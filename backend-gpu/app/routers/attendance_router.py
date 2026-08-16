from fastapi import APIRouter
from pydantic import BaseModel
from app.services.supabase_client import supabase
from datetime import datetime, timezone

router = APIRouter(prefix="/attendance", tags=["attendance"])


class AttendanceItem(BaseModel):
    student_id: int
    subject_id: int
    subject_name: str = None  # optional, for display or file export
    timestamp: datetime = None


# ----------------------------
# MARK ATTENDANCE
# ----------------------------
@router.post("")
def mark_attendance_api(item: AttendanceItem):
    from datetime import datetime, timezone

    ts = item.timestamp or datetime.now(timezone.utc)

    # Extract date + time
    date_only = ts.date()

    # start_day = ts.replace(hour=0, minute=0, second=0, microsecond=0)
    # end_day = ts.replace(hour=23, minute=59, second=59, microsecond=999999)

    existing = (
        supabase.table("attendance")
        .select("*")
        .eq("student_id", item.student_id)
        .eq("subject_id", item.subject_id)
        .eq("date", date_only.isoformat())
        .execute()
    )

    if existing.data:
        return {"status": "already marked"}

    res = (
        supabase.table("attendance")
        .insert(
            {
                "student_id": item.student_id,
                "subject_id": item.subject_id,
                "subject_name": item.subject_name,
                "timestamp": ts.isoformat(),  # full datetime
                "date": date_only.isoformat(),  # only date
                "status": "Present",
            }
        )
        .execute()
    )

    return {"status": "success", "data": res.data}


# ----------------------------
# GET ATTENDANCE BY STUDENT
# ----------------------------
@router.get("/student/{student_id}")
def get_attendance_by_student(student_id: int):
    res = (
        supabase.table("attendance").select("*").eq("student_id", student_id).execute()
    )
    return {"attendance": res.data}


# ----------------------------
# GET ATTENDANCE BY SUBJECT
# ----------------------------
@router.get("/subject/{subject_id}")
def get_attendance_by_subject(subject_id: int):
    res = (
        supabase.table("attendance").select("*").eq("subject_id", subject_id).execute()
    )
    return {"attendance": res.data}


@router.get("")
def get_attendance(subject_id: int, start_date: str, end_date: str):
    from datetime import datetime

    start = datetime.fromisoformat(start_date + "T00:00:00")
    end = datetime.fromisoformat(end_date + "T23:59:59")

    res = (
        supabase.table("attendance")
        .select(
            """
    id,
    student_id,
    students(name),
    date,
    timestamp,
    status
"""
        )
        .eq("subject_id", subject_id)
        .gte("timestamp", start.isoformat())
        .lte("timestamp", end.isoformat())
        .order("timestamp", desc=False)
        .execute()
    )

    formatted = []
    for row in res.data:
        ts = row["timestamp"]

        formatted.append(
            {
                "student_id": row["student_id"],
                "student_name": (
                    row["students"]["name"] if row.get("students") else None
                ),
                "date": row["date"],  # already clean
                "timestamp": row["timestamp"],
                "time": row["timestamp"][11:19] if row["timestamp"] else None,
                "status": row.get("status", "Present"),
            }
        )

    return formatted


@router.get("/today")
def get_today_attendance(subject_id: int):
    from datetime import datetime

    today = datetime.now(timezone.utc).date().isoformat()

    res = (
        supabase.table("attendance")
        .select(
            """
    id,
    student_id,
    students(name),
    date,
    timestamp,
    status
"""
        )
        .eq("subject_id", subject_id)
        .eq("date", today)
        .order("timestamp", desc=True)
        .execute()
    )

    formatted = []
    for row in res.data:
        formatted.append(
            {
                "id": row["id"],  # IMPORTANT for delete
                "student_id": row["student_id"],
                "student_name": (
                    row["students"]["name"] if row.get("students") else None
                ),
                "timestamp": row["timestamp"],
                "time": row["timestamp"][11:19] if row["timestamp"] else None,
                "status": row.get("status", "Present"),
            }
        )

    return formatted


@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int):
    res = supabase.table("attendance").delete().eq("id", attendance_id).execute()

    return {"status": "deleted", "deleted": res.data}


@router.post("/reset")
def reset_student_today(student_id: int, subject_id: int):
    from datetime import datetime, timezone

    today = datetime.now(timezone.utc).date().isoformat()

    res = (
        supabase.table("attendance")
        .delete()
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .eq("date", today)
        .execute()
    )

    return {"status": "reset", "deleted": res.data}
