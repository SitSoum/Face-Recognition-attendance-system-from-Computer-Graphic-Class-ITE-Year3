# app/routers/subject_router.py
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.supabase_client import supabase

router = APIRouter(prefix="/subjects", tags=["subjects"])

# Pydantic model for class
class SubjectItem(BaseModel):
    name: str

# GET all classes where deleted = false
@router.get("")
def get_subjects():
    res = supabase.table("subjects").select("*").eq("deleted", False).order("id").execute()
    return res.data

# ADD a class
@router.post("")
def add_subject(item: SubjectItem):
    res = supabase.table("subjects").insert({"name": item.name, "deleted": False}).execute()
    return res.data

# EDIT class name
@router.put("/{subject_id}")
def edit_subject(subject_id: int, item: SubjectItem):
    res = supabase.table("subjects").update({"name": item.name}).eq("id", subject_id).execute()
    return res.data

# SOFT DELETE class (set deleted = True)
@router.delete("/{subject_id}")
def delete_subject(subject_id: int):
    res = supabase.table("subjects").update({"deleted": True}).eq("id", subject_id).execute()
    return {"deleted": True}