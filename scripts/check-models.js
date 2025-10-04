#!/usr/bin/env node

const { GoogleGenerativeAI } = require("@google/generative-ai")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
  console.log("❌ GEMINI_API_KEY not found")
  process.exit(1)
}

console.log("🔍 Checking available Gemini models...\n")

const genAI = new GoogleGenerativeAI(apiKey)

async function checkModels() {
  try {
    // Try different model names
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-pro",
      "gemini-1.5-flash-latest",
    ]

    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent("Hello")
        const response = await result.response
        const text = response.text()
        console.log(`✅ ${modelName} works: ${text.substring(0, 50)}...`)
        return modelName
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.split("\n")[0]}`)
      }
    }

    console.log("\n❌ No working models found")
    return null
  } catch (error) {
    console.error("Error checking models:", error.message)
    return null
  }
}

checkModels().then((workingModel) => {
  if (workingModel) {
    console.log(`\n🎉 Found working model: ${workingModel}`)
    console.log("Update your API route to use this model name.")
  } else {
    console.log("\n💡 Try checking the Google AI Studio for available models")
  }
})
