export default function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-pink-500 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="mt-8 space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Loading Succinct Network Assistant ✨
            </h2>
            <p className="text-pink-600 font-medium">
              Preparing your magical whitepaper exploration experience...
            </p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }