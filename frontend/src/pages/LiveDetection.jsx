import { useState, useEffect } from "react";
import { FaLeftRight } from "react-icons/fa6";
import TodayAttendance from "../components/LiveDetectionComponents/TodayAttendance";

export default function LiveDetection() {
  const [useWebcam, setUseWebcam] = useState(true);
  const [ipCam, setIpCam] = useState("");

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState();

  const [loading, setLoading] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const canStart = useWebcam ? selectedClass : ipCam;

  // ----------------------------
  // VIDEO SOURCE
  // ----------------------------
  const videoSrc =
    cameraOn &&
    (useWebcam
      ? `http://localhost:8000/video_feed_webcam/${selectedClass}`
      : ipCam && selectedClass
        ? `http://localhost:8000/video_feed_ip/${ipCam}/${selectedClass}`
        : "");

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await fetch("http://localhost:8000/subjects");
        const data = await res.json();
        setClasses(data);

        // auto select first class
        if (data.length > 0) {
          setSelectedClass(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (cameraOn) {
      setStreamReady(false);
      setLoading(true);

      // small restart trick
      setCameraOn(false);
      setTimeout(() => {
        setCameraOn(true);
      }, 200);
    }
  }, [selectedClass]);

  // ----------------------------
  // SOURCE SWITCH
  // ----------------------------
  const handleWebcam = () => {
    setUseWebcam(true);
    setStreamReady(false);
  };

  const handleIPCam = () => {
    setUseWebcam(false);
    setStreamReady(false);
  };

  // ----------------------------
  // CAMERA CONTROL
  // ----------------------------
  const handleOpenCamera = () => {
    setCameraOn(true);
    setLoading(true);
    setStreamReady(false);
  };

  const handleCloseCamera = () => {
    setCameraOn(false);
    setLoading(false);
    setStreamReady(false);
  };

  return (
    <div className="p-6 bg-[#f5f5f5] h-screen text-black font-sans overflow-y-auto">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* TITLE */}
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            LIVE DETECTION
          </h1>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
            Monitoring System
          </p>
        </div>

        {/* STATUS */}
        <div
          className={`px-4 py-1 text-xs font-black border-2 text-center w-fit ${
            !cameraOn
              ? "bg-white text-black border-black"
              : streamReady
                ? "bg-green-500 text-white border-black"
                : loading
                  ? "bg-yellow-400 text-black border-black"
                  : "bg-red-500 text-white border-black"
          }`}
        >
          {!cameraOn
            ? "OFF"
            : streamReady
              ? "CONNECTED"
              : loading
                ? "CONNECTING..."
                : "FAILED"}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-4 mb-6">
        {/* CAMERA TYPE */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase">Source</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleWebcam}
              className={`px-3 py-2 text-xs md:text-sm font-black border-2 transition ${
                useWebcam
                  ? "bg-blue-500 text-white border-black shadow-[4px_4px_0px_black]"
                  : "bg-white border-black hover:bg-gray-100"
              }`}
            >
              WEBCAM
            </button>

            <FaLeftRight className="text-black text-sm" />

            <button
              onClick={handleIPCam}
              className={`px-3 py-2 text-xs md:text-sm font-black border-2 transition ${
                !useWebcam
                  ? "bg-blue-500 text-white border-black shadow-[4px_4px_0px_black]"
                  : "bg-white border-black hover:bg-gray-100"
              }`}
            >
              IP CAM
            </button>
          </div>
        </div>

        {/* CAMERA CONTROL */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase">Camera</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleOpenCamera}
              disabled={!canStart}
              className={`px-3 py-2 text-xs md:text-sm font-black border-2 transition ${
                cameraOn
                  ? "bg-green-500 text-white border-black shadow-[4px_4px_0px_black]"
                  : "bg-white border-black hover:bg-gray-100"
              }`}
            >
              OPEN
            </button>

            <FaLeftRight className="text-black text-sm" />

            <button
              onClick={handleCloseCamera}
              className={`px-3 py-2 text-xs md:text-sm font-black border-2 transition ${
                !cameraOn
                  ? "bg-red-500 text-white border-black shadow-[4px_4px_0px_black]"
                  : "bg-white border-black hover:bg-gray-100"
              }`}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* IP INPUT */}
        <div className="flex flex-col w-full sm:w-64">
          <label className="text-[10px] font-black uppercase mb-1">
            IP Address
          </label>
          <input
            type="text"
            placeholder="Enter IP..."
            value={ipCam}
            onChange={(e) => setIpCam(e.target.value)}
            disabled={useWebcam}
            className={`px-3 py-2 border-2 text-sm font-bold outline-none ${
              useWebcam
                ? "bg-gray-200 text-gray-400 border-black cursor-not-allowed"
                : "bg-white border-black shadow-[3px_3px_0px_black]"
            }`}
          />
        </div>

        {/* CLASS SELECT */}
        <div className="flex flex-col w-full sm:w-52">
          <label className="text-[10px] font-black uppercase mb-1">Class</label>

          {loadingClasses ? (
            <div className="h-10 border-2 border-black bg-gray-300 animate-pulse" />
          ) : (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              className="px-3 py-2 border-2 border-black text-sm font-bold bg-white shadow-[3px_3px_0px_black]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIDEO */}
      <div className="relative border-4 border-black bg-white shadow-[8px_8px_0px_black] max-w-5xl mx-auto">
        {/* CAMERA OFF */}
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-lg font-bold z-10">
            CAMERA OFF
          </div>
        )}

        {/* LOADING */}
        {cameraOn && loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg font-bold z-10">
            STARTING CAMERA...
          </div>
        )}

        {/* ERROR */}
        {cameraOn && !loading && !streamReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400 text-lg font-bold z-10">
            FAILED TO CONNECT
          </div>
        )}

        {/* STREAM */}
        {cameraOn && videoSrc ? (
          <img
            src={videoSrc}
            alt="Live"
            className="w-full h-[70vh] object-contain bg-black"
            onLoad={() => {
              setTimeout(() => {
                setLoading(false);
                setStreamReady(true);
              }, 300);
            }}
            onError={() => {
              setLoading(false);
              setStreamReady(false);
            }}
          />
        ) : (
          <div className="h-[70vh]" />
        )}

        {/* FOOT BAR */}
        <div className="flex justify-between items-center px-4 py-2 border-t-2 border-black text-xs font-bold">
          <span>SOURCE: {useWebcam ? "WEBCAM" : ipCam || "IP CAMERA"}</span>
          <span>
            {classes.find((c) => c.id === selectedClass)?.name || "No Class"}
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-6 text-center text-xs font-bold">
        REAL-TIME MONITORING
      </div>

      <TodayAttendance subjectId={selectedClass} />
    </div>
  );
}
