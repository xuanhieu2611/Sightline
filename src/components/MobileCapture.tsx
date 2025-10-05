import React, { forwardRef, useImperativeHandle, useRef } from "react";

export type MobileCaptureHandle = {
  open: () => void;
};

type Props = {
  onCapture: (blob: Blob) => void;
  accept?: string;
  capture?: boolean | "environment" | "user";
};

const MobileCapture = forwardRef<MobileCaptureHandle, Props>(
  ({ onCapture, accept = "image/*", capture = "environment" }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        open: () => inputRef.current?.click(),
      }),
      []
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      onCapture(file);
      e.currentTarget.value = "";
    };

    return (
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        onChange={handleChange}
        className="hidden"
      />
    );
  }
);

export default MobileCapture;