'use client'
import React from 'react'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Clean Warm Soft Neutral Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#f5f2ed] to-[#f0f3f8] opacity-100" />

      {/* Subtle Micro-Grid Divider */}
      <div 
        className="absolute inset-0 opacity-[0.025]" 
        style={{
          backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
          backgroundSize: `48px 48px`
        }} 
      />

      {/* Soft Ambient Pastel Glows (Non-distracting) */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] bg-amber-100/40 rounded-full blur-[160px]" />
      <div className="absolute top-[40%] right-[15%] w-[450px] h-[450px] bg-purple-100/30 rounded-full blur-[120px]" />
    </div>
  )
}
