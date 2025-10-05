"use client"

import { useRef, useState, useEffect } from "react";
import { FiCamera, FiPause, FiPlay } from "react-icons/fi";

export default function DescribePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastDescription, setLastDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualCapture, setManualCapture] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Start camera automatically when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log("Video ready");
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Camera access denied. Please allow camera access.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Capture image and analyze
  const captureAndAnalyze = async () => {
    console.log("📸 Starting capture and analyze");
    
    if (!videoRef.current || !canvasRef.current || isAnalyzing) {
      console.log("❌ Skipping capture - video:", !!videoRef.current, "canvas:", !!canvasRef.current, "analyzing:", isAnalyzing);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("No canvas context");
      return;
    }

    setIsAnalyzing(true);
    console.log("🔄 Setting analyzing to true");

    try {
      // Capture frame
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      console.log("📷 Captured frame:", canvas.width, "x", canvas.height);

      // Convert to blob
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log("💾 Created blob:", blob.size, "bytes");
            resolve(blob);
          }
        }, "image/jpeg", 0.8);
      });

      // Send to API
      console.log("🌐 Sending to API...");
      await analyzeImage(imageBlob);
      
    } catch (error) {
      console.error("Capture error:", error);
    } finally {
      setIsAnalyzing(false);
      console.log("✅ Analysis complete, analyzing set to false");
    }
  };

  // Analyze image with existing API
  const analyzeImage = async (imageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob);

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.type === "text" && obj.chunk) {
              fullText += obj.chunk;
              setLastDescription(fullText);
              speakText(obj.chunk);
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }

      console.log("🤖 Final description:", fullText);
      
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  // Text to speech
  const speakText = (text: string) => {
    console.log("🔊 Speaking:", text);
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      speechSynthesis.speak(utterance);
    }
  };

  // Manual capture button - ONE TIME ONLY
  const handleManualCapture = () => {
    console.log("👆 Manual capture triggered - ONE TIME");
    setManualCapture(true);
    captureAndAnalyze();
    setTimeout(() => setManualCapture(false), 2000);
  };

  // Start monitoring
  const startMonitoring = () => {
    console.log("🟢 STARTING MONITORING");
    setIsMonitoring(true);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Start new interval
    intervalRef.current = setInterval(() => {
      console.log("⏰ INTERVAL TRIGGERED - 5 seconds passed");
      console.log("Current state - isMonitoring:", isMonitoring, "isAnalyzing:", isAnalyzing);
      
      if (!isAnalyzing) {
        console.log("✅ Starting capture...");
        captureAndAnalyze();
      } else {
        console.log("❌ Skipping - already analyzing");
      }
    }, 5000);
    
    console.log("Interval created:", intervalRef.current);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    console.log("🔴 STOPPING MONITORING");
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("Interval cleared");
    }
  };

  // Toggle monitoring
  const toggleMonitoring = () => {
    console.log("🔄 TOGGLE CLICKED - Current monitoring:", isMonitoring);
    
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold mb-4">SIGHTLINE</h1>
        <p className="text-gray-300">Continuous AI Vision Assistant</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {cameraError ? (
          <div className="text-center">
            <div className="bg-red-900 p-6 rounded-lg mb-6">
              <p className="text-red-200 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            {/* Video Feed */}
            <div className="relative mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 md:h-96 object-cover rounded-lg border border-white"
              />
              
              {/* Status Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-lg text-sm">
                {isMonitoring ? (
                  <span className="text-green-400">🔴 Monitoring</span>
                ) : (
                  <span className="text-yellow-400">⏸️ Paused</span>
                )}
                {isAnalyzing && (
                  <span className="text-blue-400 ml-2">Analyzing...</span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={toggleMonitoring}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isMonitoring
                    ? "bg-yellow-600 text-white hover:bg-yellow-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isMonitoring ? (
                  <>
                    <FiPause className="inline mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <FiPlay className="inline mr-2" />
                    Resume
                  </>
                )}
              </button>

              <button
                onClick={handleManualCapture}
                disabled={isAnalyzing}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isAnalyzing || manualCapture
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <FiCamera className="inline mr-2" />
                {manualCapture ? "Capturing..." : "Manual Capture"}
              </button>
            </div>

            {/* Debug Info */}
            <div className="text-center text-xs text-gray-500 mb-4">
              Monitoring: {isMonitoring ? "✅" : "❌"} | 
              Analyzing: {isAnalyzing ? "✅" : "❌"} |
              Interval: {intervalRef.current ? "✅" : "❌"}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-400 mb-4">
              {!isMonitoring ? "Click 'Resume' to start continuous analysis every 5 seconds" : "Monitoring active - analyzing every 5 seconds"}
            </div>

            {/* Last Description */}
            {lastDescription && (
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold mb-2">Latest Description:</h3>
                <p className="text-white">{lastDescription}</p>
                <button
                  onClick={() => speakText(lastDescription)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  🔊 Repeat
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}