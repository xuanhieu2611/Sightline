import React, { useEffect, useState } from "react";

type Props = {
  blob: Blob | null;
};

export default function AnalysisBox({ blob }: Props) {
  const [analysis, setAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!blob) return;

    const ac = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    (async () => {
      setAnalysis("");
      setAnalyzing(true);

      try {
        const form = new FormData();
        form.append("image", blob, "photo.jpg");

        const res = await fetch("/api/analyze-image", {
          method: "POST",
          body: form,
          signal: ac.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          setAnalysis(`Server error: ${res.status} ${errText}`);
          return;
        }

        if (!res.body) {
          const json = await res.json().catch(() => null);
          setAnalysis(json?.description ?? "No description returned");
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
              // Only append incremental chunks. Ignore final `description` to avoid duplication.
              if (obj.chunk) {
                setAnalysis((s) => s + obj.chunk);
              } else if (obj.error) {
                setAnalysis(`Error: ${obj.error}`);
              }
            } catch {
              // ignore partial JSON
            }
          }
        }

        // flush remaining buffered line (only handle chunk)
        if (buffer.trim()) {
          try {
            const obj = JSON.parse(buffer);
            if (obj.chunk) setAnalysis((s) => s + obj.chunk);
            // intentionally ignore obj.description
          } catch {}
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setAnalysis(`Analysis failed: ${err?.message ?? String(err)}`);
        }
      } finally {
        setAnalyzing(false);
      }
    })();

    return () => {
      ac.abort();
      if (reader) reader.cancel().catch(() => {});
    };
  }, [blob]);

  if (!blob) return null;

  return (
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
  );
}