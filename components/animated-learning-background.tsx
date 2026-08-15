'use client'
import React from 'react'
import Image from 'next/image'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* User's Theme Background Image (Cozy Study Night Scene) */}
      <div className="absolute inset-0">
        <Image
          src="/bg-study.jpg"
          alt="Cozy Study Ambient Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transform scale-105 transition-transform duration-1000 opacity-25 filter blur-[2px]"
        />
      </div>

      {/* Warm Ivory Base Tint & Overlay Gradient for Perfect UI Legibility */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(244, 239, 231, 0.88) 0%, rgba(247, 241, 232, 0.82) 50%, rgba(241, 232, 221, 0.90) 100%)'
        }}
      />

      {/* Soft Lamp Glow Atmospheric Blobs (Matching Warm Lighting in Photo) */}
      <div 
        className="absolute top-[-5%] left-[-5%] w-[650px] h-[650px] rounded-full blur-[150px] opacity-40 animate-pulse" 
        style={{
          background: 'radial-gradient(circle, rgba(233,185,73,0.35) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '10s'
        }} 
      />

      <div 
        className="absolute top-[30%] right-[-8%] w-[700px] h-[700px] rounded-full blur-[160px] opacity-35 animate-pulse" 
        style={{
          background: 'radial-gradient(circle, rgba(231,111,81,0.3) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '12s'
        }} 
      />

      <div 
        className="absolute bottom-[-10%] left-[25%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-30" 
        style={{
          background: 'radial-gradient(circle, rgba(139,126,200,0.25) 0%, rgba(247,241,232,0) 70%)'
        }} 
      />

      {/* Fine Grid Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025]" 
        style={{
          backgroundImage: `linear-gradient(to right, #292724 1px, transparent 1px), linear-gradient(to bottom, #292724 1px, transparent 1px)`,
          backgroundSize: `64px 64px`
        }} 
      />
    </div>
  )
}
