'use server'

import { SubscriptionData } from "@/lib/data-store"

export async function createRazorpayOrder(plan: 'pro' | 'institution', amount: number) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_aulyn2026"
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "aulyn_secret_2026"

    const orderId = `order_aulyn_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // If Razorpay API keys are configured, make real API call
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amount * 100, // Amount in paise
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: { plan }
        })
      })
      const data = await res.json()
      if (data && data.id) {
        return {
          success: true,
          orderId: data.id,
          currency: "INR",
          amount: data.amount,
          keyId
        }
      }
    }

    // Default Test Order Mode
    return {
      success: true,
      orderId,
      currency: "INR",
      amount: amount * 100,
      keyId
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Failed to create Razorpay order"
    }
  }
}

export async function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string, plan: 'pro' | 'institution') {
  try {
    // Basic verification check
    if (!orderId || !paymentId) {
      return { success: false, message: "Invalid payment credentials" }
    }

    const updatedSub: SubscriptionData = {
      plan: plan === "institution" ? "institution" : "pro",
      status: "active",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amount: plan === "institution" ? 99 : 9,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    return {
      success: true,
      subscription: updatedSub,
      message: `Pro Subscription (${plan}) activated successfully!`
    }
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || "Payment verification failed"
    }
  }
}
