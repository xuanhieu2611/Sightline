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

    useImperativeHandle(
      ref,
      () => ({
        open: () => setIsOpen(true),
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
      const utterance = new SpeechSynthesisUtterance(countdown.toString())
      utterance.rate = 1.5
      window.speechSynthesis.speak(utterance)

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }

      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
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
            const utterance = new SpeechSynthesisUtterance("Photo captured")
            utterance.rate = 1.5
            window.speechSynthesis.speak(utterance)

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
