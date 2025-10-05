"use client"

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react"

export type MobileCaptureHandle = {
  open: () => void
}

type Props = {
  onCapture: (blob: Blob) => void
  autoCapture?: boolean
  captureDelay?: number // in seconds
}

const MobileCapture = forwardRef<MobileCaptureHandle, Props>(
  ({ onCapture, autoCapture = true, captureDelay = 3 }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [countdown, setCountdown] = useState<number | null>(null)
    const speechInitialized = useRef(false)

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          // Initialize speech synthesis on user interaction (required for mobile)
          if (!speechInitialized.current && typeof window !== "undefined") {
            try {
              // Prime the speech synthesis with a silent utterance
              const primeUtterance = new SpeechSynthesisUtterance("")
              window.speechSynthesis.speak(primeUtterance)
              speechInitialized.current = true
            } catch (err) {
              console.warn("Speech synthesis initialization failed:", err)
            }
          }
          setIsOpen(true)
        },
      }),
      []
    )

    useEffect(() => {
      if (!isOpen) return

      let mounted = true
      ;(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          })

          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }

          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
          }

          // Start countdown after camera is ready
          if (autoCapture) {
            setCountdown(captureDelay)
          }
        } catch (err) {
          console.error("Camera access failed:", err)
          setIsOpen(false)
        }
      })()

      return () => {
        mounted = false
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
      }
    }, [isOpen, autoCapture, captureDelay])

    // Countdown timer
    useEffect(() => {
      if (countdown === null || countdown < 0) return

      if (countdown === 0) {
        capturePhoto()
        return
      }

      // Speak countdown for accessibility
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          // Cancel any pending speech to avoid queue buildup
          window.speechSynthesis.cancel()

          const utterance = new SpeechSynthesisUtterance(countdown.toString())
          utterance.rate = 1.5
          utterance.volume = 1.0

          // Add error handler for mobile compatibility
          utterance.onerror = (event) => {
            console.warn("Speech synthesis error:", event)
          }

          window.speechSynthesis.speak(utterance)
        } catch (err) {
          console.warn("Failed to speak countdown:", err)
        }
      }

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }

      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => {
        clearTimeout(timer)
        // Clean up speech on unmount
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
      }
    }, [countdown])

    const capturePhoto = async () => {
      const video = videoRef.current
      if (!video) return

      const w = video.videoWidth || 1280
      const h = video.videoHeight || 720
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(video, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Audio feedback for capture
            if (typeof window !== "undefined" && window.speechSynthesis) {
              try {
                const utterance = new SpeechSynthesisUtterance("Photo captured")
                utterance.rate = 1.5
                utterance.volume = 1.0
                window.speechSynthesis.speak(utterance)
              } catch (err) {
                console.warn("Failed to speak capture confirmation:", err)
              }
            }

            // Double vibration for capture confirmation
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }

            onCapture(blob)
            setIsOpen(false)
            setCountdown(null)
          }
        },
        "image/jpeg",
        0.92
      )

      // Stop stream after capture
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-9xl font-bold animate-pulse">
                {countdown}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

MobileCapture.displayName = "MobileCapture"

export default MobileCapture
