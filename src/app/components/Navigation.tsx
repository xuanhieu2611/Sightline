"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center items-center py-8">
      <div className="flex gap-8">
        <Link
          href="/describe"
          className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
            pathname === "/describe"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Describe
        </Link>
        <Link
          href="/read"
          className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
            pathname === "/read"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Read
        </Link>
      </div>
    </div>
  );
}


