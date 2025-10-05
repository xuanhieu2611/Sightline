"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";

export type MobileCaptureHandle = {
  open: () => Promise<void>;
  close: () => void;
};

type Props = {
  onCapture?: (blob: Blob) => void;
  intervalMs?: number;
  facingMode?: "user" | "environment";
  mimeType?: string;
  quality?: number; // 0..1 for jpeg/webp
};

const MobileCapture = forwardRef<MobileCaptureHandle, Props>(
  (
    {
      onCapture,
      intervalMs = 3000,
      facingMode = "environment",
      mimeType = "image/jpeg",
      quality = 0.92,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const mountedRef = useRef(true);
    const appendedVideoRef = useRef<HTMLVideoElement | null>(null);
    const [isGettingOrPlayingAudio, setIsGettingOrPlayingAudio] = useState<boolean>(false);

    const [photos, setPhotos] = useState<string[]>([]);
    const revokeQueueRef = useRef<string[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        open: async () => {
          await startStreamAndCapture();
        },
        close: () => {
          stopStreamAndInterval();
        },
      }),
      []
    );

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        stopStreamAndInterval();
        revokeQueueRef.current.forEach((u) => URL.revokeObjectURL(u));
        revokeQueueRef.current = [];
      };
    }, []);

    const stopStreamAndInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          // @ts-ignore
          videoRef.current.srcObject = null;
        } catch {}
      }
      // remove appended hidden video if we created one
      if (appendedVideoRef.current && appendedVideoRef.current.parentElement) {
        try {
          appendedVideoRef.current.parentElement.removeChild(appendedVideoRef.current);
        } catch {}
        appendedVideoRef.current = null;
      }
    };

    const captureOnce = async (videoEl: HTMLVideoElement) => {
      try {
        const w = videoEl.videoWidth || 1280;
        const h = videoEl.videoHeight || 720;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoEl, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            onCapture?.(blob);
            const url = URL.createObjectURL(blob);
            revokeQueueRef.current.push(url);
            setPhotos((p) => [url, ...p]);
          },
          mimeType,
          quality
        );
      } catch (e) {
        console.warn("captureOnce failed", e);
      }
    };

    const waitForPlayable = (video: HTMLVideoElement, timeout = 2000) =>
      new Promise<void>((resolve) => {
        if (video.readyState >= 2 && (video.videoWidth || video.videoHeight)) return resolve();
        const onLoaded = () => {
          cleanup();
          resolve();
        };
        const onPlaying = () => {
          cleanup();
          resolve();
        };
        const cleanup = () => {
          video.removeEventListener("loadeddata", onLoaded);
          video.removeEventListener("loadedmetadata", onLoaded);
          video.removeEventListener("playing", onPlaying);
        };
        video.addEventListener("loadeddata", onLoaded);
        video.addEventListener("loadedmetadata", onLoaded);
        video.addEventListener("playing", onPlaying);
        setTimeout(() => {
          cleanup();
          resolve();
        }, timeout);
      });

    const startStreamAndCapture = async () => {
      if (streamRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        let videoEl = videoRef.current;
        if (!videoEl) {
          // create and append a tiny hidden video to the DOM to improve iOS behavior
          videoEl = document.createElement("video");
          videoEl.playsInline = true;
          videoEl.muted = true;
          Object.assign(videoEl.style, {
            position: "fixed",
            width: "1px",
            height: "1px",
            left: "-10000px",
            top: "0",
            opacity: "0",
          });
          document.body.appendChild(videoEl);
          appendedVideoRef.current = videoEl;
          videoRef.current = videoEl;
        }

        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.playsInline = true;

        // wait for video to be ready; play may be blocked until user gesture but waitForPlayable helps
        await waitForPlayable(videoEl);
        // attempt play (may reject if autoplay prevented)
        await videoEl.play().catch(() => {});

        // initial capture (ensure dimensions are available)
        await captureOnce(videoEl);

        // set interval for repeated captures; guard against multiple intervals
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(() => {
          if (videoRef.current) captureOnce(videoRef.current);
        }, intervalMs) as number;
      } catch (err) {
        console.warn("MobileCapture start failed:", err);
        stopStreamAndInterval();
      }
    };

    return (
      <div>
        <video
          ref={videoRef}
          style={{
            position: "fixed",
            width: 1,
            height: 1,
            left: -10000,
            top: 0,
            opacity: 0,
          }}
          playsInline
          muted
        />

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <img
              key={p + i}
              src={p}
              alt={`capture-${i}`}
              className="w-24 h-24 object-cover rounded border border-white/20"
              onClick={() => window.open(p, "_blank")}
            />
          ))}
        </div>
      </div>
    );
  }
);

export default MobileCapture;