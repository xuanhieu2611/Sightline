"use client"

import { useState } from "react"
import { FiCamera, FiX } from "react-icons/fi"
import Camera from "../components/camera"

export default function Home() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-7xl md:text-9xl font-extrabold mb-12 text-white">SightLine</h1>

      <button
        type="button"
        aria-label="Open camera"
        onClick={() => setOpen(true)}
        className="w-40 h-40 md:w-56 md:h-56 bg-white text-black rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform focus:outline-none"
      >
        <FiCamera className="text-black" size={64} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl h-[80vh] bg-black rounded-lg overflow-hidden">
            <button
              aria-label="Close camera"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white focus:outline-none"
            >
              <FiX size={20} />
            </button>

            <div className="w-full h-full">
              <Camera />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
