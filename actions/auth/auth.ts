'use server'

import { prisma } from "@/lib/prisma"

export async function loginUser(email: string, password: string, type: string) {
  try {
    if (!process.env.DATABASE_URL) {
      return { error: "DATABASE_URL_NOT_CONFIGURED", message: "Database URL is not configured." }
    }
    const cleanEmail = email.trim().toLowerCase()
    const cleanType = type.trim().toLowerCase()

    let user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
        password: password,
        type: { equals: cleanType, mode: 'insensitive' }
      }
    })

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: 'insensitive' },
          password: password,
        }
      })
    }

    if (!user) {
      return { error: "INVALID_CREDENTIALS", message: "User not found with these credentials." }
    }

    return { success: true, user }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database error"
    console.error("loginUser error:", errorMsg)
    return { error: "DB_ERROR", message: errorMsg }
  }
}

export async function registerUser(name: string, email: string, password: string, type: string) {
  try {
    if (!process.env.DATABASE_URL) {
      return { error: "DATABASE_URL_NOT_CONFIGURED", message: "Database URL is not configured." }
    }
    const cleanEmail = email.trim().toLowerCase()
    const cleanType = type.trim().toLowerCase()

    const existing = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    })

    if (existing) {
      return { error: "USER_EXISTS", message: "User with this email already exists." }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password,
        type: cleanType
      }
    })

    return { success: true, user }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database error"
    console.error("registerUser error:", errorMsg)
    return { error: "DB_ERROR", message: errorMsg }
  }
}