#!/usr/bin/env node

const { GoogleGenerativeAI } = require("@google/generative-ai")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
  console.log("❌ GEMINI_API_KEY not found")
  process.exit(1)
}

console.log("🔍 Testing Gemini API with simple approach...\n")

async function testSimpleGemini() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // Try without specifying model (use default)
    console.log("Testing with default model...")
    const model = genAI.getGenerativeModel({})

    const result = await model.generateContent("Hello, world!")
    const response = await result.response
    const text = response.text()

    console.log("✅ Success! Response:", text)
    return true
  } catch (error) {
    console.error("❌ Error:", error.message)

    // Try with explicit model name
    try {
      console.log("\nTrying with gemini-pro model...")
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const result = await model.generateContent("Hello, world!")
      const response = await result.response
      const text = response.text()

      console.log("✅ Success with gemini-pro! Response:", text)
      return true
    } catch (error2) {
      console.error("❌ gemini-pro also failed:", error2.message)
      return false
    }
  }
}

testSimpleGemini().then((success) => {
  if (success) {
    console.log("\n🎉 Gemini API is working!")
    console.log("You can now test the image analysis endpoint.")
  } else {
    console.log("\n💡 Check your API key and permissions")
    console.log(
      "Make sure you have enabled the Generative AI API in Google Cloud Console"
    )
  }
})
