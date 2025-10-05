import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")

    // Initialize Gemini model - try the latest available model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    })

    // Create the prompt for accessibility-focused description
    const prompt = `You are SightLine, a navigation assistant for visually impaired users. Provide clear, actionable descriptions for safe movement.

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

    // Generate content with the image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: image.type,
        },
      },
    ])

    const response = await result.response
    const description = response.text()

    return NextResponse.json({
      success: true,
      description: description,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error analyzing image:", error)

    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
