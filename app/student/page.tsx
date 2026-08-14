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
    { type: "ai", content: "Hello! I am your **AI Learning Tutor**. Ask me any question about your courses, code logic, or study topics!" }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Enrolled classes state
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([
    { id: 1, name: "Data Structures & Algorithms", code: "CS201", icon: <PenTool className="w-4 h-4 text-indigo-600" /> },
    { id: 2, name: "Operating Systems & Linux", code: "CS302", icon: <Book className="w-4 h-4 text-purple-600" /> },
    { id: 3, name: "Database & System Design", code: "CS305", icon: <BookOpen className="w-4 h-4 text-cyan-600" /> },
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

  const handleSendMessage = async () => {
    const messageToSend = inputMessage.trim()
    if (!messageToSend) return

    if (aiQueryCount >= 5) {
      toast.warning("Free daily AI query limit reached (5/5). Upgrade for unlimited access!")
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
      // Offline fallback
    }

    setTimeout(() => {
      let aiResponse = `Here is a breakdown for **"${messageToSend}"**:\n\n`
      const lower = messageToSend.toLowerCase()
      if (lower.includes("tree") || lower.includes("dsa") || lower.includes("binary") || lower.includes("search")) {
        aiResponse += `• **Binary Search Tree Property**: Left child < parent < right child.\n• **Search Time**: \\(O(\\log N)\\) average time complexity.`
      } else if (lower.includes("os") || lower.includes("process") || lower.includes("memory")) {
        aiResponse += `• **Process vs Thread**: A process is an independent executing program with its own memory space; threads share process memory.`
      } else {
        aiResponse += `Great question! You can trace algorithm execution line-by-line in the **Code Trace** tab or generate study decks in the **Notes AI** tab.`
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
      icon: <Book className="w-4 h-4 text-indigo-600" />
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
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Clean Subtle Background */}
      <AnimatedLearningBackground />

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs">
            EB
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Student Workspace</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">EduMeet.Ai Learning Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs rounded-xl"
            onClick={() => setPricingOpen(true)}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Upgrade Pro
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{studentName}</p>
            <p className="text-[10px] text-slate-500">{studentEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600 border-slate-200 text-xs font-semibold rounded-xl">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="student" />

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200/80 bg-white/70 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl shadow-xs text-xs">
                  <Plus className="w-4 h-4 mr-1.5" /> Join Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 font-black">Join Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="classCode" className="text-slate-700 text-xs font-bold">Class Code</Label>
                    <Input
                      id="classCode"
                      placeholder="e.g. CS201 or CODE123"
                      value={joinClassCode}
                      onChange={(e) => setJoinClassCode(e.target.value)}
                      className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs"
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

            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">Enrolled Courses</h2>
            <ul className="space-y-1">
              {enrolledClasses.map((cls) => {
                const isActive = activeClass === cls.id
                return (
                  <li key={cls.id}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left font-bold rounded-xl px-3 py-2 transition-all text-xs ${
                        isActive ? "bg-indigo-50 text-indigo-900 border border-indigo-100 font-extrabold shadow-2xs" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

          <div className="mt-8 pt-4 border-t border-slate-200/80 space-y-3">
            {/* Free Tier AI Limit Badge */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span className="flex items-center gap-1 text-indigo-700"><Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Daily AI Limit</span>
                <span className="text-slate-900 font-mono">{aiQueryCount} / 5</span>
              </div>
              <Progress value={(aiQueryCount / 5) * 100} className="h-1.5 bg-slate-200" />
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Tabs defaultValue="progress" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 max-w-3xl bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs mb-6">
              <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-bold text-xs data-[state=active]:shadow-2xs">
                Progress
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-bold text-xs data-[state=active]:shadow-2xs">
                Code Trace
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-bold text-xs data-[state=active]:shadow-2xs">
                Notes AI
              </TabsTrigger>
              <TabsTrigger value="assessments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-bold text-xs data-[state=active]:shadow-2xs">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="qna" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-bold text-xs data-[state=active]:shadow-2xs">
                AI Tutor
              </TabsTrigger>
              <TabsTrigger value="prep" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-bold text-xs data-[state=active]:shadow-2xs">
                Practice
              </TabsTrigger>
            </TabsList>

            {/* Student Progress Tracker Tab */}
            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Course Completion</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">76%</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center font-bold">
                      <Trophy className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Study Streak</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">5 Days 🔥</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quiz Accuracy</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">92%</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed Tasks</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">12 / 15</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl flex items-center justify-center font-bold">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Mastery */}
              <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-black text-slate-900">Enrolled Courses Progress</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">Real-time completion across active study modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">Data Structures & Algorithms</span>
                      <span className="text-indigo-600 font-mono">85%</span>
                    </div>
                    <Progress value={85} className="h-2 bg-slate-100" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">Operating Systems & Linux</span>
                      <span className="text-purple-600 font-mono">70%</span>
                    </div>
                    <Progress value={70} className="h-2 bg-slate-100" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">Database & System Design</span>
                      <span className="text-cyan-600 font-mono">65%</span>
                    </div>
                    <Progress value={65} className="h-2 bg-slate-100" />
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
              <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-base font-black">Active Assignments</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">View due tasks and submit completed coursework</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="divide-y divide-slate-100">
                    {assessments.map((item) => (
                      <li key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === "Submitted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {item.status}
                            </span>
                            <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{item.subject} • Due: {item.dueDate}</p>
                        </div>

                        {item.status === "Pending" ? (
                          <Dialog open={submittingId === item.id} onOpenChange={(open) => setSubmittingId(open ? item.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs rounded-xl">
                                Submit Work
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-slate-900 font-black">Submit Assignment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 py-2">
                                <Label className="text-slate-700 text-xs font-bold">Submission Details / Drive Link</Label>
                                <Input
                                  placeholder="Paste document link or summary..."
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl"
                                />
                              </div>
                              <Button className="w-full bg-indigo-600 text-white font-bold text-xs" onClick={() => handleSubmitAssignment(item.id)}>
                                Confirm Submission
                              </Button>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center">
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
              <Card className="flex-1 flex flex-col bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-slate-900 font-black text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> AI Study Assistant
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs">Ask questions, request explanations, or get step-by-step help</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAiMessages([])} className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl">
                    Clear Chat
                  </Button>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-4 justify-between min-h-[450px]">
                  <ScrollArea className="flex-1 pr-4 max-h-[460px] overflow-y-auto">
                    <div className="space-y-4">
                      {aiMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-2xs leading-relaxed ${
                            msg.type === "user"
                              ? "bg-indigo-600 text-white rounded-br-none font-semibold"
                              : "bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none font-normal"
                          }`}>
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 border border-slate-200 text-slate-500 text-xs px-4 py-2 rounded-2xl animate-pulse">
                            AI is thinking...
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center space-x-2 pt-4 border-t border-slate-100 mt-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask any study question..."
                      className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs rounded-xl">
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
                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-900 text-base font-black">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-600" /> Multiple Choice Quizzes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-600">Test your conceptual understanding with topic MCQs.</p>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs rounded-xl" onClick={resetMcq}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Start Quiz
                    </Button>
                  </CardContent>
                </Card>

                {/* One Word Card */}
                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-900 text-base font-black">
                      <Circle className="w-4 h-4 mr-2 text-purple-600" /> One-Word Flashcards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-600">Practice quick recall of key technical definitions.</p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs rounded-xl" onClick={() => setOneWordOpen(true)}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Practice Flashcards
                    </Button>
                  </CardContent>
                </Card>

                {/* Mock Test Card */}
                <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-900 text-base font-black">
                      <AlertCircle className="w-4 h-4 mr-2 text-cyan-600" /> Timed Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-slate-600">Simulate exam conditions with a timed mock test.</p>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs rounded-xl" onClick={() => { setMockTestOpen(true); setMockTestFinished(false) }}>
                      <Trophy className="w-4 h-4 mr-2" /> Take Mock Test
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* MCQ Quiz Dialog */}
              <Dialog open={mcqModalOpen} onOpenChange={setMcqModalOpen}>
                <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 font-black">Topic Quiz</DialogTitle>
                  </DialogHeader>
                  {!quizFinished ? (
                    <div className="space-y-4 py-2">
                      <p className="text-xs font-bold text-slate-500">Question {currentQuestionIdx + 1} of {mcqQuestions.length}</p>
                      <p className="font-bold text-slate-900 text-sm">{mcqQuestions[currentQuestionIdx].question}</p>

                      <RadioGroup value={selectedOption !== null ? selectedOption.toString() : ""} onValueChange={(v) => setSelectedOption(parseInt(v))}>
                        <div className="space-y-2">
                          {mcqQuestions[currentQuestionIdx].options.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-2 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-medium">
                              <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                              <Label htmlFor={`opt-${idx}`} className="cursor-pointer font-semibold text-slate-700 w-full">{opt}</Label>
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
                      <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
                      <h3 className="text-xl font-black text-slate-900">Quiz Completed!</h3>
                      <p className="text-slate-600 text-xs font-semibold">You scored <strong>{mcqScore}</strong> out of <strong>{mcqQuestions.length}</strong>.</p>
                      <Button className="bg-indigo-600 text-white font-bold text-xs" onClick={() => setMcqModalOpen(false)}>
                        Close & Save Result
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* One Word Questions Dialog */}
              <Dialog open={oneWordOpen} onOpenChange={setOneWordOpen}>
                <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-purple-600 font-black">Revision Flashcard</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4 text-center">
                    <p className="text-xs font-bold text-slate-500">Card {oneWordIdx + 1} of {oneWordQA.length}</p>
                    <p className="font-bold text-slate-900 text-base">{oneWordQA[oneWordIdx].question}</p>

                    {showOneWordAnswer ? (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-bold text-sm">
                        Answer: {oneWordQA[oneWordIdx].answer}
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 text-xs font-bold" onClick={() => setShowOneWordAnswer(true)}>
                        Reveal Answer
                      </Button>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={oneWordIdx === 0}
                        className="text-slate-500 text-xs font-bold"
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
                <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-cyan-600 font-black">Timed Mock Assessment</DialogTitle>
                  </DialogHeader>
                  {!mockTestFinished ? (
                    <div className="py-4 space-y-4">
                      <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs font-bold text-cyan-900">
                        ⏱️ Timed Session: 15 Minutes • 20 Total Questions
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        This test simulates full exam conditions. Click below when ready to submit.
                      </p>
                      <Button className="w-full bg-cyan-600 text-white font-bold text-xs" onClick={() => { setMockTestFinished(true); toast.success("Mock test submitted!") }}>
                        Submit Mock Exam
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <FileCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-slate-900 text-base">Mock Exam Submitted</h4>
                      <p className="text-xs text-slate-500">Your score report has been saved to your student progress profile.</p>
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