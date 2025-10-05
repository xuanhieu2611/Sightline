"use client"

import AnalysisBox from "@/components/AnalysisBox"
import CameraModal from "@/components/CameraModal"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { FiCamera } from "react-icons/fi"

export default function DescribePage() {
  const router = useRouter()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const lastTapRef = useRef<number>(0)

  // Swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  )
  const [touchCurrent, setTouchCurrent] = useState<{
    x: number
    y: number
  } | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  // Announce mode when page loads
  useEffect(() => {
    const announceMode = () => {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance("Describe mode")
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1
        speechSynthesis.speak(utterance)
      }
    }

    // Small delay to ensure smooth transition
    const timer = setTimeout(announceMode, 100)
    return () => clearTimeout(timer)
  }, [])

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
    // when app is frist loaded, press anywhere to open camera
    if (!capturedBlob) {
      setCameraOpen(true)
    }

    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300 // milliseconds

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      resetCapture()
      setCameraOpen(true)
    }

    lastTapRef.current = now
  }

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Disable swipe when image is captured
    if (capturedBlob) return

    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchCurrent({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || capturedBlob) return

    const touch = e.touches[0]
    const currentPos = { x: touch.clientX, y: touch.clientY }
    setTouchCurrent(currentPos)

    const deltaX = currentPos.x - touchStart.x
    const deltaY = Math.abs(currentPos.y - touchStart.y)

    // Only treat as swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      setIsSwiping(true)
      // Prevent scrolling during horizontal swipe
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchCurrent || capturedBlob) {
      setTouchStart(null)
      setTouchCurrent(null)
      setIsSwiping(false)
      return
    }

    const deltaX = touchCurrent.x - touchStart.x
    const deltaY = Math.abs(touchCurrent.y - touchStart.y)

    // Check if it's a horizontal swipe
    if (Math.abs(deltaX) > deltaY) {
      // Swipe left (negative deltaX) to go to live page
      if (deltaX < -75) {
        router.push("/live")
      }
    }

    // Reset state
    setTouchStart(null)
    setTouchCurrent(null)
    setIsSwiping(false)
  }

  // Calculate transform for visual feedback
  const getTransform = () => {
    if (!isSwiping || !touchStart || !touchCurrent || capturedBlob)
      return "translateX(0px)"

    const deltaX = touchCurrent.x - touchStart.x
    // Only allow left swipe (negative values)
    const clampedDelta = Math.min(deltaX, 0)
    return `translateX(${clampedDelta}px)`
  }

  return (
    <div
      className="bg-black text-white flex flex-col items-center px-6 py-2"
      style={{
        minHeight: "calc(100vh - 180px)",
        transform: getTransform(),
        transition: isSwiping ? "none" : "transform 0.3s ease-out",
      }}
      onClick={handleDoubleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
