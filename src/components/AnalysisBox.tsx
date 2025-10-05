import React, { useEffect, useRef, useState } from "react"

type Props = {
  blob: Blob | null
}

export default function AnalysisBox({ blob }: Props) {
  const [analyzing, setAnalyzing] = useState(false)
  const [description, setDescription] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)

  // audio queue / playback refs (from hieu)
  const audioQueueRef = useRef<Blob[]>([])
  const isPlayingRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const savedAudioBlobRef = useRef<Blob | null>(null) // Store the complete audio for replay
  const allAudioChunksRef = useRef<Blob[]>([]) // Store all audio chunks

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
    }
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true
    setIsPlaying(true)
    const audioBlob = audioQueueRef.current.shift()!
    try {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        isPlayingRef.current = false
        setIsPlaying(false)
        playNextAudio()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        isPlayingRef.current = false
        setIsPlaying(false)
        playNextAudio()
      }
      await audio.play()
    } catch (err) {
      console.error("Audio playback error:", err)
      isPlayingRef.current = false
      setIsPlaying(false)
      playNextAudio()
    }
  }

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    isPlayingRef.current = false
    setIsPlaying(false)
    audioQueueRef.current = []
  }

  const replayAudio = async () => {
    if (!description || !savedAudioBlobRef.current) return

    // Stop current audio if playing
    stopAudio()

    // Play the saved complete audio blob
    try {
      const audioUrl = URL.createObjectURL(savedAudioBlobRef.current)
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        isPlayingRef.current = false
        setIsPlaying(false)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        isPlayingRef.current = false
        setIsPlaying(false)
      }

      isPlayingRef.current = true
      setIsPlaying(true)
      await audio.play()
    } catch (err) {
      console.error("Replay audio error:", err)
      isPlayingRef.current = false
      setIsPlaying(false)
    }
  }

  // helper: send text chunk to server TTS endpoint which proxies to ElevenLabs.
  // Expects /api/tts to return audio/mpeg binary.
  const synthesizeChunk = async (text: string, signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
      })
      if (!res.ok) {
        console.warn("TTS failed", await res.text().catch(() => ""))
        return null
      }
      const ab = await res.arrayBuffer()
      return new Blob([ab], { type: "audio/mpeg" })
    } catch (e) {
      if ((e as any)?.name === "AbortError") return null
      console.error("synthesizeChunk error", e)
      return null
    }
  }

  // Helper: Combine multiple audio blobs into one complete audio file
  const combineAudioBlobs = async (blobs: Blob[]): Promise<Blob> => {
    if (blobs.length === 0) throw new Error("No blobs to combine")
    if (blobs.length === 1) return blobs[0]

    try {
      // Convert all blobs to array buffers
      const arrayBuffers = await Promise.all(
        blobs.map((blob) => blob.arrayBuffer())
      )

      // Calculate total length
      const totalLength = arrayBuffers.reduce(
        (sum, buffer) => sum + buffer.byteLength,
        0
      )

      // Create a new array buffer with the combined data
      const combinedBuffer = new Uint8Array(totalLength)
      let offset = 0

      for (const buffer of arrayBuffers) {
        combinedBuffer.set(new Uint8Array(buffer), offset)
        offset += buffer.byteLength
      }

      // Return as a single blob
      return new Blob([combinedBuffer], { type: "audio/mpeg" })
    } catch (error) {
      console.error("Error combining audio blobs:", error)
      // Fallback: return the first blob
      return blobs[0]
    }
  }

  useEffect(() => {
    if (!blob) return
    const ac = new AbortController()
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null(
      async () => {
        setAnalyzing(true)
        setDescription("")
        audioQueueRef.current = []
        isPlayingRef.current = false
        setIsPlaying(false)
        savedAudioBlobRef.current = null
        allAudioChunksRef.current = [] // Reset audio chunks

        try {
          const form = new FormData()
          form.append("image", blob, "photo.jpg")

          const res = await fetch("/api/image-describe", {
            method: "POST",
            body: form,
            signal: ac.signal,
          })

          if (!res.ok) {
            console.warn(
              "analyze-image failed",
              await res.text().catch(() => "")
            )
            setAnalyzing(false)
            return
          }

          if (!res.body) {
            // fallback: non-streaming response — expect text description
            const json = await res.json().catch(() => null)
            if (json?.description) {
              setDescription(json.description)
              const b = await synthesizeChunk(json.description, ac.signal)
              if (b) {
                audioQueueRef.current.push(b)
                allAudioChunksRef.current.push(b)
                playNextAudio()
              }
            }
            setAnalyzing(false)
            return
          }

          reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""
          let fullText = ""

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
                // if server already produced audio chunks (base64), queue them directly
                if (obj.type === "audio" && obj.chunk) {
                  const audioData = Uint8Array.from(atob(obj.chunk), (c) =>
                    c.charCodeAt(0)
                  )
                  const audioBlob = new Blob([audioData], {
                    type: "audio/mpeg",
                  })
                  allAudioChunksRef.current.push(audioBlob) // Collect ALL chunks
                  audioQueueRef.current.push(audioBlob)
                  if (!isPlayingRef.current) playNextAudio()
                }

                // if server sends text chunks, synthesize via ElevenLabs proxy
                else if (obj.type === "text" && obj.chunk) {
                  fullText += obj.chunk
                  setDescription(fullText)
                  // synthesize asynchronously but don't block parsing
                  synthesizeChunk(obj.chunk, ac.signal).then((audioBlob) => {
                    if (audioBlob) {
                      allAudioChunksRef.current.push(audioBlob) // Collect ALL chunks
                      audioQueueRef.current.push(audioBlob)
                      if (!isPlayingRef.current) playNextAudio()
                    }
                  })
                }

                // When done, combine all audio chunks
                else if (obj.type === "done") {
                  if (allAudioChunksRef.current.length > 0) {
                    try {
                      savedAudioBlobRef.current = await combineAudioBlobs(
                        allAudioChunksRef.current
                      )
                      console.log(
                        "Combined audio chunks:",
                        allAudioChunksRef.current.length
                      )
                    } catch (err) {
                      console.warn("Failed to combine audio blobs:", err)
                      // Fallback: use the last blob
                      savedAudioBlobRef.current =
                        allAudioChunksRef.current[
                          allAudioChunksRef.current.length - 1
                        ]
                    }
                  }
                } else if (obj.type === "error") {
                  console.error("analysis error:", obj.error)
                }
              } catch (e) {
                // ignore partial JSON
              }
            }
          }

          // flush remaining buffer
          if (buffer.trim()) {
            try {
              const obj = JSON.parse(buffer)
              if (obj.type === "text" && obj.chunk) {
                fullText += obj.chunk
                setDescription(fullText)
                const audioBlob = await synthesizeChunk(obj.chunk, ac.signal)
                if (audioBlob) {
                  allAudioChunksRef.current.push(audioBlob)
                  audioQueueRef.current.push(audioBlob)
                  if (!isPlayingRef.current) playNextAudio()
                }
              } else if (obj.type === "audio" && obj.chunk) {
                const audioData = Uint8Array.from(atob(obj.chunk), (c) =>
                  c.charCodeAt(0)
                )
                const audioBlob = new Blob([audioData], { type: "audio/mpeg" })
                allAudioChunksRef.current.push(audioBlob)
                audioQueueRef.current.push(audioBlob)
                if (!isPlayingRef.current) playNextAudio()
              }
            } catch {}
          }

          // Final combination if not done yet
          if (
            allAudioChunksRef.current.length > 0 &&
            !savedAudioBlobRef.current
          ) {
            try {
              savedAudioBlobRef.current = await combineAudioBlobs(
                allAudioChunksRef.current
              )
              console.log(
                "Final combined audio chunks:",
                allAudioChunksRef.current.length
              )
            } catch (err) {
              console.warn("Failed to combine audio blobs:", err)
              savedAudioBlobRef.current =
                allAudioChunksRef.current[allAudioChunksRef.current.length - 1]
            }
          }
        } catch (err: any) {
          if ((err as any)?.name !== "AbortError") {
            console.error("analysis failed", err)
          }
        } finally {
          setAnalyzing(false)
          try {
            reader?.cancel()
          } catch {}
        }
      }
    )()

    return () => {
      ac.abort()
      try {
        reader?.cancel()
      } catch {}
      audioQueueRef.current = []
      isPlayingRef.current = false
      setIsPlaying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob])

  // Show description text and audio indicator
  if (!blob) return null

  return (
    <div className="mt-6 w-full max-w-lg">
      {analyzing && (
        <div className="text-center text-sm text-gray-300 mb-4">Analyzing…</div>
      )}

      {description && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <p className="text-white whitespace-pre-line">{description}</p>

          {/* Audio controls */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <button
              onClick={replayAudio}
              disabled={isPlaying || !savedAudioBlobRef.current}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying || !savedAudioBlobRef.current
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isPlaying ? "🔊 Playing..." : "🔊 Play Again"}
            </button>

            {isPlaying && (
              <button
                onClick={stopAudio}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audio playback indicator */}
      {isPlaying && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-4 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm text-gray-300 ml-2">🔊 Playing</span>
        </div>
      )}
    </div>
  )
}
