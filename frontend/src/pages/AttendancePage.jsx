import { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa6";
import * as XLSX from "xlsx";

export default function AttendancePage({ API_URL }) {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);

  const [selectedClassName, setSelectedClassName] = useState("");

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await fetch(`${API_URL}/subjects`);
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0].id);
          setSelectedClassName(data[0].name);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [API_URL]);

  // Fetch attendance
  const fetchAttendance = async () => {
    if (!selectedClass || !startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/attendance?subject_id=${selectedClass}&start_date=${startDate}&end_date=${endDate}`,
      );
      const data = await res.json();
      setAttendanceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Download Excel
  const downloadExcel = () => {
    if (attendanceData.length === 0) return;

    const formattedData = attendanceData.map((item) => {
      const dateObj = new Date(item.timestamp);

      return {
        Student: item.student_name || "Unknown",
        Date: item.date,
        Time: dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        Status: item.status || "Present",
      };
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);

    // optional: auto column width
    const colWidths = [
      { wch: 25 }, // Student
      { wch: 15 }, // Date
      { wch: 10 }, // Time
      { wch: 12 }, // Status
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    XLSX.writeFile(
      wb,
      `Attendance_${selectedClassName}_${startDate}_to_${endDate}.xlsx`,
    );
  };

  return (
    <div className="p-6 bg-[#f5f5f5] min-h-screen font-sans">
      <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-4">
        STUDENT ATTENDANCE
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Class */}
        <div className="flex flex-col w-52">
          <label className="text-xs font-black uppercase mb-1">Class</label>
          {loadingClasses ? (
            <div className="h-10 border-2 border-black bg-gray-300 animate-pulse" />
          ) : (
            <select
              value={selectedClass}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedClass(id);

                const selected = classes.find((c) => c.id === id);
                setSelectedClassName(selected?.name || "");
              }}
              className="px-3 py-2 border-2 border-black font-bold shadow-[3px_3px_0px_black]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Start Date */}
        <div className="flex flex-col w-40">
          <label className="text-xs font-black uppercase mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border-2 border-black font-bold shadow-[3px_3px_0px_black]"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col w-40">
          <label className="text-xs font-black uppercase mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border-2 border-black font-bold shadow-[3px_3px_0px_black]"
          />
        </div>

        {/* Fetch & Download */}
        <div className="flex items-end gap-2">
          <button
            onClick={fetchAttendance}
            disabled={!selectedClass || !startDate || !endDate}
            className="px-4 py-2 bg-blue-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_black]"
          >
            FETCH
          </button>
          <button
            onClick={downloadExcel}
            disabled={attendanceData.length === 0}
            className="px-4 py-2 bg-green-500 text-white font-bold border-2 border-black shadow-[3px_3px_0px_black] flex items-center gap-1"
          >
            <FaDownload /> EXPORT
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-black shadow-[6px_6px_0px_black] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-black bg-gray-200">
            <tr>
              <th className="p-2 text-left">Student</th>
              <th className="p-2 text-center">Date</th>
              <th className="p-2 text-center">Time</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <div className="h-4 bg-gray-300 animate-pulse rounded w-32"></div>
                    </td>
                    <td className="p-2">
                      <div className="h-4 bg-gray-300 animate-pulse rounded w-24 mx-auto"></div>
                    </td>
                    <td className="p-2">
                      <div className="h-4 bg-gray-300 animate-pulse rounded w-20 mx-auto"></div>
                    </td>
                  </tr>
                ))
              : attendanceData.map((a, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-bold">{a.student_name}</td>
                    <td className="p-2 text-center">{a.date}</td>
                    <td className="p-2 text-center">
                      (
                      {new Date(a.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      )
                    </td>
                    <td className="p-2 text-center">{a.status}</td>
                  </tr>
                ))}
            {!loading && attendanceData.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-400">
                  No attendance data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
