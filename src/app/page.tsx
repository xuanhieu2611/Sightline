"use client"

import { useState, useRef, useEffect } from "react"
import { TapButton } from "@/components/TapButton"
import { ReadButton } from "@/components/ReadButton"
import { FindButton } from "@/components/FindButton"
import { VoiceFeedback } from "@/components/VoiceFeedback"
import { StatusIndicator } from "@/components/StatusIndicator"

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [voiceMessage, setVoiceMessage] = useState("")
  const [lastAction, setLastAction] = useState<string | null>(null)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleAction = (action: string, message: string) => {
    setLastAction(action)
    setVoiceMessage(message)

    // Clear message after 3 seconds
    setTimeout(() => {
      setVoiceMessage("")
    }, 3000)
  }

  const handleLongPress = () => {
    if (lastAction) {
      handleAction(lastAction, `Repeating: ${lastAction}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sightline</h1>
          <StatusIndicator isOnline={isOnline} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Tap Button - Main Action */}
        <div className="text-center">
          <TapButton
            onAction={(message) => handleAction("tap", message)}
            onLongPress={handleLongPress}
          />
          <p className="mt-4 text-lg font-medium">Tap to scan surroundings</p>
          <p className="text-sm text-gray-400 mt-2">
            Long press to repeat last action
          </p>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
          <ReadButton onAction={(message) => handleAction("read", message)} />
          <FindButton onAction={(message) => handleAction("find", message)} />
        </div>

        {/* Instructions */}
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold mb-4">How to use:</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Tap:</strong> Scan your surroundings for navigation help
            </p>
            <p>
              <strong>Read:</strong> Point at signs or menus to read text
            </p>
            <p>
              <strong>Find:</strong> Look for specific objects like exits
            </p>
          </div>

          {/* Test Analyzer Link */}
          <div className="mt-6">
            <a
              href="/test-analyzer"
              className="w-full h-12 bg-blue-600 text-white font-bold rounded-lg touch-target flex items-center justify-center hover:bg-blue-700"
            >
              🧪 Test Image Analyzer
            </a>
          </div>
        </div>
      </main>

      {/* Voice Feedback */}
      {voiceMessage && <VoiceFeedback message={voiceMessage} />}

      {/* Footer */}
      <footer className="p-4 border-t border-white text-center text-sm">
        <p>Accessibility Assistant • Works Offline</p>
      </footer>
    </div>
  )
}
