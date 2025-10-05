"use client"

import AnalysisBox from "@/components/AnalysisBox";
import CameraModal from "@/components/CameraModal";
import { useState, useEffect } from "react";
import { FiCamera } from "react-icons/fi";

export default function DescribePage() {
  const [cameraOpen, setCameraOpen] = useState(true);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessingOrPlayingAudio, setIsProcessionOrPlayingAudio] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleCapture = (blob: Blob) => {
    setCapturedBlob(blob);
    setImageUrl(URL.createObjectURL(blob));
    setCameraOpen(false);
  };

  const resetCapture = () => {
    setCapturedBlob(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        {!capturedBlob ? (
          <div className="flex flex-col items-center">
            <button
              onClick={() => !isProcessingOrPlayingAudio && setCameraOpen(true)}
              type="button"
              aria-label="Open camera"
              disabled={isProcessingOrPlayingAudio}
              className={`w-40 h-40 md:w-56 md:h-56 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 transition-transform focus:outline-none ${
                isProcessingOrPlayingAudio
                  ? "border-gray-600 opacity-50 cursor-not-allowed"
                  : "border-white active:scale-95"
              }`}
            >
              <FiCamera size={64} />
            </button>
            {isProcessingOrPlayingAudio && (
              <p className="mt-4 text-gray-400 text-sm text-center">
                Audio is playing... Please wait
              </p>
            )}
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="flex justify-center">
              <img
                src={imageUrl!}
                alt="Captured for analysis"
                className="w-full h-64 object-cover rounded-lg border border-white"
              />
            </div>

            <button
              onClick={resetCapture}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Take Another Photo
            </button>
          </div>
        )}

        <CameraModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCapture}
          isProcessingOrPlayingAudio={isProcessingOrPlayingAudio}
          setIsProcessionOrPlayingAudio={setIsProcessionOrPlayingAudio}
        />

        <AnalysisBox
          blob={capturedBlob}
          isProcessingOrPlayingAudio={isProcessingOrPlayingAudio}
          setIsProcessionOrPlayingAudio={setIsProcessionOrPlayingAudio}
        />
      </div>
    </div>
  );
}