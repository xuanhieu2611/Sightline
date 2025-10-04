#!/usr/bin/env node

const { GoogleGenerativeAI } = require("@google/generative-ai")
const fs = require("fs")
const path = require("path")

console.log("🔑 Testing Gemini API Key...\n")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
  console.log("❌ GEMINI_API_KEY not found or not set properly")
  console.log("Please set your API key in .env.local file")
  console.log("Example: GEMINI_API_KEY=your_actual_key_here")
  process.exit(1)
}

console.log("✅ API Key found:", apiKey.substring(0, 10) + "...")

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey)

async function testGeminiAPI() {
  try {
    console.log("🤖 Testing Gemini API connection...")

    // Initialize model - using the standard model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Test with a simple text prompt first
    console.log("📝 Testing text generation...")
    const textResult = await model.generateContent(
      'Say "Hello from Gemini!" in exactly 5 words.'
    )
    const textResponse = await textResult.response
    const textOutput = textResponse.text()

    console.log("✅ Text generation successful:", textOutput)

    // Test with image analysis (using a placeholder)
    console.log("🖼️  Testing image analysis capability...")

    // Create a simple test image (1x1 pixel)
    const testImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    const imageResult = await model.generateContent([
      "Describe this image in one sentence.",
      {
        inlineData: {
          data: testImageBase64,
          mimeType: "image/png",
        },
      },
    ])

    const imageResponse = await imageResult.response
    const imageOutput = imageResponse.text()

    console.log("✅ Image analysis successful:", imageOutput)

    console.log("\n🎉 Gemini API is working correctly!")
    console.log("Your API key is valid and ready to use.")

    return true
  } catch (error) {
    console.error("❌ Gemini API test failed:", error.message)

    if (error.message.includes("API_KEY_INVALID")) {
      console.log("\n💡 Possible solutions:")
      console.log("1. Check if your API key is correct")
      console.log("2. Verify the key has proper permissions")
      console.log("3. Make sure you're using the right API key")
    } else if (error.message.includes("quota")) {
      console.log("\n💡 You may have hit API quota limits")
      console.log("Check your Google AI Studio dashboard for usage")
    } else {
      console.log("\n💡 Check your internet connection and try again")
    }

    return false
  }
}

// Run the test
testGeminiAPI().then((success) => {
  if (success) {
    console.log("\n🚀 Next steps:")
    console.log("1. Run: npm run dev")
    console.log("2. Visit: http://localhost:3000/test-analyzer")
    console.log("3. Upload an image to test real analysis")
    process.exit(0)
  } else {
    process.exit(1)
  }
})
