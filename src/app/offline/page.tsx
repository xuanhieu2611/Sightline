export default function OfflinePage() {
  return (
    <div className="h-full bg-black text-white flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 border-4 border-white rounded-full flex items-center justify-center mb-6 mx-auto">
          <div className="w-8 h-8 bg-white rounded-full"></div>
        </div>

        <h1 className="text-3xl font-bold mb-4">Sightline</h1>
        <h2 className="text-xl font-semibold mb-4">You're Offline</h2>

        <p className="text-lg mb-6">
          Don't worry! Sightline works offline for basic navigation assistance.
        </p>

        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
            <div>
              <h3 className="font-semibold">Tap to Scan</h3>
              <p className="text-sm text-gray-400">
                Basic obstacle detection works offline
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
            <div>
              <h3 className="font-semibold">Read Text</h3>
              <p className="text-sm text-gray-400">
                OCR works with cached models
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex-shrink-0 mt-1"></div>
            <div>
              <h3 className="font-semibold">Find Objects</h3>
              <p className="text-sm text-gray-400">
                Limited to basic object detection
              </p>
            </div>
          </div>
        </div>

        <button
          className="w-full h-16 bg-white text-black font-bold text-lg rounded-lg mt-8 touch-target"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
