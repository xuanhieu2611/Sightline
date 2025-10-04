"use client"

import { useState, useRef } from "react"

interface ImageAnalyzerProps {
  onAnalysisComplete: (description: string) => void
  onError: (error: string) => void
}

export function ImageAnalyzer({
  onAnalysisComplete,
  onError,
}: ImageAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onAnalysisComplete(result.description)
      } else {
        onError(result.error || "Failed to analyze image")
      }
    } catch (error) {
      onError(
        "Network error: " +
          (error instanceof Error ? error.message : "Unknown error")
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Image Preview */}
      {previewUrl && (
        <div className="mb-4">
          <img
            src={previewUrl}
            alt="Selected for analysis"
            className="w-full h-48 object-cover rounded-lg border-2 border-white"
          />
          <button
            onClick={clearImage}
            className="mt-2 w-full h-10 bg-red-600 text-white font-bold rounded-lg touch-target"
          >
            Clear Image
          </button>
        </div>
      )}

      {/* File Selection Buttons */}
      {!selectedImage && (
        <div className="space-y-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full h-16 bg-blue-600 text-white font-bold rounded-lg touch-target"
          >
            📷 Take Photo
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-16 bg-gray-600 text-white font-bold rounded-lg touch-target"
          >
            📁 Choose File
          </button>
        </div>
      )}

      {/* Analyze Button */}
      {selectedImage && (
        <button
          onClick={analyzeImage}
          disabled={isAnalyzing}
          className={`
            w-full h-16 rounded-lg font-bold text-lg touch-target
            ${
              isAnalyzing
                ? "bg-yellow-600 text-white animate-pulse"
                : "bg-green-600 text-white hover:bg-green-700"
            }
          `}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </div>
          ) : (
            "🔍 Analyze Image"
          )}
        </button>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  )
}
