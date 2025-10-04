#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const FormData = require("form-data")
const fetch = require("node-fetch")

console.log("🧪 Testing API Endpoint with Real Image...\n")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey || apiKey === "your_actual_gemini_api_key_here") {
  console.log("❌ GEMINI_API_KEY not found")
  console.log("Please set your API key in .env.local file")
  process.exit(1)
}

console.log("✅ API Key found:", apiKey.substring(0, 10) + "...")

async function testAPIEndpoint() {
  try {
    console.log("🚀 Starting development server...")

    // Start the dev server in the background
    const { spawn } = require("child_process")
    const devServer = spawn("npm", ["run", "dev"], {
      stdio: "pipe",
      detached: true,
    })

    // Wait for server to start
    console.log("⏳ Waiting for server to start...")
    await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

    console.log("📡 Testing API endpoint...")

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    )

    // Create form data
    const formData = new FormData()
    formData.append("image", testImageBuffer, {
      filename: "test.png",
      contentType: "image/png",
    })

    // Test the API endpoint
    const response = await fetch("http://localhost:3000/api/analyze-image", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      console.log("✅ API endpoint working!")
      console.log("📝 Response:", result.description)
      if (result.note) {
        console.log("ℹ️  Note:", result.note)
      }
    } else {
      console.log("❌ API endpoint failed:", result.error)
    }

    // Clean up
    devServer.kill()
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    console.log("\n💡 Make sure to:")
    console.log("1. Set your GEMINI_API_KEY in .env.local")
    console.log("2. Run: npm run dev")
    console.log("3. Visit: http://localhost:3000/test-analyzer")
  }
}

// Alternative: Test with curl command
function showCurlTest() {
  console.log("\n🔧 Alternative: Test with curl command")
  console.log("1. Start the dev server: npm run dev")
  console.log("2. In another terminal, run:")
  console.log("curl -X POST http://localhost:3000/api/analyze-image \\")
  console.log('  -F "image=@path/to/your/image.jpg"')
  console.log("\nOr test in browser:")
  console.log("Visit: http://localhost:3000/test-analyzer")
}

testAPIEndpoint().catch(() => {
  showCurlTest()
})
