"use client"

import AnalysisBox from "@/components/AnalysisBox"
import CameraModal from "@/components/CameraModal"
import { useState, useEffect, useRef } from "react"
import { FiCamera } from "react-icons/fi"

export default function DescribePage() {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const lastTapRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const handleCapture = (blob: Blob) => {
    setCapturedBlob(blob)
    setImageUrl(URL.createObjectURL(blob))
    setCameraOpen(false)
  }

  const resetCapture = () => {
    setCapturedBlob(null)
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
      setImageUrl(null)
    }
  }

  const handleDoubleTap = () => {
    // Only allow double-tap when an image is captured
    if (!capturedBlob) return

    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300 // milliseconds

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      resetCapture()
      setCameraOpen(true)
    }

    lastTapRef.current = now
  }

  return (
    <div
      className="bg-black text-white flex flex-col items-center px-6 py-2"
      style={{ minHeight: "calc(100vh - 180px)" }}
      onClick={handleDoubleTap}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {!capturedBlob ? (
          <button
            onClick={() => setCameraOpen(true)}
            type="button"
            aria-label="Open camera"
            className="w-40 h-40 md:w-56 md:h-56 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform focus:outline-none mt-20"
          >
            <FiCamera size={64} />
          </button>
        ) : (
          <div className="w-full space-y-6">
            <div className="flex justify-center">
              <img
                src={imageUrl!}
                alt="Captured for analysis"
                className="w-full h-64 object-cover rounded-lg border border-white"
              />
            </div>
          </div>
        )}

        <CameraModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCapture}
        />

        <AnalysisBox blob={capturedBlob} />
      </div>
    </div>
  )
}
