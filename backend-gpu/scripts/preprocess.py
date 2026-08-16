# preprocess.py
import os
import cv2
import numpy as np
from ultralytics import YOLO
from insightface.app import FaceAnalysis
from app.utils import expand_bbox

# ----------------------------
# CONFIG
# ----------------------------
RAW_FOLDER = "raw_dataset"
DB_FILE = "database/face_db.npy"
TOP_N_FACES = 3
EXPAND_RATIO = 0.25
CONF_THRESHOLD = 0.3

# ----------------------------
# HELPER: FACE QUALITY
# ----------------------------
def compute_face_quality(face_img):
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = np.var(lap) / 1000.0
    blur_score = min(1.0, blur_score)
    h, w = face_img.shape[:2]
    pose_score = min(1.0, min(h, w)/max(h, w))
    quality = (0.7 * blur_score + 0.3 * pose_score)
    return quality

# ----------------------------
# LOAD MODELS
# ----------------------------
print("Loading YOLO face detector...")
detector = YOLO("yolov8n-face-lindevs.pt")

print("Loading ArcFace model...")
arcface_app = FaceAnalysis(name='buffalo_l')
arcface_app.prepare(ctx_id=-1)  # CPU

# ----------------------------
# BUILD DATABASE
# ----------------------------
face_db = {}

for person_name in os.listdir(RAW_FOLDER):
    person_path = os.path.join(RAW_FOLDER, person_name)
    if not os.path.isdir(person_path):
        continue
    
    embeddings = []
    
    for img_name in os.listdir(person_path):
        img_path = os.path.join(person_path, img_name)
        img = cv2.imread(img_path)
        if img is None:
            continue

        h_frame, w_frame = img.shape[:2]
        results = detector(img, conf=CONF_THRESHOLD, verbose=False)
        if len(results) == 0 or len(results[0].boxes.xyxy) == 0:
            continue

        x1, y1, x2, y2 = map(int, results[0].boxes.xyxy[0])
        x1n, y1n, x2n, y2n = expand_bbox(x1, y1, x2, y2, w_frame, h_frame, EXPAND_RATIO)
        face_crop = img[y1n:y2n, x1n:x2n]

        faces = arcface_app.get(face_crop)
        if len(faces) == 0:
            continue

        face = faces[0]
        quality = compute_face_quality(face_crop)
        emb_512 = face.embedding
        emb_256 = emb_512[:256]
        emb_unit = emb_256 / np.linalg.norm(emb_256)

        embeddings.append({'embedding': emb_unit, 'quality': quality})
    
    # Keep top N
    embeddings = sorted(embeddings, key=lambda x: x['quality'], reverse=True)[:TOP_N_FACES]
    face_db[person_name] = embeddings
    print(f"[INFO] Processed {person_name}, faces saved: {len(embeddings)}")

# Save database
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
np.save(DB_FILE, face_db)
print(f"[INFO] Face database saved to {DB_FILE}")