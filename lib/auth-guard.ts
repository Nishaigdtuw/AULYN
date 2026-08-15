// AULYN Session & Auth Protection Guard

export interface AuthSessionUser {
  userId: string
  name: string
  email: string
  role: 'student' | 'teacher'
  createdAt?: string
}

const AUTH_USER_KEY = "user"

export function getAuthenticatedUser(): AuthSessionUser | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem(AUTH_USER_KEY)
  if (!userStr) return null
  try {
    const user = JSON.parse(userStr)
    if (user && (user.role || user.type)) {
      return {
        userId: user.userId || user.id || "usr-1",
        name: user.name || "User",
        email: user.email || "user@aulyn.edu",
        role: (user.role || user.type) === "teacher" ? "teacher" : "student"
      }
    }
    return null
  } catch {
    return null
  }
}

export function setAuthenticatedUser(user: AuthSessionUser) {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  document.cookie = `aulyn_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=2592000; SameSite=Lax`
}

export function clearAuthenticatedUser() {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_USER_KEY)
  document.cookie = "aulyn_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
}
