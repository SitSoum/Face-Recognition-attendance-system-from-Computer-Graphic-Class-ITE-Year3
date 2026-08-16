import { useState, useEffect } from "react";

export default function SubjectCRUD() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [modelUpdatingIds, setModelUpdatingIds] = useState([]);
  const [featureCounts, setFeatureCounts] = useState({});
  const [progressInfo, setProgressInfo] = useState({});
  const [studentCounts, setStudentCounts] = useState({});

  // ---------------- FETCH SUBJECTS ----------------
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/subjects");
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!subjects.length) return;

    const fetchStudentCounts = async () => {
      const counts = {};
      for (const s of subjects) {
        try {
          const res = await fetch(
            `http://localhost:8000/students/count-by-subject/${s.id}`,
          );
          const data = await res.json();
          counts[s.id] = data.student_num;
        } catch {
          counts[s.id] = 0;
        }
      }
      setStudentCounts(counts);
    };

    fetchStudentCounts();
  }, [subjects]);

  // ---------------- FETCH FEATURE COUNTS ----------------
  useEffect(() => {
    if (!subjects.length) return;

    const fetchCounts = async () => {
      const counts = {};
      for (const s of subjects) {
        try {
          const res = await fetch(
            `http://localhost:8000/students/feature-db-count/${s.id}`,
          );
          const data = await res.json();
          counts[s.id] = data.student_num;
        } catch {
          counts[s.id] = 0;
        }
      }
      setFeatureCounts(counts);
    };

    fetchCounts();
  }, [subjects]);

  // ---------------- UPDATE MODEL ----------------
  const updateModel = async (subjectId) => {
    if (modelUpdatingIds.includes(subjectId)) return;

    setModelUpdatingIds((prev) => [...prev, subjectId]);

    try {
      await fetch(
        `http://localhost:8000/students/update-face-db/subject/${subjectId}`,
        { method: "POST" },
      );

      const interval = setInterval(async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/students/update-face-db/progress/${subjectId}`,
          );
          const data = await res.json();

          // calculate %
          let percent = 0;
          if (data.total > 0) {
            percent = Math.floor((data.progress / data.total) * 100);
          }

          // store full progress info
          setProgressInfo((prev) => ({
            ...prev,
            [subjectId]: {
              percent,
              stage: data.stage,
              message: data.message,
            },
          }));

          // stop when done
          if (data.stage === "done") {
            clearInterval(interval);

            // refresh feature count
            const countRes = await fetch(
              `http://localhost:8000/students/feature-db-count/${subjectId}`,
            );
            const countData = await countRes.json();

            setFeatureCounts((prev) => ({
              ...prev,
              [subjectId]: countData.student_num,
            }));

            setTimeout(() => {
              setModelUpdatingIds((prev) =>
                prev.filter((id) => id !== subjectId),
              );

              setProgressInfo((prev) => ({
                ...prev,
                [subjectId]: null,
              }));
            }, 800);
          }
        } catch (err) {
          console.error(err);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Update failed");

      setModelUpdatingIds((prev) => prev.filter((id) => id !== subjectId));
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-8 bg-[#020c1b] min-h-screen text-white font-mono">
      <h1 className="text-3xl font-black text-cyan-400 mb-6">
        SUBJECT MANAGEMENT
      </h1>

      {/* ADD */}
      <div className="flex gap-4 mb-10">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-cyan-900 p-2 bg-transparent"
          placeholder="Subject name"
        />
        <button className="bg-cyan-500 px-4 py-2 text-black font-bold">
          ADD
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse h-10 bg-gray-700"></div>
        ) : (
          subjects.map((s) => {
            const count = featureCounts[s.id] || 0;
            const studentCount = studentCounts[s.id] || 0; // ✅ FIX HERE
            const isUpdating = modelUpdatingIds.includes(s.id);

            return (
              <div
                key={s.id}
                className="p-4 border-2 border-cyan-900 bg-white/5"
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-lg">{s.name}</div>
                    <div className="text-xs text-cyan-300">
                      Model: {count} embedded | Students: {studentCount}
                    </div>
                  </div>

                  <button
                    onClick={() => updateModel(s.id)}
                    disabled={isUpdating || studentCount === 0}
                    className={`px-3 py-1 border text-xs font-bold ${
                      studentCount === 0
                        ? "border-gray-600 text-gray-500 cursor-not-allowed"
                        : "border-green-500 text-green-400 hover:bg-green-500 hover:text-black"
                    }`}
                  >
                    {isUpdating ? "Updating..." : "Update Model"}
                  </button>
                </div>

                {/* PROGRESS BAR */}
                {isUpdating && progressInfo[s.id] && (
                  <div className="mt-3">
                    {/* TEXT STATUS */}
                    <div className="text-xs text-cyan-300 mb-1">
                      {progressInfo[s.id].message}
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="w-full bg-gray-700 h-2">
                      <div
                        className={`h-2 transition-all ${
                          progressInfo[s.id].stage === "downloading"
                            ? "bg-blue-400"
                            : progressInfo[s.id].stage === "cropping"
                              ? "bg-yellow-400"
                              : progressInfo[s.id].stage === "embedding"
                                ? "bg-purple-400"
                                : "bg-green-400"
                        }`}
                        style={{ width: `${progressInfo[s.id].percent}%` }}
                      />
                    </div>

                    {/* STAGE + PERCENT */}
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>{progressInfo[s.id].stage}</span>
                      <span>{progressInfo[s.id].percent}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
