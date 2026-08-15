'use client'
import React, { useEffect, useState } from "react"
import { Book, BookOpen, LogOut, PenTool, Send, CheckCircle2, Circle, AlertCircle, Plus, Sparkles, Check, FileCheck, PlayCircle, Trophy, Flame, Award, Crown, Compass, Clock, ArrowUpRight } from "lucide-react"
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
import AnimatedLearningBackground from "@/components/animated-learning-background"

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
    { type: "ai", content: "Hello Alex! I am your **AI Study Tutor**. Ask me any question or tap a quick prompt chip below to begin." }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Enrolled classes state
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([
    { id: 1, name: "Data Structures & Algorithms", code: "CS201", icon: <PenTool className="w-4 h-4 text-[#E76F51]" /> },
    { id: 2, name: "Operating Systems & Linux", code: "CS302", icon: <Book className="w-4 h-4 text-[#8B7EC8]" /> },
    { id: 3, name: "Database & System Design", code: "CS305", icon: <BookOpen className="w-4 h-4 text-[#75B798]" /> },
  ])
  const [joinClassCode, setJoinClassCode] = useState("")

  // Assignments state
  const [assessments, setAssessments] = useState<AssessmentItem[]>([
    { id: 1, title: "Binary Search Tree Implementation", subject: "Data Structures & Algorithms", dueDate: "2026-08-20", status: "Pending" },
    { id: 2, title: "Operating System Process Scheduling Essay", subject: "Operating Systems & Linux", dueDate: "2026-08-22", status: "Pending" },
    { id: 3, title: "SQL Indexing & Normalization Report", subject: "Database & System Design", dueDate: "2026-08-25", status: "Pending" },
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
      question: "Which traversal of a Binary Search Tree produces sorted ascending order?",
      options: ["Pre-order", "In-order", "Post-order", "Level-order"],
      correct: 1
    },
    {
      question: "Which data structure uses LIFO (Last In First Out)?",
      options: ["Queue", "Array", "Stack", "Tree"],
      correct: 2
    },
    {
      question: "What is the average time complexity of searching in a balanced BST?",
      options: ["O(1)", "O(N)", "O(log N)", "O(N²)"],
      correct: 2
    }
  ]

  // One Word Questions State
  const [oneWordOpen, setOneWordOpen] = useState(false)
  const [oneWordIdx, setOneWordIdx] = useState(0)
  const [showOneWordAnswer, setShowOneWordAnswer] = useState(false)

  const oneWordQA = [
    { question: "Which algorithm sorts elements in O(N log N) average time?", answer: "QuickSort" },
    { question: "What OS concept handles concurrent access to shared resources?", answer: "Semaphore / Mutex" },
    { question: "What data structure is used for Breadth First Search (BFS)?", answer: "Queue" }
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
      // Offline fallback
    }

    setTimeout(() => {
      let aiResponse = `Here is your requested guidance for **"${messageToSend}"**:\n\n`
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
    const newClass: EnrolledClass = {
      id: Date.now(),
      name: `Class (${joinClassCode.toUpperCase()})`,
      code: joinClassCode.toUpperCase(),
      icon: <Book className="w-4 h-4 text-[#E76F51]" />
    }
    setEnrolledClasses((prev) => [...prev, newClass])
    setActiveClass(newClass.id)
    setJoinClassCode("")
    toast.success(`Joined ${newClass.name}!`)
  }

  const handleSubmitAssignment = (id: number) => {
    if (!submissionText.trim()) {
      toast.warning("Please enter your submission details")
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
    <div className="min-h-screen bg-[#F4EFE7] text-[#292724] flex flex-col justify-between relative overflow-hidden">
      {/* Clean Abstract Atmospheric Background */}
      <AnimatedLearningBackground />

      {/* Header Bar */}
      <header className="flex justify-between items-center px-8 py-3.5 bg-[#FFF9F1]/80 backdrop-blur-md border-b border-[#E5DCD0] sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#E76F51] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-2xs">
            EB
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-[#292724] leading-none">Student Workspace</h1>
            <p className="text-[11px] text-[#77716A] font-medium mt-0.5">EduMeet.Ai Intelligent Workspace</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E5DCD0] bg-[#FFF9F1] text-[#292724] hover:bg-[#F1E8DD] font-bold text-xs rounded-xl"
            onClick={() => setPricingOpen(true)}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-[#E9B949]" /> Upgrade Pro
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

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#E5DCD0] bg-[#FFF9F1]/70 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-6 bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl shadow-2xs text-xs">
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
                      placeholder="e.g. CS201 or CODE123"
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

            <h2 className="text-[11px] font-bold text-[#77716A] uppercase tracking-wider mb-2.5 px-1">Enrolled Courses</h2>
            <ul className="space-y-1">
              {enrolledClasses.map((cls) => {
                const isActive = activeClass === cls.id
                return (
                  <li key={cls.id}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left font-bold rounded-xl px-3 py-2 transition-all text-xs ${
                        isActive ? "bg-[#F1E8DD] text-[#E76F51] border border-[#E5DCD0] font-extrabold shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
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

          <div className="mt-8 pt-4 border-t border-[#E5DCD0] space-y-3">
            {/* Free Tier AI Query Limit Badge */}
            <div className="p-3 bg-[#F1E8DD]/70 rounded-xl text-xs border border-[#E5DCD0] space-y-2">
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className="flex items-center gap-1 text-[#E76F51]"><Sparkles className="w-3.5 h-3.5 text-[#E76F51]" /> Daily AI Limit</span>
                <span className="text-[#292724] font-mono">{aiQueryCount} / 5</span>
              </div>
              <Progress value={(aiQueryCount / 5) * 100} className="h-1.5 bg-[#E5DCD0]" />
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Senior Designer Personal Welcoming Header (Prompt Spec) */}
          <div className="mb-6 space-y-1">
            <h2 className="text-3xl font-serif font-bold text-[#292724]">
              Good morning, {studentName.split(" ")[0]}.
            </h2>
            <p className="text-xs font-semibold text-[#77716A]">
              Ready for your next breakthrough? Here is your study overview.
            </p>
          </div>

          <Tabs defaultValue="progress" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs mb-6">
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

            {/* Overview / Student Dashboard Tab */}
            <TabsContent value="progress" className="space-y-6">
              {/* PRIMARY FOCUS CARD (Prompt Spec: "Today's Focus: Recursion — 18 min recommended") */}
              <div className="p-6 bg-gradient-to-r from-[#FFF9F1] to-[#F1E8DD] border-2 border-[#E76F51] rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E76F51]/10 text-[#E76F51] text-xs font-bold border border-[#E76F51]/20">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Today&apos;s Primary Focus</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#292724]">
                    Recursion & Call Stack Visualization
                  </h3>
                  <p className="text-xs text-[#77716A] font-medium flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#E76F51]" /> 18 min recommended session • Master base case termination & stack frames
                  </p>
                </div>

                <Button 
                  className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-xs self-start md:self-center"
                  onClick={() => toast.info("Opening Recursion study session...")}
                >
                  Start Focus Session <ArrowUpRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Course Progress</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">76%</p>
                    </div>
                    <div className="w-10 h-10 bg-[#F1E8DD] text-[#E76F51] border border-[#E5DCD0] rounded-xl flex items-center justify-center font-bold">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Study Streak</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">5 Days 🔥</p>
                    </div>
                    <div className="w-10 h-10 bg-[#E9B949]/15 text-[#E9B949] border border-[#E9B949]/30 rounded-xl flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Quiz Accuracy</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">92%</p>
                    </div>
                    <div className="w-10 h-10 bg-[#75B798]/15 text-[#75B798] border border-[#75B798]/30 rounded-xl flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Completed Tasks</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">12 / 15</p>
                    </div>
                    <div className="w-10 h-10 bg-[#8B7EC8]/15 text-[#8B7EC8] border border-[#8B7EC8]/30 rounded-xl flex items-center justify-center font-bold">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Completion Progress Bar */}
              <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-serif font-bold text-[#292724]">Enrolled Courses Mastery</CardTitle>
                  <CardDescription className="text-[#77716A] text-xs">Real-time completion across active study modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Data Structures & Algorithms</span>
                      <span className="text-[#E76F51] font-mono">85%</span>
                    </div>
                    <Progress value={85} className="h-2 bg-[#F1E8DD]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Operating Systems & Linux</span>
                      <span className="text-[#8B7EC8] font-mono">70%</span>
                    </div>
                    <Progress value={70} className="h-2 bg-[#F1E8DD]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Database & System Design</span>
                      <span className="text-[#75B798] font-mono">65%</span>
                    </div>
                    <Progress value={65} className="h-2 bg-[#F1E8DD]" />
                  </div>
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

            {/* Assignments Tab */}
            <TabsContent value="assessments" className="space-y-6">
              <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base">Active Assignments</CardTitle>
                  <CardDescription className="text-[#77716A] text-xs">View due tasks and submit completed coursework</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="divide-y divide-[#E5DCD0]">
                    {assessments.map((item) => (
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
                          <p className="text-xs text-[#77716A] mt-1">{item.subject} • Due: {item.dueDate}</p>
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

            {/* AI STUDY TUTOR TAB WITH PROMPT ACTION CHIPS (Prompt Spec) */}
            <TabsContent value="qna" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E5DCD0]">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E76F51]" /> AI Study Tutor Workspace
                    </CardTitle>
                    <CardDescription className="text-[#77716A] text-xs">Contextual AI tutoring workspace with quick action prompts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAiMessages([])} className="text-xs border-[#E5DCD0] text-[#77716A] hover:bg-[#F1E8DD] rounded-xl">
                    Clear Chat
                  </Button>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-4 justify-between min-h-[450px]">
                  {/* Contextual Action Chips (Prompt Spec: "Explain this simply", "Give me an example", "Quiz me on this", "Explain step-by-step") */}
                  <div className="flex flex-wrap gap-2 pb-3 border-b border-[#E5DCD0]">
                    <button 
                      onClick={() => handleSendMessage("Explain Recursion simply")}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      💡 Explain this simply
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Give me a code example of Recursion")}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      💻 Give me an example
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Quiz me on Recursion and Call Stacks")}
                      className="px-3 py-1 bg-[#F1E8DD] border border-[#E5DCD0] hover:border-[#E76F51] rounded-full text-xs font-bold text-[#292724] transition-colors"
                    >
                      🎯 Quiz me on this
                    </button>
                    <button 
                      onClick={() => handleSendMessage("Explain Binary Search step-by-step")}
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
                      placeholder="Ask your AI tutor anything..."
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
                {/* MCQ Card */}
                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#292724] text-base font-serif font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-[#E76F51]" /> Multiple Choice Quizzes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-[#77716A]">Test your conceptual understanding with topic MCQs.</p>
                    <Button className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs shadow-2xs rounded-xl" onClick={resetMcq}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Start Quiz
                    </Button>
                  </CardContent>
                </Card>

                {/* One Word Flashcards Card */}
                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#292724] text-base font-serif font-bold">
                      <Circle className="w-4 h-4 mr-2 text-[#8B7EC8]" /> Tactile Flashcards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-[#77716A]">Practice quick recall of key technical definitions.</p>
                    <Button className="w-full bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold text-xs shadow-2xs rounded-xl" onClick={() => setOneWordOpen(true)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Practice Flashcards
                    </Button>
                  </CardContent>
                </Card>

                {/* Mock Test Card */}
                <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-[#292724] text-base font-serif font-bold">
                      <AlertCircle className="w-4 h-4 mr-2 text-[#75B798]" /> Timed Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-[#77716A]">Simulate exam conditions with a timed mock test.</p>
                    <Button className="w-full bg-[#75B798] hover:bg-[#64a687] text-white font-bold text-xs shadow-2xs rounded-xl" onClick={() => { setMockTestOpen(true); setMockTestFinished(false) }}>
                      <Trophy className="w-4 h-4 mr-2" /> Take Mock Test
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* MCQ Quiz Dialog */}
              <Dialog open={mcqModalOpen} onOpenChange={setMcqModalOpen}>
                <DialogContent className="sm:max-w-lg bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#292724] font-serif font-bold">Topic Quiz</DialogTitle>
                  </DialogHeader>
                  {!quizFinished ? (
                    <div className="space-y-4 py-2">
                      <p className="text-xs font-bold text-[#77716A]">Question {currentQuestionIdx + 1} of {mcqQuestions.length}</p>
                      <p className="font-bold text-[#292724] text-sm">{mcqQuestions[currentQuestionIdx].question}</p>

                      <RadioGroup value={selectedOption !== null ? selectedOption.toString() : ""} onValueChange={(v) => setSelectedOption(parseInt(v))}>
                        <div className="space-y-2">
                          {mcqQuestions[currentQuestionIdx].options.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-2 p-3 border border-[#E5DCD0] rounded-xl hover:bg-[#F1E8DD]/50 cursor-pointer text-xs font-medium">
                              <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                              <Label htmlFor={`opt-${idx}`} className="cursor-pointer font-semibold text-[#292724] w-full">{opt}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>

                      <Button className="w-full bg-[#E76F51] text-white font-bold text-xs mt-4" onClick={handleNextMcq}>
                        {currentQuestionIdx + 1 === mcqQuestions.length ? "Finish Quiz" : "Next Question"}
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-4">
                      <Trophy className="w-12 h-12 text-[#E9B949] mx-auto" />
                      <h3 className="text-xl font-serif font-bold text-[#292724]">Quiz Completed!</h3>
                      <p className="text-[#77716A] text-xs font-semibold">You scored <strong>{mcqScore}</strong> out of <strong>{mcqQuestions.length}</strong>.</p>
                      <Button className="bg-[#E76F51] text-white font-bold text-xs" onClick={() => setMcqModalOpen(false)}>
                        Close & Save Result
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* One Word Flashcards Dialog */}
              <Dialog open={oneWordOpen} onOpenChange={setOneWordOpen}>
                <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#292724] font-serif font-bold">Revision Flashcard</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4 text-center">
                    <p className="text-xs font-bold text-[#77716A]">Card {oneWordIdx + 1} of {oneWordQA.length}</p>
                    <p className="font-bold text-[#292724] text-base">{oneWordQA[oneWordIdx].question}</p>

                    {showOneWordAnswer ? (
                      <div className="p-4 bg-[#F1E8DD] border border-[#E5DCD0] rounded-xl text-[#8B7EC8] font-bold text-sm">
                        Answer: {oneWordQA[oneWordIdx].answer}
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="border-[#E5DCD0] text-[#292724] text-xs font-bold" onClick={() => setShowOneWordAnswer(true)}>
                        Reveal Answer
                      </Button>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={oneWordIdx === 0}
                        className="text-[#77716A] text-xs font-bold"
                        onClick={() => { setOneWordIdx((prev) => prev - 1); setShowOneWordAnswer(false) }}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#8B7EC8] text-white font-bold text-xs"
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
                <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#292724] font-serif font-bold">Timed Mock Assessment</DialogTitle>
                  </DialogHeader>
                  {!mockTestFinished ? (
                    <div className="py-4 space-y-4">
                      <div className="p-3 bg-[#F1E8DD] border border-[#E5DCD0] rounded-xl text-xs font-bold text-[#292724]">
                        ⏱️ Timed Session: 15 Minutes • 20 Total Questions
                      </div>
                      <p className="text-xs text-[#77716A] font-medium">
                        This test simulates full exam conditions. Click below when ready to submit.
                      </p>
                      <Button className="w-full bg-[#75B798] text-white font-bold text-xs" onClick={() => { setMockTestFinished(true); toast.success("Mock test submitted!") }}>
                        Submit Mock Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <FileCheck className="w-12 h-12 text-[#75B798] mx-auto" />
                      <h4 className="font-bold text-[#292724] text-base">Mock Exam Submitted</h4>
                      <p className="text-xs text-[#77716A]">Your score report has been saved to your student progress profile.</p>
                      <Button size="sm" className="bg-[#292724] text-white text-xs font-bold" onClick={() => setMockTestOpen(false)}>Close</Button>
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