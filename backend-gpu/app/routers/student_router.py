# app/routers/student_router.py

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from app.services.supabase_client import supabase
from app.utils import process_face_db, progress_store

import os
import numpy as np

router = APIRouter(prefix="/students", tags=["students"])


class StudentItem(BaseModel):
    name: str
    subject_ids: list[int] = []


# GET all students (not deleted)
@router.get("")
def get_students():
    res = (
        supabase.table("students")
        .select(
            """
            id,
            name,
            student_images(*),
            student_subject(
                subjects(id, name)
            )
        """
        )
        .eq("deleted", False)
        .execute()
    )

    students = []
    for s in res.data:
        students.append(
            {
                "id": s["id"],
                "name": s["name"],
                "subjects": [
                    ss["subjects"]
                    for ss in s.get("student_subject", [])
                    if ss.get("subjects")
                ],
                "images": [
                    img
                    for img in s.get("student_images", [])
                    if not img.get("deleted", False)
                ],
            }
        )

    return students


# ADD student
@router.post("")
def add_student(item: StudentItem):
    res = (
        supabase.table("students")
        .insert({"name": item.name, "deleted": False})
        .execute()
    )

    student = res.data[0]

    for sid in item.subject_ids:
        supabase.table("student_subject").insert(
            {"student_id": student["id"], "subject_id": sid}
        ).execute()

    return student


# UPDATE student
@router.put("/{student_id}")
def update_student(student_id: int, item: StudentItem):

    supabase.table("students").update({"name": item.name}).eq(
        "id", student_id
    ).execute()

    # remove old subjects
    supabase.table("student_subject").delete().eq(
        "student_id", student_id
    ).execute()

    # insert new subjects
    for sid in item.subject_ids:
        supabase.table("student_subject").insert(
            {"student_id": student_id, "subject_id": sid}
        ).execute()

    return {"updated": True}


# SOFT DELETE
@router.delete("/{student_id}")
def delete_student(student_id: int):
    supabase.table("students").update({"deleted": True}).eq(
        "id", student_id
    ).execute()

    return {"deleted": True}


# 🚀 START face DB update (background)
@router.post("/update-face-db/subject/{subject_id}")
def update_face_db(subject_id: int, bg: BackgroundTasks):
    bg.add_task(process_face_db, subject_id)

    return {
        "status": "Processing started in background",
        "subject_id": subject_id
    }


# 📊 GET progress
@router.get("/update-face-db/progress/{subject_id}")
def get_progress(subject_id: int):
    return {
        "subject_id": subject_id,
        **progress_store.get(subject_id, {
            "stage": "idle",
            "progress": 0,
            "total": 0,
            "message": "No task running"
        })
    }


# 📁 Feature DB path
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
FEATURE_DB_FOLDER = os.path.join(PROJECT_ROOT, "face_databases")


# 📊 Count students in feature DB
@router.get("/feature-db-count/{subject_id}")
def get_feature_db_count(subject_id: int):
    db_file = os.path.join(
        FEATURE_DB_FOLDER,
        f"face_db_subject_{subject_id}.npy"
    )

    if not os.path.exists(db_file):
        return {"student_num": 0}

    db = np.load(db_file, allow_pickle=True).item()
    return {"student_num": len(db)}


# 📊 Count students in subject (DB)
@router.get("/count-by-subject/{subject_id}")
def count_students_by_subject(subject_id: int):

    res = (
        supabase.table("student_subject")
        .select("student_id")
        .eq("subject_id", subject_id)
        .execute()
    )

    student_ids = [r["student_id"] for r in res.data]

    if not student_ids:
        return {"student_num": 0}

    students = (
        supabase.table("students")
        .select("id")
        .in_("id", student_ids)
        .eq("deleted", False)
        .execute()
    )

    return {"student_num": len(students.data)}