'use client'
import React from 'react'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Warm Ivory Base Backdrop */}
      <div className="absolute inset-0 bg-[#F4EFE7] opacity-100" />

      {/* Atmospheric Organic Soft Gradient Shapes (No floating objects) */}
      <div 
        className="absolute top-[-10%] left-[-8%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-40 animate-pulse" 
        style={{
          background: 'radial-gradient(circle, rgba(231,111,81,0.35) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '10s'
        }} 
      />

      <div 
        className="absolute top-[25%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[160px] opacity-35 animate-pulse" 
        style={{
          background: 'radial-gradient(circle, rgba(139,126,200,0.3) 0%, rgba(247,241,232,0) 70%)',
          animationDuration: '12s'
        }} 
      />

      <div 
        className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-30" 
        style={{
          background: 'radial-gradient(circle, rgba(117,183,152,0.3) 0%, rgba(247,241,232,0) 70%)'
        }} 
      />

      <div 
        className="absolute top-[60%] right-[30%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-25" 
        style={{
          background: 'radial-gradient(circle, rgba(233,185,73,0.25) 0%, rgba(247,241,232,0) 70%)'
        }} 
      />

      {/* Subtle Fine Noise / Texture Layer */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `linear-gradient(to right, #292724 1px, transparent 1px), linear-gradient(to bottom, #292724 1px, transparent 1px)`,
          backgroundSize: `64px 64px`
        }} 
      />
    </div>
  )
}
