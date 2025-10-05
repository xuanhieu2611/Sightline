import { useState, useEffect } from "react";
import { FiCamera } from "react-icons/fi";
import CameraModal from "../components/CameraModal";
import AnalysisBox from "../components/AnalysisBox";

export default function Home() {
    const [cameraOpen, setCameraOpen] = useState(false);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

    useEffect(() => {
        return () => {
            /* cleanup */
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
            <h1 className="text-7xl md:text-9xl font-extrabold mb-12 text-white">SightLine</h1>

            <button
                onClick={() => setCameraOpen(true)}
                type="button"
                aria-label="Open camera"
                className="w-40 h-40 md:w-56 md:h-56 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform focus:outline-none"
            >
                <FiCamera size={64} />
            </button>

            <CameraModal
                open={cameraOpen}
                onClose={() => setCameraOpen(false)}
                onCapture={(blob) => {
                    setCapturedBlob(blob);
                    setCameraOpen(false);
                }}
            />

            {/* AnalysisBox handles uploading the blob and showing streamed text */}
            <AnalysisBox blob={capturedBlob} />
        </div>
    );
}