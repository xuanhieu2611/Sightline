import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
})

// Continuous monitoring prompt - shorter, more frequent updates
const PROMPT = `You are SightLine continuous monitoring mode. Provide brief, essential updates about the environment.

PRIORITY ORDER:
1. IMMEDIATE SAFETY: Obstacles, hazards, people approaching
2. NAVIGATION: Path changes, doors, stairs
3. ENVIRONMENT: Room changes, lighting, weather
4. PEOPLE: New people, movements, expressions

STYLE:
- Keep descriptions SHORT (1-2 sentences max)
- Focus on CHANGES from previous state
- Use clear, direct language
- Only mention important details

EXAMPLES:
- "Clear path ahead. No obstacles."
- "Person approaching from the left."
- "Door on your right. Room is well-lit."
- "Stairs ahead - be careful."

Avoid: Detailed descriptions, repetitive information, or "this image shows" language.`

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          description: "AI service not configured.",
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

    // Generate content
    const result = await model.generateContent([PROMPT, imageData])
    const description = result.response.text()

    return NextResponse.json({
      success: true,
      description: description,
      timestamp: new Date().toISOString(),
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
