import { useEffect, useRef, useState } from "react";

export const Camera = () => {

    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [infiniteLoopTriggered, setInfiniteLoopTriggered] = useState<boolean>(false);

    useEffect(() => {
        const helper = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1000 },
                    height: { ideal: 1000 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setStream(stream);
        }
        helper();
    }, [])

    const isBlackImage = (blob: Blob): Promise<boolean> => new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            for (let i = 0; i < pixels.length; i += 4)
                if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0) {
                    resolve(false);
                    return;
                }
            resolve(true);
        };
        img.src = URL.createObjectURL(blob);
    });

    const screenshotLooper = async (screenshot: () => Promise<Blob | undefined>) => {
        if (!infiniteLoopTriggered) {
            console.log("should only ever run once");
            setInfiniteLoopTriggered(true);
        } else {
            return;
        }
        const imageBlob = await screenshot();

        if (!imageBlob || await isBlackImage(imageBlob)) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await screenshotLooper(screenshot);
            return
        }

        const formData = new FormData();
        formData.append("image", imageBlob);

        const response = await fetch("/api/image-analyze", {
            method: "POST",
            body: formData,
        });

        let fullText = "";
        try {
            const json = await response.json().catch(() => null);
            fullText = json?.description ?? json?.text ?? "";
        } catch {
            fullText = await response.text().catch(() => "");
        }

        console.log(fullText);

        const utterance = new SpeechSynthesisUtterance(fullText);
        await new Promise<void>(resolve => {
            utterance.onend = () => resolve();
            speechSynthesis.speak(utterance);
        });
        console.log("screenshoting");
        await screenshotLooper(screenshot);
        return;
    }

    useEffect(() => {
        if (!stream || !videoRef.current) return;

        const video = videoRef.current;

        const capturePhoto = async () => {

            // Create canvas and context
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    }
                }, 'image/jpeg', 0.8);
            });
            return blob;
        };

        screenshotLooper(capturePhoto);

    }, [stream]);

    return <>
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 md:h-96 object-cover rounded-lg border border-white"
        />
    </>;
}