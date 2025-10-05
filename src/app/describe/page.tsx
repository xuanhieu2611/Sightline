"use client";

import { useState } from "react";
import { Camera } from "@/camera/Camera";

export default function DescribePage() {
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    // ✅ Unlock speech synthesis on user gesture
    const unlock = new SpeechSynthesisUtterance("");
    speechSynthesis.speak(unlock);

    // ✅ You can also unlock audio contexts if you use Web Audio later:
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (err) {
      console.warn("AudioContext resume failed", err);
    }

    // ✅ Proceed to start camera
    setStarted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {!started ? (
        <button
          onClick={handleStart}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white focus:outline-none"
          style={{
            fontSize: "5rem",
            padding: "4rem",
            lineHeight: 1,
            textAlign: "center",
            fontWeight: 800,
            borderRadius: 0,
          }}
        >
          Tap to Start
        </button>
      ) : (
        <Camera />
      )}
    </div>
  );
}
