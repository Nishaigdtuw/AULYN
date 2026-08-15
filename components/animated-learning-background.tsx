'use client'
import React from 'react'
import Image from 'next/image'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* High-Resolution Study Night Photo Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-study.jpg"
          alt="Cozy Study Ambient Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transform scale-100 opacity-80 filter brightness-95 contrast-105"
        />
      </div>

      {/* Subtle Warm Atmospheric Lighting Overlay */}
      <div 
        className="absolute inset-0 z-1"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 26, 22, 0.45) 0%, rgba(244, 239, 231, 0.25) 50%, rgba(30, 26, 22, 0.55) 100%)'
        }}
      />

      {/* Soft Ambient Desk Lamp Glow Accent */}
      <div 
        className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-35 animate-pulse z-2" 
        style={{
          background: 'radial-gradient(circle, rgba(245, 195, 95, 0.4) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '8s'
        }} 
      />

      {/* City Sky Glow Accent */}
      <div 
        className="absolute top-[0%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 animate-pulse z-2" 
        style={{
          background: 'radial-gradient(circle, rgba(231, 111, 81, 0.3) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '10s'
        }} 
      />
    </div>
  )
}
