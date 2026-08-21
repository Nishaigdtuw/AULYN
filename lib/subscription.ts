export type PlanType = 'FREE' | 'STUDENT_PRO' | 'TEACHER_PRO' | 'INSTITUTION'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING'

export interface UserSubscription {
  plan: PlanType
  status: SubscriptionStatus
  role: 'student' | 'teacher'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  subscriptionStartedAt?: string
  subscriptionExpiresAt?: string
  amount?: number
  currency?: string
}

export interface PaymentRecord {
  id: string
  userId: string
  role: 'student' | 'teacher'
  plan: PlanType
  amount: number
  currency: 'INR'
  razorpayOrderId: string
  razorpayPaymentId?: string
  status: 'CREATED' | 'PAID' | 'FAILED'
  createdAt: string
  verifiedAt?: string
}

export type FeatureKey =
  | 'notes_ai_unlimited'
  | 'multi_doc_assistant'
  | 'ai_viva_higher_usage'
  | 'adaptive_practice_deep'
  | 'code_visualizer_pro_explanations'
  | 'learning_insights'
  | 'study_pack_export'
  | 'teacher_classroom_analytics'
  | 'teacher_ai_assignment_gen'
  | 'teacher_ai_quiz_gen'
  | 'teacher_lecture_intelligence'
  | 'teacher_student_insights'
  | 'teacher_exportable_reports'

export const PLAN_PRICES = {
  STUDENT_PRO: 99, // ₹99 / month
  TEACHER_PRO: 199, // ₹199 / month
  INSTITUTION: 999
}

import type { SubscriptionData } from '@/lib/data-store'

export function isPro(sub?: UserSubscription | SubscriptionData | null): boolean {
  if (!sub) return false
  const p = (sub.plan || '').toString().toLowerCase()
  const s = (sub.status || '').toString().toLowerCase()
  return (p === 'student_pro' || p === 'teacher_pro' || p === 'pro' || p === 'institution') && s === 'active'
}


export function getFeatureLimit(feature: FeatureKey, isProUser: boolean): { limit: number | 'unlimited'; isProOnly: boolean } {
  switch (feature) {
    case 'notes_ai_unlimited':
      return { limit: isProUser ? 'unlimited' : 5, isProOnly: false }
    case 'multi_doc_assistant':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'ai_viva_higher_usage':
      return { limit: isProUser ? 'unlimited' : 2, isProOnly: false }
    case 'adaptive_practice_deep':
      return { limit: isProUser ? 'unlimited' : 3, isProOnly: false }
    case 'code_visualizer_pro_explanations':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'learning_insights':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'study_pack_export':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'teacher_classroom_analytics':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'teacher_ai_assignment_gen':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'teacher_ai_quiz_gen':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'teacher_lecture_intelligence':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'teacher_student_insights':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    case 'teacher_exportable_reports':
      return { limit: isProUser ? 'unlimited' : 0, isProOnly: true }
    default:
      return { limit: 'unlimited', isProOnly: false }
  }
}

export function canUseFeature(feature: FeatureKey, sub?: UserSubscription | null, currentUsage: number = 0): { allowed: boolean; reason?: string } {
  const isProUser = isPro(sub)
  const { limit, isProOnly } = getFeatureLimit(feature, isProUser)

  if (isProUser) return { allowed: true }

  if (isProOnly) {
    return {
      allowed: false,
      reason: `This is an AULYN Pro capability. Upgrade to unlock unlimited access.`
    }
  }

  if (limit !== 'unlimited' && currentUsage >= limit) {
    return {
      allowed: false,
      reason: `You have reached your daily free limit (${limit}/${limit}). Upgrade to AULYN Pro for unlimited usage.`
    }
  }

  return { allowed: true }
}
