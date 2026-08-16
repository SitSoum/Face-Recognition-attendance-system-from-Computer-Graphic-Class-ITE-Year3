#app/services/face_database.py
import os
import cv2
import numpy as np
from ultralytics import YOLO
from insightface.app import FaceAnalysis

# ----------------------------
# CONFIG
# ----------------------------
RAW_FOLDER = "raw_dataset"
YOLO_FACE_FOLDER = "yolo_faces"
DB_FILE = "face_db.npy"
TOP_N_FACES = 3
EXPAND_RATIO = 0.25
CONF_THRESHOLD = 0.3
SIMILARITY_THRESHOLD = 0.65

# ----------------------------
# LOAD MODELS
# ----------------------------
detector = YOLO("yolov8n-face-lindevs.pt")
detector.to("cuda")
arcface_app = FaceAnalysis(name='buffalo_l')
arcface_app.prepare(ctx_id=0)

# ----------------------------
# HELPER FUNCTIONS
# ----------------------------
def compute_face_quality(face_img):
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    blur_score = min(1.0, np.var(cv2.Laplacian(gray, cv2.CV_64F)) / 1000.0)
    h, w = face_img.shape[:2]
    pose_score = min(1.0, min(h, w)/max(h, w))
    return 0.7*blur_score + 0.3*pose_score


def crop_faces_from_raw(raw_folder=RAW_FOLDER, save_folder=YOLO_FACE_FOLDER, expand_ratio=EXPAND_RATIO):
    os.makedirs(save_folder, exist_ok=True)
    
    for student_id in os.listdir(raw_folder):
        student_path = os.path.join(raw_folder, student_id)
        if not os.path.isdir(student_path):
            continue

        save_student_path = os.path.join(save_folder, student_id)
        os.makedirs(save_student_path, exist_ok=True)

        for img_name in os.listdir(student_path):
            img_path = os.path.join(student_path, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue

            h, w = img.shape[:2]
            results = detector(img, conf=CONF_THRESHOLD, verbose=False)
            if len(results) == 0 or len(results[0].boxes.xyxy) == 0:
                continue

            x1, y1, x2, y2 = map(int, results[0].boxes.xyxy[0])
            bw, bh = x2 - x1, y2 - y1
            x1n = max(0, int(x1 - bw * expand_ratio))
            y1n = max(0, int(y1 - bh * expand_ratio))
            x2n = min(w, int(x2 + bw * expand_ratio))
            y2n = min(h, int(y2 + bh * expand_ratio))

            face_crop = img[y1n:y2n, x1n:x2n]
            save_path = os.path.join(save_student_path, img_name)
            cv2.imwrite(save_path, face_crop)


def get_face_embeddings_from_folder(face_folder=YOLO_FACE_FOLDER, top_n=TOP_N_FACES):
    db = {}
    for student_folder_name in os.listdir(face_folder):
        student_path = os.path.join(face_folder, student_folder_name)
        if not os.path.isdir(student_path):
            continue

        # Assume folder name = "{student_id}_{student_name}" or you can map it from Supabase
        if "_" in student_folder_name:
            student_id_str, student_name = student_folder_name.split("_", 1)
            student_id = int(student_id_str)
        else:
            student_id = student_folder_name
            student_name = student_folder_name

        embeddings = []
        for img_name in os.listdir(student_path):
            img = cv2.imread(os.path.join(student_path, img_name))
            if img is None:
                continue
            faces = arcface_app.get(img)
            if len(faces) == 0:
                continue
            face = faces[0]
            x1, y1, x2, y2 = face.bbox.astype(int)
            face_crop = img[y1:y2, x1:x2]
            quality = compute_face_quality(face_crop)
            emb_256 = face.embedding[:256]
            emb_unit = emb_256 / np.linalg.norm(emb_256)
            embeddings.append({'embedding': emb_unit, 'quality': quality})

        embeddings = sorted(embeddings, key=lambda x: x['quality'], reverse=True)[:top_n]

        db[student_id] = {
            "name": student_name,
            "embeddings": embeddings
        }

    return db

# ----------------------------
# RECOGNITION
# ----------------------------
def recognize_face_from_crop(face_crop, db, threshold=SIMILARITY_THRESHOLD):
    faces = arcface_app.get(face_crop)
    if len(faces) == 0:
        return None, None, 0.0  # student_id, name, score

    emb_256 = faces[0].embedding[:256]
    emb_unit = emb_256 / np.linalg.norm(emb_256)

    best_id, best_name, best_score = None, None, 0.0

    for student_id, info in db.items():
        student_name = info["name"]
        embeddings = info["embeddings"]

        for e in embeddings:
            score = np.dot(emb_unit, e["embedding"])
            if score > best_score:
                best_score = score
                best_id = student_id
                best_name = student_name

    if best_score >= threshold:
        return best_id, best_name, best_score

    return None, None, best_score



PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Now PROJECT_ROOT = backend/
FEATURE_DB_FOLDER = os.path.join(PROJECT_ROOT, "face_databases")


def load_face_db_by_subject(subject_id: int):
    db_file = os.path.join(FEATURE_DB_FOLDER, f"face_db_subject_{subject_id}.npy")

    if not os.path.exists(db_file):
        return {}

    return np.load(db_file, allow_pickle=True).item()


# # ----------------------------
# # MAIN
# # ----------------------------
# if not os.path.exists(DB_FILE):
#     crop_faces_from_raw()
#     face_db = get_face_embeddings_from_folder()
#     np.save(DB_FILE, face_db)
# else:
#     face_db = np.load(DB_FILE, allow_pickle=True).item()