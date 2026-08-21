'use client'

import React, { useState, useEffect } from "react"
import { Check, Sparkles, Crown, ShieldCheck, CreditCard, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"

import { toast } from "sonner"
import { createRazorpayOrder, verifyRazorpayPayment } from "@/actions/subscription/razorpay"
import { saveSubscription, getStoredSubscription, SubscriptionData, savePaymentRecord } from "@/lib/data-store"

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
  const [subscription, setSubscription] = useState<SubscriptionData>({ plan: "free", status: "inactive" })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTestCheckoutModal, setShowTestCheckoutModal] = useState(false)
  const [pendingOrderData, setPendingOrderData] = useState<{ orderId: string; amount: number; targetPlan: 'student_pro' | 'teacher_pro' | 'institution' } | null>(null)

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

  const targetPlan: 'student_pro' | 'teacher_pro' = userRole === "teacher" ? "teacher_pro" : "student_pro"
  const priceINR = userRole === "teacher" ? 199 : 99

  const handleUpgrade = async (plan: 'student_pro' | 'teacher_pro' | 'institution' = targetPlan) => {
    if (isProcessing) return
    setIsProcessing(true)
    const toastId = toast.loading("Preparing secure payment...")

    try {
      const res = await createRazorpayOrder(plan, userRole)
      if (!res || !res.success || !res.orderId) {
        toast.error("Failed to initialize Razorpay order", { id: toastId })
        setIsProcessing(false)
        return
      }

      const orderId = res.orderId
      const amountPaise = res.amount || (plan === "institution" ? 99900 : priceINR * 100)
      const keyId = res.keyId || "rzp_test_aulyn2026"

      const windowRazorpay = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay

      if (typeof windowRazorpay === "function") {
        try {
          const options = {
            key: keyId,
            amount: amountPaise,
            currency: "INR",
            name: "AULYN Learning Platform",
            description: `AULYN ${userRole === "teacher" ? "Teacher Pro" : "Student Pro"} Subscription`,
            order_id: orderId,
            handler: async function (response: RazorpayResponse) {
              const verifyRes = await verifyRazorpayPayment(
                response.razorpay_order_id || orderId,
                response.razorpay_payment_id || `pay_${Date.now()}`,
                response.razorpay_signature || "test_signature",
                plan,
                userRole
              )

              if (verifyRes && verifyRes.success && verifyRes.subscription) {
                saveSubscription(verifyRes.subscription)
                savePaymentRecord({
                  id: `pay_rec_${Date.now()}`,
                  userId: userRole === "teacher" ? "teacher-demo" : "student-demo",
                  role: userRole,
                  plan: verifyRes.subscription.plan,
                  amount: verifyRes.subscription.amount || priceINR,
                  currency: "INR",
                  razorpayOrderId: orderId,
                  razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                  status: "PAID",
                  createdAt: new Date().toISOString(),
                  verifiedAt: new Date().toISOString()
                })
                setSubscription(verifyRes.subscription)
                toast.success("Welcome to AULYN Pro! Your Pro features are now available.", { id: toastId })
                if (onOpenChange) onOpenChange(false)
              } else {
                toast.error(verifyRes?.message || "Payment verification failed. Your Pro plan has not been activated.", { id: toastId })
              }
            },
            modal: {
              ondismiss: function() {
                toast.dismiss(toastId)
                toast.info("Payment cancelled. Account remains on Free Tier.")
                setIsProcessing(false)
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
      setPendingOrderData({ orderId, amount: plan === "institution" ? 999 : priceINR, targetPlan: plan })
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
    const toastId = toast.loading("Verifying Payment Signature...")

    try {
      const mockPaymentId = `pay_sim_${Date.now()}`
      const verifyRes = await verifyRazorpayPayment(
        pendingOrderData.orderId,
        mockPaymentId,
        "sig_valid_test",
        pendingOrderData.targetPlan,
        userRole
      )

      if (verifyRes && verifyRes.success && verifyRes.subscription) {
        saveSubscription(verifyRes.subscription)
        savePaymentRecord({
          id: `pay_rec_${Date.now()}`,
          userId: userRole === "teacher" ? "teacher-demo" : "student-demo",
          role: userRole,
          plan: verifyRes.subscription.plan,
          amount: pendingOrderData.amount,
          currency: "INR",
          razorpayOrderId: pendingOrderData.orderId,
          razorpayPaymentId: mockPaymentId,
          status: "PAID",
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString()
        })
        setSubscription(verifyRes.subscription)
        toast.success("Welcome to AULYN Pro! Your Pro features are now available.", { id: toastId })
        setShowTestCheckoutModal(false)
        setPendingOrderData(null)
        if (onOpenChange) onOpenChange(false)
      } else {
        toast.error("Payment verification failed. Your Pro plan has not been activated.", { id: toastId })
      }
    } catch {
      toast.error("Verification error occurred", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const studentFeatures = [
    "Unlimited Personal Notes AI (Summary, Quiz, Practice, Q&A)",
    "Multi-document Ask My Notes (Cross-PDF Analysis)",
    "Higher AI Viva Usage (Grounded in course material)",
    "Advanced Adaptive Practice Sessions",
    "Advanced Code Visualizer Explanations (Execution reasons, state)",
    "Detailed Learning Insights & Concept Mastery",
    "AI Study Pack Export (Downloadable Markdown)"
  ]

  const teacherFeatures = [
    "Advanced Classroom Analytics & Performance Trends",
    "AI Assignment Generation (From course notes)",
    "AI Quiz Generation (From course notes)",
    "Lecture Intelligence (Structured summaries on class end)",
    "Advanced Student Insights (Weak area identification)",
    "Exportable Classroom Reports (CSV / JSON download)"
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
          <DialogHeader className="text-center space-y-2 border-b border-[#E5DCD0] pb-3">
            <div className="mx-auto w-12 h-12 bg-[#E76F51]/10 border border-[#E76F51]/30 rounded-2xl flex items-center justify-center text-[#E76F51] shadow-2xs">
              <Crown className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-serif font-black text-[#292724]">
              AULYN Pro
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77716A] font-semibold max-w-md mx-auto">
              More intelligence. Fewer limits.
            </DialogDescription>

            {subscription.status === "active" && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full mx-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Active: AULYN {userRole === "teacher" ? "Teacher Pro" : "Student Pro"} (Active)
              </div>
            )}
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            {/* Free Plan */}
            <Card className="bg-white border-[#E5DCD0] rounded-2xl p-5 space-y-4 shadow-2xs">
              <div>
                <span className="text-xs font-bold text-[#77716A] uppercase tracking-wider">Free Tier</span>
                <div className="text-2xl font-serif font-black text-[#292724] mt-1">₹0 <span className="text-xs font-sans font-normal text-[#77716A]">/month</span></div>
                <p className="text-[11px] text-[#77716A] mt-1">Essential learning & classroom features for everyday study.</p>
              </div>

              <ul className="space-y-2 text-xs text-[#77716A] font-medium">
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-2 text-[#75B798] shrink-0" /> Classroom joining & discussions</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-2 text-[#75B798] shrink-0" /> Course material viewing</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-2 text-[#75B798] shrink-0" /> PDF assignment submissions</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-2 text-[#75B798] shrink-0" /> Basic Live Classroom access</li>
                <li className="flex items-center"><Check className="w-3.5 h-3.5 mr-2 text-[#75B798] shrink-0" /> Normal Code Trace IDE</li>
              </ul>

              <Button variant="outline" disabled className="w-full text-xs border-[#E5DCD0] text-[#77716A] rounded-xl font-bold">
                {subscription.status === "active" ? "Included Free" : "Current Plan"}
              </Button>
            </Card>

            {/* Role-Specific Pro Plan */}
            <Card className="bg-[#FFF9F1] border-2 border-[#E76F51] rounded-2xl p-5 space-y-4 shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E76F51] text-white text-[10px] uppercase font-bold px-3.5 py-0.5 rounded-full shadow-2xs tracking-wide">
                RECOMMENDED
              </div>

              <div>
                <span className="text-xs font-bold text-[#E76F51] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AULYN {userRole === "teacher" ? "Teacher Pro" : "Student Pro"}
                </span>
                <div className="text-3xl font-serif font-black text-[#292724] mt-1">
                  ₹{priceINR} <span className="text-xs font-sans font-normal text-[#77716A]">/month</span>
                </div>
                <p className="text-[11px] text-[#77716A] mt-1">
                  {userRole === "teacher" ? "Time-saving AI generators & deep class analytics." : "Unlimited Notes AI, Multi-document assistant & deeper insights."}
                </p>
              </div>

              <ul className="space-y-2 text-xs text-[#292724] font-semibold">
                {(userRole === "teacher" ? teacherFeatures : studentFeatures).map((feat, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-3.5 h-3.5 mr-2 text-[#E76F51] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Button
                disabled={isProcessing}
                onClick={() => handleUpgrade(targetPlan)}
                className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold py-2.5 rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessing ? "Preparing secure payment..." : `Upgrade ${userRole === "teacher" ? "Teacher" : "Student"} Account (₹${priceINR})`}
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Razorpay Test Sandbox Checkout Dialog */}
      <Dialog open={showTestCheckoutModal} onOpenChange={setShowTestCheckoutModal}>
        <DialogContent className="sm:max-w-md bg-white border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E5DCD0] pb-3 text-center">
            <div className="w-10 h-10 bg-[#E76F51]/10 text-[#E76F51] rounded-xl flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#292724]">
              Razorpay Test Checkout
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77716A]">
              Simulating server-verified payment for Order ID: <span className="font-mono text-[#E76F51]">{pendingOrderData?.orderId}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="p-4 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>Selected Plan:</span>
                <span className="uppercase text-[#E76F51]">
                  AULYN {userRole === "teacher" ? "Teacher Pro" : "Student Pro"}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Amount:</span>
                <span className="font-mono text-[#292724]">₹{pendingOrderData?.amount} INR</span>
              </div>
              <div className="flex justify-between text-[#77716A] text-[11px] pt-1 border-t border-[#E5DCD0]">
                <span>Gateway Mode:</span>
                <span className="text-[#75B798] font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Razorpay Test Sandbox
                </span>
              </div>
            </div>

            <Button
              onClick={handleSimulatePaymentCompletion}
              disabled={isProcessing}
              className="w-full bg-[#75B798] hover:bg-[#63a284] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs cursor-pointer"
            >
              {isProcessing ? "Verifying Payment Signature..." : "Complete Razorpay Test Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

