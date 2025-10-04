"use client"

import { useState, useEffect } from "react"

interface FindButtonProps {
  onAction: (message: string) => void
}

const TARGET_OPTIONS = [
  "Exit",
  "Restroom",
  "Elevator",
  "Stairs",
  "Information",
  "Food Court",
  "Parking",
  "ATM",
]

export function FindButton({ onAction }: FindButtonProps) {
  const [isFinding, setIsFinding] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleFind = async (target: string) => {
    if (isFinding) return

    setIsFinding(true)
    setIsScanning(true)
    setSelectedTarget(target)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }

    // Simulate scanning process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate contextual response based on target
    const responses = {
      Exit: [
        "Exit sign, 1 o'clock, near",
        "Emergency exit detected at 3 o'clock",
        "Main exit, straight ahead, 20 feet",
      ],
      Restroom: [
        "Restroom sign, 2 o'clock, 30 feet",
        "Bathroom facilities, 4 o'clock, near",
        "Restroom, straight ahead, second door",
      ],
      Elevator: [
        "Elevator doors, 12 o'clock, 15 feet",
        "Elevator bank, 2 o'clock, near",
        "Elevator, straight ahead, right side",
      ],
      Stairs: [
        "Staircase, 1 o'clock, 25 feet",
        "Stairs up, 3 o'clock, near",
        "Stairwell, straight ahead, left side",
      ],
      Information: [
        "Information desk, 2 o'clock, 40 feet",
        "Help desk, 4 o'clock, near",
        "Information booth, straight ahead",
      ],
      "Food Court": [
        "Food court entrance, 3 o'clock, 50 feet",
        "Dining area, 1 o'clock, near",
        "Food court, straight ahead, second floor",
      ],
      Parking: [
        "Parking garage entrance, 4 o'clock, 60 feet",
        "Parking level B2, 2 o'clock, near",
        "Parking, straight ahead, down ramp",
      ],
      ATM: [
        "ATM machine, 1 o'clock, 20 feet",
        "ATM, 3 o'clock, near",
        "ATM, straight ahead, right side",
      ],
    }

    const targetResponses = responses[target as keyof typeof responses] || [
      "Target not found",
    ]
    const response =
      targetResponses[Math.floor(Math.random() * targetResponses.length)]

    onAction(response)
    setIsScanning(false)
    setIsFinding(false)
  }

  const handleTargetSelect = (target: string) => {
    setSelectedTarget(target)
    handleFind(target)
  }

  // Auto-scan when target is selected
  useEffect(() => {
    if (selectedTarget && !isScanning) {
      const interval = setInterval(() => {
        if (isFinding) return

        const responses = {
          Exit: ["Exit sign, 1 o'clock, near", "Exit, 3 o'clock, 15 feet"],
          Restroom: [
            "Restroom, 2 o'clock, near",
            "Bathroom, 4 o'clock, 20 feet",
          ],
          Elevator: [
            "Elevator, 12 o'clock, near",
            "Elevator doors, 2 o'clock, 10 feet",
          ],
          Stairs: ["Stairs, 1 o'clock, near", "Staircase, 3 o'clock, 25 feet"],
          Information: [
            "Info desk, 2 o'clock, near",
            "Information, 4 o'clock, 30 feet",
          ],
          "Food Court": [
            "Food court, 3 o'clock, near",
            "Dining, 1 o'clock, 40 feet",
          ],
          Parking: ["Parking, 4 o'clock, near", "Garage, 2 o'clock, 50 feet"],
          ATM: ["ATM, 1 o'clock, near", "ATM, 3 o'clock, 15 feet"],
        }

        const targetResponses = responses[
          selectedTarget as keyof typeof responses
        ] || ["Target not found"]
        const response =
          targetResponses[Math.floor(Math.random() * targetResponses.length)]

        onAction(response)
      }, 3000) // Scan every 3 seconds

      return () => clearInterval(interval)
    }
  }, [selectedTarget, isScanning, isFinding, onAction])

  if (selectedTarget) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="text-lg font-semibold mb-2">
            Finding: {selectedTarget}
          </div>
          {isScanning && (
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Scanning...
            </div>
          )}
        </div>

        <button
          className="w-full h-12 bg-red-600 text-white font-bold rounded-lg touch-target"
          onClick={() => {
            setSelectedTarget(null)
            setIsScanning(false)
            setIsFinding(false)
          }}
        >
          Stop Finding
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        className={`
          w-full h-20 rounded-lg border-4 border-white
          bg-black text-white font-bold text-lg
          transition-all duration-200 ease-in-out
          touch-target
          hover:bg-white hover:text-black
          focus:outline-none focus:ring-4 focus:ring-green-500
          ${isFinding ? "animate-pulse" : ""}
        `}
        onClick={() => setSelectedTarget("selecting")}
        disabled={isFinding}
        aria-label="Find specific objects"
      >
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1">🔍</div>
          <span>FIND</span>
        </div>
      </button>

      {selectedTarget === "selecting" && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-semibold mb-2">
            What are you looking for?
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_OPTIONS.map((target) => (
              <button
                key={target}
                className="h-10 bg-gray-800 text-white font-bold rounded-lg touch-target text-sm"
                onClick={() => handleTargetSelect(target)}
              >
                {target}
              </button>
            ))}
          </div>
          <button
            className="w-full h-10 bg-gray-600 text-white font-bold rounded-lg touch-target"
            onClick={() => setSelectedTarget(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
