"use client";

import { useRef, useState, useEffect } from "react";
import DesktopCapture from "../../components/DesktopCapture";

export default function DescribePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDesktopCam, setShowDesktopCam] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (capturedImage?.startsWith("blob:")) URL.revokeObjectURL(capturedImage);
    };
  }, [capturedImage]);

  const isMobile = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const openCamera = () => isMobile() ? inputRef.current?.click() : setShowDesktopCam(true);

  const analyzeBlob = async (blob: Blob) => {
    setAnalysis("");
    setAnalyzing(true);
    setCapturedImage(URL.createObjectURL(blob));

    try {
      const form = new FormData();
      form.append("image", blob, "photo.jpg");
      const res = await fetch("/api/analyze-image", { method: "POST", body: form });

      if (!res.ok || !res.body) {
        setAnalysis("Error analyzing image");
        setAnalyzing(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            if (obj.chunk) setAnalysis((s) => s + obj.chunk);
            else if (obj.error) setAnalysis(`Error: ${obj.error}`);
          } catch {}
        }
      }
    } catch (err: any) {
      setAnalysis(`Failed: ${err?.message}`);
    } finally {
      setAnalyzing(false);
      setShowDesktopCam(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: 0.9 }));
    }
  };

  const clearImage = () => {
    if (capturedImage?.startsWith("blob:")) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    setAnalysis("");
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.currentTarget.value = "";
    analyzeBlob(file);
  };

  const handleDesktopCapture = (blob: Blob) => {
    setShowDesktopCam(false);
    analyzeBlob(blob);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Sightline</h1>
      
      {!capturedImage ? (
        <button onClick={openCamera} className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg">
          Take Photo
        </button>
      ) : (
        <div className="space-y-6 max-w-md w-full">
          <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
          
          {analyzing ? (
            <div className="text-center">Analyzing...</div>
          ) : analysis && (
            <div className="space-y-4">
              <div className="bg-gray-100 text-black p-4 rounded-lg">{analysis}</div>
              <button onClick={() => speakText(analysis)} className="w-full px-4 py-2 bg-green-500 text-white rounded-lg">
                Speak
              </button>
            </div>
          )}
          
          <button onClick={clearImage} className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg">
            Take Another
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {showDesktopCam && (
        <DesktopCapture
          onCapture={handleDesktopCapture}
          onCancel={() => setShowDesktopCam(false)}
        />
      )}
    </div>
  );
}


