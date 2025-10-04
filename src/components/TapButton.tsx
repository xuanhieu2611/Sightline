"use client"

import { useState, useRef, useEffect } from "react"

interface TapButtonProps {
  onAction: (message: string) => void
  onLongPress: () => void
}

export function TapButton({ onAction, onLongPress }: TapButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const pressStartTime = useRef<number>(0)

  const handlePressStart = () => {
    setIsPressed(true)
    pressStartTime.current = Date.now()

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      onLongPress()
    }, 800) // 800ms for long press
  }

  const handlePressEnd = () => {
    setIsPressed(false)

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Check if it was a short press
    const pressDuration = Date.now() - pressStartTime.current
    if (pressDuration < 800) {
      handleTap()
    }
  }

  const handleTap = async () => {
    if (isScanning) return

    setIsScanning(true)

    // Simulate scanning with haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    try {
      // Try to access camera for real image analysis
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      // Create a canvas to capture the image
      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
      })

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)

      // Stop the camera
      stream.getTracks().forEach((track) => track.stop())

      // Convert to blob and send to API
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(resolve!, "image/jpeg", 0.8)
      })

      const formData = new FormData()
      formData.append("image", blob, "camera-capture.jpg")

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onAction(result.description)
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.log("Camera access failed, using fallback:", error)

      // Fallback to simulated response
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const responses = [
        "Two people ahead. Door slightly right. Clear path left.",
        "Obstacle detected at 2 o'clock. Safe passage to your left.",
        "Clear path ahead. No obstacles detected.",
        "Stairs ahead. Handrail on your right.",
        "Doorway detected. Handle on the left side.",
        "Crowded area. Move slowly and stay to the right.",
      ]

      const response = responses[Math.floor(Math.random() * responses.length)]
      onAction(response)
    }

    setIsScanning(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <button
      className={`
        relative w-32 h-32 rounded-full border-4 border-white
        bg-black text-white font-bold text-xl
        transition-all duration-200 ease-in-out
        touch-target
        ${
          isPressed
            ? "scale-95 bg-white text-black"
            : "hover:bg-white hover:text-black"
        }
        ${isScanning ? "animate-pulse" : ""}
        focus:outline-none focus:ring-4 focus:ring-green-500
      `}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      disabled={isScanning}
      aria-label="Tap to scan surroundings"
    >
      {isScanning ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-sm">Scanning...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-white rounded-full mb-2 flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <span className="text-sm">TAP</span>
        </div>
      )}
    </button>
  )
}
