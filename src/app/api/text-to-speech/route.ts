import { NextRequest, NextResponse } from "next/server"
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      text,
      model_id = "eleven_flash_v2_5",
      use_speaker_boost = false,
      speed = 2.0,
      output_format = "mp3_44100_128",
    } = body

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    // Roger voice
    const VOICE_ID = process.env.VOICE_ID

    if (!VOICE_ID) {
      return NextResponse.json(
        { error: "No voices available" },
        { status: 500 }
      )
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      output_format: output_format,
    })

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?${queryParams}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: model_id,
          use_speaker_boost: use_speaker_boost,
          speed: speed,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("ElevenLabs API error:", error)
      return NextResponse.json(
        { error: "Failed to generate speech", details: error },
        { status: response.status }
      )
    }

    // Get audio data as array buffer
    const audioData = await response.arrayBuffer()

    // Return audio file
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioData.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Error processing text-to-speech:", error)

    return NextResponse.json(
      {
        error: "Failed to process text-to-speech request",
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
