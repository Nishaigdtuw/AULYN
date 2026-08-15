'use client'
import React from 'react'
import Image from 'next/image'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* User's Aesthetic Study Desk Photo Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-study.jpg"
          alt="Aesthetic Study Desk Ambient Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transform scale-100 opacity-85 filter brightness-95 contrast-105"
        />
      </div>

      {/* Subtle Warm Amber Vignette for High UI Card Readability */}
      <div 
        className="absolute inset-0 z-1"
        style={{
          background: 'linear-gradient(180deg, rgba(244, 239, 231, 0.35) 0%, rgba(30, 26, 22, 0.20) 50%, rgba(244, 239, 231, 0.40) 100%)'
        }}
      />

      {/* Soft Ambient Warm Desk Lamp Glow Accent */}
      <div 
        className="absolute top-[-5%] right-[-5%] w-[650px] h-[650px] rounded-full blur-[150px] opacity-30 animate-pulse z-2" 
        style={{
          background: 'radial-gradient(circle, rgba(233,185,73,0.4) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '10s'
        }} 
      />

      <div 
        className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-25 animate-pulse z-2" 
        style={{
          background: 'radial-gradient(circle, rgba(231,111,81,0.35) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '12s'
        }} 
      />
    </div>
  )
}
