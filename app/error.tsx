'use client'

import React, { useEffect } from "react"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log exception for debugging
    console.error("AULYN Runtime Error Caught:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FFF9F1] flex items-center justify-center p-6 text-[#292724]">
      <Card className="max-w-md w-full bg-white border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-center space-y-4">
        <CardHeader className="pb-2 space-y-2">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-2xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl font-serif font-bold text-[#292724]">
            Something went wrong.
          </CardTitle>
          <CardDescription className="text-xs text-[#77716A]">
            A temporary component error occurred. Your session and data remain safe.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {error.message && (
            <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-left font-mono text-[11px] text-red-600 overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={() => reset()}
              className="flex-1 bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="flex-1 border-[#E5DCD0] text-[#292724] font-bold text-xs py-2.5 rounded-xl"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" /> Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
