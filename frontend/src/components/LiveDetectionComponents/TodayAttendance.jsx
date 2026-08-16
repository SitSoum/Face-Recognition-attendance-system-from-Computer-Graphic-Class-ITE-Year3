import { useEffect, useState } from "react";

export default function TodayAttendance({ subjectId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // FETCH TODAY DATA
  // ----------------------------
  const fetchToday = async () => {
    if (!subjectId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/attendance/today?subject_id=${subjectId}`,
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // fetch once when subject changes
  useEffect(() => {
    fetchToday();
  }, [subjectId]);

  // ----------------------------
  // RESET ONE
  // ----------------------------
  const handleResetOne = async (id) => {
    await fetch(`http://localhost:8000/attendance/${id}`, {
      method: "DELETE",
    });

    fetchToday();
  };

  // ----------------------------
  // RESET ALL
  // ----------------------------
  const handleResetAll = async () => {
    await Promise.all(
      data.map((item) =>
        fetch(`http://localhost:8000/attendance/${item.id}`, {
          method: "DELETE",
        }),
      ),
    );

    fetchToday();
  };

  return (
    <div className="mt-6 max-w-5xl mx-auto">
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_black]">
        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-2 border-b-2 border-black">
          <h2 className="text-sm font-black">TODAY ATTENDANCE</h2>

          <div className="flex gap-2">
            {/* REFRESH */}
            <button
              onClick={fetchToday}
              className="px-3 py-1 text-xs font-black bg-blue-500 text-white border-2 border-black shadow-[3px_3px_0px_black]"
            >
              REFRESH
            </button>

            {/* RESET ALL */}
            <button
              onClick={handleResetAll}
              className="px-3 py-1 text-xs font-black bg-red-500 text-white border-2 border-black shadow-[3px_3px_0px_black]"
            >
              RESET ALL
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm font-bold">Loading...</div>
          ) : data.length === 0 ? (
            <div className="p-4 text-center text-sm font-bold">
              No attendance yet
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center px-4 py-2 border-b border-black text-sm font-bold"
              >
                <div>
                  {item.student_name || "Unknown"}{" "}
                  <span className="text-xs text-gray-500">
                    (
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    )
                  </span>
                </div>

                <button
                  onClick={() => handleResetOne(item.id)}
                  className="px-2 py-1 text-xs font-black bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_black]"
                >
                  RESET
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
