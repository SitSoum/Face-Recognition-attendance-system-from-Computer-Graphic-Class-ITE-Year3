# app/routes.py
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from app.services.face_database import recognize_face_from_crop
from app.services.live_recognition import get_video_stream, get_cached_face_db
import cv2
import numpy as np
from app.services.subjects import get_subject_by_id

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/recognize/")
async def recognize(class_id: int, file: UploadFile = File(...)):
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    face_db = get_cached_face_db(class_id)

    # person, score = recognize_face_from_crop(img, face_db)
    # return {"person": person, "score": float(score)}

    student_id, score = recognize_face_from_crop(img, face_db)

    if student_id is not None:
        student_name = face_db.get(student_id, {}).get("name", "Unknown")
    else:
        student_name = None

    return {
        "student_id": student_id,
        "student_name": student_name,
        "score": float(score)
    }


@router.get("/video_feed_webcam/{subject_id}")
def video_feed_webcam(subject_id: int):
    subject_info = get_subject_by_id(subject_id)  # implement this API to return name
    subject_name = subject_info['name']

    return StreamingResponse(
        get_video_stream(subject_id, subject_name),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
    
@router.get("/video_feed_ip/{ip}/{subject_id}")
def video_feed_ip(ip: str, subject_id: int):
    subject_info = get_subject_by_id(subject_id)
    subject_name = subject_info['name']

    return StreamingResponse(
        get_video_stream(subject_id, subject_name, ip),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
