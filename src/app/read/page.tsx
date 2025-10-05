"use client"

import { useRef, useState, useEffect } from "react"
import DesktopCapture from "../../components/DesktopCapture"

export default function ReadPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showDesktopCam, setShowDesktopCam] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [readText, setReadText] = useState("")

  useEffect(() => {
    return () => {
      if (capturedImage?.startsWith("blob:")) URL.revokeObjectURL(capturedImage)
    }
  }, [capturedImage])

  const isMobile = () =>
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const openCamera = () => {
    if (isMobile()) {
      inputRef.current?.click()
    } else {
      setShowDesktopCam(true)
    }
  }

  const handleCaptureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCapturedImage(URL.createObjectURL(file))
    analyzeImage(file)
  }

  const handleCaptureDesktop = (file: File) => {
    setCapturedImage(URL.createObjectURL(file))
    setShowDesktopCam(false)
    analyzeImage(file)
  }

  const analyzeImage = async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch("/api/image-describe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to analyze image")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let text = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += new TextDecoder().decode(value)
        setReadText(text)
      }
    } catch (error) {
      console.error("Error analyzing image:", error)
      setReadText("Error analyzing image. Please try again.")
    }
  }

  const speakText = () => {
    if ("speechSynthesis" in window && readText) {
      const utterance = new SpeechSynthesisUtterance(readText)
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-white mb-8">Read Mode</h1>

        {capturedImage && (
          <div className="mb-6">
            <img
              src={capturedImage}
              alt="Captured for reading"
              className="max-w-full h-64 object-contain rounded-lg border border-white"
            />
          </div>
        )}

        {readText && (
          <div className="mb-6 max-w-2xl">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <p className="text-white">{readText}</p>
            </div>
            <button
              onClick={speakText}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔊 Speak Text
            </button>
          </div>
        )}

        {!capturedImage && (
          <button
            onClick={openCamera}
            className="px-8 py-4 bg-white text-black text-lg font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            📷 Take Photo
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCaptureInput}
          className="hidden"
        />

        {showDesktopCam && (
          <DesktopCapture
            onCapture={handleCaptureDesktop}
            onClose={() => setShowDesktopCam(false)}
          />
        )}
      </div>
    </div>
  )
}
