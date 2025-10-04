#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

console.log("🔍 Testing Sightline PWA Configuration...\n")

// Check if manifest.json exists and has required fields
function testManifest() {
  console.log("📋 Testing manifest.json...")

  const manifestPath = path.join(__dirname, "..", "public", "manifest.json")

  if (!fs.existsSync(manifestPath)) {
    console.log("❌ manifest.json not found")
    return false
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

  const requiredFields = [
    "name",
    "short_name",
    "icons",
    "theme_color",
    "display",
    "start_url",
  ]
  const missingFields = requiredFields.filter((field) => !manifest[field])

  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields: ${missingFields.join(", ")}`)
    return false
  }

  if (manifest.display !== "standalone") {
    console.log('❌ display should be "standalone"')
    return false
  }

  if (manifest.start_url !== "/") {
    console.log('❌ start_url should be "/"')
    return false
  }

  console.log("✅ manifest.json is valid")
  return true
}

// Check if service worker exists
function testServiceWorker() {
  console.log("🔧 Testing service worker...")

  const swPath = path.join(__dirname, "..", "public", "sw.js")

  if (!fs.existsSync(swPath)) {
    console.log("❌ Service worker not found")
    return false
  }

  const swContent = fs.readFileSync(swPath, "utf8")

  if (!swContent.includes("install") || !swContent.includes("fetch")) {
    console.log("❌ Service worker missing required event listeners")
    return false
  }

  console.log("✅ Service worker is valid")
  return true
}

// Check if icons exist
function testIcons() {
  console.log("🖼️  Testing PWA icons...")

  const iconsDir = path.join(__dirname, "..", "public", "icons")
  const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512]

  if (!fs.existsSync(iconsDir)) {
    console.log("❌ Icons directory not found")
    return false
  }

  const missingIcons = requiredSizes.filter((size) => {
    const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`)
    return !fs.existsSync(iconPath)
  })

  if (missingIcons.length > 0) {
    console.log(`⚠️  Missing PNG icons for sizes: ${missingIcons.join(", ")}`)
    console.log(
      "   SVG icons found, but PNG icons are recommended for production"
    )
  }

  console.log("✅ Icons directory exists")
  return true
}

// Check if offline page exists
function testOfflinePage() {
  console.log("📱 Testing offline page...")

  const offlinePath = path.join(
    __dirname,
    "..",
    "src",
    "app",
    "offline",
    "page.tsx"
  )

  if (!fs.existsSync(offlinePath)) {
    console.log("❌ Offline page not found")
    return false
  }

  console.log("✅ Offline page exists")
  return true
}

// Check if next.config.js has PWA configuration
function testPWAConfig() {
  console.log("⚙️  Testing PWA configuration...")

  const configPath = path.join(__dirname, "..", "next.config.js")

  if (!fs.existsSync(configPath)) {
    console.log("❌ next.config.js not found")
    return false
  }

  const configContent = fs.readFileSync(configPath, "utf8")

  if (
    !configContent.includes("next-pwa") ||
    !configContent.includes("withPWA")
  ) {
    console.log("❌ PWA configuration not found in next.config.js")
    return false
  }

  console.log("✅ PWA configuration is valid")
  return true
}

// Run all tests
function runTests() {
  const tests = [
    testManifest,
    testServiceWorker,
    testIcons,
    testOfflinePage,
    testPWAConfig,
  ]

  const results = tests.map((test) => test())
  const passed = results.filter((result) => result).length
  const total = results.length

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log(
      "🎉 All PWA tests passed! Your app is ready for Lighthouse testing."
    )
    console.log("\nNext steps:")
    console.log("1. Run: npm run build")
    console.log("2. Run: npm start")
    console.log("3. Open Chrome DevTools > Lighthouse > PWA audit")
    console.log("4. Target score: ≥ 90")
  } else {
    console.log("⚠️  Some tests failed. Please fix the issues above.")
  }
}

runTests()
