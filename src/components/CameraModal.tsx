"use client"
import React, { useEffect, useRef } from "react";
import DesktopCapture from "./DesktopCapture";
import MobileCapture, { MobileCaptureHandle } from "./MobileCapture";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
};

export default function CameraModal({ open, onClose, onCapture }: Props) {
  const mobileRef = useRef<MobileCaptureHandle | null>(null);

  useEffect(() => {
    if (!open || typeof navigator === "undefined") return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // trigger mobile file input (MobileCapture should expose open() via ref)
      // small timeout lets modal mount before opening native camera UI
      setTimeout(() => mobileRef.current?.open(), 80);
    }
  }, [open]);

  if (!open) return null;

  const isMobileNow =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleCapture = (blob: Blob) => {
    onCapture(blob);
    onClose();
  };

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