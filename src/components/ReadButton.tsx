"use client"

import { useState, useRef } from "react"

interface ReadButtonProps {
  onAction: (message: string) => void
}

export function ReadButton({ onAction }: ReadButtonProps) {
  const [isReading, setIsReading] = useState(false)
  const [hasText, setHasText] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRead = async () => {
    if (isReading) return

    setIsReading(true)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 25, 50])
    }

    try {
      // Try to access camera for OCR
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach((track) => track.stop())

      // Simulate OCR processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate text detection
      const detectedTexts = [
        "MENU - Coffee $3.50, Tea $2.00",
        "EXIT - Emergency Exit Only",
        "RESTROOM - Women's Room",
        "ELEVATOR - Floor 2, 3, 4",
        "PARKING - Level B2",
        "CAFE - Open 7AM-9PM",
      ]

      const detectedText =
        detectedTexts[Math.floor(Math.random() * detectedTexts.length)]
      setHasText(true)
      onAction(`Text detected: ${detectedText}. Read all?`)
    } catch (error) {
      // Fallback to file upload
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    setIsReading(false)
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsReading(true)

    // Simulate OCR processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const detectedText = "Menu items: Coffee $3.50, Tea $2.00, Sandwich $8.99"
    setHasText(true)
    onAction(`Text detected: ${detectedText}. Read all?`)

    setIsReading(false)
  }

  const handleReadAll = () => {
    onAction(
      "Reading complete. Menu includes coffee, tea, and sandwiches with prices listed."
    )
    setHasText(false)
  }

  return (
    <div className="text-center">
      <button
        className={`
          w-full h-20 rounded-lg border-4 border-white
          bg-black text-white font-bold text-lg
          transition-all duration-200 ease-in-out
          touch-target
          hover:bg-white hover:text-black
          focus:outline-none focus:ring-4 focus:ring-green-500
          ${isReading ? "animate-pulse" : ""}
        `}
        onClick={handleRead}
        disabled={isReading}
        aria-label="Read text from signs or menus"
      >
        {isReading ? (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Reading...
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-1">📖</div>
            <span>READ</span>
          </div>
        )}
      </button>

      {hasText && (
        <div className="mt-4 space-y-2">
          <button
            className="w-full h-12 bg-green-600 text-white font-bold rounded-lg touch-target"
            onClick={handleReadAll}
          >
            Read All
          </button>
          <button
            className="w-full h-10 bg-gray-600 text-white font-bold rounded-lg touch-target"
            onClick={() => setHasText(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
