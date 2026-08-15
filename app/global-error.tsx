'use client'

import React from "react"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-[#FFF9F1] flex items-center justify-center p-6 text-[#292724] font-sans">
        <div className="max-w-md w-full bg-white border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-2xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#292724]">
            Application Error Encountered
          </h2>
          <p className="text-xs text-[#77716A]">
            {error?.message || "An unexpected runtime error occurred."}
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 bg-[#E76F51] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="flex-1 border border-[#E5DCD0] text-[#292724] font-bold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
