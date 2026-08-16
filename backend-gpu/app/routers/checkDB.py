import os
import numpy as np

# __file__ = app/scripts/checkDB.py
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
# Now PROJECT_ROOT = backend/

FEATURE_DB_FOLDER = os.path.join(PROJECT_ROOT, "face_databases")
class_id = 1

# Build the npy file path for this class
db_file = os.path.join(FEATURE_DB_FOLDER, f"face_db_class_{class_id}.npy")

if not os.path.exists(db_file):
    print("missing path:", db_file)
else:
    db = np.load(db_file, allow_pickle=True).item()
    count = sum(len(embeddings) for embeddings in db.values())
    num_students = len(db)
    print("Total embeded image:", count, " student count: ", num_students)

# python app/routers/checkDB.py
