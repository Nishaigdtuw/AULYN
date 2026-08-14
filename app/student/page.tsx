'use client'
import React, { useEffect, useState } from "react"
import { Book, BookOpen, LogOut, PenTool, Send, CheckCircle2, Circle, AlertCircle, Plus, Sparkles, Check, FileCheck, PlayCircle, Trophy, Flame, Award, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import Markdown from 'react-markdown'
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import CodeVisualizer from "@/components/code-visualizer"
import NotesAiConverter from "@/components/notes-ai-converter"
import PricingModal from "@/components/pricing-modal"

interface AiMessage {
  type: 'ai' | 'user'
  content: string
}

interface EnrolledClass {
  id: number
  name: string
  code: string
  icon: React.ReactNode
}

interface AssessmentItem {
  id: number
  title: string
  subject: string
  dueDate: string
  status: "Pending" | "Submitted"
}

export default function StudentPortal() {
  const router = useRouter()
  const [studentName, setStudentName] = useState("Alex Rivera")
  const [studentEmail, setStudentEmail] = useState("alex.rivera@edumeet.ai")

  const [activeClass, setActiveClass] = useState<number>(1)
  const [aiQueryCount, setAiQueryCount] = useState(2) // Free tier 5 max
  const [pricingOpen, setPricingOpen] = useState(false)

  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { type: "ai", content: "Hello! I am your **EduBridge AI Learning Assistant**. Ask me any question about Mathematics, Physics, History, or Coding!" }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Enrolled classes state
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([
    { id: 1, name: "Mathematics 101", code: "MATH101", icon: <PenTool className="w-4 h-4 text-indigo-400" /> },
    { id: 2, name: "History 202", code: "HIST202", icon: <Book className="w-4 h-4 text-purple-400" /> },
    { id: 3, name: "Physics 301", code: "PHYS301", icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
  ])
  const [joinClassCode, setJoinClassCode] = useState("")

  // Assessments state
  const [assessments, setAssessments] = useState<AssessmentItem[]>([
    { id: 1, title: "Mathematics Assignment 3: Calculus Integration", subject: "Mathematics 101", dueDate: "2026-08-20", status: "Pending" },
    { id: 2, title: "History Essay: The Industrial Revolution", subject: "History 202", dueDate: "2026-08-22", status: "Pending" },
    { id: 3, title: "Physics Lab Report: Projectile Motion", subject: "Physics 301", dueDate: "2026-08-25", status: "Pending" },
  ])
  const [submissionText, setSubmissionText] = useState("")
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  // MCQ Quiz Modal State
  const [mcqModalOpen, setMcqModalOpen] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [mcqScore, setMcqScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)

  const mcqQuestions = [
    {
      question: "What is the derivative of x² with respect to x?",
      options: ["x", "2x", "x²", "2"],
      correct: 1
    },
    {
      question: "Which data structure uses LIFO (Last In First Out)?",
      options: ["Queue", "Array", "Stack", "Tree"],
      correct: 2
    },
    {
      question: "What is the primary function of a Smart Contract?",
      options: ["Web Design", "Self-executing agreement on Blockchain", "Video Streaming", "DB Backup"],
      correct: 1
    }
  ]

  // One Word Questions State
  const [oneWordOpen, setOneWordOpen] = useState(false)
  const [oneWordIdx, setOneWordIdx] = useState(0)
  const [showOneWordAnswer, setShowOneWordAnswer] = useState(false)

  const oneWordQA = [
    { question: "What element does 'H' stand for in the periodic table?", answer: "Hydrogen" },
    { question: "What is the capital city of Japan?", answer: "Tokyo" },
    { question: "What algorithm sorts in O(n log n) average time?", answer: "QuickSort" }
  ]

  // Mock Test State
  const [mockTestOpen, setMockTestOpen] = useState(false)
  const [mockTestFinished, setMockTestFinished] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.replace("/")
      return
    }
    try {
      const parsed = JSON.parse(userStr)
      if (parsed.name) setStudentName(parsed.name)
      if (parsed.email) setStudentEmail(parsed.email)
    } catch {
      router.replace("/")
    }
  }, [router])

  const handleSendMessage = async () => {
    const messageToSend = inputMessage.trim()
    if (!messageToSend) return

    if (aiQueryCount >= 5) {
      toast.warning("Free daily AI query limit reached (5/5). Upgrade to Pro for unlimited AI!")
      setPricingOpen(true)
      return
    }

    setAiMessages((prev) => [...prev, { type: 'user', content: messageToSend }])
    setInputMessage("")
    setAiQueryCount((prev) => prev + 1)
    setIsAiLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_AI_CHAT_URL || "http://localhost:8000"
      const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, currentClass: "general", currentChapter: "general" }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data && data.message) {
          setAiMessages((prev) => [...prev, { type: 'ai', content: data.message }])
          setIsAiLoading(false)
          return
        }
      }
    } catch {
      // AI Backend offline fallback
    }

    setTimeout(() => {
      let aiResponse = `Here is a breakdown for your query regarding **"${messageToSend}"**:\n\n`
      const lower = messageToSend.toLowerCase()
      if (lower.includes("calculus") || lower.includes("math") || lower.includes("integration") || lower.includes("derivative")) {
        aiResponse += `• **Integration Rule**: \\(\\int x^n dx = \\frac{x^{n+1}}{n+1} + C\\)\n• **Derivative Rule**: \\(\\frac{d}{dx}[x^n] = n x^{n-1}\\)\n\nPracticing these core rules will help you solve calculus problems step by step!`
      } else if (lower.includes("history") || lower.includes("war") || lower.includes("revolution")) {
        aiResponse += `• The Industrial Revolution began in Great Britain in the late 18th century.\n• Key inventions include the Steam Engine (James Watt) and Cotton Gin (Eli Whitney).`
      } else if (lower.includes("physics") || lower.includes("motion") || lower.includes("force")) {
        aiResponse += `• **Newton's Second Law**: \\(F = m \\cdot a\\) (Force = mass × acceleration).\n• **Kinematic Equation**: \\(v = u + a t\\).`
      } else {
        aiResponse += `Thank you for your question! As your AI tutor, I recommend reviewing your active class materials and practicing the interactive quizzes in the **Prep** tab!`
      }
      setAiMessages((prev) => [...prev, { type: 'ai', content: aiResponse }])
      setIsAiLoading(false)
    }, 700)
  }

  const handleJoinClass = () => {
    if (!joinClassCode.trim()) {
      toast.warning("Please enter a valid class code")
      return
    }
    const newClass: EnrolledClass = {
      id: Date.now(),
      name: `Class (${joinClassCode.toUpperCase()})`,
      code: joinClassCode.toUpperCase(),
      icon: <Book className="w-4 h-4 text-indigo-400" />
    }
    setEnrolledClasses((prev) => [...prev, newClass])
    setActiveClass(newClass.id)
    setJoinClassCode("")
    toast.success(`Successfully joined ${newClass.name}!`)
  }

  const handleSubmitAssignment = (id: number) => {
    if (!submissionText.trim()) {
      toast.warning("Please enter your submission text or link")
      return
    }
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Submitted" } : a)))
    setSubmissionText("")
    setSubmittingId(null)
    toast.success("Assignment submitted successfully!")
  }

  const handleNextMcq = () => {
    if (selectedOption === null) {
      toast.warning("Please select an answer option")
      return
    }
    if (selectedOption === mcqQuestions[currentQuestionIdx].correct) {
      setMcqScore((prev) => prev + 1)
    }
    if (currentQuestionIdx + 1 < mcqQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1)
      setSelectedOption(null)
    } else {
      setQuizFinished(true)
    }
  }

  const resetMcq = () => {
    setCurrentQuestionIdx(0)
    setSelectedOption(null)
    setMcqScore(0)
    setQuizFinished(false)
    setMcqModalOpen(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.info("Logged out.")
    router.replace("/")
  }

  return (
    <div className="min-h-screen bg-mesh-dark text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 glass-panel border-b border-slate-800/80 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg glow-indigo">
            EB
          </div>
          <div>
            <h1 className="text-xl font-black gradient-text leading-none">Student Workspace</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Progress Tracker & Code Trace Visualizer</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold text-xs"
            onClick={() => setPricingOpen(true)}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Upgrade Pro
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{studentName}</p>
            <p className="text-[10px] text-slate-400">{studentEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-red-400 border-slate-800 hover:bg-slate-900 text-xs">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="student" />

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 glass-panel p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg glow-indigo text-xs">
                  <Plus className="w-4 h-4 mr-2" /> Join Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md glass-panel border-slate-800 text-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-indigo-400 font-bold">Join a New Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="classCode" className="text-slate-300 text-xs font-semibold">Classroom Code</Label>
                    <Input
                      id="classCode"
                      placeholder="e.g. MATH101 or CODE123"
                      value={joinClassCode}
                      onChange={(e) => setJoinClassCode(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>
                <DialogClose asChild>
                  <Button className="w-full bg-indigo-600 text-white font-bold text-xs" onClick={handleJoinClass}>
                    Join Classroom
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-1">Enrolled Classes</h2>
            <ul className="space-y-1.5">
              {enrolledClasses.map((cls) => {
                const isActive = activeClass === cls.id
                return (
                  <li key={cls.id}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left font-semibold rounded-xl px-3 py-2.5 transition-all text-xs ${
                        isActive ? "bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-bold glow-indigo" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      }`}
                      onClick={() => setActiveClass(cls.id)}
                    >
                      {cls.icon}
                      <span className="ml-2.5 truncate">{cls.name}</span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 space-y-3">
            {/* Free Tier AI Limit Badge */}
            <div className="p-3 bg-slate-900/80 rounded-2xl text-xs border border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className="flex items-center gap-1 text-indigo-400"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Daily AI Limit</span>
                <span className="text-white font-mono">{aiQueryCount} / 5</span>
              </div>
              <Progress value={(aiQueryCount / 5) * 100} className="h-1.5 bg-slate-950" />
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Tabs defaultValue="progress" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl bg-slate-900/80 p-1 rounded-2xl border border-slate-800 shadow-xl mb-6">
              <TabsTrigger value="progress" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">
                Progress
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">
                Code Trace
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">
                Notes AI
              </TabsTrigger>
              <TabsTrigger value="assessments" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="qna" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">
                AI Q&A
              </TabsTrigger>
              <TabsTrigger value="prep" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">
                Prep & Practice
              </TabsTrigger>
            </TabsList>

            {/* Student Progress Tracker Tab (from handwritten note) */}
            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card border-slate-800">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Course Progress</p>
                      <p className="text-2xl font-black text-indigo-400 mt-1">76%</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center font-bold">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-slate-800">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Study Streak</p>
                      <p className="text-2xl font-black text-amber-400 mt-1">5 Days 🔥</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-slate-800">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Quiz Accuracy</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">92%</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-slate-800">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Completed Tasks</p>
                      <p className="text-2xl font-black text-purple-400 mt-1">12 / 15</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center font-bold">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Learning Skill Mastery */}
              <Card className="glass-panel border-slate-800 rounded-3xl shadow-2xl overflow-hidden glow-indigo">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Subject Progress & Skill Mastery</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Real-time progress overview across your enrolled courses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-200">Mathematics 101 (Calculus & Vectors)</span>
                      <span className="text-indigo-400 font-mono">85%</span>
                    </div>
                    <Progress value={85} className="h-2 bg-slate-950" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-200">History 202 (Industrial Revolution)</span>
                      <span className="text-purple-400 font-mono">70%</span>
                    </div>
                    <Progress value={70} className="h-2 bg-slate-950" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-200">Physics 301 (Projectile Motion & Mechanics)</span>
                      <span className="text-cyan-400 font-mono">65%</span>
                    </div>
                    <Progress value={65} className="h-2 bg-slate-950" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Visualizer Tab (from handwritten note) */}
            <TabsContent value="code">
              <CodeVisualizer />
            </TabsContent>

            {/* Notes AI Converter Tab (Notes -> Quiz / Flashcards / Summarize) */}
            <TabsContent value="notes">
              <NotesAiConverter />
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-6">
              <Card className="glass-panel border-slate-800 rounded-3xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-indigo-400 font-bold">Pending & Active Assignments</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">View due assignments and submit your work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="divide-y divide-slate-800">
                    {assessments.map((item) => (
                      <li key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === "Submitted" ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40" : "bg-amber-950/80 text-amber-400 border-amber-500/40"
                            }`}>
                              {item.status}
                            </span>
                            <p className="font-semibold text-white text-sm">{item.title}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{item.subject} • Due: {item.dueDate}</p>
                        </div>

                        {item.status === "Pending" ? (
                          <Dialog open={submittingId === item.id} onOpenChange={(open) => setSubmittingId(open ? item.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs glow-indigo">
                                Submit Work
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-panel border-slate-800 text-white rounded-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-indigo-400 font-bold">Submit: {item.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 py-2">
                                <Label className="text-slate-300 text-xs">Submission Notes / Drive Link</Label>
                                <Input
                                  placeholder="Paste drive link or write answer summary..."
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                                />
                              </div>
                              <Button className="w-full bg-indigo-600 text-white font-bold text-xs" onClick={() => handleSubmitAssignment(item.id)}>
                                Confirm Submission
                              </Button>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 flex items-center">
                            <Check className="w-4 h-4 mr-1" /> Submitted
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QNA & AI Assistant Tab */}
            <TabsContent value="qna" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col glass-panel border-slate-800 rounded-3xl shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <CardTitle className="text-indigo-400 font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" /> AI Study Assistant
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">Ask questions, request explanations, or get step-by-step help</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAiMessages([])} className="text-xs border-slate-800 text-slate-400 hover:bg-slate-900">
                    Clear Chat
                  </Button>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-4 justify-between min-h-[450px]">
                  <ScrollArea className="flex-1 pr-4 max-h-[460px] overflow-y-auto">
                    <div className="space-y-4">
                      {aiMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-md leading-relaxed ${
                            msg.type === "user"
                              ? "bg-indigo-600 text-white rounded-br-none font-medium glow-indigo"
                              : "bg-slate-950/90 text-slate-100 border border-slate-800 rounded-bl-none font-normal"
                          }`}>
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-950 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-2xl animate-pulse">
                            AI is thinking...
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center space-x-2 pt-4 border-t border-slate-800 mt-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask any question (e.g. Explain Integration by parts)..."
                      className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs glow-indigo">
                      <Send className="w-4 h-4 mr-1.5" /> Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prep & Practice Tab */}
            <TabsContent value="prep" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MCQ Card */}
                <Card className="glass-card border-slate-800 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-indigo-400 text-lg font-bold">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-400" /> MCQ Quizzes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400">Test your conceptual knowledge with multiple-choice questions.</p>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs glow-indigo" onClick={resetMcq}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Start MCQ Quiz
                    </Button>
                  </CardContent>
                </Card>

                {/* One Word Card */}
                <Card className="glass-card border-slate-800 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-400 text-lg font-bold">
                      <Circle className="w-5 h-5 mr-2 text-purple-400" /> One-Word Flashcards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400">Enhance your quick recall with key definition flashcards.</p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs glow-purple" onClick={() => setOneWordOpen(true)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Practice One-Word
                    </Button>
                  </CardContent>
                </Card>

                {/* Mock Test Card */}
                <Card className="glass-card border-slate-800 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-400 text-lg font-bold">
                      <AlertCircle className="w-5 h-5 mr-2 text-cyan-400" /> Timed Mock Test
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-400">Simulate real exam conditions with a timed mock assessment.</p>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs" onClick={() => { setMockTestOpen(true); setMockTestFinished(false) }}>
                      <Trophy className="w-4 h-4 mr-2" /> Take Mock Test
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* MCQ Quiz Dialog */}
              <Dialog open={mcqModalOpen} onOpenChange={setMcqModalOpen}>
                <DialogContent className="sm:max-w-lg glass-panel border-slate-800 text-white rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-indigo-400 font-bold">Interactive MCQ Quiz</DialogTitle>
                  </DialogHeader>
                  {!quizFinished ? (
                    <div className="space-y-4 py-2">
                      <p className="text-xs font-bold text-slate-400">Question {currentQuestionIdx + 1} of {mcqQuestions.length}</p>
                      <p className="font-semibold text-white text-sm">{mcqQuestions[currentQuestionIdx].question}</p>

                      <RadioGroup value={selectedOption !== null ? selectedOption.toString() : ""} onValueChange={(v) => setSelectedOption(parseInt(v))}>
                        <div className="space-y-2">
                          {mcqQuestions[currentQuestionIdx].options.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-2 p-3 border border-slate-800 rounded-xl hover:bg-slate-900 cursor-pointer text-xs">
                              <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                              <Label htmlFor={`opt-${idx}`} className="cursor-pointer font-medium text-slate-300 w-full">{opt}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>

                      <Button className="w-full bg-indigo-600 text-white font-bold text-xs mt-4" onClick={handleNextMcq}>
                        {currentQuestionIdx + 1 === mcqQuestions.length ? "Finish Quiz" : "Next Question"}
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-4">
                      <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                      <h3 className="text-xl font-bold text-white">Quiz Completed!</h3>
                      <p className="text-slate-300 text-xs">You scored <strong>{mcqScore}</strong> out of <strong>{mcqQuestions.length}</strong>.</p>
                      <Button className="bg-indigo-600 text-white font-bold text-xs" onClick={() => setMcqModalOpen(false)}>
                        Close & Save Result
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* One Word Questions Dialog */}
              <Dialog open={oneWordOpen} onOpenChange={setOneWordOpen}>
                <DialogContent className="sm:max-w-md glass-panel border-slate-800 text-white rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-purple-400 font-bold">One-Word Revision Flashcard</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4 text-center">
                    <p className="text-xs font-bold text-slate-400">Card {oneWordIdx + 1} of {oneWordQA.length}</p>
                    <p className="font-bold text-white text-base">{oneWordQA[oneWordIdx].question}</p>

                    {showOneWordAnswer ? (
                      <div className="p-4 bg-purple-950/80 border border-purple-500/40 rounded-2xl text-purple-300 font-bold text-sm">
                        Answer: {oneWordQA[oneWordIdx].answer}
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 text-xs" onClick={() => setShowOneWordAnswer(true)}>
                        Reveal Answer
                      </Button>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={oneWordIdx === 0}
                        className="text-slate-400 text-xs"
                        onClick={() => { setOneWordIdx((prev) => prev - 1); setShowOneWordAnswer(false) }}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 text-white font-bold text-xs"
                        onClick={() => {
                          if (oneWordIdx + 1 < oneWordQA.length) {
                            setOneWordIdx((prev) => prev + 1)
                            setShowOneWordAnswer(false)
                          } else {
                            toast.success("All flashcards completed!")
                            setOneWordOpen(false)
                          }
                        }}
                      >
                        {oneWordIdx + 1 === oneWordQA.length ? "Finish" : "Next Card"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mock Test Dialog */}
              <Dialog open={mockTestOpen} onOpenChange={setMockTestOpen}>
                <DialogContent className="sm:max-w-md glass-panel border-slate-800 text-white rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-cyan-400 font-bold">Full Mock Assessment</DialogTitle>
                  </DialogHeader>
                  {!mockTestFinished ? (
                    <div className="py-4 space-y-4">
                      <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-2xl text-xs text-cyan-300">
                        ⏱️ Timed Session: 15 Minutes • 20 Total Questions
                      </div>
                      <p className="text-xs text-slate-300">
                        This test simulates full exam conditions for Mathematics & Physics. Click below when ready to submit.
                      </p>
                      <Button className="w-full bg-cyan-600 text-white font-bold text-xs" onClick={() => { setMockTestFinished(true); toast.success("Mock test submitted!") }}>
                        Submit Mock Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <FileCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h4 className="font-bold text-white text-base">Mock Exam Submitted</h4>
                      <p className="text-xs text-slate-400">Your score report has been sent to your teacher dashboard.</p>
                      <Button size="sm" className="bg-slate-800 text-white text-xs font-bold" onClick={() => setMockTestOpen(false)}>Close</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}