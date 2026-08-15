'use client'
import React, { useEffect, useState } from "react"
import { Book, BookOpen, LogOut, PenTool, Send, CheckCircle2, Circle, AlertCircle, Plus, Sparkles, Check, FileCheck, PlayCircle, Trophy, Award, Crown, Compass, Clock, ArrowUpRight, Menu, ChevronDown, ChevronRight, Play, Pause, RotateCcw, Code, Brain, Settings, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
  id: string
  name: string
  code: string
  teacher: string
  icon: React.ReactNode
  progress: number
  chapters: string[]
  materials: string[]
  assignments: Array<{ id: number; title: string; dueDate: string; status: "Pending" | "Submitted" }>
  announcement: string
}

const CLASSROOM_DATABASE: Record<string, EnrolledClass> = {
  "dsa": {
    id: "dsa",
    name: "Data Structures & Algorithms",
    code: "CS201",
    teacher: "Prof. Sarah Jenkins",
    icon: <PenTool className="w-4 h-4 text-[#E76F51]" />,
    progress: 85,
    chapters: ["Chapter 1: Binary Search Trees", "Chapter 2: Recursion & Backtracking", "Chapter 3: Graph Traversals (BFS/DFS)"],
    materials: ["Trees_Lecture_Notes.pdf", "Recursion_CallStack_Guide.pdf", "Graph_Algorithms.pptx"],
    assignments: [
      { id: 101, title: "Binary Search Tree Implementation", dueDate: "2026-08-20", status: "Pending" },
      { id: 102, title: "Recursion & Call Stack Problem Set", dueDate: "2026-08-22", status: "Pending" }
    ],
    announcement: "Next class will feature a live 3-Panel Code Trace session on Recursion."
  },
  "math": {
    id: "math",
    name: "Mathematics 101 (Calculus)",
    code: "MATH101",
    teacher: "Dr. Robert Vance",
    icon: <BookOpen className="w-4 h-4 text-[#8B7EC8]" />,
    progress: 72,
    chapters: ["Chapter 1: Limits & Continuity", "Chapter 2: Derivatives & Chain Rule", "Chapter 3: Definite & Indefinite Integrals"],
    materials: ["Calculus_CheatSheet.pdf", "Limits_Practice_Problems.pdf"],
    assignments: [
      { id: 201, title: "Limits & Derivatives Quiz", dueDate: "2026-08-21", status: "Pending" },
      { id: 202, title: "Integration Techniques Assignment", dueDate: "2026-08-24", status: "Pending" }
    ],
    announcement: "Midterm exam covers limits, differentiation and integration."
  },
  "physics": {
    id: "physics",
    name: "Physics 301 (Classical Mechanics)",
    code: "PHYS301",
    teacher: "Dr. Elena Rostova",
    icon: <Book className="w-4 h-4 text-[#75B798]" />,
    progress: 68,
    chapters: ["Chapter 1: Newton's Laws of Motion", "Chapter 2: Work, Energy & Momentum", "Chapter 3: Rotational Dynamics"],
    materials: ["Mechanics_Lab_Guide.pdf", "Kinematics_Formulas.pdf"],
    assignments: [
      { id: 301, title: "Newtonian Motion Lab Report", dueDate: "2026-08-23", status: "Pending" }
    ],
    announcement: "Lab submissions must include vector diagram analysis."
  },
  "history": {
    id: "history",
    name: "History 202 (Modern History)",
    code: "HIST202",
    teacher: "Prof. Arthur Pendelton",
    icon: <Award className="w-4 h-4 text-[#E9B949]" />,
    progress: 90,
    chapters: ["Chapter 1: The Industrial Revolution", "Chapter 2: World War I & II Dynamics", "Chapter 3: Cold War Geopolitics"],
    materials: ["Industrial_Revolution_Essays.pdf", "Cold_War_Timeline.pdf"],
    assignments: [
      { id: 401, title: "Industrialization Historical Analysis", dueDate: "2026-08-25", status: "Pending" }
    ],
    announcement: "Essay peer review deadline is this Friday."
  }
}

export default function StudentPortal() {
  const router = useRouter()
  const [studentName, setStudentName] = useState("Alex Rivera")
  const [studentEmail, setStudentEmail] = useState("alex.rivera@edumeet.ai")

  // Class Selection State (Default: Data Structures)
  const [selectedClassId, setSelectedClassId] = useState<string>("dsa")
  const currentClass = CLASSROOM_DATABASE[selectedClassId] || CLASSROOM_DATABASE["dsa"]

  const [aiQueryCount, setAiQueryCount] = useState(2) // Free tier 5 max
  const [pricingOpen, setPricingOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [activeMainTab, setActiveMainTab] = useState("progress")

  // Sidebar Expandable Sections State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    myClasses: true,
    learn: true,
    codeLab: true,
    assessments: false,
    progress: false
  })

  // Focus Session Modal & Timer State
  const [focusModalOpen, setFocusModalOpen] = useState(false)
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(18 * 60) // 18 minutes
  const [isFocusActive, setIsFocusActive] = useState(false)
  const [focusCompleted, setFocusCompleted] = useState(false)
  const [focusGoals, setFocusGoals] = useState({
    baseCase: true,
    stackFrames: false,
    traceTree: false
  })

  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { type: "ai", content: "Hello Alex! I am your **AI Study Tutor**. Ask me any question or tap a quick prompt chip below to begin." }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  const [joinClassCode, setJoinClassCode] = useState("")
  const [submissionText, setSubmissionText] = useState("")
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  // Timer Effect for Focus Session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isFocusActive && focusTimerSeconds > 0) {
      interval = setInterval(() => {
        setFocusTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (focusTimerSeconds === 0 && isFocusActive) {
      setIsFocusActive(false)
      setFocusCompleted(true)
      toast.success("Focus Session Complete! 18 minutes logged.")
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isFocusActive, focusTimerSeconds])

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleStartFocusSession = () => {
    setFocusTimerSeconds(18 * 60)
    setIsFocusActive(true)
    setFocusCompleted(false)
    setFocusModalOpen(true)
  }

  const handleToggleFocusTimer = () => {
    setIsFocusActive(!isFocusActive)
  }

  const handleResetFocusTimer = () => {
    setIsFocusActive(false)
    setFocusTimerSeconds(18 * 60)
    setFocusCompleted(false)
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || inputMessage.trim()
    if (!messageToSend) return

    if (aiQueryCount >= 5) {
      toast.warning("Free daily AI query limit reached (5/5). Upgrade for unlimited access!")
      setPricingOpen(true)
      return
    }

    setAiMessages((prev) => [...prev, { type: 'user', content: messageToSend }])
    if (!customPrompt) setInputMessage("")
    setAiQueryCount((prev) => prev + 1)
    setIsAiLoading(true)

    setTimeout(() => {
      let aiResponse = `Here is your requested guidance for **"${messageToSend}"** in **${currentClass.name}**:\n\n`
      const lower = messageToSend.toLowerCase()
      if (lower.includes("simply") || lower.includes("recursion")) {
        aiResponse += `• **Recursion Explained Simply**: Recursion is when a function calls itself to solve smaller instances of the same problem, stopping when it hits a **base case**.`
      } else if (lower.includes("example")) {
        aiResponse += `• **Factorial Example**: \\(5! = 5 \\times 4! = 5 \\times 4 \\times 3 \\times 2 \\times 1 = 120\\). Base case: \\(0! = 1\\).`
      } else if (lower.includes("quiz")) {
        aiResponse += `• **Quick Quiz**: What happens if a recursive function does NOT have a base case?\n*(Answer: Stack Overflow Error)*`
      } else {
        aiResponse += `Great question! Trace recursive algorithm execution step-by-step in the **Code Trace** tab or convert notes in the **Notes AI** tab.`
      }
      setAiMessages((prev) => [...prev, { type: 'ai', content: aiResponse }])
      setIsAiLoading(false)
    }, 600)
  }

  const handleJoinClass = () => {
    if (!joinClassCode.trim()) {
      toast.warning("Please enter a valid class code")
      return
    }
    toast.success(`Joined class code ${joinClassCode.toUpperCase()}!`)
    setJoinClassCode("")
  }

  const handleSubmitAssignment = (id: number) => {
    if (!submissionText.trim()) {
      toast.warning("Please enter your submission details")
      return
    }
    currentClass.assignments.forEach((a) => {
      if (a.id === id) a.status = "Submitted"
    })
    setSubmissionText("")
    setSubmittingId(null)
    toast.success("Assignment submitted successfully!")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.info("Logged out.")
    router.replace("/")
  }

  // Sidebar Content Component for Desktop & Mobile Drawer
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Join Class Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl shadow-2xs text-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Join Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#292724] font-serif font-bold">Join Classroom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="classCode" className="text-[#292724] text-xs font-bold">Class Code</Label>
                <Input
                  id="classCode"
                  placeholder="e.g. CS201 or MATH101"
                  value={joinClassCode}
                  onChange={(e) => setJoinClassCode(e.target.value)}
                  className="bg-white border-[#E5DCD0] text-[#292724] rounded-xl text-xs"
                />
              </div>
            </div>
            <DialogClose asChild>
              <Button className="w-full bg-[#E76F51] text-white font-bold text-xs" onClick={handleJoinClass}>
                Join Classroom
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Structured Expandable Navigation */}
        <nav className="space-y-1 text-xs">
          {/* Home */}
          <button
            onClick={() => { setActiveMainTab("progress"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all ${
              activeMainTab === "progress" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <Compass className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Home Workspace
          </button>

          {/* My Classes Section (Class-Specific Switching) */}
          <div>
            <button
              onClick={() => toggleSection("myClasses")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <Book className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Enrolled Classes
              </span>
              {expandedSections.myClasses ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.myClasses && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                {Object.values(CLASSROOM_DATABASE).map((cls) => {
                  const isActive = selectedClassId === cls.id
                  return (
                    <button
                      key={cls.id}
                      onClick={() => { setSelectedClassId(cls.id); setActiveMainTab("progress"); setMobileDrawerOpen(false) }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate block transition-all ${
                        isActive ? "bg-[#FFF9F1] text-[#E76F51] font-bold shadow-2xs border border-[#E5DCD0]" : "text-[#77716A] hover:text-[#292724]"
                      }`}
                    >
                      {cls.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Learn Tools */}
          <div>
            <button
              onClick={() => toggleSection("learn")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <Brain className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Learn & Study
              </span>
              {expandedSections.learn ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.learn && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("qna"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  AI Study Tutor
                </button>
                <button onClick={() => { setActiveMainTab("notes"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Smart Notes & Flashcards
                </button>
                <button onClick={() => { setActiveMainTab("prep"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Practice Quizzes
                </button>
              </div>
            )}
          </div>

          {/* Code Lab */}
          <div>
            <button
              onClick={() => toggleSection("codeLab")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <Code className="w-4 h-4 mr-2.5 text-[#75B798]" /> Code Lab
              </span>
              {expandedSections.codeLab ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.codeLab && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("code"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  3-Area Code Trace IDE
                </button>
              </div>
            )}
          </div>

          {/* Assessments */}
          <div>
            <button
              onClick={() => toggleSection("assessments")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <FileCheck className="w-4 h-4 mr-2.5 text-[#E9B949]" /> Assessments
              </span>
              {expandedSections.assessments ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.assessments && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("assessments"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Assignments & Due Tasks
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="w-full flex items-center px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]">
            <Settings className="w-4 h-4 mr-2.5 text-[#77716A]" /> Settings
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E5DCD0] space-y-3">
        <div className="p-3 bg-[#F1E8DD]/80 rounded-xl text-xs border border-[#E5DCD0] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-[11px]">
            <span className="flex items-center gap-1 text-[#E76F51]"><Sparkles className="w-3.5 h-3.5 text-[#E76F51]" /> Daily AI Limit</span>
            <span className="text-[#292724] font-mono">{aiQueryCount} / 5</span>
          </div>
          <Progress value={(aiQueryCount / 5) * 100} className="h-1.5 bg-[#E5DCD0]" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent text-[#292724] flex flex-col justify-between relative overflow-x-hidden">
      {/* Header Bar */}
      <header className="flex justify-between items-center px-4 sm:px-8 py-3.5 bg-[#FFF9F1]/95 backdrop-blur-md border-b border-[#E5DCD0] sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center space-x-3">
          {/* Mobile Drawer Trigger (< lg screens) */}
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-[#292724] hover:bg-[#F1E8DD]/60">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-[#FFF9F1] border-r border-[#E5DCD0] p-6">
              <SheetHeader className="pb-4 border-b border-[#E5DCD0]">
                <SheetTitle className="text-left font-serif font-bold text-[#292724]">Student Navigation</SheetTitle>
              </SheetHeader>
              <div className="pt-4 h-[calc(100vh-120px)]">
                <RenderSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-9 h-9 bg-[#E76F51] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-2xs">
            EB
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-bold text-[#292724] leading-none">Student Workspace</h1>
            <p className="text-[10px] text-[#77716A] font-medium mt-0.5 hidden sm:block">EduMeet.Ai Intelligent Workspace</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3.5">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E5DCD0] bg-[#FFF9F1] text-[#292724] hover:bg-[#F1E8DD] font-bold text-xs rounded-xl"
            onClick={() => setPricingOpen(true)}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-[#E9B949]" /> Pro
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#292724]">{studentName}</p>
            <p className="text-[10px] text-[#77716A]">{studentEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#77716A] hover:text-red-600 border-[#E5DCD0] text-xs font-semibold rounded-xl">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="student" />

      {/* Focus Session Working Timer Modal (Prompt Spec: Real Working Focus Timer) */}
      <Dialog open={focusModalOpen} onOpenChange={setFocusModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl p-6">
          <DialogHeader className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 bg-[#E76F51]/15 text-[#E76F51] border border-[#E76F51]/30 rounded-2xl flex items-center justify-center font-bold mb-1">
              <Clock className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-serif font-bold text-[#292724]">
              Interactive Focus Session
            </DialogTitle>
            <p className="text-xs text-[#77716A]">
              Topic: <span className="font-bold text-[#292724]">Recursion & Call Stack Trace</span> • {currentClass.name}
            </p>
          </DialogHeader>

          <div className="py-6 space-y-6 text-center">
            {/* Live Countdown Timer HUD */}
            <div className="p-6 bg-[#F1E8DD]/80 border border-[#E5DCD0] rounded-2xl shadow-inner space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77716A]">
                {isFocusActive ? "Focus Timer Countdown" : focusCompleted ? "Session Finished" : "Timer Paused"}
              </span>
              <div className="text-5xl font-mono font-black text-[#292724] tracking-tight">
                {formatTimer(focusTimerSeconds)}
              </div>
              <Progress value={((18 * 60 - focusTimerSeconds) / (18 * 60)) * 100} className="h-2 bg-[#E5DCD0] mt-2" />
            </div>

            {/* Session Checklist Goals */}
            <div className="text-left space-y-2 bg-[#FFF9F1] p-4 rounded-xl border border-[#E5DCD0]">
              <p className="text-xs font-bold text-[#292724] uppercase tracking-wider">Session Learning Objectives</p>
              <div className="space-y-1.5 text-xs text-[#77716A]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusGoals.baseCase}
                    onChange={(e) => setFocusGoals({ ...focusGoals, baseCase: e.target.checked })}
                    className="rounded border-[#E5DCD0] text-[#E76F51]"
                  />
                  <span>Understand base case termination condition</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusGoals.stackFrames}
                    onChange={(e) => setFocusGoals({ ...focusGoals, stackFrames: e.target.checked })}
                    className="rounded border-[#E5DCD0] text-[#E76F51]"
                  />
                  <span>Trace call stack activation frames step-by-step</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusGoals.traceTree}
                    onChange={(e) => setFocusGoals({ ...focusGoals, traceTree: e.target.checked })}
                    className="rounded border-[#E5DCD0] text-[#E76F51]"
                  />
                  <span>Run binary search trace in Code Visualizer</span>
                </label>
              </div>
            </div>

            {/* Timer Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={handleToggleFocusTimer}
                className={`font-bold text-xs rounded-xl px-5 py-2.5 shadow-2xs ${
                  isFocusActive ? "bg-[#E76F51] hover:bg-[#d55e42] text-white" : "bg-[#75B798] hover:bg-[#64a687] text-white"
                }`}
              >
                {isFocusActive ? <><Pause className="w-4 h-4 mr-1.5" /> Pause Timer</> : <><Play className="w-4 h-4 mr-1.5" /> {focusTimerSeconds === 18 * 60 ? "Start Session" : "Resume Timer"}</>}
              </Button>

              <Button variant="outline" size="sm" className="border-[#E5DCD0] text-[#77716A] hover:text-[#292724] text-xs font-semibold rounded-xl" onClick={handleResetFocusTimer}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>

              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="text-xs text-[#77716A]">
                  End & Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Desktop Sidebar (≥ lg screens) */}
        <aside className="w-64 border-r border-[#E5DCD0] bg-[#FFF9F1]/85 backdrop-blur-md p-5 hidden lg:flex flex-col justify-between overflow-y-auto">
          <RenderSidebarContent />
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* Header & Active Classroom Switcher Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#292724]">
                Good morning, {studentName.split(" ")[0]}.
              </h2>
              <p className="text-xs font-semibold text-[#77716A] mt-0.5">
                Active Classroom: <span className="text-[#E76F51] font-bold">{currentClass.name}</span> ({currentClass.code} • {currentClass.teacher})
              </p>
            </div>

            {/* Quick Class Selection Dropdown Pill */}
            <div className="flex items-center gap-1.5 bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0]">
              {Object.values(CLASSROOM_DATABASE).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedClassId === c.id ? "bg-[#FFF9F1] text-[#E76F51] shadow-2xs border border-[#E5DCD0]" : "text-[#77716A] hover:text-[#292724]"
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs mb-6 overflow-x-auto">
              <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs">
                Code Trace
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs">
                Notes AI
              </TabsTrigger>
              <TabsTrigger value="assessments" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="qna" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs">
                AI Tutor
              </TabsTrigger>
              <TabsTrigger value="prep" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs">
                Practice
              </TabsTrigger>
            </TabsList>

            {/* Overview / Class-Specific Workspace Tab */}
            <TabsContent value="progress" className="space-y-6">
              {/* PRIMARY FOCUS CARD (Prompt Spec: Working Start Focus Session CTA) */}
              <div className="p-6 bg-gradient-to-r from-[#FFF9F1]/95 to-[#F1E8DD]/95 backdrop-blur-md border-2 border-[#E76F51] rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E76F51]/10 text-[#E76F51] text-xs font-bold border border-[#E76F51]/20">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Today&apos;s Primary Focus • {currentClass.name}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#292724]">
                    Recursion & Call Stack Visualization
                  </h3>
                  <p className="text-xs text-[#77716A] font-medium flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#E76F51]" /> 18 min recommended session • Master base case termination & stack frames
                  </p>
                </div>

                <Button 
                  className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-xs self-start md:self-center"
                  onClick={handleStartFocusSession}
                >
                  Start Focus Session <ArrowUpRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              {/* Class Announcement Banner */}
              <div className="p-4 bg-[#FFF9F1]/95 backdrop-blur-md border border-[#E5DCD0] rounded-2xl shadow-2xs space-y-1">
                <p className="text-[11px] font-bold text-[#8B7EC8] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Class Notice from {currentClass.teacher}
                </p>
                <p className="text-xs font-bold text-[#292724]">{currentClass.announcement}</p>
              </div>

              {/* Class-Specific Course Chapters & Materials Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Chapters */}
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader className="p-4 border-b border-[#E5DCD0]">
                    <CardTitle className="text-sm font-serif font-bold text-[#292724] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#E76F51]" /> Class Chapters ({currentClass.code})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    {currentClass.chapters.map((chap, idx) => (
                      <div key={idx} className="p-3 bg-[#F1E8DD]/60 rounded-xl border border-[#E5DCD0] text-xs font-bold text-[#292724] flex items-center justify-between">
                        <span>{chap}</span>
                        <span className="text-[10px] text-[#75B798] bg-[#75B798]/10 px-2 py-0.5 rounded-full border border-[#75B798]/30">Active</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Class Study Materials */}
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader className="p-4 border-b border-[#E5DCD0]">
                    <CardTitle className="text-sm font-serif font-bold text-[#292724] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#8B7EC8]" /> Study Materials & Drive Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    {currentClass.materials.map((mat, idx) => (
                      <div key={idx} className="p-3 bg-[#F1E8DD]/60 rounded-xl border border-[#E5DCD0] text-xs font-bold text-[#292724] flex items-center justify-between">
                        <span className="truncate">{mat}</span>
                        <Button variant="ghost" size="sm" className="text-[11px] text-[#E76F51] hover:text-[#d55e42] h-6 px-2 font-bold" onClick={() => toast.info(`Downloading ${mat}...`)}>
                          Download
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Class Mastery Progress Indicator */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-serif font-bold text-[#292724]">Overall Course Progress ({currentClass.code})</CardTitle>
                  <CardDescription className="text-[#77716A] text-xs">Real-time completion metrics for {currentClass.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#292724]">Course Completion</span>
                    <span className="text-[#E76F51] font-mono">{currentClass.progress}%</span>
                  </div>
                  <Progress value={currentClass.progress} className="h-2.5 bg-[#F1E8DD]" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Visualizer Tab */}
            <TabsContent value="code">
              <CodeVisualizer />
            </TabsContent>

            {/* Notes AI Converter Tab */}
            <TabsContent value="notes">
              <NotesAiConverter />
            </TabsContent>

            {/* Class-Specific Assignments Tab */}
            <TabsContent value="assessments" className="space-y-6">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base">Active Assignments for {currentClass.name}</CardTitle>
                  <CardDescription className="text-[#77716A] text-xs">View due tasks and submit completed coursework</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="divide-y divide-[#E5DCD0]">
                    {currentClass.assignments.map((item) => (
                      <li key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === "Submitted" ? "bg-[#75B798]/15 text-[#75B798] border-[#75B798]/30" : "bg-[#E9B949]/15 text-[#E9B949] border-[#E9B949]/30"
                            }`}>
                              {item.status}
                            </span>
                            <p className="font-bold text-[#292724] text-sm">{item.title}</p>
                          </div>
                          <p className="text-xs text-[#77716A] mt-1">{currentClass.name} • Due: {item.dueDate}</p>
                        </div>

                        {item.status === "Pending" ? (
                          <Dialog open={submittingId === item.id} onOpenChange={(open) => setSubmittingId(open ? item.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs shadow-2xs rounded-xl">
                                Submit Work
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-[#292724] font-serif font-bold">Submit Assignment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 py-2">
                                <Label className="text-[#292724] text-xs font-bold">Submission Details / Drive Link</Label>
                                <Input
                                  placeholder="Paste document link or summary..."
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  className="bg-white border-[#E5DCD0] text-[#292724] text-xs rounded-xl"
                                />
                              </div>
                              <Button className="w-full bg-[#E76F51] text-white font-bold text-xs" onClick={() => handleSubmitAssignment(item.id)}>
                                Confirm Submission
                              </Button>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-xs font-bold text-[#75B798] flex items-center">
                            <Check className="w-4 h-4 mr-1" /> Submitted
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI STUDY TUTOR TAB */}
            <TabsContent value="qna" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col bg-[#FFF9F1]/95 backdrop-blur-md border border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E5DCD0]">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E76F51]" /> AI Study Tutor Workspace ({currentClass.code})
                    </CardTitle>
                    <CardDescription className="text-[#77716A] text-xs">Contextual AI tutoring workspace with quick action prompts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAiMessages([])} className="text-xs border-[#E5DCD0] text-[#77716A] hover:bg-[#F1E8DD] rounded-xl">
                    Clear Chat
                  </Button>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-4 justify-between min-h-[450px]">
                  {/* Contextual Action Chips */}
                  <div className="flex flex-wrap gap-2 pb-3 border-b border-[#E5DCD0]">
                    <button 
                      onClick={() => handleSendMessage(`Explain ${currentClass.name} concepts simply`)}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      💡 Explain this simply
                    </button>
                    <button 
                      onClick={() => handleSendMessage(`Give me an example problem for ${currentClass.name}`)}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      💻 Give me an example
                    </button>
                    <button 
                      onClick={() => handleSendMessage(`Quiz me on ${currentClass.name}`)}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      🎯 Quiz me on this
                    </button>
                    <button 
                      onClick={() => handleSendMessage(`Explain step-by-step for ${currentClass.name}`)}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      🔍 Explain step-by-step
                    </button>
                  </div>

                  <ScrollArea className="flex-1 pr-4 py-4 max-h-[380px] overflow-y-auto">
                    <div className="space-y-4">
                      {aiMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-2xs leading-relaxed ${
                            msg.type === "user"
                              ? "bg-[#E76F51] text-white rounded-br-none font-semibold"
                              : "bg-[#F1E8DD]/80 text-[#292724] border border-[#E5DCD0] rounded-bl-none font-normal"
                          }`}>
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#F1E8DD] border border-[#E5DCD0] text-[#77716A] text-xs px-4 py-2 rounded-2xl animate-pulse">
                            AI Tutor is processing...
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center space-x-2 pt-4 border-t border-[#E5DCD0]">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Ask your AI tutor about ${currentClass.name}...`}
                      className="bg-white border-[#E5DCD0] text-[#292724] text-xs rounded-xl"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={() => handleSendMessage()} className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs shadow-2xs rounded-xl">
                      <Send className="w-4 h-4 mr-1.5" /> Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Practice & Mock Test Tab */}
            <TabsContent value="prep" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#292724] text-base font-serif font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-[#E76F51]" /> Multiple Choice Quizzes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-[#77716A]">Test conceptual understanding for {currentClass.name}.</p>
                    <Button className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs shadow-2xs rounded-xl" onClick={() => toast.info(`Launching ${currentClass.name} quiz...`)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Start Quiz
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#292724] text-base font-serif font-bold">
                      <Circle className="w-4 h-4 mr-2 text-[#8B7EC8]" /> Tactile Flashcards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-[#77716A]">Practice quick recall of key definitions in {currentClass.code}.</p>
                    <Button className="w-full bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold text-xs shadow-2xs rounded-xl" onClick={() => toast.info(`Opening ${currentClass.code} flashcard deck...`)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Review Deck
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#292724] text-base font-serif font-bold">
                      <AlertCircle className="w-4 h-4 mr-2 text-[#75B798]" /> Timed Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-[#77716A]">Simulate exam conditions with a timed mock test.</p>
                    <Button className="w-full bg-[#75B798] hover:bg-[#64a687] text-white font-bold text-xs shadow-2xs rounded-xl" onClick={() => toast.info("Launching mock assessment...")}>
                      <Trophy className="w-4 h-4 mr-2" /> Take Mock Test
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}