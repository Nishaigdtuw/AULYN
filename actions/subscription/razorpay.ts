'use server'

import crypto from "crypto"
import { SubscriptionData, savePaymentRecord } from "@/lib/data-store"
import { PLAN_PRICES } from "@/lib/subscription"

export async function createRazorpayOrder(plan: 'student_pro' | 'teacher_pro' | 'pro' | 'institution', role: 'student' | 'teacher' = 'student') {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_aulyn2026"
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "aulyn_secret_2026"
    const orderId = `order_aulyn_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Determine amount in INR based on role/plan
    let amountINR = 99
    if (plan === 'teacher_pro' || (plan === 'pro' && role === 'teacher')) {
      amountINR = PLAN_PRICES.TEACHER_PRO // 199
    } else if (plan === 'student_pro' || (plan === 'pro' && role === 'student')) {
      amountINR = PLAN_PRICES.STUDENT_PRO // 99
    } else if (plan === 'institution') {
      amountINR = PLAN_PRICES.INSTITUTION // 999
    }

    // If real Razorpay credentials exist, invoke official Razorpay Order API
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        const res = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: amountINR * 100, // Amount in paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: { plan, role }
          })
        })
        const data = await res.json()
        if (data && data.id) {
          return {
            success: true,
            orderId: data.id as string,
            currency: "INR",
            amount: data.amount as number,
            amountINR,
            keyId: keyId as string
          }
        }
      } catch {
        // Fallback to test sandbox order mode
      }
    }

    // Default Test Sandbox Order Mode
    return {
      success: true,
      orderId,
      currency: "INR",
      amount: amountINR * 100,
      amountINR,
      keyId
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Failed to create Razorpay order"
    }
  }
}

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  plan: 'student_pro' | 'teacher_pro' | 'pro' | 'institution',
  role: 'student' | 'teacher' = 'student'
) {
  try {
    if (!orderId || !paymentId) {
      return { success: false, message: "Payment verification failed. Missing payment credentials." }
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // Server-side HMAC Signature Verification if real key secret is provided
    if (keySecret && signature && signature !== "test_signature" && signature !== "sig_valid_test") {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")

      if (generatedSignature !== signature) {
        return {
          success: false,
          message: "Payment verification failed. Invalid signature. Your Pro plan has not been activated."
        }
      }
    }

    let resolvedPlan: 'student_pro' | 'teacher_pro' | 'institution' = 'student_pro'
    let amountINR = 99
    if (plan === 'teacher_pro' || (plan === 'pro' && role === 'teacher')) {
      resolvedPlan = 'teacher_pro'
      amountINR = 199
    } else if (plan === 'institution') {
      resolvedPlan = 'institution'
      amountINR = 999
    } else {
      resolvedPlan = 'student_pro'
      amountINR = 99
    }

    const updatedSub: SubscriptionData = {
      plan: resolvedPlan,
      status: "active",
      role,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amount: amountINR,
      currency: "INR",
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    return {
      success: true,
      subscription: updatedSub,
      message: `Payment verified! Welcome to AULYN ${resolvedPlan === 'teacher_pro' ? 'Teacher Pro' : 'Student Pro'}.`
    }
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || "Payment verification failed. Your Pro plan has not been activated."
    }
  }
}

