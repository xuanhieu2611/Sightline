"use client"

import { useEffect, useRef } from "react"

interface VoiceFeedbackProps {
  message: string
}

export function VoiceFeedback({ message }: VoiceFeedbackProps) {
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!message) return

    // Cancel any ongoing speech
    if (synthRef.current) {
      speechSynthesis.cancel()
    }

    // Create new speech utterance
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 0.9 // Slightly slower for clarity
    utterance.pitch = 1.0
    utterance.volume = 0.8

    // Use a clear, accessible voice if available
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Alex") ||
        voice.name.includes("Samantha") ||
        voice.name.includes("Google") ||
        voice.lang.startsWith("en")
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    // Store reference for cleanup
    synthRef.current = utterance

    // Speak the message
    speechSynthesis.speak(utterance)

    // Cleanup on unmount or new message
    return () => {
      if (synthRef.current) {
        speechSynthesis.cancel()
      }
    }
  }, [message])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  if (!message) return null

  return (
    <div className="voice-feedback">
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse mr-2"></div>
        <span>{message}</span>
      </div>
    </div>
  )
}
