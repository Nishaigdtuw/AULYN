'use client'
import React from 'react'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Soft Warm Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#f0f4f9] to-[#f3f0fa] opacity-95" />

      {/* Textured Micro Grid & Dot Blueprint Layer */}
      <div 
        className="absolute inset-0 opacity-[0.04]" 
        style={{
          backgroundImage: `radial-gradient(#4f46e5 1.5px, transparent 1.5px), radial-gradient(#8b5cf6 1.5px, #faf8f5 1.5px)`,
          backgroundSize: `36px 36px`,
          backgroundPosition: `0 0, 18px 18px`
        }} 
      />

      {/* Ambient Pastel Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] bg-gradient-to-br from-indigo-200/50 to-purple-200/40 rounded-full blur-[130px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[650px] h-[650px] bg-gradient-to-tr from-amber-200/50 to-rose-200/40 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[35%] right-[8%] w-[450px] h-[450px] bg-gradient-to-bl from-teal-200/40 to-cyan-200/40 rounded-full blur-[110px]" />

      {/* SVG Connected Engineering Node & Circuit Network */}
      <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="engNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Engineering Circuit Paths */}
        <path d="M 80 120 Q 350 40 650 220 T 1200 120" fill="none" stroke="url(#engNodeGrad)" strokeWidth="2" strokeDasharray="6 6" />
        <path d="M 180 650 Q 550 420 850 680 T 1400 520" fill="none" stroke="url(#engNodeGrad)" strokeWidth="2" strokeDasharray="4 4" />

        {/* Node Connection Points */}
        <circle cx="80" cy="120" r="5" fill="#4f46e5" opacity="0.7" />
        <circle cx="650" cy="220" r="7" fill="#8b5cf6" opacity="0.6" />
        <circle cx="1200" cy="120" r="6" fill="#06b6d4" opacity="0.7" />
        <circle cx="550" cy="420" r="6" fill="#ec4899" opacity="0.6" />
        <circle cx="850" cy="680" r="7" fill="#10b981" opacity="0.7" />
      </svg>

      {/* Engineering Symbols, Formulas & CS Badges */}
      <div className="absolute inset-0 font-sans text-xs">
        {/* Engineering Item 1: CS & DSA */}
        <div className="absolute top-[14%] left-[6%] bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-indigo-200 shadow-md flex items-center space-x-2 text-indigo-800 font-bold animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
          <span className="font-mono text-xs">DSA & Algorithms</span>
        </div>

        {/* Engineering Item 2: Linear Algebra & Matrix Math */}
        <div className="absolute top-[28%] right-[10%] bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-purple-200 shadow-md text-purple-900 font-bold flex items-center space-x-2">
          <span className="text-purple-600 font-mono text-sm font-black">Ax = λx</span>
          <span>Linear Algebra</span>
        </div>

        {/* Engineering Item 3: Operating Systems / Systems */}
        <div className="absolute bottom-[22%] left-[10%] bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-200 shadow-md text-amber-900 font-bold flex items-center space-x-2">
          <span>⚙️ OS Kernel & Semaphore</span>
        </div>

        {/* Engineering Item 4: Time Complexity */}
        <div className="absolute bottom-[16%] right-[16%] bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-teal-200 shadow-md text-teal-900 font-bold font-mono animate-bounce" style={{ animationDuration: '7s' }}>
          O(N log N) • Gate & Placement Prep
        </div>
      </div>
    </div>
  )
}
