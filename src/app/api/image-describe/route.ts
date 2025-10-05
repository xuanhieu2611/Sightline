import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Initialize Gemini AI and model ONCE (outside the handler)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", // Faster, lighter model
})

// Navigation-focused prompt for accessibility
const PROMPT = `You are SightLine, a navigation assistant for visually impaired users. Provide clear, actionable descriptions for safe movement.

CRITICAL PRIORITIES:
1. SAFETY FIRST: Obstacles, stairs, doors, hazards
2. NAVIGATION: Clear path directions (left/right/straight)
3. PEOPLE: Position and movement ("Two people ahead, moving left")
4. EXITS: Doors, elevators, stairways
5. TEXT: Signs, labels, important written information

DESCRIPTION STYLE:
- Start with immediate path information
- Use clear spatial references ("Door on your right", "Clear path straight ahead")
- Keep descriptions concise but complete
- Mention lighting conditions if relevant
- If unclear or dangerous, say so directly

EXAMPLES:
- "Clear hallway ahead. Door on your right. No obstacles."
- "Two people walking toward you. Stairs ahead - be careful."
- "Restaurant entrance. Menu board on your left."

Avoid: Detailed clothing descriptions, irrelevant background details, or "this image shows" language.`

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
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      console.warn("ElevenLabs TTS failed:", response.status)
      return null
    }

    const audioBuffer = await response.arrayBuffer()
    return new Uint8Array(audioBuffer)
  } catch (error) {
    console.error("ElevenLabs TTS error:", error)
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
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          description: "AI service not configured. Please contact support.",
        },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json(
        { success: false, description: "No image provided" },
        { status: 400 }
      )
    }

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")
    const imageData = {
      inlineData: {
        data: imageBase64,
        mimeType: imageFile.type,
      },
    }

    // Generate content with streaming
    const result = await model.generateContentStream([PROMPT, imageData])
    
    let fullText = ""
    const encoder = new TextEncoder()

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText

            // Send text chunk
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "text", chunk: chunkText }) + "\n"
              )
            )

            // Convert text to speech and send audio
            if (chunkText.trim()) {
              const audioBuffer = await textToSpeechStream(chunkText)
              if (audioBuffer) {
                const audioBase64 = Buffer.from(audioBuffer).toString("base64")
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: "audio", chunk: audioBase64 }) + "\n"
                  )
                )
              }
            }
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "done" }) + "\n")
          )
        } catch (error) {
          console.error("Streaming error:", error)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "error", error: "Analysis failed" }) + "\n"
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json(
      {
        success: false,
        description: "Analysis failed. Please try again.",
      },
      { status: 500 }
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
