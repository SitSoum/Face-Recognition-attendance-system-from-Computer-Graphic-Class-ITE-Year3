import { Link, useLocation } from "react-router-dom";
import { HiMenu } from "react-icons/hi";

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation(); // to highlight active link
  const links = [
    { path: "/students", label: "Students" },
    { path: "/classes", label: "Classes/Subjects" },
    { path: "/live", label: "Live Detection" },
    { path: "/attendance", label: "Attendance list" },
  ];

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden flex items-start justify-between bg-[#020c1b] p-3 border-b border-cyan-900 ">
        {/* <span className="text-cyan-300 font-bold uppercase tracking-tight">
          NeoSchool.exe
        </span> */}
        <HiMenu
          className="text-cyan-400 w-6 h-6 cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg-[#020c1b] p-6 font-mono border-r-4 border-cyan-900
          transform z-20 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:relative md:flex flex-col`}
      >
        {/* Logo */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-[#0a192f]/80 backdrop-blur-md border-2 border-cyan-400 p-4 shadow-[6px_6px_0px_0px_#0891b2] transform -rotate-1">
            <span className="text-xl font-black tracking-tighter text-cyan-300 uppercase">
              CG<span className="text-white">Attendance</span>.exe
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-5">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative group px-5 py-4 transition-all duration-200 border-2 
                  ${isActive 
                    ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[4px_4px_0px_0px_#0891b2] translate-x-[-2px] translate-y-[-2px]" 
                    : "bg-white/5 border-transparent text-slate-400 hover:border-slate-700 hover:text-cyan-200"}`}
              >
                <div className="absolute inset-0 backdrop-blur-sm -z-10" />
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-widest text-sm">
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                  )}
                </div>
                {isActive && (
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border-l border-t border-black" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Info */}
        <div className="mt-auto pt-6 border-t border-cyan-900/50">
          <div className="bg-cyan-950/40 p-3 border-2 border-cyan-900 rounded-sm">
            <p className="text-[10px] text-cyan-600 uppercase font-bold mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 bg-cyan-900">
                <div className="h-full bg-cyan-400 w-3/4 shadow-[0_0_10px_#22d3ee]" />
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">75%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}