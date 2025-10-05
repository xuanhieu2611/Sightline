"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <div className="bg-black text-white ">
      <div className="text-center py-2 pt-6">
        <h1 className="text-5xl font-semibold pt-4 mb-6">SIGHTLINE</h1>
        <div className="flex justify-center gap-8 pb-2">
          <Link
            href="/describe"
            className={`px-8 py-4 text-2xl font-semibold rounded-3xl transition-colors ${
              pathname === "/describe"
                ? "bg-black text-white border-2 border-white"
                : "bg-black text-white hover:bg-gray-100"
            }`}
          >
            Describe
          </Link>
          <Link
            href="/live"
            className={`px-8 py-4 text-2xl font-semibold rounded-3xl transition-colors ${
              pathname === "/live"
                ? "bg-black text-white border-2 border-white"
                : "bg-black text-white hover:bg-gray-500"
            }`}
          >
            Live
          </Link>
        </div>
      </div>
    </div>
  )
}
