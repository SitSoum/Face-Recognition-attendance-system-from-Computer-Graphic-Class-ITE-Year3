import cv2
from app.services.face_database import (
    detector,
    recognize_face_from_crop,
    EXPAND_RATIO,
    CONF_THRESHOLD,
    load_face_db_by_subject
)
from concurrent.futures import ThreadPoolExecutor


# Use attendance API for auto-marking
from app.routers.attendance_router import mark_attendance_api, AttendanceItem

db_cache = {}

executor = ThreadPoolExecutor(max_workers=2)


def compute_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interArea = max(0, xB-xA) * max(0, yB-yA)
    boxAArea = (boxA[2]-boxA[0])*(boxA[3]-boxA[1])
    boxBArea = (boxB[2]-boxB[0])*(boxB[3]-boxB[1])
    return interArea / float(boxAArea + boxBArea - interArea + 1e-6)

def expand_bbox(x1,y1,x2,y2,w,h,ratio=EXPAND_RATIO):
    bw = x2-x1
    bh = y2-y1
    return (
        max(0,int(x1-bw*ratio)),
        max(0,int(y1-bh*ratio)),
        min(w,int(x2+bw*ratio)),
        min(h,int(y2+bh*ratio))
    )




# ----------------------------
# ASYNC RECOGNITION
# ----------------------------
def async_recognize(face_crop, face_db):
    # Directly returns (id, name, score)
    return recognize_face_from_crop(face_crop, face_db)



def get_cached_face_db(subject_id: int):
    if subject_id not in db_cache:
        print(f"Loading DB for subject {subject_id}...")
        db_cache[subject_id] = load_face_db_by_subject(subject_id)
    else:
        print(f"Using cached DB for subject {subject_id}")
    return db_cache[subject_id]

# ----------------------------
# STREAM FUNCTION
# ----------------------------
def get_video_stream(subject_id: int, subject_name: str, ip: str = None):
    if ip:
        print(f"Using IP camera: {ip}")
        cap = cv2.VideoCapture(f"http://{ip}/video", cv2.CAP_FFMPEG)
    else:
        print("Using webcam")
        cap = cv2.VideoCapture(0)
    face_db = get_cached_face_db(subject_id)

    tracked_faces = {}
    next_track_id = 0
    frame_count = 0

    MAX_MISSING = 5
    IOU_THRESHOLD = 0.4

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        h_frame, w_frame = frame.shape[:2]

        # DETECTION
        results = detector(frame, conf=CONF_THRESHOLD, verbose=False)
        detections = []
        if len(results) > 0 and len(results[0].boxes.xyxy) > 0:
            detections = [tuple(map(int, box)) for box in results[0].boxes.xyxy]

        # PROCESS DETECTIONS
        for det in detections:
            x1, y1, x2, y2 = det
            x1n, y1n, x2n, y2n = expand_bbox(x1, y1, x2, y2, w_frame, h_frame)
            expanded_box = (x1n, y1n, x2n, y2n)

            matched_id = None

            # MATCH EXISTING TRACKS
            for track_id, data in tracked_faces.items():
                if compute_iou(expanded_box, data["bbox"]) > IOU_THRESHOLD:
                    matched_id = track_id
                    break

            face_crop = frame[y1n:y2n, x1n:x2n]

            # EXISTING TRACK
            if matched_id is not None:
                tracked_faces[matched_id]["bbox"] = expanded_box
                tracked_faces[matched_id]["last_seen"] = frame_count

                if tracked_faces[matched_id]["name"] is None and tracked_faces[matched_id].get("future") is None:
                    future = executor.submit(recognize_face_from_crop, face_crop, face_db)
                    tracked_faces[matched_id]["future"] = future

            # NEW TRACK
            else:
                future = executor.submit(recognize_face_from_crop, face_crop, face_db)
                tracked_faces[next_track_id] = {
                    "bbox": expanded_box,
                    "name": None,
                    "score": 0.0,
                    "future": future,
                    "last_seen": frame_count
                }
                next_track_id += 1

        # UPDATE THREAD RESULTS & MARK ATTENDANCE
        for track_id, data in tracked_faces.items():
            future = data.get("future")
            if future is not None and future.done():
                student_id, student_name, score = future.result()
                

                data["name"] = student_name
                data["score"] = score
                data["future"] = None

                # MARK ATTENDANCE VIA ROUTER
                if student_id and score > 0.6:
                    item = AttendanceItem(
                        student_id=student_id,
                        subject_id=subject_id,
                        subject_name=subject_name
                    )
                    mark_attendance_api(item)

        # REMOVE LOST TRACKS
        tracked_faces = {tid: d for tid, d in tracked_faces.items() if frame_count - d["last_seen"] <= MAX_MISSING}

        # DRAW RESULTS
        for track_id, data in tracked_faces.items():
            x1, y1, x2, y2 = data["bbox"]
            name = data["name"] if data["name"] else "Unknown"
            label = f"ID:{track_id} | {name}"
            if data["name"]:
                label += f" | S:{data['score']:.2f}"
            color = (0, 255, 0) if data["name"] else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # ENCODE FRAME
        ret, jpeg = cv2.imencode(".jpg", frame)
        if not ret:
            continue
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n"

    cap.release()