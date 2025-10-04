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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Create the prompt for accessibility-focused description
    const prompt = `
    Analyze this image and provide a detailed, accessibility-focused description that would help a visually impaired person navigate their environment. 
    
    Focus on:
    1. Spatial relationships (positions, distances, directions)
    2. Obstacles and clear paths
    3. Important objects (doors, exits, signs, people)
    4. Text content if visible
    5. Environmental context (indoor/outdoor, lighting, etc.)
    
    Format the response as:
    - Brief overview (1-2 sentences)
    - Spatial layout (clock positions, distances)
    - Obstacles and clear paths
    - Important objects and their locations
    - Any readable text
    
    Keep descriptions concise but informative, using clock positions (12 o'clock, 3 o'clock, etc.) for spatial reference.
    `

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

    // Fallback response for development/testing
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        description:
          "Two people ahead. Door slightly right. Clear path left. Exit sign visible at 2 o'clock, approximately 20 feet away. Floor appears clear with no obstacles in the immediate path.",
        timestamp: new Date().toISOString(),
        note: "Development mode - using placeholder response",
      })
    }

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
