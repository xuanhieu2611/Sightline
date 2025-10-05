"use client"
import React, { useEffect, useRef } from "react";
import DesktopCapture from "./DesktopCapture";
import MobileCapture, { MobileCaptureHandle } from "./MobileCapture";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  isProcessingOrPlayingAudio: boolean;
  setIsProcessionOrPlayingAudio: (value: boolean) => void;
};

export default function CameraModal({ open, onClose, onCapture, isProcessingOrPlayingAudio, setIsProcessionOrPlayingAudio }: Props) {
  const mobileRef = useRef<MobileCaptureHandle | null>(null);

  useEffect(() => {
    if (!open || typeof navigator === "undefined" || isProcessingOrPlayingAudio) return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // trigger mobile file input (MobileCapture should expose open() via ref)
      // small timeout lets modal mount before opening native camera UI
      setTimeout(() => mobileRef.current?.open(), 80);
    }
  }, [open, isProcessingOrPlayingAudio]);

  if (!open) return null;

  const isMobileNow =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleCapture = (blob: Blob) => {
    if (isProcessingOrPlayingAudio) {
      // Prevent capture if audio is still processing or playing
      return;
    }
    onCapture(blob);
    onClose();
  };

  // Don't show modal if audio is processing/playing
  if (isProcessingOrPlayingAudio) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-white text-lg mb-2">Please wait...</p>
          <p className="text-gray-400">Audio is still playing from the previous capture</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-black rounded-lg w-full max-w-xl overflow-hidden">
        <div className="p-4">
          {isMobileNow ? (
            // MobileCapture is mounted hidden and will open native camera immediately via ref
            <MobileCapture ref={mobileRef} onCapture={handleCapture} />
          ) : (
            // DesktopCapture shows video preview + capture button
            <DesktopCapture onCapture={handleCapture} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}