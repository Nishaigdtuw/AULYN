'use client'
import React, { useState } from "react"
import { Eye, EyeOff, LogIn, UserPlus, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loginUser, registerUser } from "@/actions/auth/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [userType, setUserType] = useState("student")
  const [isLoading, setIsLoading] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handleDemoLogin = (role: "student" | "teacher") => {
    setIsLoading(true)
    const demoUser = {
      userId: role === "student" ? "demo-student-id" : "demo-teacher-id",
      name: role === "student" ? "Demo Student" : "Demo Teacher",
      email: `${role}@edumeet.ai`,
      type: role
    }
    localStorage.setItem("user", JSON.stringify(demoUser))
    toast.success(`Welcome! Logged in as Demo ${role === "student" ? "Student" : "Teacher"}`)
    setTimeout(() => {
      router.replace(`/${role}`)
    }, 500)
  }

  async function handleLogin() {
    if (!email.trim()) {
      toast.warning("Please enter your email address")
      return
    }
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      toast.warning("Please enter a valid email address")
      return
    }
    if (password.length <= 3) {
      toast.warning("Please enter your password")
      return
    }

    setIsLoading(true)
    try {
      const res = await loginUser(cleanEmail, password, userType)

      if (res.error) {
        if (res.error === "INVALID_CREDENTIALS") {
          toast.error("Incorrect email, password, or account type.")
        } else if (res.error === "DATABASE_URL_NOT_CONFIGURED" || res.error === "DB_ERROR") {
          toast.info("Database not connected. Logging in using Demo Mode...")
          handleDemoLogin(userType as "student" | "teacher")
          return
        } else {
          toast.error(res.message || "Sign in failed")
        }
        setIsLoading(false)
        return
      }

      if (res.success && res.user) {
        toast.success("Successfully Logged In!")
        localStorage.setItem("user", JSON.stringify(res.user))
        router.replace(`/${userType}`)
      }
    } catch (err: unknown) {
      console.error("Login client error:", err)
      toast.info("Falling back to Demo Session...")
      handleDemoLogin(userType as "student" | "teacher")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignUp() {
    if (!name.trim()) {
      toast.warning("Please enter your full name")
      return
    }
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      toast.warning("Please enter a valid email address")
      return
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const res = await registerUser(name, cleanEmail, password, userType)

      if (res.error) {
        if (res.error === "USER_EXISTS") {
          toast.error("Account already exists with this email. Please Sign In instead.")
        } else if (res.error === "DATABASE_URL_NOT_CONFIGURED" || res.error === "DB_ERROR") {
          toast.info("Database not connected. Creating Demo Account...")
          handleDemoLogin(userType as "student" | "teacher")
          return
        } else {
          toast.error(res.message || "Registration failed")
        }
        setIsLoading(false)
        return
      }

      if (res.success && res.user) {
        toast.success("Account created successfully!")
        localStorage.setItem("user", JSON.stringify(res.user))
        router.replace(`/${userType}`)
      }
    } catch (err: unknown) {
      console.error("Signup error:", err)
      toast.info("Database error. Creating Demo Session...")
      handleDemoLogin(userType as "student" | "teacher")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-indigo-100">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <LogIn className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Welcome to Edubridge</CardTitle>
          <CardDescription className="text-gray-600">
            AI-Powered Classroom & Learning Assistant
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email Address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Select Role</Label>
                <RadioGroup value={userType} onValueChange={setUserType} className="flex justify-around bg-slate-50 p-2 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="signin-student" />
                    <Label htmlFor="signin-student" className="cursor-pointer font-medium">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="signin-teacher" />
                    <Label htmlFor="signin-teacher" className="cursor-pointer font-medium">Teacher</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all"
                disabled={isLoading}
                onClick={handleLogin}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...
                  </>
                ) : (
                  `Sign In as ${userType === "student" ? "Student" : "Teacher"}`
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Select Role</Label>
                <RadioGroup value={userType} onValueChange={setUserType} className="flex justify-around bg-slate-50 p-2 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="signup-student" />
                    <Label htmlFor="signup-student" className="cursor-pointer font-medium">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="signup-teacher" />
                    <Label htmlFor="signup-teacher" className="cursor-pointer font-medium">Teacher</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all"
                disabled={isLoading}
                onClick={handleSignUp}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...
                  </>
                ) : (
                  `Create ${userType === "student" ? "Student" : "Teacher"} Account`
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-medium">Or Quick Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-medium text-xs py-2"
              onClick={() => handleDemoLogin("student")}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Demo Student
            </Button>
            <Button
              variant="outline"
              className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 font-medium text-xs py-2"
              onClick={() => handleDemoLogin("teacher")}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Demo Teacher
            </Button>
          </div>
        </CardContent>

        <CardFooter className="justify-center border-t py-3 bg-slate-50/50 rounded-b-xl">
          <p className="text-xs text-gray-500">
            Powered by EduMeet.Ai & Next.js
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}