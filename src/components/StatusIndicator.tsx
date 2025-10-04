"use client"

interface StatusIndicatorProps {
  isOnline: boolean
}

export function StatusIndicator({ isOnline }: StatusIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isOnline ? "bg-green-500" : "bg-red-500"
        }`}
        aria-label={isOnline ? "Online" : "Offline"}
      />
      <span className="text-sm font-medium">
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  )
}
