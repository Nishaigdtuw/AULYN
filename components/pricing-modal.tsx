'use client'
import React, { useState } from "react"
import { Check, Sparkles, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface PricingModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  userRole?: "student" | "teacher"
}

export default function PricingModal({ open, onOpenChange, userRole = "student" }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "institution">("pro")

  const handleUpgrade = (planName: string) => {
    toast.success(`Upgraded to ${planName}! Unlimited AI & Pro Features unlocked.`)
    if (onOpenChange) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl studio-panel border-slate-200 text-slate-800 rounded-3xl shadow-2xl bg-white/95">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
            <Crown className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">
            Upgrade to EduMeet.Ai Pro
          </DialogTitle>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Unlock Code Trace Visualizer, Unlimited AI Notes Summarizer, and Advanced Analytics for {userRole === "teacher" ? "Teachers" : "Students"}.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {/* Free Tier */}
          <Card className={`studio-card border-slate-200 transition-all ${selectedPlan === "free" ? "border-slate-400 bg-slate-50" : ""}`}>
            <CardHeader className="p-4 pb-2 text-center">
              <CardTitle className="text-base text-slate-700 font-bold">Free Tier</CardTitle>
              <div className="text-2xl font-black text-slate-900 mt-1">$0 <span className="text-xs font-normal text-slate-500">/mo</span></div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> 5 AI Queries / Day</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Classroom Access</li>
                <li className="flex items-center text-slate-400"><Check className="w-3.5 h-3.5 mr-1.5 text-slate-300" /> Limited Code Trace</li>
              </ul>
              <Button variant="outline" className="w-full text-xs border-slate-200 text-slate-600" onClick={() => setSelectedPlan("free")}>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier (Recommended) */}
          <Card className="studio-card border-2 border-indigo-500 bg-indigo-50/60 relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] uppercase font-extrabold px-3 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <CardHeader className="p-4 pb-2 text-center">
              <CardTitle className="text-base text-indigo-700 flex items-center justify-center gap-1 font-extrabold">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Pro {userRole === "teacher" ? "Teacher" : "Student"}
              </CardTitle>
              <div className="text-2xl font-black text-indigo-950 mt-1">
                {userRole === "teacher" ? "$29" : "$9"} <span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <ul className="space-y-2 text-slate-800 font-semibold">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Unlimited AI Queries</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Code Trace Visualizer</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> AI Notes & Flashcard Generator</li>
                {userRole === "teacher" && (
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Advanced Analytics Dashboard</li>
                )}
              </ul>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md" onClick={() => handleUpgrade(`Pro ${userRole === "teacher" ? "Teacher" : "Student"}`)}>
                Upgrade Now
              </Button>
            </CardContent>
          </Card>

          {/* Institution Tier */}
          <Card className={`studio-card border-slate-200 transition-all ${selectedPlan === "institution" ? "border-purple-400 bg-purple-50" : ""}`}>
            <CardHeader className="p-4 pb-2 text-center">
              <CardTitle className="text-base text-purple-800 font-bold">Institution</CardTitle>
              <div className="text-2xl font-black text-purple-950 mt-1">$99 <span className="text-xs font-normal text-slate-500">/mo</span></div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Unlimited Teachers & Students</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Custom Domain & LMS Integration</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Dedicated Support</li>
              </ul>
              <Button variant="outline" className="w-full text-xs border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => handleUpgrade("Institution Plan")}>
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
