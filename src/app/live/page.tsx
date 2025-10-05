"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FiCamera } from "react-icons/fi"

export default function DescribePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingAudioRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null) // 👈 NEW: Store audio element
  const abortControllerRef = useRef<AbortController | null>(null) // For canceling fetch requests

  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastDescription, setLastDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [manualCapture, setManualCapture] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

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
    startMonitoring()

    return () => {
      stopCamera()
      stopMonitoring()
      // Abort any ongoing fetch requests when unmounting
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      // Stop any playing audio when navigating away
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      // Cancel any speech synthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
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

  // Stop monitoring
  const stopMonitoring = () => {
    console.log("🔴 STOPPING MONITORING")
    setIsMonitoring(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      console.log("Interval cleared")
    }
  }

  // Start monitoring
  const startMonitoring = () => {
    console.log("🟢 STARTING MONITORING")
    setIsMonitoring(true)

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      console.log("⏰ INTERVAL TRIGGERED - 10 seconds passed")
      console.log(
        "Current state - isAnalyzing:",
        isAnalyzing,
        "isPlayingAudio:",
        isPlayingAudioRef.current
      )

      if (!isAnalyzing && !isPlayingAudioRef.current) {
        console.log("✅ Starting auto capture...")
        captureAndAnalyze(false)
      } else {
        console.log("❌ Skipping - analyzing or audio playing")
      }
    }, 10000)

    console.log("Interval created:", intervalRef.current)
  }

  // Capture image and analyze
  const captureAndAnalyze = async (isManual = false) => {
    console.log(
      "📸 Starting capture and analyze",
      isManual ? "(MANUAL)" : "(AUTO)"
    )

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

      // Send to different APIs based on manual vs auto
      console.log("🌐 Sending to API...")
      if (isManual) {
        await analyzeImageManual(imageBlob)
      } else {
        await analyzeImageAuto(imageBlob)
      }
    } catch (error) {
      console.error("Capture error:", error)
    } finally {
      setIsAnalyzing(false)
      console.log("✅ Analysis complete, analyzing set to false")

      // Resume monitoring after manual capture
      if (isManual) {
        console.log("🔄 Resuming auto-monitoring after manual capture")
        startMonitoring()
      }
    }
  }

  // Analyze image for MANUAL capture - uses /api/image-describe (streaming with ElevenLabs audio)
  const analyzeImageManual = async (imageBlob: Blob) => {
    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const formData = new FormData()
      formData.append("image", imageBlob)

      console.log("📝 Using /api/image-describe for manual capture")
      const response = await fetch("/api/image-describe", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let buffer = ""
      let fullText = ""
      const audioChunks: string[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const obj = JSON.parse(line)
            if (obj.type === "text" && obj.chunk) {
              fullText += obj.chunk
              setLastDescription(fullText)
            } else if (obj.type === "audio" && obj.chunk) {
              audioChunks.push(obj.chunk)
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }

      console.log("🤖 Manual final description:", fullText)

      // Play ElevenLabs audio if available
      if (audioChunks.length > 0) {
        console.log("🔊 Playing ElevenLabs audio chunks:", audioChunks.length)
        await playElevenLabsAudio(audioChunks)
      } else {
        console.log("⚠️ No audio chunks received, falling back to native TTS")
        speakText(fullText)
      }
    } catch (error) {
      // Handle abort errors gracefully (user navigated away)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("🚫 Request aborted (user navigated away)")
      } else {
        console.error("Manual analysis error:", error)
      }
    } finally {
      // Clean up abort controller reference
      abortControllerRef.current = null
    }
  }

  // Play ElevenLabs audio chunks
  const playElevenLabsAudio = async (audioChunks: string[]) => {
    try {
      isPlayingAudioRef.current = true
      setIsPlayingAudio(true)
      console.log("🔊 Audio playback started - blocking auto-capture")

      // Convert base64 chunks to audio buffers
      const audioBuffers = audioChunks.map((chunk) =>
        Uint8Array.from(atob(chunk), (c) => c.charCodeAt(0))
      )

      // Combine all audio buffers
      const totalLength = audioBuffers.reduce(
        (sum, buffer) => sum + buffer.length,
        0
      )
      const combinedBuffer = new Uint8Array(totalLength)

      let offset = 0
      for (const buffer of audioBuffers) {
        combinedBuffer.set(buffer, offset)
        offset += buffer.length
      }

      // Create audio blob
      const audioBlob = new Blob([combinedBuffer], { type: "audio/mpeg" })
      const audioUrl = URL.createObjectURL(audioBlob)

      // 👈 USE THE PRE-CREATED AUDIO ELEMENT
      if (audioRef.current) {
        const audio = audioRef.current
        audio.src = audioUrl

        // Set up event handlers
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          isPlayingAudioRef.current = false
          setIsPlayingAudio(false)
          console.log("🔊 Audio playback finished - auto-capture unblocked")
        }

        audio.onerror = (error) => {
          console.error("Audio playback error:", error)
          URL.revokeObjectURL(audioUrl)
          isPlayingAudioRef.current = false
          setIsPlayingAudio(false)
        }

        // Play the audio
        await audio.play()
        console.log("🔊 Audio playing successfully")
      } else {
        console.error("No audio element available")
        throw new Error("Audio element not created")
      }
    } catch (error) {
      console.error("Error playing ElevenLabs audio:", error)
      isPlayingAudioRef.current = false
      setIsPlayingAudio(false)
      // Fallback to native TTS
      speakText(lastDescription)
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
                <span className="text-green-400">🔴 Live Monitoring</span>
                {isAnalyzing && (
                  <span className="text-blue-400 ml-2">Analyzing...</span>
                )}
                {manualCapture && (
                  <span className="text-yellow-400 ml-2">(Manual)</span>
                )}
                {isPlayingAudio && (
                  <span className="text-purple-400 ml-2">🔊 Playing</span>
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
