"use client";

import { useRef, useState, useEffect } from "react";
import { FiCamera } from "react-icons/fi";
import DesktopCapture from "../components/DesktopCapture";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showDesktopCam, setShowDesktopCam] = useState(false);

  useEffect(() => {
    return () => {
      if (photo && photo.startsWith("blob:")) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  const isMobile = () => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  const openCamera = () => {
    if (isMobile()) {
      inputRef.current?.click(); // mobile: file input (camera)
    } else {
      setShowDesktopCam(true); // desktop: use getUserMedia modal
    }
  };

  const handleCaptureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // prefer object URL for performance
    if (photo && photo.startsWith("blob:")) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
  };

  const handleCaptureDesktop = (blob: Blob) => {
    if (photo && photo.startsWith("blob:")) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(blob));
    setShowDesktopCam(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-7xl md:text-9xl font-extrabold mb-12 text-white">SightLine</h1>

      <button
        onClick={openCamera}
        type="button"
        aria-label="Open camera"
        className="w-40 h-40 md:w-56 md:h-56 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-white hover:text-black hover:border-black active:scale-95 transition-transform focus:outline-none"
      >
        <FiCamera className="text-current" size={64} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCaptureInput}
        className="hidden"
      />

      {showDesktopCam && (
        <DesktopCapture
          onCapture={handleCaptureDesktop}
          onCancel={() => setShowDesktopCam(false)}
        />
      )}

      {photo && (
        <img
          src={photo}
          alt="Captured"
          className="mt-6 w-full max-w-sm rounded-lg border border-white"
        />
      )}
    </div>
  );
}
