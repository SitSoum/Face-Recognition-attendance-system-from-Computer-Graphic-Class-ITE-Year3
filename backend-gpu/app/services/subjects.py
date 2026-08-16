# app/services/subjects.py

from app.services.supabase_client import supabase

def get_subject_by_id(subject_id: int):
    """
    Fetch a single subject by ID from Supabase.
    Returns None if not found.
    """
    res = (
        supabase
        .table("subjects")
        .select("*")
        .eq("id", subject_id)
        .eq("deleted", False)
        .execute()
    )

    data = res.data
    return data[0] if data else None