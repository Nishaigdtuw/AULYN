'use client'

import React from "react"
import { Crown, Sparkles, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ProLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName?: string
  reason?: string
  userRole?: 'student' | 'teacher'
  onOpenPricing?: () => void
}

export function ProLimitDialog({
  open,
  onOpenChange,
  featureName = "AULYN Pro Capability",
  reason = "This is an AULYN Pro capability. Upgrade to unlock unlimited access.",
  userRole = "student",
  onOpenPricing
}: ProLimitDialogProps) {
  const priceLabel = userRole === "teacher" ? "₹199 / month" : "₹99 / month"
  const planTitle = userRole === "teacher" ? "Teacher Pro" : "Student Pro"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
        <DialogHeader className="text-center space-y-2 border-b border-[#E5DCD0] pb-3">
          <div className="mx-auto w-12 h-12 bg-[#E76F51]/10 border border-[#E76F51]/30 rounded-2xl flex items-center justify-center text-[#E76F51] shadow-2xs">
            <Crown className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724]">
            This is an AULYN Pro capability.
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A] max-w-sm mx-auto leading-relaxed">
            {featureName ? `"${featureName}" requires an active AULYN Pro subscription.` : reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="p-4 bg-white border border-[#E5DCD0] rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-[#E76F51]">
                <Sparkles className="w-4 h-4" /> AULYN {planTitle}
              </span>
              <span className="text-[#292724] font-serif font-bold text-sm">{priceLabel}</span>
            </div>
            <p className="text-[11px] text-[#77716A] leading-relaxed">
              Unlock unlimited AI capabilities, multi-document notes analysis, Pro code visualizer state tracking, and role-tailored productivity tools.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-1/2 text-xs border-[#E5DCD0] text-[#77716A] hover:bg-[#F1E8DD] font-bold rounded-xl h-9"
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false)
                if (onOpenPricing) onOpenPricing()
              }}
              className="w-full sm:w-1/2 bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl h-9 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              View AULYN Pro <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
