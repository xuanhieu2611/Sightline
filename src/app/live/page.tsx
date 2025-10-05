"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DescribePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastDescription, setLastDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cameraError, setCameraError] = useState("")

  // Swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  )
  const [touchCurrent, setTouchCurrent] = useState<{
    x: number
    y: number
  } | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  // Auto-start camera on page load
  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
      // Cancel any speech synthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Announce mode when page loads
  useEffect(() => {
    const announceMode = () => {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance('"Live" mode')
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

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = () => {
          console.log("Video ready")
          // Wait for camera to stabilize before first capture
          setTimeout(() => {
            console.log("Camera stabilized, starting first analysis")
            captureAndAnalyze()
          }, 2000) // 2 second delay to allow camera to focus
        }
      }
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError("Camera access denied. Please allow camera access.")
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  // Set monitoring state (for UI display)
  const setMonitoringState = (monitoring: boolean) => {
    console.log(monitoring ? "🟢 MONITORING ACTIVE" : "🔴 MONITORING STOPPED")
    setIsMonitoring(monitoring)
  }

  // Capture image and analyze
  const captureAndAnalyze = async () => {
    console.log("📸 Starting capture and analyze")

    if (!videoRef.current || !canvasRef.current || isAnalyzing) {
      console.log(
        "❌ Skipping capture - video:",
        !!videoRef.current,
        "canvas:",
        !!canvasRef.current,
        "analyzing:",
        isAnalyzing
      )
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      console.error("No canvas context")
      return
    }

    setIsAnalyzing(true)
    setMonitoringState(true)
    console.log("🔄 Setting analyzing to true")

    try {
      // Capture frame
      canvas.width = video.videoWidth || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      console.log("📷 Captured frame:", canvas.width, "x", canvas.height)

      // Convert to blob
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log("💾 Created blob:", blob.size, "bytes")
              resolve(blob)
            }
          },
          "image/jpeg",
          0.8
        )
      })

      // Send to API
      console.log("🌐 Sending to API...")
      await analyzeImageAuto(imageBlob)
    } catch (error) {
      console.error("Capture error:", error)
    } finally {
      setIsAnalyzing(false)
      console.log("✅ Analysis complete, analyzing set to false")
    }
  }

  // Analyze image for AUTO capture - uses /api/image-analyze (JSON response)
  const analyzeImageAuto = async (imageBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("image", imageBlob)

      console.log("🔄 Using /api/image-analyze for auto capture")
      const response = await fetch("/api/image-analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      console.log("🤖 Auto API response:", data)

      if (data.description) {
        setLastDescription(data.description)
        speakText(data.description)
      }
    } catch (error) {
      console.error("Auto analysis error:", error)
    }
  }

  // Text to speech
  const speakText = (text: string) => {
    console.log("🔊 Speaking:", text)
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      // Add event listener for when speech ends
      utterance.onend = () => {
        console.log("🔊 Speech ended, starting next analysis")
        // Start next analysis when TTS is done
        setTimeout(() => {
          if (!isAnalyzing) {
            captureAndAnalyze()
          }
        }, 500) // Small delay to ensure smooth transition
      }

      speechSynthesis.speak(utterance)
    }
  }

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchCurrent({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return

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
    if (!touchStart || !touchCurrent) {
      setTouchStart(null)
      setTouchCurrent(null)
      setIsSwiping(false)
      return
    }

    const deltaX = touchCurrent.x - touchStart.x
    const deltaY = Math.abs(touchCurrent.y - touchStart.y)

    // Check if it's a horizontal swipe
    if (Math.abs(deltaX) > deltaY) {
      // Swipe right (positive deltaX) to go to describe page
      if (deltaX > 75) {
        router.push("/describe")
      }
    }

    // Reset state
    setTouchStart(null)
    setTouchCurrent(null)
    setIsSwiping(false)
  }

  // Calculate transform for visual feedback
  const getTransform = () => {
    if (!isSwiping || !touchStart || !touchCurrent) return "translateX(0px)"

    const deltaX = touchCurrent.x - touchStart.x
    // Only allow right swipe (positive values)
    const clampedDelta = Math.max(deltaX, 0)
    return `translateX(${clampedDelta}px)`
  }

  return (
    <div
      className="bg-black text-white flex flex-col h-full overflow-hidden"
      style={{
        transform: getTransform(),
        transition: isSwiping ? "none" : "transform 0.3s ease-out",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-start justify-start p-6">
        {cameraError ? (
          <div className="text-center">
            <div className="bg-red-900 p-6 rounded-lg mb-6">
              <p className="text-red-200 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            {/* Video Feed */}
            <div className="relative mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 md:h-96 object-cover rounded-lg border border-white"
              />

              {/* Status Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-lg text-sm">
                <span className="text-green-400">🔴 Live Analysis</span>
                {isAnalyzing && (
                  <span className="text-blue-400 ml-2">Analyzing...</span>
                )}
              </div>
            </div>

            {/* Last Description */}
            {lastDescription && (
              <div className="h-40 flex flex-col justify-end overflow-hidden">
                <p className="text-white whitespace-pre-line text-center text-4xl font-semibold">
                  {lastDescription}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
