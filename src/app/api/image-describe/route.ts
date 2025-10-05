import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Initialize Gemini AI and model ONCE (outside the handler)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", // Faster, lighter model
  generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
})

// Navigation-focused prompt for accessibility
const PROMPT = `## System Prompt

You are an assistive vision AI designed to describe visual scenes for blind or low-vision users. Your descriptions will be read aloud via text-to-speech.

## Instructions

Analyze the image and provide a clear, comprehensive description following these guidelines:

### Structure & Priority
1. **Start with context** - What type of space or environment is this? (e.g., "You're in an elevator" or "This is a waterfall in a forest")
2. **Key actionable information first** - Text, numbers, signs, controls, or navigation info (e.g., "The display shows floor 3")
3. **Spatial layout** - General layout and important objects/features
4. **People if present** - Mention number and general position only (e.g., "One person is standing in front of you"), avoid detailed physical descriptions
5. **Additional context** - Other relevant environmental details, colors, lighting
6. **Safety information** - Obstacles, hazards, or concerns if relevant

### Tone & Style
- Use natural, conversational language as if describing the scene to a friend
- Be concise but thorough - aim for 3-5 sentences for simple scenes, more for complex ones
- Avoid overly technical or artistic language
- Use clear spatial references (left, right, foreground, background, above, below)
- Describe colors and lighting conditions when relevant

### What to Avoid
- Don't say "This image shows..." or "I can see..." - just describe directly
- Don't be overly poetic or use excessive metaphors
- Don't make assumptions about things you can't see clearly
- **Don't provide detailed physical descriptions of people** (hair style, clothing brands, facial features) - just mention their presence and general position
- Don't describe if the image is too blurry, dark, or unclear to provide useful information - instead say "The image is too dark/unclear to provide a reliable description"
- Don't describe every minor detail - focus on what's useful for understanding and navigation

### Special Scenarios
- **If text is present**: Read it clearly and note its location/purpose
- **If it's a menu or sign**: Prioritize reading the text content
- **If there's potential danger**: Mention it early (e.g., "There are stairs directly ahead")
- **If the scene is empty or minimal**: Be honest and brief (e.g., "This shows a plain white wall with no notable features")
    `

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
          model_id: "eleven_flash_v2_5", // Faster model
          speed: 1.5, // Optimized speed
        }),
      }
    )

    if (!response.ok) {
      console.warn("ElevenLabs TTS failed:", response.status)
      return null
    }

    // Collect all audio chunks into one buffer for smooth playback
    const reader = response.body?.getReader()
    if (!reader) {
      const audioBuffer = await response.arrayBuffer()
      return new Uint8Array(audioBuffer)
    }

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

    // Optimize image (resize if too large)
    const { data: imageBase64, mimeType } = await optimizeImage(imageFile)
    const imageData = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    }

    // Generate content with streaming
    const result = await model.generateContentStream([PROMPT, imageData])

    const encoder = new TextEncoder()

    // Create a readable stream with sentence buffering
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = ""
          let sentenceBuffer = ""
          const MIN_WORDS_FOR_TTS = 8 // Send to TTS after this many words

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText
            sentenceBuffer += chunkText

            // Send text chunk immediately for display
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "text", chunk: chunkText }) + "\n"
              )
            )

            // Extract complete sentences
            const { sentences, remaining } = extractSentences(sentenceBuffer)
            sentenceBuffer = remaining

            // Convert complete sentences to audio
            for (const sentence of sentences) {
              if (sentence.trim()) {
                const audioBuffer = await textToSpeechStream(sentence)
                if (audioBuffer && audioBuffer.length > 0) {
                  const audioBase64 =
                    Buffer.from(audioBuffer).toString("base64")
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "audio", chunk: audioBase64 }) +
                        "\n"
                    )
                  )
                }
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
                const audioBase64 = Buffer.from(audioBuffer).toString("base64")
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: "audio", chunk: audioBase64 }) + "\n"
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
              const audioBase64 = Buffer.from(audioBuffer).toString("base64")
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "audio", chunk: audioBase64 }) + "\n"
                )
              )
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
        Connection: "keep-alive",
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
