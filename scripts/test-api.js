#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

console.log("🧪 Testing Gemini API Integration...\n")

// Test if API route exists
function testAPIRoute() {
  console.log("📡 Testing API route...")

  const apiRoutePath = path.join(
    __dirname,
    "..",
    "src",
    "app",
    "api",
    "analyze-image",
    "route.ts"
  )

  if (!fs.existsSync(apiRoutePath)) {
    console.log("❌ API route not found at src/app/api/analyze-image/route.ts")
    return false
  }

  const routeContent = fs.readFileSync(apiRoutePath, "utf8")

  if (
    !routeContent.includes("GoogleGenerativeAI") ||
    !routeContent.includes("gemini")
  ) {
    console.log("❌ API route missing Gemini integration")
    return false
  }

  if (
    !routeContent.includes("export async function POST") ||
    !routeContent.includes("formData")
  ) {
    console.log("❌ API route missing proper HTTP method handling")
    return false
  }

  console.log("✅ API route is properly configured")
  return true
}

// Test if components exist
function testComponents() {
  console.log("🧩 Testing components...")

  const components = ["ImageAnalyzer.tsx", "TapButton.tsx", "VoiceFeedback.tsx"]

  const componentsDir = path.join(__dirname, "..", "src", "components")

  if (!fs.existsSync(componentsDir)) {
    console.log("❌ Components directory not found")
    return false
  }

  const missingComponents = components.filter((component) => {
    const componentPath = path.join(componentsDir, component)
    return !fs.existsSync(componentPath)
  })

  if (missingComponents.length > 0) {
    console.log(`❌ Missing components: ${missingComponents.join(", ")}`)
    return false
  }

  console.log("✅ All required components exist")
  return true
}

// Test if test page exists
function testTestPage() {
  console.log("📄 Testing test page...")

  const testPagePath = path.join(
    __dirname,
    "..",
    "src",
    "app",
    "test-analyzer",
    "page.tsx"
  )

  if (!fs.existsSync(testPagePath)) {
    console.log("❌ Test analyzer page not found")
    return false
  }

  console.log("✅ Test analyzer page exists")
  return true
}

// Test environment configuration
function testEnvironmentConfig() {
  console.log("⚙️  Testing environment configuration...")

  const configPath = path.join(__dirname, "..", "config", "api.ts")

  if (!fs.existsSync(configPath)) {
    console.log("❌ API configuration file not found")
    return false
  }

  const configContent = fs.readFileSync(configPath, "utf8")

  if (
    !configContent.includes("GEMINI_API_KEY") ||
    !configContent.includes("FALLBACK_RESPONSES")
  ) {
    console.log("❌ API configuration missing required settings")
    return false
  }

  console.log("✅ API configuration is valid")
  return true
}

// Run all tests
function runTests() {
  const tests = [
    testAPIRoute,
    testComponents,
    testTestPage,
    testEnvironmentConfig,
  ]

  const results = tests.map((test) => test())
  const passed = results.filter((result) => result).length
  const total = results.length

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log("🎉 All API integration tests passed!")
    console.log("\nNext steps:")
    console.log("1. Set your GEMINI_API_KEY in environment variables")
    console.log("2. Run: npm run dev")
    console.log("3. Visit: http://localhost:3000/test-analyzer")
    console.log("4. Test image upload and analysis")
    console.log(
      "\nNote: Without GEMINI_API_KEY, the app will use fallback responses for development."
    )
  } else {
    console.log("⚠️  Some tests failed. Please fix the issues above.")
  }
}

runTests()
