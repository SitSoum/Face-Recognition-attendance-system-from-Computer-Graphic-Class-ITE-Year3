from fastapi import FastAPI
from app.routes import router
from app.routers.subject_router import router as subject_router
from app.routers.student_router import router as student_router
from app.routers.student_image_router import router as image_router
from app.routers.attendance_router import router as attendance_router
from app.routers.student_subject_router import router as student_subject_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Face Recognition API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
app.include_router(subject_router)
app.include_router(student_router)
app.include_router(image_router)
app.include_router(attendance_router)
app.include_router(student_subject_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)