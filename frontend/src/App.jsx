import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/NavBar.jsx";
import StudentCRUD from "./pages/StudentCRUD.jsx";
import LiveDetection from "./pages/LiveDetection.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import SubjectCRUD from "./pages/SubjectCRUD.jsx";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 h-full transition-all duration-300">
        <Routes>
          <Route path="/students" element={<StudentCRUD />} />
          <Route path="/classes" element={<SubjectCRUD />} />
          <Route path="/live" element={<LiveDetection />} />
          <Route path="/attendance" element={<AttendancePage API_URL={"http://localhost:8000"}/>} />
          <Route
            path="*"
            element={
<div className="min-h-screen bg-yellow-200 flex flex-col items-center p-6 gap-6">

  {/* TITLE */}
  <h1 className="text-3xl font-black uppercase border-4 border-black bg-pink-400 px-6 py-2 shadow-[6px_6px_0px_black]">
    Welcome
  </h1>

  {/* IMAGE GRID */}
  <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">

    {/* CARD 1 */}
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_black] p-3 hover:-translate-y-1 hover:-translate-x-1 transition">
      
      <h2 className="font-black text-black mb-2 border-b-4 border-black pb-1">
        3 Kingdoms
      </h2>

      <img
        src="/3kingdom_labeled.jpg"
        className="w-full h-64 object-cover border-2 border-black"
      />

      <p className="mt-2 text-sm font-bold text-black">
        Zhang Fei • Liu Bei • Guan Yu
      </p>
    </div>

    {/* CARD 2 */}
    {/* <div className="border-4 border-black bg-white shadow-[8px_8px_0px_black] p-3 hover:-translate-y-1 hover:-translate-x-1 transition">
      
      <h2 className="font-black text-black mb-2 border-b-4 border-black pb-1">
        Lang Ya Bang
      </h2>

      <img
        src="/langyabang_labeled.jpg"
        className="w-full h-64 object-cover border-2 border-black"
      />

      <p className="mt-2 text-sm font-bold text-black">
        Detected Faces
      </p>
    </div> */}

  </div>
</div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
