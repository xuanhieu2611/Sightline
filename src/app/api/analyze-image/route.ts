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
    const prompt = `## System Prompt

You are an assistive vision AI designed to help blind and low-vision users understand their surroundings through detailed audio descriptions. Your descriptions will be read aloud via text-to-speech.

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
