'use client'

import React, { useState, useEffect } from "react"
import { Check, Sparkles, Crown, ShieldCheck, CreditCard, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createRazorpayOrder, verifyRazorpayPayment } from "@/actions/subscription/razorpay"
import { saveSubscription, getStoredSubscription, SubscriptionData } from "@/lib/data-store"

interface PricingModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  userRole?: "student" | "teacher"
}

interface RazorpayResponse {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

export default function PricingModal({ open, onOpenChange, userRole = "student" }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "institution">("pro")
  const [subscription, setSubscription] = useState<SubscriptionData>({ plan: "free", status: "inactive" })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTestCheckoutModal, setShowTestCheckoutModal] = useState(false)
  const [pendingOrderData, setPendingOrderData] = useState<{ orderId: string; amount: number; plan: 'pro' | 'institution' } | null>(null)

  useEffect(() => {
    if (open) {
      setSubscription(getStoredSubscription())
    }
  }, [open])

  // Safe Razorpay script loading
  useEffect(() => {
    if (typeof window === "undefined") return
    const existingScript = document.getElementById("razorpay-checkout-script")
    if (!existingScript && !(window as unknown as { Razorpay?: unknown }).Razorpay) {
      try {
        const script = document.createElement("script")
        script.id = "razorpay-checkout-script"
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.body.appendChild(script)
      } catch {
        // Safe catch for environment restrictions
      }
    }
  }, [])

  const handleUpgrade = async (plan: 'pro' | 'institution') => {
    setIsProcessing(true)
    const amount = plan === "institution" ? 99 : (userRole === "teacher" ? 29 : 9)
    const toastId = toast.loading("Initializing Razorpay Test Order...")

    try {
      const res = await createRazorpayOrder(plan, amount)
      if (!res || !res.success || !res.orderId) {
        toast.error("Failed to initialize order", { id: toastId })
        setIsProcessing(false)
        return
      }

      const orderId = res.orderId
      const amountPaise = res.amount || amount * 100
      const keyId = res.keyId || "rzp_test_aulyn2026"

      const windowRazorpay = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay

      if (typeof windowRazorpay === "function") {
        try {
          const options = {
            key: keyId,
            amount: amountPaise,
            currency: "INR",
            name: "AULYN Learning Platform",
            description: `Upgrade to AULYN ${plan.toUpperCase()} Plan`,
            order_id: orderId,
            handler: async function (response: RazorpayResponse) {
              const verifyRes = await verifyRazorpayPayment(
                response.razorpay_order_id || orderId,
                response.razorpay_payment_id || `pay_${Date.now()}`,
                response.razorpay_signature || "test_signature",
                plan
              )

              if (verifyRes && verifyRes.success && verifyRes.subscription) {
                saveSubscription(verifyRes.subscription)
                setSubscription(verifyRes.subscription)
                toast.success(`Payment Verified! Pro Features Unlocked.`, { id: toastId })
                if (onOpenChange) onOpenChange(false)
              } else {
                toast.error("Payment verification failed", { id: toastId })
              }
            },
            prefill: {
              name: userRole === "teacher" ? "Prof. Sarah Jenkins" : "Alex Rivera",
              email: userRole === "teacher" ? "sarah.jenkins@aulyn.edu" : "alex.rivera@aulyn.edu"
            },
            theme: { color: "#E76F51" }
          }

          const rzp = new windowRazorpay(options)
          rzp.open()
          toast.dismiss(toastId)
          setIsProcessing(false)
          return
        } catch {
          // If Razorpay SDK initialization fails, trigger seamless Test Simulation fallback
        }
      }

      // Fallback to Razorpay Test Checkout Simulation Dialog
      toast.dismiss(toastId)
      setPendingOrderData({ orderId, amount, plan })
      setShowTestCheckoutModal(true)
    } catch {
      toast.error("Checkout process interrupted", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSimulatePaymentCompletion = async () => {
    if (!pendingOrderData) return
    setIsProcessing(true)
    const toastId = toast.loading("Verifying Test Payment Signature...")

    try {
      const mockPaymentId = `pay_sim_${Date.now()}`
      const verifyRes = await verifyRazorpayPayment(
        pendingOrderData.orderId,
        mockPaymentId,
        "sig_valid_test",
        pendingOrderData.plan
      )

      if (verifyRes && verifyRes.success && verifyRes.subscription) {
        saveSubscription(verifyRes.subscription)
        setSubscription(verifyRes.subscription)
        toast.success(`Test Payment Verified! AULYN ${pendingOrderData.plan.toUpperCase()} Unlocked.`, { id: toastId })
        setShowTestCheckoutModal(false)
        setPendingOrderData(null)
        if (onOpenChange) onOpenChange(false)
      } else {
        toast.error("Payment verification failed", { id: toastId })
      }
    } catch {
      toast.error("Verification error occurred", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
          <DialogHeader className="text-center space-y-2 border-b border-[#E5DCD0] pb-3">
            <div className="mx-auto w-10 h-10 bg-[#E76F51]/10 border border-[#E76F51]/30 rounded-xl flex items-center justify-center text-[#E76F51]">
              <Crown className="w-5 h-5" />
            </div>
            <DialogTitle className="text-2xl font-serif font-bold text-[#292724]">
              Upgrade to AULYN Pro
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77716A] max-w-md mx-auto">
              Unlock Multimodal Vision AI Tutor, Unlimited Flashcard Decks, and Advanced Analytics for {userRole === "teacher" ? "Teachers" : "Students"}.
            </DialogDescription>

            {subscription.status === "active" && (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#75B798] bg-[#75B798]/10 border border-[#75B798]/30 px-3 py-1 rounded-full mx-auto">
                <ShieldCheck className="w-4 h-4" /> Active Subscription: {subscription.plan.toUpperCase()} Plan
              </div>
            )}
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
                  {subscription.plan === "free" ? "Current Plan" : "Select Free"}
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
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> Multimodal Vision AI Tutor</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> Interactive Timed Mock Tests</li>
                  <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> 3D Flashcard Deck Generator</li>
                  {userRole === "teacher" && (
                    <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> Class Mastery Analytics</li>
                  )}
                </ul>
                <Button
                  disabled={isProcessing}
                  onClick={() => handleUpgrade("pro")}
                  className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold shadow-2xs rounded-xl"
                >
                  {isProcessing ? "Processing..." : "Upgrade via Razorpay"}
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
                <Button
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleUpgrade("institution")}
                  className="w-full text-xs border-[#E5DCD0] text-[#8B7EC8] hover:bg-[#F1E8DD] rounded-xl"
                >
                  Razorpay Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Razorpay Test Mode Checkout Simulation Dialog */}
      <Dialog open={showTestCheckoutModal} onOpenChange={setShowTestCheckoutModal}>
        <DialogContent className="sm:max-w-md bg-white border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E5DCD0] pb-3 text-center">
            <div className="w-10 h-10 bg-[#E76F51]/10 text-[#E76F51] rounded-xl flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#292724]">
              Razorpay Test Mode Checkout
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77716A]">
              Simulating secure payment verification for Order ID: <span className="font-mono text-[#E76F51]">{pendingOrderData?.orderId}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="p-3.5 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>Plan:</span>
                <span className="uppercase text-[#E76F51]">{pendingOrderData?.plan} Plan</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Amount:</span>
                <span className="font-mono">${pendingOrderData?.amount} USD</span>
              </div>
              <div className="flex justify-between text-[#77716A] text-[11px]">
                <span>Gateway Status:</span>
                <span className="text-[#75B798] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Test Sandbox Active
                </span>
              </div>
            </div>

            <Button
              onClick={handleSimulatePaymentCompletion}
              disabled={isProcessing}
              className="w-full bg-[#75B798] hover:bg-[#63a284] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs"
            >
              {isProcessing ? "Verifying Payment..." : "Complete Test Payment & Activate Pro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
