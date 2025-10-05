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
      generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
    })

    // Create the prompt for accessibility-focused description
    const prompt = `You are SightLine continuous monitoring mode, a navigation assistant for blind and low-vision users. Analyze this image and provide clear, concise audio guidance. Focus on:

1. **Immediate Hazards** (Priority 1 - mention first):
   - Obstacles in the path (steps, curbs, poles, low-hanging objects)
   - Moving hazards (vehicles, bicycles, people walking toward user)
   - Surface changes (wet floors, uneven ground, stairs)
   - Distance to hazards (e.g., "step down in 2 feet")

2. **Navigation Information**:
   - Clear path direction ("path continues straight", "doorway 3 feet ahead on right")
   - Turns or intersections
   - Landmarks for orientation (walls, doors, furniture)

3. **Environmental Context**:
   - General setting (indoor/outdoor, room type, street)
   - Nearby people (location and movement direction)
   - Important objects or features relevant to navigation

**Communication Style**:
- Be concise and direct - user will hear this via text-to-speech
- Use clock positions for directions (e.g., "obstacle at 2 o'clock")
- Provide specific distances when possible (feet or steps)
- Prioritize safety-critical information first
- Use clear, simple language
- Avoid overly detailed descriptions of non-essential visual elements

**Example Response Format**:
"Staircase descending in front of you, handrail on right. Person walking toward you at. Indoor hallway with doors on both sides."

Analyze the image now and provide navigation guidance.`

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
