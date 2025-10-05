"use client"

import { useRef, useState, useEffect } from "react"
import { FiCamera } from "react-icons/fi"
import DesktopCapture from "../components/DesktopCapture"

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showDesktopCam, setShowDesktopCam] = useState(false)
  const [analysis, setAnalysis] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    return () => {
      // nothing to revoke here since we no longer create object URLs for preview
    }
  }, [])

  const isMobile = () => {
    if (typeof navigator === "undefined") return false
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  const openCamera = () => {
    if (isMobile()) {
      inputRef.current?.click() // mobile: file input (camera)
    } else {
      setShowDesktopCam(true) // desktop: use getUserMedia modal
    }
  }

  // Audio playback queue
  const audioQueueRef = useRef<Blob[]>([])
  const isPlayingRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
    }
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Play audio chunks sequentially
  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return

    isPlayingRef.current = true
    const audioBlob = audioQueueRef.current.shift()!

    try {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        isPlayingRef.current = false
        playNextAudio() // Play next in queue
      }

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        isPlayingRef.current = false
        playNextAudio() // Continue with next
      }

      await audio.play()
    } catch (err) {
      console.error("Audio playback error:", err)
      isPlayingRef.current = false
      playNextAudio()
    }
  }

  // send blob to AI and show streamed response with audio
  const analyzeBlob = async (blob: Blob) => {
    setAnalysis("")
    setAnalyzing(true)
    audioQueueRef.current = [] // Clear audio queue

    try {
      const form = new FormData()
      form.append("image", blob, "photo.jpg")

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        body: form,
      })

      if (!res.ok) {
        const errText = await res.text()
        setAnalysis(`Server error: ${res.status} ${errText}`)
        setAnalyzing(false)
        return
      }

      if (!res.body) {
        // fallback: parse full json
        const json = await res.json().catch(() => null)
        setAnalysis(json?.description ?? "No description returned")
        setAnalyzing(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

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
              // Display text chunk
              setAnalysis((s) => s + obj.chunk)
            } else if (obj.type === "audio" && obj.chunk) {
              // Decode base64 audio and add to queue
              const audioData = Uint8Array.from(atob(obj.chunk), (c) =>
                c.charCodeAt(0)
              )
              const audioBlob = new Blob([audioData], { type: "audio/mpeg" })
              audioQueueRef.current.push(audioBlob)

              // Start playing if not already playing
              if (!isPlayingRef.current) {
                playNextAudio()
              }
            } else if (obj.type === "done") {
              // Analysis complete
              console.log("Analysis complete")
            } else if (obj.type === "error") {
              setAnalysis(`Error: ${obj.error}`)
            }
          } catch (e) {
            // ignore parse errors for partial lines
          }
        }
      }

      // flush any remaining buffered line
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer)
          if (obj.type === "text" && obj.chunk) {
            setAnalysis((s) => s + obj.chunk)
          }
        } catch {}
      }
    } catch (err: any) {
      setAnalysis(`Capture/analysis failed: ${err?.message ?? String(err)}`)
    } finally {
      setAnalyzing(false)
      setShowDesktopCam(false)
    }
  }

  const handleCaptureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // mobile: clear input and immediately start analysis (no camera UI to hide)
    e.currentTarget.value = ""
    analyzeBlob(file)
  }

  const handleCaptureDesktop = (blob: Blob) => {
    // hide the desktop camera UI immediately when a photo is taken
    setShowDesktopCam(false)
    // then send the blob to analysis
    analyzeBlob(blob)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-7xl md:text-9xl font-extrabold mb-12 text-white">
        SightLine
      </h1>

      <button
        onClick={openCamera}
        type="button"
        aria-label="Open camera"
        className="w-40 h-40 md:w-56 md:h-56 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-white hover:text-black hover:border-black active:scale-95 transition-transform focus:outline-none"
      >
        <FiCamera className="text-current" size={64} />
      </button>

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
          onCancel={() => setShowDesktopCam(false)}
        />
      )}

      <div className="mt-6 w-full max-w-lg">
        {analyzing ? (
          <div className="text-center text-sm text-gray-300">
            Analyzing image…
          </div>
        ) : (
          analysis && (
            <div className="prose text-white bg-gray-900/40 p-4 rounded-md whitespace-pre-wrap">
              {analysis}
            </div>
          )
        )}
      </div>
    </div>
  )
}
