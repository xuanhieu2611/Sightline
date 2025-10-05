"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <div className="bg-black text-white">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold pt-4 mb-6">SIGHTLINE</h1>
        <div className="flex justify-center gap-8 pb-2">
          <Link
            href="/describe"
            className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
              pathname === "/describe"
                ? "bg-gray-700 text-white"
                : "bg-gray-600 text-white hover:bg-gray-500"
            }`}
          >
            Describe
          </Link>
          <Link
            href="/read"
            className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
              pathname === "/read"
                ? "bg-gray-700 text-white"
                : "bg-gray-600 text-white hover:bg-gray-500"
            }`}
          >
            Read
          </Link>
        </div>
      </div>
    </div>
  )
}
