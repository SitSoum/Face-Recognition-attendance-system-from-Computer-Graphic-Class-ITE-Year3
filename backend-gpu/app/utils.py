# app/utils.py
# import numpy as np
# from app.config import SIMILARITY_THRESHOLD


# def compute_iou(boxA, boxB):
#     xA = max(boxA[0], boxB[0])
#     yA = max(boxA[1], boxB[1])
#     xB = min(boxA[2], boxB[2])
#     yB = min(boxA[3], boxB[3])
#     interArea = max(0, xB - xA) * max(0, yB - yA)
#     boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
#     boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
#     return interArea / float(boxAArea + boxBArea - interArea + 1e-6)


# def expand_bbox(x1, y1, x2, y2, w_frame, h_frame, ratio=0.25):
#     bw = x2 - x1
#     bh = y2 - y1
#     x1n = max(0, int(x1 - bw * ratio))
#     y1n = max(0, int(y1 - bh * ratio))
#     x2n = min(w_frame, int(x2 + bw * ratio))
#     y2n = min(h_frame, int(y2 + bh * ratio))
#     return x1n, y1n, x2n, y2n


# def recognize_face_from_crop(face_crop, db, arcface_app):
#     faces = arcface_app.get(face_crop)
#     if len(faces) == 0:
#         return None, 0.0

#     face = faces[0]
#     emb_256 = face.embedding[:256]
#     emb_unit = emb_256 / np.linalg.norm(emb_256)

#     best_person = None
#     best_score = 0.0

#     for person_id, embeddings in db.items():
#         for e in embeddings:
#             score = np.dot(emb_unit, e['embedding'])
#             if score > best_score:
#                 best_score = score
#                 best_person = person_id

#     if best_score >= SIMILARITY_THRESHOLD:
#         return best_person, best_score
#     else:
#         return None, best_score

import os
import requests
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from threading import Semaphore

from app.services.supabase_client import supabase
from app.services.face_database import (
    crop_faces_from_raw,
    get_face_embeddings_from_folder,
)
from app.services.live_recognition import db_cache


# 🔒 GLOBAL LIMIT
download_semaphore = Semaphore(20)

# ⚙️ THREAD COUNT
MAX_WORKERS = 10


# 📁 DB folder
FACE_DB_FOLDER = "face_databases"
os.makedirs(FACE_DB_FOLDER, exist_ok=True)

progress_store = {}
def update_progress(subject_id, stage, current, total, message):
    progress_store[subject_id] = {
        "stage": stage,
        "progress": current,
        "total": total,
        "message": message,
    }



def download_image(img_url, save_path):
    with download_semaphore:
        try:
            if os.path.exists(save_path):
                return

            r = requests.get(img_url, timeout=10)

            if r.status_code == 200:
                with open(save_path, "wb") as f:
                    f.write(r.content)

        except Exception as e:
            print(f"Download failed: {img_url} -> {e}")

def process_face_db(subject_id: int):

    update_progress(subject_id, "starting", 0, 0, "Initializing...")

    # 1️⃣ Fetch students
    res = (
        supabase.table("student_subject")
        .select(
            """
            student:students(
                id,
                name,
                deleted,
                student_images(*)
            )
        """
        )
        .eq("subject_id", subject_id)
        .eq("student.deleted", False)
        .execute()
    )

    students = [row["student"] for row in res.data if row.get("student")]

    if not students:
        update_progress(subject_id, "done", 0, 0, "No students found")
        return

    # 👉 count total images
    image_tasks = []
    for student in students:
        for img in student.get("student_images", []):
            if not img.get("deleted", False) and img.get("image_url"):
                image_tasks.append((student, img))

    total_images = len(image_tasks)

    raw_folder = os.path.join("tmp_raw", f"subject_{subject_id}")
    os.makedirs(raw_folder, exist_ok=True)

    completed = 0

    update_progress(subject_id, "downloading", 0, total_images, "Downloading images...")

    def download_and_track(student, img):
        nonlocal completed

        student_folder = os.path.join(
            raw_folder, f"{student['id']}_{student['name']}"
        )
        os.makedirs(student_folder, exist_ok=True)

        img_url = img["image_url"]
        local_path = os.path.join(
            student_folder, os.path.basename(img_url)
        )

        download_image(img_url, local_path)

        completed += 1
        update_progress(
            subject_id,
            "downloading",
            completed,
            total_images,
            f"Downloading {completed}/{total_images}"
        )

    # 🚀 parallel download
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(download_and_track, s, i)
            for (s, i) in image_tasks
        ]
        for f in futures:
            f.result()

    # 3️⃣ YOLO
    update_progress(subject_id, "cropping", 0, 1, "Cropping faces...")

    yolo_folder = os.path.join("tmp_yolo", f"subject_{subject_id}")
    os.makedirs(yolo_folder, exist_ok=True)

    crop_faces_from_raw(raw_folder=raw_folder, save_folder=yolo_folder)

    # 4️⃣ Embeddings
    update_progress(subject_id, "embedding", 0, 1, "Extracting features...")

    face_db = get_face_embeddings_from_folder(face_folder=yolo_folder)

    # 5️⃣ Save
    db_file = os.path.join(
        FACE_DB_FOLDER,
        f"face_db_subject_{subject_id}.npy"
    )
    np.save(db_file, face_db)

    db_cache.pop(subject_id, None)

    update_progress(subject_id, "done", 1, 1, "Completed")
    # 1️⃣ Fetch students
    res = (
        supabase.table("student_subject")
        .select(
            """
            student:students(
                id,
                name,
                deleted,
                student_images(*)
            )
        """
        )
        .eq("subject_id", subject_id)
        .eq("student.deleted", False)
        .execute()
    )

    students = [row["student"] for row in res.data if row.get("student")]

    if not students:
        print("No students found")
        return

    # 2️⃣ Raw folder
    raw_folder = os.path.join("tmp_raw", f"subject_{subject_id}")
    os.makedirs(raw_folder, exist_ok=True)

    futures = []

    # 🚀 Parallel download
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for student in students:
            student_folder = os.path.join(
                raw_folder, f"{student['id']}_{student['name']}"
            )
            os.makedirs(student_folder, exist_ok=True)

            for img in student.get("student_images", []):
                if img.get("deleted", False):
                    continue

                img_url = img.get("image_url")
                if not img_url:
                    continue

                local_path = os.path.join(
                    student_folder,
                    os.path.basename(img_url)
                )

                futures.append(
                    executor.submit(download_image, img_url, local_path)
                )

        for f in futures:
            f.result()

    # 3️⃣ YOLO crop
    yolo_folder = os.path.join("tmp_yolo", f"subject_{subject_id}")
    os.makedirs(yolo_folder, exist_ok=True)

    crop_faces_from_raw(
        raw_folder=raw_folder,
        save_folder=yolo_folder
    )

    # 4️⃣ Embeddings
    face_db = get_face_embeddings_from_folder(
        face_folder=yolo_folder
    )

    # 5️⃣ Save
    db_file = os.path.join(
        FACE_DB_FOLDER,
        f"face_db_subject_{subject_id}.npy"
    )

    np.save(db_file, face_db)

    # 6️⃣ Clear cache
    db_cache.pop(subject_id, None)

    print(f"Face DB updated: {db_file}")