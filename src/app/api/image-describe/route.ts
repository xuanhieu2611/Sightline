import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"

// Initialize Gemini AI and model ONCE (outside the handler)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", // Faster, lighter model
})

// Optimized, concise prompt (maintains quality but reduces tokens)
const PROMPT = `You are an assistive vision AI for blind users. Describe images clearly for text-to-speech.

Priority order:
1. Environment context (e.g., "You're in an elevator")
2. Text/numbers/signs (read clearly)
3. Spatial layout and key objects
4. People (mention position only, e.g., "One person ahead")
5. Safety concerns (stairs, obstacles)

Style:
- Natural, conversational tone
- 3-5 sentences for simple scenes, more if complex
- Use clear spatial references (left/right/above/below)
- Mention colors/lighting when relevant

Avoid:
- "This image shows..." - describe directly
- Detailed people descriptions (clothing, features)
- Minor irrelevant details
- If unclear/dark, say so directly`

// ElevenLabs configuration
const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || ""
const VOICE_ID = process.env.VOICE_ID || ""

// Helper: Convert text to speech using ElevenLabs - returns complete audio buffer
async function textToSpeechStream(text: string): Promise<Uint8Array | null> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    console.warn("ElevenLabs not configured, skipping TTS")
    return null
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?output_format=mp3_44100_32`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_flash_v2_5",
          speed: 2.0,
        }),
      }
    )

    if (!response.ok) {
      console.error("ElevenLabs TTS error:", await response.text())
      return null
    }

    // Collect all audio chunks into one buffer
    const reader = response.body?.getReader()
    if (!reader) return null

    const chunks: Uint8Array[] = []
    let totalLength = 0

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        totalLength += value.length
      }
    }

    // Concatenate all chunks into a single buffer
    const completeAudio = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      completeAudio.set(chunk, offset)
      offset += chunk.length
    }

    return completeAudio
  } catch (error) {
    console.error("TTS streaming error:", error)
    return null
  }
}

// Helper: Check if text ends with sentence boundary
function endsWithSentence(text: string): boolean {
  return /[.!?]\s*$/.test(text.trim())
}

// Helper: Extract complete sentences from buffer
function extractSentences(buffer: string): {
  sentences: string[]
  remaining: string
} {
  const sentences: string[] = []
  let remaining = buffer

  // Match sentences ending with . ! or ?
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)/g
  const matches = buffer.match(sentenceRegex)

  if (matches && matches.length > 0) {
    sentences.push(...matches.map((s) => s.trim()))
    // Remove matched sentences from buffer
    remaining = buffer.replace(sentenceRegex, "").trim()
  }

  return { sentences, remaining }
}

// Helper: Resize image if too large
async function optimizeImage(
  file: File
): Promise<{ data: string; mimeType: string }> {
  const MAX_SIZE = 1024 // Max width/height in pixels
  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

  // If file is small enough, use as-is
  if (file.size < MAX_FILE_SIZE) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    return {
      data: buffer.toString("base64"),
      mimeType: file.type,
    }
  }

  // Otherwise, resize
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    img.onload = () => {
      let { width, height } = img

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = (height / width) * MAX_SIZE
          width = MAX_SIZE
        } else {
          width = (width / height) * MAX_SIZE
          height = MAX_SIZE
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error("Failed to optimize image"))
          const bytes = await blob.arrayBuffer()
          const buffer = Buffer.from(bytes)
          resolve({
            data: buffer.toString("base64"),
            mimeType: "image/jpeg",
          })
        },
        "image/jpeg",
        0.8
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Optimize image (resize if needed)
    const { data: base64Image, mimeType } = await optimizeImage(image)

    // Use streaming for faster perceived performance with integrated TTS
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream([
            PROMPT,
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ])

          let fullText = ""
          let sentenceBuffer = ""
          const MIN_WORDS_FOR_TTS = 8 // Send to TTS after this many words

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText
            sentenceBuffer += chunkText

            // Send text chunk to client immediately for display
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "text",
                  chunk: chunkText,
                }) + "\n"
              )
            )

            // Check if we have complete sentences to convert to speech
            const { sentences, remaining } = extractSentences(sentenceBuffer)
            sentenceBuffer = remaining

            // Process each complete sentence through TTS
            for (const sentence of sentences) {
              const audioBuffer = await textToSpeechStream(sentence)

              if (audioBuffer && audioBuffer.length > 0) {
                const base64Audio = Buffer.from(audioBuffer).toString("base64")
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "audio",
                      chunk: base64Audio,
                    }) + "\n"
                  )
                )
              }
            }

            // Fallback: If buffer is getting long without sentence endings, send anyway
            const wordCount = sentenceBuffer.trim().split(/\s+/).length
            if (
              wordCount >= MIN_WORDS_FOR_TTS &&
              sentenceBuffer.trim().length > 0
            ) {
              const audioBuffer = await textToSpeechStream(sentenceBuffer)

              if (audioBuffer && audioBuffer.length > 0) {
                const base64Audio = Buffer.from(audioBuffer).toString("base64")
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "audio",
                      chunk: base64Audio,
                    }) + "\n"
                  )
                )
              }
              sentenceBuffer = "" // Clear buffer after sending
            }
          }

          // Process any remaining text in buffer
          if (sentenceBuffer.trim().length > 0) {
            const audioBuffer = await textToSpeechStream(sentenceBuffer)

            if (audioBuffer && audioBuffer.length > 0) {
              const base64Audio = Buffer.from(audioBuffer).toString("base64")
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "audio",
                    chunk: base64Audio,
                  }) + "\n"
                )
              )
            }
          }

          // Send final message
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "done",
                success: true,
                description: fullText,
                timestamp: new Date().toISOString(),
              }) + "\n"
            )
          )

          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: "Failed to analyze image",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              }) + "\n"
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Error analyzing image:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
