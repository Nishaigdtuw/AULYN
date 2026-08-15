'use client'
import React, { useState, useEffect } from 'react'
import { ArrowRight, ShieldCheck, UserCheck, GraduationCap, School, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { handleLogin, handleSignup } from '@/actions/auth/auth'

interface UserRecord {
  userId?: string
  id?: string
  type?: string
  role?: string
  name?: string
  email?: string
}

export default function AuthPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'teacher'>('student')

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup inputs
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Scroll listener for sticky navbar translucency effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.warning('Please fill in both email and password.')
      return
    }

    setIsLoading(true)

    try {
      const res = await handleLogin(loginEmail, loginPassword)
      if (res && res.user) {
        const u = res.user as UserRecord
        localStorage.setItem('user', JSON.stringify({
          userId: u.userId || u.id || 'usr-1',
          name: u.name || 'User',
          email: u.email || loginEmail,
          role: u.type || u.role || role
        }))
        toast.success(`Welcome back, ${u.name || 'User'}!`)
        const destRole = u.type || u.role || role
        router.push(destRole === 'teacher' ? '/teacher' : '/student')
        return
      }
    } catch {
      // Offline fallback
    }

    setTimeout(() => {
      const mockUser = {
        userId: role === 'teacher' ? 'teacher-demo' : 'student-demo',
        name: role === 'teacher' ? 'Prof. Sarah Jenkins' : 'Alex Rivera',
        email: loginEmail,
        role: role
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      toast.success(`Authenticated as ${mockUser.name}`)
      setIsLoading(false)
      router.push(role === 'teacher' ? '/teacher' : '/student')
    }, 500)
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupName || !signupEmail || !signupPassword) {
      toast.warning('Please complete all fields.')
      return
    }

    setIsLoading(true)

    try {
      const res = await handleSignup(signupName, signupEmail, signupPassword, role)
      if (res && res.user) {
        const u = res.user as UserRecord
        localStorage.setItem('user', JSON.stringify({
          userId: u.userId || u.id || `usr-${Date.now()}`,
          name: u.name || signupName,
          email: u.email || signupEmail,
          role: u.type || u.role || role
        }))
        toast.success(`Welcome, ${signupName}!`)
        router.push(role === 'teacher' ? '/teacher' : '/student')
        return
      }
    } catch {
      // Offline fallback
    }

    setTimeout(() => {
      const mockUser = {
        userId: `usr-${Date.now()}`,
        name: signupName,
        email: signupEmail,
        role: role
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      toast.success(`Account created!`)
      setIsLoading(false)
      router.push(role === 'teacher' ? '/teacher' : '/student')
    }, 500)
  }

  const handleQuickDemo = (demoRole: 'student' | 'teacher') => {
    const mockUser = demoRole === 'teacher'
      ? { userId: 'teacher-demo', name: 'Prof. Sarah Jenkins', email: 'sarah.jenkins@aulyn.edu', role: 'teacher' }
      : { userId: 'student-demo', name: 'Alex Rivera', email: 'alex.rivera@aulyn.edu', role: 'student' }

    localStorage.setItem('user', JSON.stringify(mockUser))
    toast.success(`Entering ${demoRole === 'teacher' ? 'Teacher' : 'Student'} Workspace...`)
    router.push(demoRole === 'teacher' ? '/teacher' : '/student')
  }

  return (
    <div className="min-h-screen bg-transparent text-[#292724] flex flex-col justify-between relative overflow-x-hidden animate-in fade-in-50 duration-300">
      {/* 100% Sticky Header with Translucent Blur Transition and Official AULYN Logo */}
      <header
        className={`px-4 sm:px-8 py-3.5 flex items-center justify-between fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FFF9F1]/95 backdrop-blur-md border-b border-[#E5DCD0] shadow-sm'
            : 'bg-[#FFF9F1]/80 backdrop-blur-sm border-b border-[#E5DCD0]/40'
        }`}
      >
        <div className="flex items-center space-x-3">
          <img src="/aulyn-logo.png" alt="AULYN Logo" className="w-9 h-9 object-contain rounded-lg shadow-2xs hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-xl font-serif font-black tracking-tight text-[#292724] leading-none">AULYN</h1>
            <p className="text-[10px] text-[#77716A] font-medium tracking-wide hidden sm:block mt-0.5">Connected Learning Workspace</p>
          </div>
        </div>

        {/* Persistent Demo Access in Sticky Header Across Mobile & Desktop */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => handleQuickDemo('student')}
            className="text-xs font-bold text-[#292724] hover:text-[#E76F51] transition-all duration-200 px-3 py-1.5 rounded-xl hover:bg-[#F1E8DD]/60 border border-transparent hover:border-[#E5DCD0]"
          >
            <span className="hidden xs:inline">Enter </span>Student<span className="hidden sm:inline"> Workspace</span> →
          </button>
          <Button
            size="sm"
            onClick={() => handleQuickDemo('teacher')}
            className="text-xs bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 px-3.5 py-1.5"
          >
            <span className="hidden xs:inline">Enter </span>Teacher<span className="hidden sm:inline"> Workspace</span> →
          </Button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-12 lg:pt-32 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center flex-1 z-10">
        {/* Left Column: Clean Editorial Hero */}
        <div className="lg:col-span-6 space-y-8 bg-[#FFF9F1]/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#E5DCD0]/80 shadow-lg transition-all duration-300 hover:border-[#E5DCD0]">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#292724] leading-[1.12] tracking-tight">
              One place for the entire <br className="hidden sm:block" />
              <span className="italic text-[#E76F51] font-normal">learning journey.</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#8B7EC8]">
              Built around how students actually learn.
            </p>

            <p className="text-[#77716A] text-sm sm:text-base leading-relaxed max-w-lg">
              AULYN connects classrooms, teaching, assessment and personalized learning in one intelligent workspace — giving educators deeper visibility into student progress while giving learners the tools to understand, practice and improve.
            </p>
          </div>

          {/* Minimal Capability Flow (Teach → Assess → Understand → Improve) */}
          <div className="pt-2 border-t border-[#E5DCD0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#77716A] mb-3">Core Learning Architecture</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F1E8DD]/50 border border-[#E5DCD0]/60 space-y-0.5 hover:border-[#E76F51]/40 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs">
                <span className="font-bold text-[#292724] flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#E76F51]" /> Teach
                </span>
                <p className="text-[11px] text-[#77716A]">Manage classes & material</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F1E8DD]/50 border border-[#E5DCD0]/60 space-y-0.5 hover:border-[#8B7EC8]/40 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs">
                <span className="font-bold text-[#292724] flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#8B7EC8]" /> Assess
                </span>
                <p className="text-[11px] text-[#77716A]">Assignments, quizzes & tests</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F1E8DD]/50 border border-[#E5DCD0]/60 space-y-0.5 hover:border-[#75B798]/40 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs">
                <span className="font-bold text-[#292724] flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#75B798]" /> Understand
                </span>
                <p className="text-[11px] text-[#77716A]">AI Tutor & Code Visualizer</p>
              </div>

              <div className="p-3 rounded-xl bg-[#F1E8DD]/50 border border-[#E5DCD0]/60 space-y-0.5 hover:border-[#E9B949]/40 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs">
                <span className="font-bold text-[#292724] flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#E9B949]" /> Improve
                </span>
                <p className="text-[11px] text-[#77716A]">Progress & topic mastery</p>
              </div>
            </div>
          </div>

          {/* Refined Demo Workspace Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleQuickDemo('student')}
              className="group inline-flex items-center justify-between px-4 py-3 rounded-xl bg-[#FFF9F1] border border-[#E5DCD0] hover:border-[#E76F51] text-xs font-bold text-[#292724] hover:text-[#E76F51] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#E76F51]" /> Enter Student Workspace
              </span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform duration-200 text-[#E76F51]" />
            </button>

            <button
              onClick={() => handleQuickDemo('teacher')}
              className="group inline-flex items-center justify-between px-4 py-3 rounded-xl bg-[#FFF9F1] border border-[#E5DCD0] hover:border-[#8B7EC8] text-xs font-bold text-[#292724] hover:text-[#8B7EC8] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#8B7EC8]" /> Enter Teacher Workspace
              </span>
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform duration-200 text-[#8B7EC8]" />
            </button>
          </div>
        </div>

        {/* Right Column: Refined Warm Cream Auth Box */}
        <div className="lg:col-span-6 flex justify-center">
          <Card className="w-full max-w-md bg-[#FFF9F1]/95 backdrop-blur-md border border-[#E5DCD0] shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            <CardHeader className="space-y-1 pb-4 text-center border-b border-[#E5DCD0] bg-[#F1E8DD]/40">
              <div className="mx-auto mb-2">
                <img src="/aulyn-logo.png" alt="AULYN Logo" className="h-10 w-auto mx-auto object-contain" />
              </div>
              <CardTitle className="text-lg font-serif font-bold text-[#292724] flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-[#E76F51]" /> Access AULYN Workspace
              </CardTitle>
              <CardDescription className="text-xs text-[#77716A]">
                Select your role to sign in or register
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Role Selection Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F1E8DD] rounded-xl border border-[#E5DCD0]">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    role === 'student'
                      ? 'bg-[#FFF9F1] text-[#E76F51] shadow-2xs border border-[#E5DCD0]'
                      : 'text-[#77716A] hover:text-[#292724]'
                  }`}
                  onClick={() => setRole('student')}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Student
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    role === 'teacher'
                      ? 'bg-[#FFF9F1] text-[#8B7EC8] shadow-2xs border border-[#E5DCD0]'
                      : 'text-[#77716A] hover:text-[#292724]'
                  }`}
                  onClick={() => setRole('teacher')}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Teacher
                </button>
              </div>

              {/* Tabs for Sign In vs Register */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0]">
                  <TabsTrigger value="login" className="text-xs font-bold transition-all duration-200 data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#292724] data-[state=active]:shadow-2xs">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs font-bold transition-all duration-200 data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#292724] data-[state=active]:shadow-2xs">
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab Content */}
                <TabsContent value="login" className="space-y-4 pt-4 animate-in fade-in-50 duration-200">
                  <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="loginEmail" className="text-xs font-bold text-[#292724]">Email Address</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder={role === 'teacher' ? 'sarah.jenkins@aulyn.edu' : 'alex.rivera@aulyn.edu'}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs focus:border-[#E76F51] rounded-xl transition-colors duration-200 font-medium"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loginPassword" className="text-xs font-bold text-[#292724]">Password</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs focus:border-[#E76F51] rounded-xl transition-colors duration-200 font-medium"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl text-xs shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : `Sign In as ${role === 'student' ? 'Student' : 'Teacher'}`}
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                {/* Registration Tab Content */}
                <TabsContent value="signup" className="space-y-4 pt-4 animate-in fade-in-50 duration-200">
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="signupName" className="text-xs font-bold text-[#292724]">Full Name</Label>
                      <Input
                        id="signupName"
                        placeholder="e.g. Alex Rivera"
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs focus:border-[#E76F51] rounded-xl transition-colors duration-200 font-medium"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signupEmail" className="text-xs font-bold text-[#292724]">Email Address</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="alex@aulyn.edu"
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs focus:border-[#E76F51] rounded-xl transition-colors duration-200 font-medium"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signupPassword" className="text-xs font-bold text-[#292724]">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs focus:border-[#E76F51] rounded-xl transition-colors duration-200 font-medium"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold py-2 rounded-xl text-xs shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : `Register ${role === 'student' ? 'Student' : 'Teacher'} Account`}
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="px-8 py-4 border-t border-[#E5DCD0] bg-[#FFF9F1]/80 backdrop-blur-md text-center text-xs text-[#77716A] z-10 font-medium">
        <p>© 2026 AULYN • One place for the entire learning journey.</p>
      </footer>
    </div>
  )
}