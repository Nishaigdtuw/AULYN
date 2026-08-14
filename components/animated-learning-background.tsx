'use client'
import React from 'react'

export default function AnimatedLearningBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Soft Pastel Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#f0f4f9] to-[#f3f0fa] opacity-90" />

      {/* Floating Pastel Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/40 to-purple-200/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-amber-200/40 to-rose-200/30 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-gradient-to-bl from-teal-200/30 to-cyan-200/30 rounded-full blur-[100px]" />

      {/* SVG Connected Learning Nodes Network */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Connected Node Paths */}
        <path d="M 100 150 Q 300 50 600 200 T 1100 100" fill="none" stroke="url(#nodeGrad)" strokeWidth="1.5" strokeDasharray="6 6" />
        <path d="M 200 600 Q 500 400 800 650 T 1300 500" fill="none" stroke="url(#nodeGrad)" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Pulsing Node Circles */}
        <circle cx="100" cy="150" r="4" fill="#6366f1" opacity="0.6" />
        <circle cx="600" cy="200" r="6" fill="#a855f7" opacity="0.5" />
        <circle cx="1100" cy="100" r="5" fill="#3b82f6" opacity="0.6" />
        <circle cx="500" cy="400" r="5" fill="#ec4899" opacity="0.5" />
        <circle cx="800" cy="650" r="6" fill="#10b981" opacity="0.6" />
      </svg>

      {/* Floating Learning Symbols & Equations */}
      <div className="absolute inset-0 font-mono text-xs font-bold text-slate-400/40">
        {/* Floating Item 1 */}
        <div className="absolute top-[12%] left-[8%] bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-indigo-500/70 animate-bounce" style={{ animationDuration: '5s' }}>
          E = mc²
        </div>

        {/* Floating Item 2 */}
        <div className="absolute top-[25%] right-[12%] bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-purple-500/70 animate-pulse">
          O(N log N)
        </div>

        {/* Floating Item 3 */}
        <div className="absolute bottom-[20%] left-[15%] bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-teal-600/70">
          ∫ f(x) dx
        </div>

        {/* Floating Item 4 */}
        <div className="absolute bottom-[15%] right-[22%] bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-rose-500/70 animate-bounce" style={{ animationDuration: '6s' }}>
          &lt;Component /&gt;
        </div>

        {/* Floating Item 5 */}
        <div className="absolute top-[60%] left-[5%] bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-amber-600/70">
          ∑ i = n(n+1)/2
        </div>
      </div>
    </div>
  )
}
