"use client";

import { useRef, useState, useEffect } from "react";
import { FiCamera } from "react-icons/fi";
import DesktopCapture from "../components/DesktopCapture";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDesktopCam, setShowDesktopCam] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      // nothing to revoke here since we no longer create object URLs for preview
    };
  }, []);

  const isMobile = () => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  const openCamera = () => {
    if (isMobile()) {
      inputRef.current?.click(); // mobile: file input (camera)
    } else {
      setShowDesktopCam(true); // desktop: use getUserMedia modal
    }
  };

  // send blob to AI and show streamed response
  const analyzeBlob = async (blob: Blob) => {
    setAnalysis("");
    setAnalyzing(true);

    try {
      const form = new FormData();
      form.append("image", blob, "photo.jpg");

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errText = await res.text();
        setAnalysis(`Server error: ${res.status} ${errText}`);
        setAnalyzing(false);
        return;
      }

      if (!res.body) {
        // fallback: parse full json
        const json = await res.json().catch(() => null);
        setAnalysis(json?.description ?? "No description returned");
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
            // server sends chunks with { chunk: "...", done: false } and final with done: true + description
            if (obj.chunk) {
              setAnalysis((s) => s + obj.chunk);
            } else if (obj.description) {
              setAnalysis((s) => (s ? s + "\n" + obj.description : obj.description));
            } else if (obj.error) {
              setAnalysis((_) => `Error: ${obj.error}`);
            }
          } catch (e) {
            // ignore parse errors for partial lines
          }
        }
      }

      // flush any remaining buffered line
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          if (obj.chunk) setAnalysis((s) => s + obj.chunk);
          else if (obj.description) setAnalysis((s) => (s ? s + "\n" + obj.description : obj.description));
        } catch {}
      }
    } catch (err: any) {
      setAnalysis(`Capture/analysis failed: ${err?.message ?? String(err)}`);
    } finally {
      setAnalyzing(false);
      setShowDesktopCam(false);
    }
  };

  const handleCaptureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // mobile: clear input and immediately start analysis (no camera UI to hide)
    e.currentTarget.value = "";
    analyzeBlob(file);
  };

  const handleCaptureDesktop = (blob: Blob) => {
    // hide the desktop camera UI immediately when a photo is taken
    setShowDesktopCam(false);
    // then send the blob to analysis
    analyzeBlob(blob);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-7xl md:text-9xl font-extrabold mb-12 text-white">SightLine</h1>

      <button
        onClick={openCamera}
        type="button"
        aria-label="Open camera"
        className="w-40 h-40 md:w-56 md:h-56 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-white hover:text-black hover:border-black active:scale-95 transition-transform focus:outline-none"
      >
        <FiCamera className="text-current" size={64} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCaptureInput}
        className="hidden"
      />

      {showDesktopCam && (
        <DesktopCapture
          onCapture={handleCaptureDesktop}
          onCancel={() => setShowDesktopCam(false)}
        />
      )}

      <div className="mt-6 w-full max-w-lg">
        {analyzing ? (
          <div className="text-center text-sm text-gray-300">Analyzing image…</div>
        ) : (
          analysis && (
            <div className="prose text-white bg-gray-900/40 p-4 rounded-md whitespace-pre-wrap">
              {analysis}
            </div>
          )
        )}
      </div>
    </div>
  );
}
