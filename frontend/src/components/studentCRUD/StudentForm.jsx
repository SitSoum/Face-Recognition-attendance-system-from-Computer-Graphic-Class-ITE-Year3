import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export function StudentForm({
  API_URL,
  subjects,
  selectedSubjects,
  setSelectedSubjects,
  editingStudent,
  images,
  setImages,
  error,
  setError,
  resetForm,
  fetchStudents,
  setStudents,
}) {
  const [name, setName] = useState(editingStudent?.name || "");
  const [loading, setLoading] = useState(false);
  const [deletedImages, setDeletedImages] = useState([]);

  useEffect(() => {
    setName(editingStudent?.name || "");
    setImages(editingStudent?.images || []);
    setSelectedSubjects(editingStudent?.subjects?.map((s) => s.name) || []);
  }, [editingStudent, setImages, setSelectedSubjects]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      setError("MAX 10 FILES");
      return;
    }
    setError("");
    setImages([...images, ...files]);
  };

  const handleSave = async () => {
    if (!name || !selectedSubjects.length) {
      setError("Student must have a name and at least one subject.");
      return;
    }

    setLoading(true);

    try {
      let studentId;

      const subjectIds = subjects
        .filter((s) => selectedSubjects.includes(s.name))
        .map((s) => s.id);

      // -----------------------
      // UPDATE STUDENT
      // -----------------------
      if (editingStudent) {
        await fetch(`${API_URL}/students/${editingStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, subject_ids: subjectIds }),
        });

        studentId = editingStudent.id;

        await fetchStudents();
        resetForm();
      }

      // -----------------------
      // CREATE STUDENT
      // -----------------------
      else {
        const res = await fetch(`${API_URL}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, subject_ids: subjectIds }),
        });

        const created = await res.json();
        studentId = created.id;

        const fullRes = await fetch(`${API_URL}/students`);
        const allStudents = await fullRes.json();

        const fullStudent = allStudents.find((s) => s.id === studentId);

        setStudents((prev) => [...prev, fullStudent || created]);
      }

      // -----------------------
      // UPLOAD NEW IMAGES
      // -----------------------
      await Promise.all(
        images.map(async (file) => {
          if (typeof file === "string") return;

          const filePath = `${studentId}/${Date.now()}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("student_images")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            return;
          }

          const { data } = supabase.storage
            .from("student_images")
            .getPublicUrl(filePath);

          await fetch(`${API_URL}/student-images/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: studentId,
              image_url: data.publicUrl,
            }),
          });
        })
      );

      // -----------------------
      // DELETE REMOVED IMAGES
      // -----------------------
      await Promise.all(
        deletedImages.map(async (img) => {
          const filePath = img.image_url.split(
            "/storage/v1/object/public/student_images/"
          )[1];

          if (!filePath) return;

          const { error: deleteError } = await supabase.storage
            .from("student_images")
            .remove([filePath]);

          if (deleteError) console.error("Delete error:", deleteError);

          await fetch(`${API_URL}/student-images/${img.id}`, {
            method: "DELETE",
          });
        })
      );

      resetForm();
    } catch (err) {
      console.error(err);
      setError("Failed to save student.");
    } finally {
      await fetchStudents();
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-6 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_black]">
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg text-black font-bold animate-pulse">
            {editingStudent ? "UPDATING..." : "SAVING..."}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* NAME */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase">Student Name</label>
          <input
            placeholder="Enter name..."
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className="border-2 border-black p-2"
          />
        </div>

        {/* SUBJECTS */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-black uppercase">Subjects</label>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 border-2 border-black p-2 min-h-[42px]">
              {selectedSubjects.length === 0 && (
                <span className="text-gray-400 text-xs">
                  No subjects selected
                </span>
              )}

              {selectedSubjects.map((subj) => (
                <div
                  key={subj}
                  className="flex items-center gap-1 bg-black text-white px-2 py-1 text-xs font-bold"
                >
                  {subj}
                  <button
                    onClick={() =>
                      setSelectedSubjects(
                        selectedSubjects.filter((s) => s !== subj)
                      )
                    }
                    className="ml-1 text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <select
              onChange={(e) => {
                const value = e.target.value;
                if (!value || selectedSubjects.includes(value)) return;

                setSelectedSubjects([...selectedSubjects, value]);
                e.target.value = "";
              }}
              className="border-2 border-black p-2"
            >
              <option value="">+ Add Subject</option>
              {subjects
                .filter((s) => !selectedSubjects.includes(s.name))
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* IMAGE UPLOAD */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase">
            Upload Images ({images.length}/10)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={images.length >= 10}
            className="border-2 border-black p-2"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col justify-end gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white font-bold border-2 border-black py-2"
          >
            {editingStudent ? "UPDATE" : "SAVE"}
          </button>

          <button
            onClick={resetForm}
            className="bg-white text-black font-bold border-2 border-black py-2 hover:bg-gray-200"
          >
            CANCEL
          </button>
        </div>
      </div>

      {/* IMAGE PREVIEW */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {images.map((img, i) => {
          let src;
          if (img instanceof File) src = URL.createObjectURL(img);
          else if (img.image_url) src = img.image_url;
          else src = img;

          return (
            <div key={i} className="relative">
              <img
                src={src}
                className="w-12 h-12 border border-black object-cover"
              />
              <button
                onClick={() => {
                  const imgToRemove = images[i];

                  if (imgToRemove.image_url) {
                    setDeletedImages([...deletedImages, imgToRemove]);
                  }

                  setImages(images.filter((_, idx) => idx !== i));
                }}
                className="absolute -top-1 -right-1 bg-black text-white text-[10px] px-1"
              >
                X
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
    </div>
  );
}