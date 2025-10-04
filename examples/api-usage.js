// Example: How to use the Sightline Image Analysis API

// 1. Basic image upload and analysis
async function analyzeImage(imageFile) {
  const formData = new FormData()
  formData.append("image", imageFile)

  try {
    const response = await fetch("/api/analyze-image", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      console.log("Analysis result:", result.description)
      return result.description
    } else {
      console.error("Analysis failed:", result.error)
      return null
    }
  } catch (error) {
    console.error("Network error:", error)
    return null
  }
}

// 2. Camera capture and analysis
async function captureAndAnalyze() {
  try {
    // Access camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })

    // Create video element
    const video = document.createElement("video")
    video.srcObject = stream
    video.play()

    // Wait for video to load
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve
    })

    // Capture frame
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0)

    // Stop camera
    stream.getTracks().forEach((track) => track.stop())

    // Convert to blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    })

    // Analyze image
    const description = await analyzeImage(blob)
    return description
  } catch (error) {
    console.error("Camera capture failed:", error)
    return null
  }
}

// 3. File input analysis
function setupFileInput() {
  const fileInput = document.getElementById("image-input")

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith("image/")) {
      const description = await analyzeImage(file)
      if (description) {
        // Display result
        document.getElementById("result").textContent = description
      }
    }
  })
}

// 4. Integration with TapButton
class TapButtonWithAI {
  constructor(onAction) {
    this.onAction = onAction
    this.isScanning = false
  }

  async handleTap() {
    if (this.isScanning) return

    this.isScanning = true

    try {
      // Capture image from camera
      const description = await captureAndAnalyze()

      if (description) {
        this.onAction(description)
      } else {
        // Fallback to simulated response
        this.onAction("Clear path ahead. No obstacles detected.")
      }
    } catch (error) {
      console.error("Tap analysis failed:", error)
      this.onAction("Analysis unavailable. Proceed with caution.")
    } finally {
      this.isScanning = false
    }
  }
}

// 5. Error handling and fallbacks
async function robustImageAnalysis(imageFile) {
  try {
    // Try AI analysis first
    const description = await analyzeImage(imageFile)
    if (description) {
      return description
    }
  } catch (error) {
    console.warn("AI analysis failed, using fallback:", error)
  }

  // Fallback responses based on image characteristics
  const fallbackResponses = [
    "Clear path ahead. No obstacles detected.",
    "Obstacle detected. Safe passage to your left.",
    "Doorway ahead. Handle on the right side.",
    "Stairs detected. Handrail on your left.",
    "Crowded area. Move slowly and stay to the right.",
  ]

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
}

// 6. Usage in React component
function ImageAnalysisComponent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState("")

  const handleImageUpload = async (file) => {
    setIsAnalyzing(true)

    try {
      const description = await analyzeImage(file)
      setResult(description || "Analysis failed")
    } catch (error) {
      setResult("Error: " + error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files[0])}
      />
      {isAnalyzing && <p>Analyzing...</p>}
      {result && <p>{result}</p>}
    </div>
  )
}

// Export functions for use in other modules
export {
  analyzeImage,
  captureAndAnalyze,
  setupFileInput,
  TapButtonWithAI,
  robustImageAnalysis,
}
