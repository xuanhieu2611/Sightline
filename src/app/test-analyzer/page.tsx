"use client"

import { useState } from "react"
import { ImageAnalyzer } from "@/components/ImageAnalyzer"
import { VoiceFeedback } from "@/components/VoiceFeedback"

export default function TestAnalyzerPage() {
  const [voiceMessage, setVoiceMessage] = useState("")
  const [analysisHistory, setAnalysisHistory] = useState<string[]>([])

  const handleAnalysisComplete = (description: string) => {
    setVoiceMessage(description)
    setAnalysisHistory((prev) => [description, ...prev.slice(0, 4)]) // Keep last 5 analyses

    // Clear message after 5 seconds
    setTimeout(() => {
      setVoiceMessage("")
    }, 5000)
  }

  const handleError = (error: string) => {
    setVoiceMessage(`Error: ${error}`)
    setTimeout(() => {
      setVoiceMessage("")
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Image Analyzer Test</h1>
          <a href="/" className="text-sm underline hover:text-gray-400">
            ← Back to Main
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">
            Test Gemini AI Image Analysis
          </h2>
          <p className="text-gray-400 mb-8">
            Upload an image or take a photo to test the Gemini AI analysis. The
            AI will provide accessibility-focused descriptions.
          </p>
        </div>

        {/* Image Analyzer Component */}
        <ImageAnalyzer
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
        />

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Recent Analyses:</h3>
            <div className="space-y-3">
              {analysisHistory.map((analysis, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-900 rounded-lg border border-gray-700"
                >
                  <div className="text-sm text-gray-400 mb-2">
                    Analysis #{analysisHistory.length - index}
                  </div>
                  <div className="text-white">{analysis}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-4">How it works:</h3>
          <div className="space-y-2 text-sm text-left">
            <p>
              <strong>1.</strong> Take a photo or upload an image
            </p>
            <p>
              <strong>2.</strong> Click "Analyze Image" to send to Gemini AI
            </p>
            <p>
              <strong>3.</strong> Get accessibility-focused description
            </p>
            <p>
              <strong>4.</strong> Description includes spatial layout,
              obstacles, and important objects
            </p>
          </div>
        </div>
      </main>

      {/* Voice Feedback */}
      {voiceMessage && <VoiceFeedback message={voiceMessage} />}

      {/* Footer */}
      <footer className="p-4 border-t border-white text-center text-sm">
        <p>Gemini AI Integration • Test Mode</p>
      </footer>
    </div>
  )
}
