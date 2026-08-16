from fastapi import APIRouter
from pydantic import BaseModel
from app.services.supabase_client import supabase

router = APIRouter(prefix="/student-subject", tags=["student_subject"])

class StudentSubjectItem(BaseModel):
    student_id: int
    subject_id: int

# ----------------------------
# ADD STUDENT TO SUBJECT
# ----------------------------
@router.post("")
def add_student_to_subject(item: StudentSubjectItem):
    existing = supabase.table("student_subject") \
        .select("*") \
        .eq("student_id", item.student_id) \
        .eq("subject_id", item.subject_id) \
        .execute()
    if existing.data:
        return {"status": "already exists", "data": existing.data}

    res = supabase.table("student_subject").insert({
        "student_id": item.student_id,
        "subject_id": item.subject_id
    }).execute()
    return {"status": "success", "data": res.data}

# ----------------------------
# REMOVE STUDENT FROM SUBJECT
# ----------------------------
@router.delete("")
def remove_student_from_subject(item: StudentSubjectItem):
    supabase.table("student_subject").delete().match({
        "student_id": item.student_id,
        "subject_id": item.subject_id
    }).execute()
    return {"status": "removed"}

# ----------------------------
# GET STUDENTS IN SUBJECT
# ----------------------------
@router.get("/subject/{subject_id}")
def get_students_in_subject(subject_id: int):
    res = supabase.table("student_subject").select("""
        student:students(
            id,
            name
        )
    """).eq("subject_id", subject_id).execute()

    students = [row["student"] for row in res.data if row.get("student")]
    return {"students": students}

# ----------------------------
# GET SUBJECTS FOR STUDENT
# ----------------------------
@router.get("/student/{student_id}")
def get_subjects_for_student(student_id: int):
    res = supabase.table("student_subject").select("""
        subject(id, name)
    """).eq("student_id", student_id).execute()
    subjects = [row["subject"] for row in res.data if row.get("subject")]
    return {"subjects": subjects}