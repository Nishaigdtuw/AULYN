'use client'
import React from 'react'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* User's Candlelit Study Desk Background Photo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-100 filter brightness-95 contrast-105 transition-all"
        style={{
          backgroundImage: "url('/bg-study.jpg')",
        }}
      />

      {/* Subtle Warm Overlay for High Contrast & Text Legibility */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(244, 239, 231, 0.20) 0%, rgba(30, 26, 22, 0.15) 50%, rgba(244, 239, 231, 0.30) 100%)'
        }}
      />

      {/* Warm Candle Light Ambient Glow Accent */}
      <div 
        className="absolute top-[40%] right-[20%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-35 animate-pulse" 
        style={{
          background: 'radial-gradient(circle, rgba(233,185,73,0.5) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '6s'
        }} 
      />

      <div 
        className="absolute bottom-[-5%] left-[-5%] w-[550px] h-[550px] rounded-full blur-[140px] opacity-30 animate-pulse" 
        style={{
          background: 'radial-gradient(circle, rgba(231,111,81,0.4) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '9s'
        }} 
      />
    </div>
  )
}
