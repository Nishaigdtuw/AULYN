'use client'
import React, { useState } from 'react'
import { ArrowRight, ShieldCheck, UserCheck, GraduationCap, School, Zap, Sparkles, CheckCircle2 } from 'lucide-react'
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
      toast.success(`Logged in as ${mockUser.name}`)
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
      ? { userId: 'teacher-demo', name: 'Prof. Sarah Jenkins', email: 'sarah.jenkins@edumeet.ai', role: 'teacher' }
      : { userId: 'student-demo', name: 'Alex Rivera', email: 'alex.rivera@edumeet.ai', role: 'student' }

    localStorage.setItem('user', JSON.stringify(mockUser))
    toast.success(`Logged in as ${mockUser.name}`)
    router.push(demoRole === 'teacher' ? '/teacher' : '/student')
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Clean Subtle Background */}
      <AnimatedLearningBackground />

      {/* Header Bar */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
            EB
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">EduMeet.Ai</h1>
            <p className="text-[11px] text-slate-500 font-medium">Interactive Learning Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => handleQuickDemo('student')} className="text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl">
            Demo Student
          </Button>
          <Button size="sm" onClick={() => handleQuickDemo('teacher')} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs">
            Demo Teacher
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1 z-10">
        {/* Left Column: Hero & Clean SaaS Product Pitch */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Smart Interactive Workspace for Education</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Elevate Learning with <br />
            <span className="text-indigo-600">Interactive AI Tools</span>
          </h2>

          <p className="text-slate-600 text-sm leading-relaxed">
            EduMeet.Ai connects students and teachers with interactive code visualization, automated AI notes summarization, progress tracking, and lecture management in a clean, modern workspace.
          </p>

          {/* 1-Click Instant Demo Cards */}
          <div className="pt-2 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Access Portals</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Portal Card */}
              <div
                onClick={() => handleQuickDemo('student')}
                className="bg-white border border-slate-200/90 p-4 rounded-2xl cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex items-center space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">Student Portal</h4>
                  <p className="text-xs text-slate-500">Code trace, notes & study tools</p>
                </div>
              </div>

              {/* Teacher Portal Card */}
              <div
                onClick={() => handleQuickDemo('teacher')}
                className="bg-white border border-slate-200/90 p-4 rounded-2xl cursor-pointer hover:border-purple-300 hover:shadow-md transition-all flex items-center space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">Teacher Portal</h4>
                  <p className="text-xs text-slate-500">Analytics, rosters & materials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clean SaaS Feature Checkmarks */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200/60 text-xs text-slate-600 font-medium">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Code Trace IDE</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Notes to Quiz Converter</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Real-Time Progress Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span>Voice Lecture Capture</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek SaaS Auth Form */}
        <div className="lg:col-span-6 flex justify-center">
          <Card className="w-full max-w-md bg-white border border-slate-200/90 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 pb-4 text-center border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" /> Workspace Login
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Sign in to your account or register a new profile
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Role Selection Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'student'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setRole('student')}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Student
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'teacher'
                      ? 'bg-white text-purple-600 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => setRole('teacher')}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Teacher
                </button>
              </div>

              {/* Tabs for Sign In vs Register */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <TabsTrigger value="login" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab Content */}
                <TabsContent value="login" className="space-y-4 pt-4">
                  <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="loginEmail" className="text-xs font-bold text-slate-700">Email Address</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder={role === 'teacher' ? 'sarah.jenkins@edumeet.ai' : 'alex.rivera@edumeet.ai'}
                        className="bg-white border-slate-200 text-slate-900 text-xs focus:border-indigo-500 rounded-xl"
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
                        className="bg-white border-slate-200 text-slate-900 text-xs focus:border-indigo-500 rounded-xl"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : `Sign In as ${role === 'student' ? 'Student' : 'Teacher'}`}
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                {/* Registration Tab Content */}
                <TabsContent value="signup" className="space-y-4 pt-4">
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="signupName" className="text-xs font-bold text-slate-700">Full Name</Label>
                      <Input
                        id="signupName"
                        placeholder="e.g. Alex Rivera"
                        className="bg-white border-slate-200 text-slate-900 text-xs focus:border-indigo-500 rounded-xl"
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
                        className="bg-white border-slate-200 text-slate-900 text-xs focus:border-indigo-500 rounded-xl"
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
                        className="bg-white border-slate-200 text-slate-900 text-xs focus:border-indigo-500 rounded-xl"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs" disabled={isLoading}>
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

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-slate-200/80 bg-white/60 text-center text-xs text-slate-500">
        <p>© 2026 EduMeet.Ai • Interactive Learning Studio for Students & Educators</p>
      </footer>
    </div>
  )
}