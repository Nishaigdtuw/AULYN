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
      <DialogContent className="sm:max-w-3xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 bg-[#E76F51]/10 border border-[#E76F51]/30 rounded-xl flex items-center justify-center text-[#E76F51]">
            <Crown className="w-5 h-5" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-[#292724]">
            Upgrade to AULYN Pro
          </DialogTitle>
          <p className="text-xs text-[#77716A] max-w-md mx-auto">
            Unlock 3-Panel Code Trace IDE, Unlimited AI Notes Summarization, and Class Mastery Analytics for {userRole === "teacher" ? "Teachers" : "Students"}.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {/* Free Tier */}
          <Card className={`bg-white border-[#E5DCD0] transition-all rounded-xl ${selectedPlan === "free" ? "border-slate-400 bg-slate-50" : ""}`}>
            <CardHeader className="p-4 pb-2 text-center">
              <CardTitle className="text-sm text-[#77716A] font-bold">Free Tier</CardTitle>
              <div className="text-2xl font-bold text-[#292724] mt-1">$0 <span className="text-xs font-normal text-[#77716A]">/mo</span></div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <ul className="space-y-2 text-[#77716A]">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#75B798]" /> 5 AI Queries / Day</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#75B798]" /> Classroom Access</li>
                <li className="flex items-center text-slate-300"><Check className="w-3.5 h-3.5 mr-1.5 text-slate-300" /> Limited Code Trace</li>
              </ul>
              <Button variant="outline" className="w-full text-xs border-[#E5DCD0] text-[#77716A] rounded-xl" onClick={() => setSelectedPlan("free")}>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier (Recommended) */}
          <Card className="bg-[#FFF9F1] border-2 border-[#E76F51] relative shadow-md rounded-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E76F51] text-white text-[10px] uppercase font-bold px-3 py-0.5 rounded-full shadow-xs">
              Most Popular
            </div>
            <CardHeader className="p-4 pb-2 text-center">
              <CardTitle className="text-sm text-[#E76F51] flex items-center justify-center gap-1 font-bold">
                <Sparkles className="w-4 h-4 text-[#E76F51]" /> Pro {userRole === "teacher" ? "Teacher" : "Student"}
              </CardTitle>
              <div className="text-2xl font-bold text-[#292724] mt-1">
                {userRole === "teacher" ? "$29" : "$9"} <span className="text-xs font-normal text-[#77716A]">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <ul className="space-y-2 text-[#292724] font-semibold">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> Unlimited AI Queries</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> 3-Panel Code Trace IDE</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> AI Notes & Flashcard Generator</li>
                {userRole === "teacher" && (
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> Class Mastery Analytics</li>
                )}
              </ul>
              <Button className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold shadow-2xs rounded-xl" onClick={() => handleUpgrade(`Pro ${userRole === "teacher" ? "Teacher" : "Student"}`)}>
                Upgrade Now
              </Button>
            </CardContent>
          </Card>

          {/* Institution Tier */}
          <Card className={`bg-white border-[#E5DCD0] transition-all rounded-xl ${selectedPlan === "institution" ? "border-[#8B7EC8] bg-[#F1E8DD]/40" : ""}`}>
            <CardHeader className="p-4 pb-2 text-center">
              <CardTitle className="text-sm text-[#8B7EC8] font-bold">Institution</CardTitle>
              <div className="text-2xl font-bold text-[#292724] mt-1">$99 <span className="text-xs font-normal text-[#77716A]">/mo</span></div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <ul className="space-y-2 text-[#77716A]">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#8B7EC8]" /> Unlimited Teachers & Students</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#8B7EC8]" /> Custom Domain & LMS Integration</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#8B7EC8]" /> Dedicated Support</li>
              </ul>
              <Button variant="outline" className="w-full text-xs border-[#E5DCD0] text-[#8B7EC8] hover:bg-[#F1E8DD] rounded-xl" onClick={() => handleUpgrade("Institution Plan")}>
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
