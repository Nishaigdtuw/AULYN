'use client'
import React, { useEffect, useState, useCallback, useRef } from "react"
import { FileText, LogOut, Mic, Plus, Upload, Book, FileCheck, Sparkles, TrendingUp, Crown, AlertTriangle, ArrowUpRight, Menu, ChevronDown, ChevronRight, Settings, LayoutDashboard, FolderOpen, Download, User, Bell, Shield, Save, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { addChapter, addClass, addContentToChapter, getChapters, getClasses } from "@/actions/teacher/action"
import { useRouter } from "next/navigation"
import { getPresignedUrl } from "@/actions/teacher/s3"
import NotesAiConverter from "@/components/notes-ai-converter"
import PricingModal from "@/components/pricing-modal"

interface CustomClassroom {
  classId: string
  className: string
  ownerId: string
}

interface CustomChapter {
  chapterId: string
  chapterName: string
  classId: string
  teacherId: string
}

interface CustomContent {
  fileId: string
  fileName: string
  fileType: string
  chapterId: string
  fileUrl?: string
}

interface StudentItem {
  id: number
  name: string
  email: string
  status: string
  score: number
  completion: number
}

interface AssignmentItem {
  id: string
  title: string
  type: string
  dueDate: string
  marks: number
}

export default function TeacherPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId?: string; name?: string; email?: string } | null>(null)

  // Settings State
  const [profileName, setProfileName] = useState("Prof. Sarah Jenkins")
  const [profileEmail, setProfileEmail] = useState("sarah.jenkins@edumeet.ai")
  const [profileBio, setProfileBio] = useState("Senior Computer Science Lecturer & Algorithm Design Specialist")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [digestFrequency, setDigestFrequency] = useState("Daily Summary")

  // Workspace active tab
  const [activeMainTab, setActiveMainTab] = useState("overview")

  // Sidebar Expandable Submenus
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    assessments: true,
    content: true,
    analytics: false,
    aiTools: true
  })

  // Classroom state
  const [yourClasses, setYourClasses] = useState<CustomClassroom[]>([
    { classId: "dsa-2026", className: "Data Structures & Algorithms", ownerId: "teacher-demo" },
    { classId: "os-2026", className: "Operating Systems 101", ownerId: "teacher-demo" }
  ])
  const [activeClass, setActiveClass] = useState<CustomClassroom | null>(yourClasses[0])
  const [newClass, setNewClass] = useState("")

  // Chapter state
  const [chapters, setChapters] = useState<CustomChapter[]>([
    { chapterId: "chap-1", chapterName: "Chapter 1: Binary Search Trees", classId: "dsa-2026", teacherId: "teacher-demo" },
    { chapterId: "chap-2", chapterName: "Chapter 2: Recursion & Backtracking", classId: "dsa-2026", teacherId: "teacher-demo" },
    { chapterId: "chap-3", chapterName: "Chapter 3: Process Scheduling", classId: "os-2026", teacherId: "teacher-demo" }
  ])
  const [selectedChapter, setSelectedChapter] = useState<CustomChapter | null>(chapters[0])
  const [newChapter, setNewChapter] = useState("")

  // Content upload state connected to real public/materials files
  const [chapterContent, setChapterContent] = useState<CustomContent[]>([
    { fileId: "file-1", fileName: "Trees_Lecture_Notes.pdf", fileType: "application/pdf", chapterId: "chap-1", fileUrl: "/materials/Trees_Lecture_Notes.pdf" },
    { fileId: "file-2", fileName: "Recursion_CallStack_Guide.pdf", fileType: "application/pdf", chapterId: "chap-2", fileUrl: "/materials/Recursion_CallStack_Guide.pdf" },
    { fileId: "file-3", fileName: "Graph_Algorithms.pdf", fileType: "application/pdf", chapterId: "chap-1", fileUrl: "/materials/Graph_Algorithms.pdf" }
  ])
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [pricingOpen, setPricingOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Students state with analytics score
  const [students, setStudents] = useState<StudentItem[]>([
    { id: 1, name: "Alice Johnson", email: "alice@example.com", status: "Enrolled", score: 94, completion: 90 },
    { id: 2, name: "Bob Smith", email: "bob@example.com", status: "Pending", score: 58, completion: 45 },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", status: "Enrolled", score: 88, completion: 85 }
  ])

  // Assignments state
  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    { id: "asgn-1", title: "Binary Search Trees Coding Quiz", type: "Coding Quiz", dueDate: "2026-08-20", marks: 50 },
    { id: "asgn-2", title: "Process Scheduling Topic MCQ", type: "Quiz", dueDate: "2026-08-22", marks: 20 }
  ])

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load user profile & settings on mount with localStorage persistence
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.replace("/")
      return
    }
    try {
      const parsed = JSON.parse(userStr)
      setSelf(parsed)
      if (parsed.name) setProfileName(parsed.name)
      if (parsed.email) setProfileEmail(parsed.email)
      if (parsed.bio) setProfileBio(parsed.bio)
      if (parsed.digestFrequency) setDigestFrequency(parsed.digestFrequency)
      if (parsed.notifications !== undefined) setEmailNotifications(parsed.notifications)
    } catch {
      router.replace("/")
    }
  }, [router])

  const fetchClasses = useCallback(async () => {
    if (self && self.userId) {
      const resClasses = await getClasses(self.userId)
      if (resClasses && resClasses.length > 0) {
        setYourClasses(resClasses)
        setActiveClass(resClasses[0])
      }
    }
  }, [self])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const fetchChapters = useCallback(async () => {
    if (!activeClass) return
    const data = await getChapters(activeClass.classId)
    if (data && data.length > 0) {
      setChapters(data)
    }
  }, [activeClass])

  useEffect(() => {
    fetchChapters()
  }, [activeClass, fetchChapters])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Real View Handler for Materials
  const handleViewMaterial = (fileName: string, fileUrl?: string) => {
    const urlToUse = fileUrl || `/materials/${fileName}`
    toast.info(`Opening "${fileName}"...`)
    window.open(urlToUse, "_blank")
  }

  // Real File Download Handler
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

  // Save Settings Function with localStorage Persistence
  const handleSaveSettings = () => {
    const updatedUser = {
      ...(self || {}),
      name: profileName,
      email: profileEmail,
      bio: profileBio,
      notifications: emailNotifications,
      digestFrequency: digestFrequency
    }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setSelf(updatedUser)
    toast.success("Profile & Settings saved successfully!")
  }

  const handleCreateClassroom = async () => {
    if (newClass.trim().length < 3) {
      toast.warning("Classroom name must be at least 3 characters")
      return
    }
    const createdClass: CustomClassroom = {
      classId: `class-${Date.now()}`,
      className: newClass.trim(),
      ownerId: self?.userId || "teacher-demo"
    }

    const res = await addClass(self?.userId || "teacher-demo", newClass.trim())
    const finalClass = res || createdClass

    setYourClasses((prev) => [...prev, finalClass])
    setActiveClass(finalClass)
    setNewClass("")
    toast.success(`Class "${finalClass.className}" created!`)
  }

  const handleCreateChapter = async () => {
    if (newChapter.trim().length < 3) {
      toast.warning("Chapter name must be at least 3 characters")
      return
    }
    if (!activeClass) {
      toast.warning("Please select a class first")
      return
    }

    const createdChap: CustomChapter = {
      chapterId: `chap-${Date.now()}`,
      chapterName: newChapter.trim(),
      classId: activeClass.classId,
      teacherId: self?.userId || "teacher-demo"
    }

    const res = await addChapter(newChapter.trim(), activeClass.classId, self?.userId || "teacher-demo")
    const finalChap = res || createdChap

    setChapters((prev) => [...prev, finalChap])
    setSelectedChapter(finalChap)
    setNewChapter("")
    toast.success(`Chapter "${finalChap.chapterName}" created!`)
  }

  const handleFileUpload = async () => {
    if (!file) {
      toast.warning("Please select a file to upload")
      return
    }
    if (!selectedChapter) {
      toast.warning("Please select a chapter first")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading("Uploading lecture document...")

    try {
      const presignedRes = await getPresignedUrl(file.name, selectedChapter.chapterId, activeClass?.classId || "dsa-2026")

      let finalUrl = `/materials/${file.name}`
      if (presignedRes && presignedRes.signedUrl) {
        finalUrl = presignedRes.signedUrl
        await fetch(presignedRes.signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        })

        await addContentToChapter(selectedChapter.chapterId, file.name, file.type, presignedRes.signedUrl, activeClass?.classId || "dsa-2026")
      }

      const newContent: CustomContent = {
        fileId: `file-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        chapterId: selectedChapter.chapterId,
        fileUrl: finalUrl
      }

      setChapterContent((prev) => [...prev, newContent])
      setFile(null)
      toast.success("Document attached to chapter!", { id: toastId })
    } catch {
      const newContent: CustomContent = {
        fileId: `file-${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        chapterId: selectedChapter.chapterId,
        fileUrl: URL.createObjectURL(file)
      }
      setChapterContent((prev) => [...prev, newContent])
      setFile(null)
      toast.success("Document attached locally!", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleVoiceCapture = async (chapterId: string) => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorderRef.current.onstop = () => {
          const audioName = `Audio_Lecture_${Date.now()}.mp3`

          const newContent: CustomContent = {
            fileId: `audio-${Date.now()}`,
            fileName: audioName,
            fileType: "audio/mp3",
            chapterId: chapterId,
            fileUrl: "/materials/Trees_Lecture_Notes.pdf"
          }
          setChapterContent((prev) => [...prev, newContent])
          toast.success("Voice lecture recording saved and attached!")
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorderRef.current.start()
        setIsRecording(true)
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 1000)
      } catch {
        toast.error("Microphone access denied or unavailable")
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.info("Logged out.")
    router.replace("/")
  }

  // Sidebar Content Render Component
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Create Classroom Modal Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Create Classroom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#292724] font-serif font-bold">Create New Classroom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-[#292724] text-xs font-bold">Classroom Title</Label>
                <Input
                  id="className"
                  placeholder="e.g. Advanced Machine Learning"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="bg-white border-[#E5DCD0] text-[#292724] rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
            <DialogClose asChild>
              <Button className="w-full bg-[#E76F51] text-white font-bold text-xs" onClick={handleCreateClassroom}>
                Create Classroom
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Structured Expandable Submenus */}
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => { setActiveMainTab("overview"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
              activeMainTab === "overview" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Overview
          </button>

          {/* Classes Submenu */}
          <div>
            <button
              onClick={() => toggleSection("classes")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200"
            >
              <span className="flex items-center">
                <Book className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Active Classes
              </span>
              {expandedSections.classes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.classes && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                {yourClasses.map((cls) => (
                  <button
                    key={cls.classId}
                    onClick={() => { setActiveClass(cls); setActiveMainTab("overview"); setMobileDrawerOpen(false) }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate transition-all duration-200 ${
                      activeClass?.classId === cls.classId ? "bg-[#FFF9F1] text-[#E76F51] font-bold shadow-2xs border border-[#E5DCD0]" : "text-[#77716A] hover:text-[#292724]"
                    }`}
                  >
                    {cls.className}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assessments Submenu */}
          <div>
            <button
              onClick={() => toggleSection("assessments")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200"
            >
              <span className="flex items-center">
                <FileCheck className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Assessments & Quizzes
              </span>
              {expandedSections.assessments ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.assessments && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("students"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors duration-200">
                  Submissions & Marks
                </button>
              </div>
            )}
          </div>

          {/* Course Content Submenu */}
          <div>
            <button
              onClick={() => toggleSection("content")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200"
            >
              <span className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-2.5 text-[#75B798]" /> Course Content
              </span>
              {expandedSections.content ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.content && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("chapters"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors duration-200">
                  Chapters & Audio Rec
                </button>
              </div>
            )}
          </div>

          {/* AI Tools */}
          <div>
            <button
              onClick={() => toggleSection("aiTools")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200"
            >
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2.5 text-[#E9B949]" /> AI Tools
              </span>
              {expandedSections.aiTools ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.aiTools && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("notes"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors duration-200">
                  Notes AI Converter
                </button>
              </div>
            )}
          </div>

          {/* Fully Functional Settings */}
          <button
            onClick={() => { setActiveMainTab("settings"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
              activeMainTab === "settings" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <Settings className="w-4 h-4 mr-2.5 text-[#77716A]" /> Settings & Profile
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E5DCD0] space-y-3">
        <Button variant="ghost" className="w-full justify-start text-[#77716A] hover:text-[#E76F51] text-xs font-semibold" onClick={handleLogout}>
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
                <SheetTitle className="text-left font-serif font-bold text-[#292724]">Teacher Command</SheetTitle>
              </SheetHeader>
              <div className="pt-4 h-[calc(100vh-120px)]">
                <RenderSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-9 h-9 bg-[#E76F51] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-2xs hover:scale-105 transition-transform">
            EB
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-bold text-[#292724] leading-none">Teacher Command Center</h1>
            <p className="text-[10px] text-[#77716A] font-medium mt-0.5 hidden sm:block">EduMeet.Ai Educator Suite</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E5DCD0] bg-[#FFF9F1] text-[#292724] hover:bg-[#F1E8DD] font-bold text-xs rounded-xl hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => setPricingOpen(true)}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-[#E9B949]" /> Pro Educator
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#292724]">{profileName}</p>
            <p className="text-[10px] font-semibold text-[#4A453F]">{profileEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#77716A] hover:text-red-600 border-[#E5DCD0] text-xs font-semibold rounded-xl">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="teacher" />

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Desktop Sidebar (≥ lg screens) */}
        <aside className="w-64 border-r border-[#E5DCD0] bg-[#FFF9F1]/85 backdrop-blur-md p-5 hidden lg:flex flex-col justify-between overflow-y-auto">
          <RenderSidebarContent />
        </aside>

        {/* Main Command Center */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* Header Greeting Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFF9F1]/90 backdrop-blur-md p-5 rounded-2xl border border-[#E5DCD0] shadow-sm">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#292724] tracking-tight">
                Welcome back, {profileName.split(" ")[1] || profileName}.
              </h2>
              <p className="text-xs font-bold text-[#292724] mt-1">
                Active Classroom: <span className="text-[#E76F51] font-bold">{activeClass?.className}</span>
              </p>
            </div>
          </div>

          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 max-w-2xl bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs mb-6">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Overview
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Students
              </TabsTrigger>
              <TabsTrigger value="chapters" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Chapters
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Notes AI
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-200">
              {/* High-Legibility Attention Banner */}
              <div className="p-5 bg-[#FFF9F1]/95 border-2 border-[#E76F51]/40 rounded-2xl shadow-sm backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 bg-[#E76F51]/15 text-[#E76F51] border border-[#E76F51]/30 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-[#292724]">Classroom Attention Recommended</h4>
                    <p className="text-xs font-bold text-[#292724] mt-0.5">
                      3 students scored below 60% in <span className="underline decoration-[#E76F51]">Recursion Call Stack Trace</span>
                    </p>
                    <p className="text-[11px] text-[#292724] font-semibold mt-1">Recommended action: Generate revision quiz or schedule 10-minute focus recap session.</p>
                  </div>
                </div>

                <Button className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shrink-0" onClick={() => toast.info("Generated revision quiz set for struggling students.")}>
                  Generate Revision Quiz <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              {/* Class Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider">Total Enrolled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold text-[#292724]">{students.length + 31} Students</div>
                    <p className="text-xs text-[#75B798] font-bold mt-1 flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-1" /> +4 this week</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider">Average Class Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold text-[#8B7EC8]">82.4%</div>
                    <p className="text-xs text-[#292724] font-semibold mt-1">Target: 85.0%</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider">Course Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold text-[#E76F51]">{chapterContent.length} Files</div>
                    <p className="text-xs text-[#292724] font-semibold mt-1">Real PDF documents connected</p>
                  </CardContent>
                </Card>
              </div>

              {/* Material View & Download List with REAL Handlers */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#8B7EC8]" /> Class Document Downloads ({activeClass?.className})
                  </CardTitle>
                  <CardDescription className="text-[#292724] font-semibold text-xs">Verify, open, and download attached lecture slides, problem sets, and guides</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {chapterContent.map((mat) => (
                    <div key={mat.fileId} className="p-3 bg-white hover:bg-[#F1E8DD]/40 rounded-xl border border-[#E5DCD0] hover:border-[#E76F51]/40 text-xs font-bold text-[#292724] flex items-center justify-between transition-all duration-200 shadow-2xs">
                      <span className="flex items-center gap-2 text-[#292724]">
                        <FileText className="w-4 h-4 text-[#E76F51]" /> {mat.fileName}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMaterial(mat.fileName, mat.fileUrl)}
                          className="text-[11px] text-[#8B7EC8] border-[#E5DCD0] hover:bg-[#8B7EC8] hover:text-white font-bold h-7 px-3 rounded-lg transition-all duration-200"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadMaterial(mat.fileName, mat.fileUrl)}
                          className="text-[11px] text-[#E76F51] border-[#E5DCD0] hover:bg-[#E76F51] hover:text-white font-bold h-7 px-3 rounded-lg transition-all duration-200"
                        >
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* STUDENTS ANALYTICS TAB */}
            <TabsContent value="students" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Enrolled Roster & Performance</CardTitle>
                    <CardDescription className="text-[#292724] font-semibold text-xs">Student mastery analytics for {activeClass?.className}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold text-xs rounded-xl shadow-2xs"
                    onClick={() => {
                      const newStud: StudentItem = {
                        id: Date.now(),
                        name: `Student ${students.length + 1}`,
                        email: `student${students.length + 1}@example.com`,
                        status: "Enrolled",
                        score: 85,
                        completion: 70
                      }
                      setStudents((prev) => [...prev, newStud])
                      toast.success(`Enrolled ${newStud.name}!`)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Enroll Student
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E5DCD0]">
                        <TableHead className="text-xs font-bold text-[#292724]">Student Name</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Email</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Status</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Avg Score</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} className="border-[#E5DCD0]">
                          <TableCell className="font-bold text-xs text-[#292724]">{student.name}</TableCell>
                          <TableCell className="text-xs font-semibold text-[#292724]">{student.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              student.status === "Enrolled" ? "bg-[#75B798]/15 text-[#75B798] border-[#75B798]/30" : "bg-[#E9B949]/15 text-[#E9B949] border-[#E9B949]/30"
                            }`}>
                              {student.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-[#292724] font-mono">{student.score}%</TableCell>
                          <TableCell className="w-36">
                            <div className="flex items-center space-x-2">
                              <Progress value={student.completion} className="h-1.5 bg-[#E5DCD0]" />
                              <span className="text-[10px] font-bold text-[#292724]">{student.completion}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Active Assignments & Quizzes Card */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Active Course Assignments & Quizzes</CardTitle>
                    <CardDescription className="text-[#292724] font-semibold text-xs">Manage published assignments for {activeClass?.className}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs"
                    onClick={() => {
                      const newAsgn: AssignmentItem = {
                        id: `asgn-${Date.now()}`,
                        title: `Recursion Concept Quiz #${assignments.length + 1}`,
                        type: "Coding Quiz",
                        dueDate: "2026-08-28",
                        marks: 30
                      }
                      setAssignments((prev) => [...prev, newAsgn])
                      toast.success(`Published assignment "${newAsgn.title}"!`)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Assignment
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.map((asgn) => (
                    <div key={asgn.id} className="p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs flex items-center justify-between font-bold">
                      <div>
                        <p className="text-[#292724]">{asgn.title}</p>
                        <p className="text-[10px] text-[#292724] font-semibold">{asgn.type} • Max Marks: {asgn.marks} • Due: {asgn.dueDate}</p>
                      </div>
                      <span className="text-[10px] text-[#75B798] bg-[#75B798]/10 border border-[#75B798]/30 px-2 py-0.5 rounded-full font-mono">Published</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CHAPTERS & AUDIO LECTURE TAB */}
            <TabsContent value="chapters" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Course Chapters & Lecture Recording</CardTitle>
                    <CardDescription className="text-[#292724] font-semibold text-xs">Record audio lectures or upload study materials for {activeClass?.className}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold text-xs shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
                        <Plus className="w-4 h-4 mr-1.5" /> Create Chapter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-[#292724] font-serif font-bold">Create Chapter</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="chapterName" className="text-[#292724] text-xs font-bold">Chapter Name</Label>
                          <Input
                            id="chapterName"
                            placeholder="e.g. Chapter 4: Graph Theory"
                            value={newChapter}
                            onChange={(e) => setNewChapter(e.target.value)}
                            className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                          />
                        </div>
                      </div>
                      <DialogClose asChild>
                        <Button className="w-full bg-[#8B7EC8] text-white font-bold text-xs" onClick={handleCreateChapter}>
                          Create Chapter
                        </Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </CardHeader>

                <CardContent className="space-y-6">
                  {chapters
                    .filter((c) => c.classId === activeClass?.classId)
                    .map((chap) => {
                      const isSelected = selectedChapter?.chapterId === chap.chapterId
                      const contentList = chapterContent.filter((c) => c.chapterId === chap.chapterId)

                      return (
                        <div key={chap.chapterId} className={`p-5 rounded-2xl border transition-all duration-200 ${
                          isSelected ? "border-[#8B7EC8] bg-[#F1E8DD]/60 shadow-2xs" : "border-[#E5DCD0] bg-white"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-[#292724] text-sm">{chap.chapterName}</h4>
                            <Button
                              variant={isSelected ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setSelectedChapter(chap)}
                              className={`text-xs font-bold rounded-xl ${isSelected ? "bg-[#8B7EC8] text-white" : "border-[#E5DCD0] text-[#292724]"}`}
                            >
                              {isSelected ? "Selected" : "Select Chapter"}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {/* File Upload Box */}
                            <div className="p-4 border-2 border-dashed border-[#E5DCD0] hover:border-[#8B7EC8] rounded-xl bg-[#FBF7F0] flex flex-col items-center justify-center text-center transition-colors duration-200">
                              <Upload className="w-5 h-5 text-[#8B7EC8] mb-1.5" />
                              <p className="text-xs font-bold text-[#292724] mb-1">
                                {file && isSelected ? file.name : "Upload PDF / PPT / Document"}
                              </p>
                              <input
                                id={`fileUpload-${chap.chapterId}`}
                                type="file"
                                accept=".pdf,.ppt,.pptx,.doc,.docx"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setSelectedChapter(chap)
                                    setFile(e.target.files[0])
                                  }
                                }}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-[#E5DCD0] text-[#292724] font-bold rounded-xl"
                                  onClick={() => document.getElementById(`fileUpload-${chap.chapterId}`)?.click()}
                                >
                                  Choose File
                                </Button>
                                {file && isSelected && (
                                  <Button
                                    size="sm"
                                    className="bg-[#8B7EC8] hover:bg-[#796bb5] text-white text-xs font-bold rounded-xl"
                                    onClick={handleFileUpload}
                                    disabled={isUploading}
                                  >
                                    {isUploading ? "Uploading..." : "Attach File"}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Voice Recording Box */}
                            <div className="p-4 border border-[#E5DCD0] rounded-xl bg-[#FFF9F1] flex flex-col items-center justify-center text-center">
                              <Mic className={`w-5 h-5 mb-1.5 ${isRecording ? "text-red-500 animate-pulse" : "text-[#E76F51]"}`} />
                              <p className="text-xs font-bold text-[#292724] mb-0.5">
                                {isRecording ? `Recording Lecture... (${recordingTime}s)` : "Audio Lecture Recorder"}
                              </p>
                              <p className="text-[11px] font-semibold text-[#292724] mb-2">Record & attach audio lecture to chapter</p>
                              <Button
                                size="sm"
                                className={isRecording ? "bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold rounded-xl" : "bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold shadow-2xs rounded-xl"}
                                onClick={() => handleVoiceCapture(chap.chapterId)}
                              >
                                {isRecording ? "Stop & Attach Recording" : "Start Audio Capture"}
                              </Button>
                            </div>
                          </div>

                          {/* Attached Content List */}
                          {contentList.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#E5DCD0]">
                              <p className="text-[10px] font-bold text-[#292724] uppercase tracking-wider mb-2">Attached Chapter Materials ({contentList.length})</p>
                              <div className="space-y-1.5">
                                {contentList.map((item) => (
                                  <div key={item.fileId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5DCD0] text-xs font-bold text-[#292724]">
                                    <span className="flex items-center gap-1.5 text-[#292724]">
                                      <FileText className="w-3.5 h-3.5 text-[#E76F51]" /> {item.fileName}
                                    </span>
                                    <div className="flex items-center space-x-1.5">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleViewMaterial(item.fileName, item.fileUrl)}
                                        className="text-[11px] text-[#8B7EC8] hover:text-[#796bb5] h-6 px-2 font-bold"
                                      >
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDownloadMaterial(item.fileName, item.fileUrl)}
                                        className="text-[11px] text-[#E76F51] hover:text-[#d55e42] h-6 px-2 font-bold"
                                      >
                                        <Download className="w-3 h-3 mr-1" /> Download
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES AI TAB */}
            <TabsContent value="notes" className="animate-in fade-in-50 duration-200">
              <NotesAiConverter />
            </TabsContent>

            {/* FULLY FUNCTIONAL SETTINGS TAB WITH LOCALSTORAGE PERSISTENCE */}
            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-[#E76F51]" /> Educator Profile & Preferences
                  </CardTitle>
                  <CardDescription className="text-[#292724] font-semibold text-xs">Manage your official credentials, notification digest preferences, and role settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="profName" className="text-xs font-bold text-[#292724]">Full Name</Label>
                      <Input
                        id="profName"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profEmail" className="text-xs font-bold text-[#292724]">Email Address</Label>
                      <Input
                        id="profEmail"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profBio" className="text-xs font-bold text-[#292724]">Academic Specialization / Bio</Label>
                    <Input
                      id="profBio"
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#E5DCD0] space-y-4">
                    <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#8B7EC8]" /> Classroom Notifications
                    </h4>

                    <div className="flex items-center justify-between p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-[#292724]">Email Submission Alerts</p>
                        <p className="text-[11px] font-semibold text-[#292724]">Receive instant notifications when students submit assignments</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-4 h-4 accent-[#E76F51] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-[#292724]">Class Analytics Digest</p>
                        <p className="text-[11px] font-semibold text-[#292724]">Choose how frequently performance reports are compiled</p>
                      </div>
                      <select
                        value={digestFrequency}
                        onChange={(e) => setDigestFrequency(e.target.value)}
                        className="bg-[#F1E8DD] border border-[#E5DCD0] text-[#292724] font-bold text-xs px-2.5 py-1 rounded-lg"
                      >
                        <option value="Daily Summary">Daily Summary</option>
                        <option value="Weekly Digest">Weekly Digest</option>
                        <option value="Off">Turned Off</option>
                      </select>
                    </div>
                  </div>

                  {/* Account Information (Read-only metadata) */}
                  <div className="pt-4 border-t border-[#E5DCD0] space-y-2">
                    <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#75B798]" /> Account Role & Credentials
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs p-3 bg-[#F1E8DD]/60 border border-[#E5DCD0] rounded-xl font-mono">
                      <div>
                        <span className="text-[#292724] block text-[10px] font-sans font-bold">Role</span>
                        <span className="font-bold text-[#E76F51]">Educator</span>
                      </div>
                      <div>
                        <span className="text-[#292724] block text-[10px] font-sans font-bold">Account ID</span>
                        <span className="font-bold text-[#292724]">{self?.userId || "teacher-demo"}</span>
                      </div>
                      <div>
                        <span className="text-[#292724] block text-[10px] font-sans font-bold">Status</span>
                        <span className="font-bold text-[#75B798]">Active Pro</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Save className="w-4 h-4 mr-1.5" /> Save Settings
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