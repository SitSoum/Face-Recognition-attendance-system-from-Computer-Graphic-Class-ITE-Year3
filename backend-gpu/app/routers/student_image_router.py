# app/routers/student_image_router.py
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.supabase_client import supabase
from fastapi import File, UploadFile, Form

router = APIRouter(prefix="/student-images", tags=["student-images"])


class ImageItem(BaseModel):
    student_id: int
    image_url: str


# GET images by student
@router.get("/{student_id}")
def get_images(student_id: int):
    res = (
        supabase.table("student_images")
        .select("*")
        .eq("student_id", student_id)
        .eq("deleted", False)
        .execute()
    )
    return res.data


# ADD image
@router.post("/")
def add_image(item: ImageItem):
    res = (
        supabase.table("student_images")
        .insert(
            {
                "student_id": item.student_id,
                "image_url": item.image_url,
                "deleted": False,
            }
        )
        .execute()
    )
    return res.data


# DELETE /student-images/{image_id}
@router.delete("/{image_id}")
def delete_image(image_id: int):
    supabase.table("student_images") \
        .delete() \
        .eq("id", image_id) \
        .execute()

    return {"message": "deleted"}
