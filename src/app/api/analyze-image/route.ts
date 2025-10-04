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

    // Use streaming for faster perceived performance
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

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText

            // Send chunk to client
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  chunk: chunkText,
                  done: false,
                }) + "\n"
              )
            )
          }

          // Send final message
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                success: true,
                description: fullText,
                timestamp: new Date().toISOString(),
                done: true,
              }) + "\n"
            )
          )

          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: "Failed to analyze image",
                details:
                  error instanceof Error ? error.message : "Unknown error",
                done: true,
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
