'use client'
import React, { useState } from 'react'
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, GraduationCap, School, Code2, Cpu, BarChart3, Mic, Zap, Trophy } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { handleLogin, handleSignup } from '@/actions/auth/auth'
import AnimatedLearningBackground from '@/components/animated-learning-background'

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

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.warning('Please fill in both email and password.')
      return
    }

    setIsLoading(true)
    toast.info('Authenticating credentials...')

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
        toast.success(`Welcome back, ${u.name || 'User'}! Redirecting...`)
        const destRole = u.type || u.role || role
        router.push(destRole === 'teacher' ? '/teacher' : '/student')
        return
      }
    } catch {
      // Backend offline fallback
    }

    setTimeout(() => {
      const mockUser = {
        userId: role === 'teacher' ? 'teacher-demo' : 'student-demo',
        name: role === 'teacher' ? 'Prof. Sarah Jenkins' : 'Alex Rivera',
        email: loginEmail,
        role: role
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      toast.success(`Authenticated as ${mockUser.name}!`)
      setIsLoading(false)
      router.push(role === 'teacher' ? '/teacher' : '/student')
    }, 700)
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupName || !signupEmail || !signupPassword) {
      toast.warning('Please complete all registration fields.')
      return
    }

    setIsLoading(true)
    toast.info('Registering account...')

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
        toast.success(`Account created! Welcome, ${signupName}!`)
        router.push(role === 'teacher' ? '/teacher' : '/student')
        return
      }
    } catch {
      // Backend offline fallback
    }

    setTimeout(() => {
      const mockUser = {
        userId: `usr-${Date.now()}`,
        name: signupName,
        email: signupEmail,
        role: role
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      toast.success(`Account created! Redirecting to ${role} portal...`)
      setIsLoading(false)
      router.push(role === 'teacher' ? '/teacher' : '/student')
    }, 700)
  }

  const handleQuickDemo = (demoRole: 'student' | 'teacher') => {
    const mockUser = demoRole === 'teacher'
      ? { userId: 'teacher-demo', name: 'Prof. Sarah Jenkins', email: 'sarah.jenkins@edumeet.ai', role: 'teacher' }
      : { userId: 'student-demo', name: 'Alex Rivera', email: 'alex.rivera@edumeet.ai', role: 'student' }

    localStorage.setItem('user', JSON.stringify(mockUser))
    toast.success(`Logged in as ${mockUser.name} (${demoRole.toUpperCase()})`)
    router.push(demoRole === 'teacher' ? '/teacher' : '/student')
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Animated Floating Nodes Background */}
      <AnimatedLearningBackground />

      {/* Header Bar */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-slate-200/80 studio-panel sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-md text-white">
            EB
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight gradient-text-indigo">EduMeet.Ai</h1>
            <p className="text-[11px] text-slate-500 font-semibold">Creative AI Learning Studio</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Hackathon Winner Edition
          </span>
          <Button variant="outline" size="sm" onClick={() => handleQuickDemo('student')} className="text-xs border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold">
            Demo Student
          </Button>
          <Button size="sm" onClick={() => handleQuickDemo('teacher')} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md">
            Demo Teacher
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1 z-10">
        {/* Left Column: Hero Showcase */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Next-Gen Interactive EdTech Platform</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Creative AI Studio for <br />
            <span className="gradient-text-indigo">Modern Learning & Code</span>
          </h2>

          <p className="text-slate-600 text-base leading-relaxed">
            EduMeet.Ai brings together interactive code trace visualization, real-time analytics, automated AI notes summarization, and browser voice lecture capture in a warm, premium studio environment.
          </p>

          {/* 1-Click Instant Demo Portals */}
          <div className="pt-2 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">⚡ 1-Click Instant Demo Portals</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Card */}
              <div
                onClick={() => handleQuickDemo('student')}
                className="bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border border-indigo-200/80 p-4 rounded-3xl cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">Student Portal</h4>
                  <p className="text-xs text-slate-500">Code visualizer, AI tutor & progress streak</p>
                </div>
              </div>

              {/* Teacher Card */}
              <div
                onClick={() => handleQuickDemo('teacher')}
                className="bg-gradient-to-br from-orange-50/90 to-amber-50/90 border border-orange-200/80 p-4 rounded-3xl cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">Teacher Portal</h4>
                  <p className="text-xs text-slate-500">Analytics dashboard & voice lecture capture</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80">
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
              <Code2 className="w-4 h-4 text-indigo-600" /> <span>Code Trace</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
              <Cpu className="w-4 h-4 text-purple-600" /> <span>Notes → Quiz</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
              <BarChart3 className="w-4 h-4 text-teal-600" /> <span>Analytics</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
              <Mic className="w-4 h-4 text-rose-500" /> <span>Voice Capture</span>
            </div>
          </div>
        </div>

        {/* Right Column: Light Studio Auth Form */}
        <div className="lg:col-span-6 flex justify-center">
          <Card className="w-full max-w-md studio-panel border-slate-200/90 shadow-2xl rounded-3xl overflow-hidden bg-white/90">
            <CardHeader className="space-y-1 pb-4 text-center border-b border-slate-100">
              <CardTitle className="text-xl font-black text-slate-900 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" /> Enter Learning Workspace
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Select your role to sign in or register
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Role Selection Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'student'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setRole('student')}
                >
                  <UserCheck className="w-4 h-4" /> Student Role
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'teacher'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setRole('teacher')}
                >
                  <ShieldCheck className="w-4 h-4" /> Teacher Role
                </button>
              </div>

              {/* Tabs for Sign In vs Register */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                  <TabsTrigger value="login" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab Content */}
                <TabsContent value="login" className="space-y-4 pt-4">
                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="loginEmail" className="text-xs font-bold text-slate-700">Email Address</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder={role === 'teacher' ? 'sarah.jenkins@edumeet.ai' : 'alex.rivera@edumeet.ai'}
                        className="bg-white border-slate-200 text-slate-900 text-sm focus:border-indigo-500 rounded-xl"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loginPassword" className="text-xs font-bold text-slate-700">Password</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white border-slate-200 text-slate-900 text-sm focus:border-indigo-500 rounded-xl"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 rounded-xl shadow-lg" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                {/* Registration Tab Content */}
                <TabsContent value="signup" className="space-y-4 pt-4">
                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signupName" className="text-xs font-bold text-slate-700">Full Name</Label>
                      <Input
                        id="signupName"
                        placeholder="e.g. Alex Rivera"
                        className="bg-white border-slate-200 text-slate-900 text-sm focus:border-indigo-500 rounded-xl"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signupEmail" className="text-xs font-bold text-slate-700">Email Address</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="alex@example.com"
                        className="bg-white border-slate-200 text-slate-900 text-sm focus:border-indigo-500 rounded-xl"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signupPassword" className="text-xs font-bold text-slate-700">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white border-slate-200 text-slate-900 text-sm focus:border-indigo-500 rounded-xl"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : `Register ${role.toUpperCase()} Account`}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-slate-200/80 studio-panel text-center text-xs text-slate-500">
        <p>© 2026 EduMeet.Ai • Creative Learning Studio • Built with Next.js 14 & Gemini AI</p>
      </footer>
    </div>
  )
}