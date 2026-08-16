import { useState, useEffect } from "react";
import { StudentForm } from "../components/studentCRUD/StudentForm";
import { StudentTable } from "../components/studentCRUD/StudentTable";
import { DeleteConfirmModal } from "../components/studentCRUD/DeleteConfirmModal";

const API_URL = "http://localhost:8000";

export default function StudentCRUD() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState(null);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [loadingFaceDb, setLoadingFaceDb] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await fetch(`${API_URL}/subjects`);
        const data = await res.json();
        setSubjects(data);
        if (data.length && !selectedSubjects.length) {
          setSelectedSubjects([data[0].name]); // default first subject
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjects.length) return;

    const fetchFeatureCount = async () => {
      try {
        const subjectIds = subjects
          .filter((s) => selectedSubjects.includes(s.name))
          .map((s) => s.id);
        if (!subjectIds.length) return;

        const res = await fetch(
          `${API_URL}/students/feature-db-count/${subjectIds[0]}`,
        );
        const data = await res.json();
        setFeatureCount(data.student_num);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFeatureCount();
  }, [selectedSubjects, subjects]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch(`${API_URL}/students`);
      const data = await res.json();
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- HANDLERS ---
  const openEditForm = (student) => {
    setEditingStudent(student);
    setSelectedSubjects(student.subjects?.map((s) => s.name) || []);
    setImages(student.images || []);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setImages([]);
    setError("");
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`${API_URL}/students/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchStudents();
  };

  // --- FILTER + PAGINATION ---
  const filteredStudents =
    selectedSubjects.length === 0
      ? students // show all
      : students.filter((s) =>
          s.subjects?.some((subj) => selectedSubjects.includes(subj.name)),
        );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // --- UI ---
  return (
    <div className="p-6 bg-gray-100 h-screen text-black font-sans relative">
      {(loadingImport || loadingFaceDb) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-xl font-bold flex flex-col items-center gap-2">
            {loadingImport && (
              <span>
                Importing images {importProgress.current}/{importProgress.total}
              </span>
            )}
            {loadingFaceDb && <span>Updating face database...</span>}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-black">STUDENT DATABASE</h1>

          {/* SUBJECT SELECT */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-black text-base md:text-lg font-semibold">
              Select Subjects:
            </label>
            {loadingSubjects ? (
              <div className="w-40 h-10 bg-gray-300 animate-pulse"></div>
            ) : (
              <div className="border-2 border-black p-2 max-h-40 overflow-y-auto bg-white shadow-[3px_3px_0px_black]">
                {/* ALL OPTION */}
                <label className="flex items-center gap-2 font-bold border-b pb-1 mb-1">
                  <input
                    type="checkbox"
                    checked={selectedSubjects.length === 0}
                    onChange={() => setSelectedSubjects([])}
                  />
                  ALL SUBJECTS
                </label>

                {/* SUBJECT LIST */}
                {subjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(s.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjects([...selectedSubjects, s.name]);
                        } else {
                          setSelectedSubjects(
                            selectedSubjects.filter((name) => name !== s.name),
                          );
                        }
                      }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-700">
          Feature database has <span className="font-bold">{featureCount}</span>{" "}
          students
        </div>
      </div>

      {/* STUDENT FORM */}
      {showForm && (
        <StudentForm
          API_URL={API_URL}
          subjects={subjects}
          selectedSubjects={selectedSubjects}
          setSelectedSubjects={setSelectedSubjects}
          editingStudent={editingStudent}
          images={images}
          setImages={setImages}
          error={error}
          setError={setError}
          resetForm={resetForm}
          fetchStudents={fetchStudents}
          setStudents={setStudents}
        />
      )}

      {/* ADD / IMPORT BUTTONS */}
      {!showForm && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 border-2 border-black font-bold bg-white shadow-[3px_3px_0px_black]"
          >
            + ADD STUDENT
          </button>
          {/* You can keep your folder import button here if needed */}
        </div>
      )}

      {/* STUDENT TABLE */}
      <StudentTable
        students={paginatedStudents}
        loading={loadingStudents}
        openEditForm={openEditForm}
        setDeleteId={setDeleteId}
      />

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <DeleteConfirmModal
          handleDelete={handleDelete}
          cancel={() => setDeleteId(null)}
        />
      )}

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-6">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border-2 border-black font-bold ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
