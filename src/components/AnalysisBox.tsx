import React, { useEffect, useRef, useState } from "react";

type Props = {
  blob: Blob | null;
};

export default function AnalysisBox({ blob }: Props) {
  const [analyzing, setAnalyzing] = useState(false);

  // audio queue / playback refs (from hieu)
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const audioBlob = audioQueueRef.current.shift()!;
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingRef.current = false;
        playNextAudio();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingRef.current = false;
        playNextAudio();
      };
      await audio.play();
    } catch (err) {
      console.error("Audio playback error:", err);
      isPlayingRef.current = false;
      playNextAudio();
    }
  };

  // helper: send text chunk to server TTS endpoint which proxies to ElevenLabs.
  // Expects /api/tts to return audio/mpeg binary.
  const synthesizeChunk = async (text: string, signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
      });
      if (!res.ok) {
        console.warn("TTS failed", await res.text().catch(() => ""));
        return null;
      }
      const ab = await res.arrayBuffer();
      return new Blob([ab], { type: "audio/mpeg" });
    } catch (e) {
      if ((e as any)?.name === "AbortError") return null;
      console.error("synthesizeChunk error", e);
      return null;
    }
  };

  useEffect(() => {
    if (!blob) return;
    const ac = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    (async () => {
      setAnalyzing(true);
      audioQueueRef.current = [];
      isPlayingRef.current = false;

      try {
        const form = new FormData();
        form.append("image", blob, "photo.jpg");

        const res = await fetch("/api/analyze-image", {
          method: "POST",
          body: form,
          signal: ac.signal,
        });

        if (!res.ok) {
          console.warn("analyze-image failed", await res.text().catch(() => ""));
          setAnalyzing(false);
          return;
        }

        if (!res.body) {
          // fallback: non-streaming response — expect text description
          const json = await res.json().catch(() => null);
          if (json?.description) {
            const b = await synthesizeChunk(json.description, ac.signal);
            if (b) {
              audioQueueRef.current.push(b);
              playNextAudio();
            }
          }
          setAnalyzing(false);
          return;
        }

        reader = res.body.getReader();
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
              // if server already produced audio chunks (base64), queue them directly
              if (obj.type === "audio" && obj.chunk) {
                const audioData = Uint8Array.from(atob(obj.chunk), (c) =>
                  c.charCodeAt(0)
                );
                const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
                audioQueueRef.current.push(audioBlob);
                if (!isPlayingRef.current) playNextAudio();
              }

              // if server sends text chunks, synthesize via ElevenLabs proxy
              else if (obj.type === "text" && obj.chunk) {
                // synthesize asynchronously but don't block parsing
                synthesizeChunk(obj.chunk, ac.signal).then((audioBlob) => {
                  if (audioBlob) {
                    audioQueueRef.current.push(audioBlob);
                    if (!isPlayingRef.current) playNextAudio();
                  }
                });
              }

              // ignore final description to avoid duplication (server should still send type 'done' or similar)
              else if (obj.type === "done") {
                // nothing to do
              } else if (obj.type === "error") {
                console.error("analysis error:", obj.error);
              }
            } catch (e) {
              // ignore partial JSON
            }
          }
        }

        // flush remaining buffer (only handle text -> synthesize)
        if (buffer.trim()) {
          try {
            const obj = JSON.parse(buffer);
            if (obj.type === "text" && obj.chunk) {
              const audioBlob = await synthesizeChunk(obj.chunk, ac.signal);
              if (audioBlob) {
                audioQueueRef.current.push(audioBlob);
                if (!isPlayingRef.current) playNextAudio();
              }
            } else if (obj.type === "audio" && obj.chunk) {
              const audioData = Uint8Array.from(atob(obj.chunk), (c) =>
                c.charCodeAt(0)
              );
              const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
              audioQueueRef.current.push(audioBlob);
              if (!isPlayingRef.current) playNextAudio();
            }
          } catch {}
        }
      } catch (err: any) {
        if ((err as any)?.name !== "AbortError") {
          console.error("analysis failed", err);
        }
      } finally {
        setAnalyzing(false);
        try {
          reader?.cancel();
        } catch {}
      }
    })();

    return () => {
      ac.abort();
      try {
        reader?.cancel();
      } catch {}
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  // No text UI — only an optional small analyzing indicator
  if (!blob) return null;
  return (
    <div className="mt-6 w-full max-w-lg">
      {analyzing && (
        <div className="text-center text-sm text-gray-300">Analyzing…</div>
      )}
    </div>
  );
}