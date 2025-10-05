"use client"

import { useRef, useState, useEffect } from "react";
import { FiCamera } from "react-icons/fi";

export default function DescribePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingAudioRef = useRef(false); // 👈 NEW REF FOR AUDIO STATE
  
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastDescription, setLastDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualCapture, setManualCapture] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Start camera and monitoring automatically when component mounts
  useEffect(() => {
    startCamera();
    startMonitoring();
    
    return () => {
      stopCamera();
      stopMonitoring();
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
      console.log("⏰ INTERVAL TRIGGERED - 10 seconds passed");
      console.log("Current state - isAnalyzing:", isAnalyzing, "isPlayingAudio:", isPlayingAudioRef.current); // 👈 USE REF
      
      if (!isAnalyzing && !isPlayingAudioRef.current) { // 👈 CHECK REF INSTEAD OF STATE
        console.log("✅ Starting auto capture...");
        captureAndAnalyze(false);
      } else {
        console.log("❌ Skipping - analyzing or audio playing");
      }
    }, 10000);
    
    console.log("Interval created:", intervalRef.current);
  };

  // Capture image and analyze
  const captureAndAnalyze = async (isManual = false) => {
    console.log("📸 Starting capture and analyze", isManual ? "(MANUAL)" : "(AUTO)");
    
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

      // Send to different APIs based on manual vs auto
      console.log("🌐 Sending to API...");
      if (isManual) {
        await analyzeImageManual(imageBlob);
      } else {
        await analyzeImageAuto(imageBlob);
      }
      
    } catch (error) {
      console.error("Capture error:", error);
    } finally {
      setIsAnalyzing(false);
      console.log("✅ Analysis complete, analyzing set to false");
      
      // Resume monitoring after manual capture
      if (isManual) {
        console.log("🔄 Resuming auto-monitoring after manual capture");
        startMonitoring();
      }
    }
  };

  // Analyze image for MANUAL capture - uses /api/image-describe (streaming with ElevenLabs audio)
  const analyzeImageManual = async (imageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob);

      console.log("📝 Using /api/image-describe for manual capture");
      const response = await fetch("/api/image-describe", {
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
      const audioChunks: string[] = [];

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
            } else if (obj.type === "audio" && obj.chunk) {
              audioChunks.push(obj.chunk);
            }
          } catch (e) {
            // ignore partial JSON
          }
        }
      }

      console.log("🤖 Manual final description:", fullText);
      
      // Play ElevenLabs audio if available
      if (audioChunks.length > 0) {
        console.log("🔊 Playing ElevenLabs audio chunks:", audioChunks.length);
        await playElevenLabsAudio(audioChunks);
      } else {
        console.log("⚠️ No audio chunks received, falling back to native TTS");
        speakText(fullText);
      }
      
    } catch (error) {
      console.error("Manual analysis error:", error);
    }
  };

  // Play ElevenLabs audio chunks
  const playElevenLabsAudio = async (audioChunks: string[]) => {
    try {
      isPlayingAudioRef.current = true; // 👈 SET REF
      setIsPlayingAudio(true);
      console.log("🔊 Audio playback started - blocking auto-capture");
      
      // Convert base64 chunks to audio buffers
      const audioBuffers = audioChunks.map(chunk => 
        Uint8Array.from(atob(chunk), c => c.charCodeAt(0))
      );
      
      // Combine all audio buffers
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      
      let offset = 0;
      for (const buffer of audioBuffers) {
        combinedBuffer.set(buffer, offset);
        offset += buffer.length;
      }
      
      // Create audio blob and play
      const audioBlob = new Blob([combinedBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingAudioRef.current = false; // 👈 CLEAR REF
        setIsPlayingAudio(false);
        console.log("🔊 Audio playback finished - auto-capture unblocked");
      };
      
    } catch (error) {
      console.error("Error playing ElevenLabs audio:", error);
      isPlayingAudioRef.current = false; // 👈 CLEAR REF ON ERROR
      setIsPlayingAudio(false);
      // Fallback to native TTS
      speakText(lastDescription);
    }
  };

  // Analyze image for AUTO capture - uses /api/image-analyze (JSON response)
  const analyzeImageAuto = async (imageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob);

      console.log("🔄 Using /api/image-analyze for auto capture");
      const response = await fetch("/api/image-analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      console.log("🤖 Auto API response:", data);
      
      if (data.description) {
        setLastDescription(data.description);
        speakText(data.description);
      }
      
    } catch (error) {
      console.error("Auto analysis error:", error);
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

  // Manual capture button - PAUSES auto mode temporarily
  const handleManualCapture = () => {
    console.log("👆 Manual capture triggered - PAUSING AUTO MODE");
    
    // Stop auto monitoring
    stopMonitoring();
    
    setManualCapture(true);
    captureAndAnalyze(true);
    
    setTimeout(() => setManualCapture(false), 2000);
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
                <span className="text-green-400">🔴 Live Monitoring</span>
                {isAnalyzing && (
                  <span className="text-blue-400 ml-2">Analyzing...</span>
                )}
                {manualCapture && (
                  <span className="text-yellow-400 ml-2">(Manual)</span>
                )}
                {isPlayingAudio && (
                  <span className="text-purple-400 ml-2">🔊 Playing</span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleManualCapture}
                disabled={isAnalyzing}
                className={`px-8 py-4 rounded-lg font-medium transition-colors ${
                  isAnalyzing || manualCapture
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <FiCamera className="inline mr-2 text-xl" />
                {manualCapture ? "Capturing..." : "Manual Capture"}
              </button>
            </div>

            {/* Debug Info */}
            <div className="text-center text-xs text-gray-500 mb-4">
              Auto-Monitoring: {isMonitoring ? "✅" : "❌"} | 
              Analyzing: {isAnalyzing ? "✅" : "❌"} |
              Playing Audio: {isPlayingAudio ? "✅" : "❌"} |
              Interval: {intervalRef.current ? "✅" : "❌"}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-400 mb-4">
              Live monitoring active - analyzing every 10 seconds. Click "Manual Capture" for detailed analysis.
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