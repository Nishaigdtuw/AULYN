'use client'

import React, { useEffect, useState, useCallback } from "react"
import { FileText, Download, ArrowUpRight, Menu, LogOut, ChevronDown, ChevronRight, Settings, LayoutDashboard, FolderOpen, Eye, Send, Bell, User, Save, BookOpen, Sparkles, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import CodeVisualizer from "@/components/code-visualizer"
import PricingModal from "@/components/pricing-modal"
import { QuizModal, FlashcardsModal, MockTestModal } from "@/components/practice-modals"
import { AiTutorDialog } from "@/components/ai-tutor-dialog"
import { getStoredClassrooms, ClassroomData, saveSubmission, getSubmissions, SubmissionData } from "@/lib/data-store"
import { getAuthenticatedUser, clearAuthenticatedUser } from "@/lib/auth-guard"

export default function StudentPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId?: string; name?: string; email?: string; role?: string } | null>(null)

  // Classrooms Data Store
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [activeClassroom, setActiveClassroom] = useState<ClassroomData | null>(null)
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0)

  // Settings State
  const [studentName, setStudentName] = useState("Alex Rivera")
  const [studentEmail, setStudentEmail] = useState("alex.rivera@aulyn.edu")
  const [studentMajor, setStudentMajor] = useState("Computer Science & Engineering")

  // Workspace tab & sidebar navigation
  const [activeMainTab, setActiveMainTab] = useState("overview")
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  // Modals state
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false)
  const [mockTestModalOpen, setMockTestModalOpen] = useState(false)
  const [aiTutorOpen, setAiTutorOpen] = useState(false)

  // Loaded Notes state
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [activeNoteText, setActiveNoteText] = useState<string>("")
  const [activeNoteFile, setActiveNoteFile] = useState<string>("Trees_Lecture_Notes.pdf")

  // Submission Form State
  const [submissionText, setSubmissionText] = useState("")
  const [userSubmissions, setUserSubmissions] = useState<SubmissionData[]>([])

  // Sidebar Expandable Submenus
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    tools: true,
    practice: true
  })

  // Data Reload Handler with URL search param sync
  const loadClassroomData = useCallback(() => {
    const list = getStoredClassrooms()
    setClassrooms(list)

    if (list.length > 0) {
      let target = list[0]
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        const classParam = params.get("class")
        if (classParam) {
          const found = list.find((c) => c.classId === classParam || c.code.toLowerCase() === classParam.toLowerCase())
          if (found) target = found
        } else if (activeClassroom) {
          const found = list.find((c) => c.classId === activeClassroom.classId)
          if (found) target = found
        }
      }

      setActiveClassroom(target)
      const firstChap = target.chapters[0]
      if (firstChap) {
        setActiveNoteText(firstChap.sourceNoteContent)
        setActiveNoteFile(firstChap.sourceNoteFile)
      } else {
        setActiveNoteText("")
        setActiveNoteFile("")
      }
    }
  }, [activeClassroom])

  useEffect(() => {
    loadClassroomData()
    window.addEventListener("aulyn-data-update", loadClassroomData)
    return () => window.removeEventListener("aulyn-data-update", loadClassroomData)
  }, [loadClassroomData])

  // Authenticated Session Check
  useEffect(() => {
    const user = getAuthenticatedUser()
    if (!user) {
      router.replace("/")
      return
    }
    if (user.role === "teacher") {
      toast.info("Redirected to Teacher Command Center")
      router.replace("/teacher")
      return
    }
    setSelf(user)
    if (user.name) setStudentName(user.name)
    if (user.email) setStudentEmail(user.email)

    // Load Submissions
    setUserSubmissions(getSubmissions())
  }, [router])

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }))
  }

  // Robust Classroom Switch Handler
  const handleSelectClassroom = (cls: ClassroomData) => {
    setActiveClassroom(cls)
    setSelectedChapterIdx(0)
    const firstChap = cls.chapters[0]
    if (firstChap) {
      setActiveNoteText(firstChap.sourceNoteContent)
      setActiveNoteFile(firstChap.sourceNoteFile)
    } else {
      setActiveNoteText("")
      setActiveNoteFile("")
    }
    setMobileDrawerOpen(false)

    // Sync URL Search Parameter e.g. /student?class=math-101
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set("class", cls.classId)
        window.history.pushState({}, "", url.toString())
      } catch {
        // Safe catch
      }
    }

    toast.info(`Switched Active Classroom: ${cls.className} (${cls.code})`)
  }

  // Functional Load Notes
  const handleLoadNotes = () => {
    if (!activeClassroom) return
    setIsNotesLoading(true)
    const toastId = toast.loading(`Loading lecture notes for ${activeClassroom.className}...`)

    setTimeout(() => {
      const activeChap = activeClassroom.chapters[selectedChapterIdx] || activeClassroom.chapters[0]
      if (activeChap) {
        setActiveNoteText(activeChap.sourceNoteContent)
        setActiveNoteFile(activeChap.sourceNoteFile)
        toast.success(`Notes Loaded: "${activeChap.chapterName}"`, { id: toastId })
      } else {
        toast.error("Notes unavailable for selected chapter", { id: toastId })
      }
      setIsNotesLoading(false)
    }, 400)
  }

  // Material View/Open Handler
  const handleViewMaterial = (fileName: string, fileUrl?: string) => {
    const urlToUse = fileUrl || `/materials/${fileName}`
    toast.info(`Opening "${fileName}"...`)
    window.open(urlToUse, "_blank")
  }

  // Material Download Handler
  const handleDownloadMaterial = (fileName: string, fileUrl?: string) => {
    toast.info(`Downloading "${fileName}"...`)
    try {
      const urlToUse = fileUrl || `/materials/${fileName}`
      const a = document.createElement("a")
      a.href = urlToUse
      a.download = fileName
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`Downloaded "${fileName}" successfully!`)
    } catch {
      toast.error("Download failed. Please check network connection.")
    }
  }

  // Assignment Submission Handler
  const handleSubmitAssignment = (asgnId: string, asgnTitle: string) => {
    if (!submissionText.trim()) {
      toast.warning("Please type or attach your solution text before submitting")
      return
    }

    const sub: SubmissionData = {
      submissionId: `sub-${Date.now()}`,
      assignmentId: asgnId,
      assignmentTitle: asgnTitle,
      studentId: self?.userId || "student-demo",
      studentName: studentName,
      classId: activeClassroom?.classId || "dsa-2026",
      submittedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content: submissionText.trim(),
      status: "Submitted"
    }

    saveSubmission(sub)
    setUserSubmissions(getSubmissions())
    setSubmissionText("")
    toast.success(`Assignment "${asgnTitle}" submitted to ${activeClassroom?.instructor}!`)
  }

  // Save Settings & Persist Profile
  const handleSaveSettings = () => {
    const updatedUser = {
      ...(self || {}),
      userId: self?.userId || "student-demo",
      name: studentName,
      email: studentEmail,
      role: "student" as const
    }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setSelf(updatedUser)
    toast.success("Profile & Preferences saved successfully!")
  }

  const handleLogout = () => {
    clearAuthenticatedUser()
    toast.info("Logged out.")
    router.replace("/")
  }

  const currentChapter = activeClassroom?.chapters[selectedChapterIdx] || activeClassroom?.chapters[0]

  // Sidebar Content Render Component
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Ask AI Tutor Banner Trigger */}
        <Button
          onClick={() => { setAiTutorOpen(true); setMobileDrawerOpen(false) }}
          className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#E9B949]" /> Ask AI Tutor (Vision Enabled)
        </Button>

        {/* Structured Expandable Submenus */}
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => { setActiveMainTab("overview"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
              activeMainTab === "overview" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Dashboard Overview
          </button>

          {/* Enrolled Classes Submenu */}
          <div>
            <button
              onClick={() => toggleSection("classes")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200 cursor-pointer"
            >
              <span className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Enrolled Classrooms
              </span>
              {expandedSections.classes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.classes && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                {classrooms.map((cls) => (
                  <button
                    key={cls.classId}
                    onClick={() => handleSelectClassroom(cls)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate transition-all duration-200 cursor-pointer ${
                      activeClassroom?.classId === cls.classId ? "bg-[#FFF9F1] text-[#E76F51] font-bold shadow-2xs border border-[#E5DCD0]" : "text-[#77716A] hover:text-[#292724]"
                    }`}
                  >
                    {cls.code}: {cls.className}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Practice Workflows */}
          <div>
            <button
              onClick={() => toggleSection("practice")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200 cursor-pointer"
            >
              <span className="flex items-center">
                <Award className="w-4 h-4 mr-2.5 text-[#75B798]" /> Practice & Mock Tests
              </span>
              {expandedSections.practice ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.practice && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setQuizModalOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer">
                  🎯 Start Chapter Quiz
                </button>
                <button onClick={() => { setFlashcardsModalOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer">
                  🃏 Review Flashcard Deck
                </button>
                <button onClick={() => { setMockTestModalOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer">
                  ⏱️ Take Timed Mock Test
                </button>
              </div>
            )}
          </div>

          {/* Code Visualizer */}
          <button
            onClick={() => { setActiveMainTab("visualizer"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
              activeMainTab === "visualizer" ? "bg-[#F1E8DD] text-[#8B7EC8] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <FolderOpen className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Code Trace Visualizer
          </button>

          {/* Settings */}
          <button
            onClick={() => { setActiveMainTab("settings"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
              activeMainTab === "settings" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <Settings className="w-4 h-4 mr-2.5 text-[#77716A]" /> Settings & Profile
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E5DCD0] space-y-3">
        <Button variant="ghost" className="w-full justify-start text-[#77716A] hover:text-[#E76F51] text-xs font-semibold cursor-pointer" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent text-[#292724] flex flex-col justify-between relative overflow-x-hidden animate-in fade-in-50 duration-300">
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
                <SheetTitle className="text-left font-serif font-bold text-[#292724]">AULYN Student</SheetTitle>
              </SheetHeader>
              <div className="pt-4 h-[calc(100vh-120px)]">
                <RenderSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          <img src="/aulyn-logo.png" alt="AULYN Logo" className="w-9 h-9 object-contain rounded-lg shadow-2xs hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-base sm:text-lg font-serif font-black text-[#292724] leading-none tracking-tight">AULYN</h1>
            <p className="text-[10px] text-[#77716A] font-medium mt-0.5 hidden sm:block">Student Workspace</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3.5">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E5DCD0] bg-[#FFF9F1] text-[#292724] hover:bg-[#F1E8DD] font-bold text-xs rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            onClick={() => setPricingOpen(true)}
          >
            Upgrade to Pro
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#292724]">{studentName}</p>
            <p className="text-[10px] font-semibold text-[#4A453F]">{studentEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#77716A] hover:text-red-600 border-[#E5DCD0] text-xs font-semibold rounded-xl cursor-pointer">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      {/* Pricing & Practice Modals */}
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="student" />
      {activeClassroom && (
        <>
          <QuizModal
            open={quizModalOpen}
            onOpenChange={setQuizModalOpen}
            quiz={activeClassroom.quizzes[0] || { quizId: `quiz-${activeClassroom.classId}`, chapterId: "c1", title: `${activeClassroom.code} Practice Quiz`, topic: activeClassroom.subject, timeMinutes: 10, totalMarks: 20, questions: [] }}
            classroom={activeClassroom}
            studentName={studentName}
          />
          <FlashcardsModal
            open={flashcardsModalOpen}
            onOpenChange={setFlashcardsModalOpen}
            flashcards={activeClassroom.flashcards}
            classroom={activeClassroom}
          />
          <MockTestModal
            open={mockTestModalOpen}
            onOpenChange={setMockTestModalOpen}
            classroom={activeClassroom}
            studentName={studentName}
          />
          <AiTutorDialog
            open={aiTutorOpen}
            onOpenChange={setAiTutorOpen}
            activeClassName={activeClassroom.className}
            activeChapterName={currentChapter?.chapterName || "General"}
            sourceNoteContent={activeNoteText}
          />
        </>
      )}

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Desktop Sidebar (≥ lg screens) */}
        <aside className="w-64 border-r border-[#E5DCD0] bg-[#FFF9F1]/85 backdrop-blur-md p-5 hidden lg:flex flex-col justify-between overflow-y-auto">
          <RenderSidebarContent />
        </aside>

        {/* Main Student Workspace */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* Header Greeting Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFF9F1]/90 backdrop-blur-md p-5 rounded-2xl border border-[#E5DCD0] shadow-sm">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#292724] tracking-tight">
                Good morning, {studentName.split(" ")[0] || "Alex"}.
              </h2>
              <p className="text-xs font-bold text-[#292724] mt-1">
                Active Classroom: <span className="text-[#E76F51] font-bold">{activeClassroom?.className}</span> ({activeClassroom?.code}) • Professor: <span className="text-[#8B7EC8] font-bold">{activeClassroom?.instructor}</span>
              </p>
            </div>

            {/* Classroom Selector Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {classrooms.map((cls) => (
                <button
                  key={cls.classId}
                  onClick={() => handleSelectClassroom(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                    activeClassroom?.classId === cls.classId
                      ? "bg-[#E76F51] text-white shadow-2xs"
                      : "bg-[#F1E8DD] text-[#292724] hover:bg-[#E5DCD0]"
                  }`}
                >
                  {cls.code}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 max-w-xl bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs mb-6">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Overview
              </TabsTrigger>
              <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Materials & Notes
              </TabsTrigger>
              <TabsTrigger value="visualizer" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Code IDE
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Classroom Announcement Banner */}
              {activeClassroom?.announcements && activeClassroom.announcements.length > 0 && (
                <div className="p-4 bg-[#FFF9F1]/95 border-2 border-[#E76F51]/40 rounded-2xl shadow-sm backdrop-blur-md flex items-start space-x-3.5">
                  <div className="w-9 h-9 bg-[#E76F51]/15 text-[#E76F51] border border-[#E76F51]/30 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-serif font-bold text-[#292724]">{activeClassroom.announcements[0].title}</h4>
                      <span className="text-[10px] font-bold text-[#E76F51] bg-[#E76F51]/10 px-2 py-0.5 rounded-full">
                        {activeClassroom.announcements[0].author}
                      </span>
                    </div>
                    <p className="text-xs text-[#292724] font-semibold mt-0.5">{activeClassroom.announcements[0].content}</p>
                  </div>
                </div>
              )}

              {/* Quick Practice Modules Trigger Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  onClick={() => setQuizModalOpen(true)}
                  className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center justify-between">
                      Start Chapter Quiz <ArrowUpRight className="w-4 h-4 text-[#E76F51] group-hover:translate-x-0.5 transition-transform" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-serif font-bold text-[#E76F51]">Interactive MCQs</div>
                    <p className="text-xs text-[#77716A] font-semibold mt-1">Test mastery on {activeClassroom?.code}</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setFlashcardsModalOpen(true)}
                  className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center justify-between">
                      Review Flashcard Deck <ArrowUpRight className="w-4 h-4 text-[#8B7EC8] group-hover:translate-x-0.5 transition-transform" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-serif font-bold text-[#8B7EC8]">3D Flip Cards</div>
                    <p className="text-xs text-[#77716A] font-semibold mt-1">Active recall for key definitions</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setMockTestModalOpen(true)}
                  className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center justify-between">
                      Take Timed Mock Test <ArrowUpRight className="w-4 h-4 text-[#75B798] group-hover:translate-x-0.5 transition-transform" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-serif font-bold text-[#75B798]">Timed Examination</div>
                    <p className="text-xs text-[#77716A] font-semibold mt-1">Simulate exam under pressure</p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Course Assignments */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#E76F51]" /> Active Assignments ({activeClassroom?.className})
                  </CardTitle>
                  <CardDescription className="text-[#292724] font-semibold text-xs">
                    Submit solutions before the deadline for {activeClassroom?.instructor}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeClassroom?.assignments.map((asgn) => (
                    <div key={asgn.id} className="p-4 bg-white border border-[#E5DCD0] rounded-xl space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#292724]">{asgn.title}</h4>
                          <p className="text-xs font-semibold text-[#77716A]">
                            Format: {asgn.type} • Max Marks: {asgn.totalMarks} • Due: {asgn.dueDate}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-1 rounded-full border border-[#E76F51]/30 self-start sm:self-auto">
                          {asgn.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-[#292724] font-medium bg-[#F1E8DD]/40 p-2.5 rounded-lg border border-[#E5DCD0]/60">
                        {asgn.instructions}
                      </p>

                      {/* Submission Input Box */}
                      <div className="space-y-2">
                        <Input
                          placeholder="Paste solution text, code link, or notes answer here..."
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                        />
                        <Button
                          onClick={() => handleSubmitAssignment(asgn.id, asgn.title)}
                          className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 rounded-xl shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Solution
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Submissions Tracker History */}
              {userSubmissions.filter((s) => s.classId === activeClassroom?.classId).length > 0 && (
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Submissions History ({activeClassroom?.code})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {userSubmissions.filter((s) => s.classId === activeClassroom?.classId).map((sub) => (
                      <div key={sub.submissionId} className="p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs flex items-center justify-between font-bold">
                        <div>
                          <p className="text-[#292724]">{sub.assignmentTitle}</p>
                          <p className="text-[10px] text-[#77716A]">Submitted: {sub.submittedAt}</p>
                        </div>
                        <span className="text-[10px] text-[#75B798] bg-[#75B798]/10 border border-[#75B798]/30 px-2.5 py-0.5 rounded-full font-mono">
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* MATERIALS & NOTES TAB */}
            <TabsContent value="materials" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Course Materials & Lecture Notes</CardTitle>
                    <CardDescription className="text-[#292724] font-semibold text-xs">
                      Official lecture slides and study documents for {activeClassroom?.className}
                    </CardDescription>
                  </div>

                  {/* Load Notes Trigger Button */}
                  <Button
                    onClick={handleLoadNotes}
                    disabled={isNotesLoading}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 mr-1.5" /> {isNotesLoading ? "Loading..." : "Load Active Notes"}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Chapter Selector */}
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs font-bold text-[#292724]">Select Chapter:</Label>
                    <select
                      value={selectedChapterIdx}
                      onChange={(e) => {
                        const idx = Number(e.target.value)
                        setSelectedChapterIdx(idx)
                        const ch = activeClassroom?.chapters[idx]
                        if (ch) {
                          setActiveNoteText(ch.sourceNoteContent)
                          setActiveNoteFile(ch.sourceNoteFile)
                        }
                      }}
                      className="bg-white border border-[#E5DCD0] text-[#292724] font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      {activeClassroom?.chapters.map((ch, idx) => (
                        <option key={ch.chapterId} value={idx}>
                          {ch.chapterName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Real Materials File List */}
                  <div className="space-y-2">
                    {activeClassroom?.materials.map((mat) => (
                      <div key={mat.fileId} className="p-3.5 bg-white border border-[#E5DCD0] rounded-xl text-xs font-bold text-[#292724] flex items-center justify-between shadow-2xs hover:border-[#E76F51]/40 transition-colors">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#E76F51]" /> {mat.fileName} <span className="text-[10px] text-[#77716A]">({mat.size})</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMaterial(mat.fileName, mat.fileUrl)}
                            className="text-[11px] text-[#8B7EC8] border-[#E5DCD0] hover:bg-[#8B7EC8] hover:text-white font-bold h-7 px-3 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadMaterial(mat.fileName, mat.fileUrl)}
                            className="text-[11px] text-[#E76F51] border-[#E5DCD0] hover:bg-[#E76F51] hover:text-white font-bold h-7 px-3 rounded-lg cursor-pointer"
                          >
                            <Download className="w-3 h-3 mr-1" /> Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CODE IDE TAB */}
            <TabsContent value="visualizer" className="animate-in fade-in-50 duration-200">
              <CodeVisualizer
                sourceNoteText={activeNoteText}
                sourceFileName={activeNoteFile}
                activeClassName={activeClassroom?.className || "Data Structures & Algorithms"}
              />
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-[#E76F51]" /> Student Profile & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#292724]">Full Name</Label>
                      <Input
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#292724]">Email Address</Label>
                      <Input
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#292724]">Academic Major / Specialization</Label>
                    <Input
                      value={studentMajor}
                      onChange={(e) => setStudentMajor(e.target.value)}
                      className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-1.5" /> Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}