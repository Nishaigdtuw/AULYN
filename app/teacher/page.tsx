'use client'
import React, { useEffect, useState, useCallback, useRef } from "react"
import { FileText, LogOut, Mic, Plus, Upload, Book, Trash2, UserPlus, FileCheck, HelpCircle, Volume2, Sparkles, BarChart3, TrendingUp, Award, Code, Crown, AlertTriangle, ArrowUpRight, Menu, ChevronDown, ChevronRight, Settings, LayoutDashboard, FolderOpen } from "lucide-react"
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
  chapterId: string
  fileName: string
  fileUrl: string
  fileType: string
  classId: string
}

interface StudentItem {
  id: number
  name: string
  email: string
  status: "Enrolled" | "Pending"
  score: number
  completion: number
}

interface AssignmentItem {
  id: string
  title: string
  type: "Test" | "Quiz" | "Coding Quiz" | "Announcement"
  dueDate: string
  marks?: number
}

const DEFAULT_CLASSES: CustomClassroom[] = [
  { classId: "class-1", className: "Data Structures & Algorithms", ownerId: "teacher-demo" },
  { classId: "class-2", className: "Operating Systems & Linux", ownerId: "teacher-demo" },
  { classId: "class-3", className: "Database & System Design", ownerId: "teacher-demo" }
]

const DEFAULT_CHAPTERS: CustomChapter[] = [
  { chapterId: "chap-1", chapterName: "Chapter 1: Binary Search Trees", classId: "class-1", teacherId: "teacher-demo" },
  { chapterId: "chap-2", chapterName: "Chapter 2: Process Synchronization", classId: "class-2", teacherId: "teacher-demo" }
]

export default function TeacherPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId: string; name: string; email: string } | null>(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Expandable Sidebar Sections State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    assessments: true,
    content: false,
    analytics: true,
    aiTools: false
  })

  const [activeNavTab, setActiveNavTab] = useState<string>("overview")

  const [yourClasses, setYourClasses] = useState<CustomClassroom[]>(DEFAULT_CLASSES)
  const [activeClass, setActiveClass] = useState<CustomClassroom>(DEFAULT_CLASSES[0])
  
  const [chapters, setChapters] = useState<CustomChapter[]>(DEFAULT_CHAPTERS)
  const [selectedChapter, setSelectedChapter] = useState<CustomChapter | null>(DEFAULT_CHAPTERS[0])
  const [chapterContent, setChapterContent] = useState<CustomContent[]>([
    { fileId: "file-1", chapterId: "chap-1", fileName: "Trees_Lecture_Notes.pdf", fileUrl: "#", fileType: "application/pdf", classId: "class-1" }
  ])

  const [newClass, setNewClass] = useState("")
  const [newChapter, setNewChapter] = useState("")
  const [file, setFile] = useState<File | null>(null)

  // Students state with analytics score
  const [students, setStudents] = useState<StudentItem[]>([
    { id: 1, name: "Alice Johnson", email: "alice@example.com", status: "Enrolled", score: 94, completion: 90 },
    { id: 2, name: "Bob Smith", email: "bob@example.com", status: "Pending", score: 58, completion: 45 },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", status: "Enrolled", score: 88, completion: 85 },
  ])
  // Assignments & Quizzes state
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

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.replace("/")
      return
    }
    try {
      const parsed = JSON.parse(userStr)
      setSelf(parsed)
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
      toast.warning("Please select a file first")
      return
    }
    if (!activeClass || !selectedChapter) {
      toast.warning("Please select a class and chapter")
      return
    }

    toast.info("Uploading file...")
    const presigned = await getPresignedUrl(file.name, selectedChapter.chapterId, activeClass.classId)

    let fileUrl = "#"
    if (presigned?.signedUrl) {
      try {
        const res = await fetch(presigned.signedUrl, { method: "PUT", body: file })
        if (res.ok) fileUrl = presigned.signedUrl
      } catch (e) {
        console.warn("Direct S3 upload failed, fallback to local reference", e)
      }
    }

    const newContentItem: CustomContent = {
      fileId: `file-${Date.now()}`,
      chapterId: selectedChapter.chapterId,
      fileName: file.name,
      fileUrl: fileUrl,
      fileType: file.type || "application/octet-stream",
      classId: activeClass.classId
    }

    await addContentToChapter(selectedChapter.chapterId, file.name, file.type || "document", fileUrl, activeClass.classId)

    setChapterContent((prev) => [...prev, newContentItem])
    setFile(null)
    toast.success(`Uploaded "${file.name}"!`)
  }

  const handleVoiceCapture = async (chapterId: string) => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          
          const newVoiceContent: CustomContent = {
            fileId: `voice-${Date.now()}`,
            chapterId,
            fileName: `Voice_Lecture_${Date.now()}.webm`,
            fileUrl: URL.createObjectURL(audioBlob),
            fileType: "audio/webm",
            classId: activeClass?.classId || "class-1"
          }

          setChapterContent((prev) => [...prev, newVoiceContent])
          toast.success("Voice recording saved & attached to chapter!")
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        setRecordingTime(0)
        timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000)
        toast.info("Voice capture started...")
      } catch (err) {
        console.error(err)
        toast.error("Microphone access denied.")
      }
    }
  }

  const handleAutoGenerateRevisionQuiz = () => {
    const autoQuiz: AssignmentItem = {
      id: `auto-quiz-${Date.now()}`,
      title: "Recursion & Call Stack Revision Quiz (AI Generated)",
      type: "Coding Quiz",
      dueDate: "2026-08-18",
      marks: 30
    }
    setAssignments((prev) => [...prev, autoQuiz])
    toast.success("AI generated revision quiz published for 12 struggling students!")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.info("Logged out.")
    router.replace("/")
  }

  // Sidebar Component JSX function for reuse in desktop sidebar & mobile drawer
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Create Classroom Modal Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold py-2 rounded-xl shadow-2xs text-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#292724] font-serif font-bold">Create Classroom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-[#292724] text-xs font-bold">Class Name</Label>
                <Input
                  id="className"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="bg-white border-[#E5DCD0] text-[#292724] rounded-xl text-xs"
                />
              </div>
            </div>
            <DialogClose asChild>
              <Button type="button" className="w-full bg-[#8B7EC8] text-white font-bold text-xs" onClick={handleCreateClassroom}>
                Create Classroom
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Structured Expandable Navigation */}
        <nav className="space-y-1 text-xs">
          {/* Overview */}
          <button
            onClick={() => { setActiveNavTab("overview"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all ${
              activeNavTab === "overview" ? "bg-[#F1E8DD] text-[#8B7EC8] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Overview
          </button>

          {/* Classes Section */}
          <div>
            <button
              onClick={() => toggleSection("classes")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <Book className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Classes
              </span>
              {expandedSections.classes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.classes && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                {yourClasses.map((cls) => {
                  const isActive = activeClass?.classId === cls.classId
                  return (
                    <button
                      key={cls.classId}
                      onClick={() => { setActiveClass(cls); setActiveNavTab("overview"); setMobileDrawerOpen(false) }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate block transition-all ${
                        isActive ? "bg-[#FFF9F1] text-[#8B7EC8] font-bold shadow-2xs border border-[#E5DCD0]" : "text-[#77716A] hover:text-[#292724]"
                      }`}
                    >
                      {cls.className}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assessments Section */}
          <div>
            <button
              onClick={() => toggleSection("assessments")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <FileCheck className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Assessments
              </span>
              {expandedSections.assessments ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.assessments && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveNavTab("assignments"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Assignments & Quizzes
                </button>
                <button onClick={() => { setActiveNavTab("students"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Submissions & Roster
                </button>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div>
            <button
              onClick={() => toggleSection("content")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-2.5 text-[#75B798]" /> Content
              </span>
              {expandedSections.content ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.content && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveNavTab("chapters"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Chapters & Audio Rec
                </button>
                <button onClick={() => { setActiveNavTab("content"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Study Materials
                </button>
              </div>
            )}
          </div>

          {/* Analytics Section */}
          <div>
            <button
              onClick={() => toggleSection("analytics")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all"
            >
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2.5 text-[#E9B949]" /> Analytics
              </span>
              {expandedSections.analytics ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.analytics && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveNavTab("analytics"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Class Performance
                </button>
                <button onClick={() => { setActiveNavTab("analytics"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold">
                  Topic Mastery
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

      <div className="pt-4 border-t border-[#E5DCD0]">
        <div className="p-3 bg-[#F1E8DD]/80 rounded-xl text-xs border border-[#E5DCD0] space-y-1 shadow-2xs">
          <p className="font-bold flex items-center text-[#8B7EC8]">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Active Classroom:
          </p>
          <p className="truncate font-extrabold text-[#292724]">{activeClass?.className}</p>
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
                <SheetTitle className="text-left font-serif font-bold text-[#292724]">Teacher Menu</SheetTitle>
              </SheetHeader>
              <div className="pt-4 h-[calc(100vh-120px)]">
                <RenderSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-9 h-9 bg-[#8B7EC8] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-2xs">
            EB
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-bold text-[#292724] leading-none">Teacher Command Center</h1>
            <p className="text-[10px] text-[#77716A] font-medium mt-0.5 hidden sm:block">EduMeet.Ai Classroom Intelligence Studio</p>
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
            <p className="text-xs font-bold text-[#292724]">{self?.name || "Teacher"}</p>
            <p className="text-[10px] text-[#77716A]">{self?.email || "teacher@edumeet.ai"}</p>
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

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* Actionable Top Attention Banner (Readability Polish: High Opacity Surface) */}
          <div className="p-5 bg-[#FFF9F1]/95 backdrop-blur-md border border-[#E76F51]/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-[#E76F51] text-white rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#292724]">
                  Your class needs attention in <span className="underline decoration-[#E76F51]">Recursion</span>.
                </h3>
                <p className="text-xs text-[#77716A] font-semibold mt-0.5">
                  12 students struggled with recursion call stack problem sets this week.
                </p>
              </div>
            </div>

            <Button 
              size="sm" 
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs self-stretch sm:self-auto"
              onClick={handleAutoGenerateRevisionQuiz}
            >
              Generate Revision Quiz <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <Tabs value={activeNavTab} onValueChange={setActiveNavTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 max-w-2xl bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs mb-6 overflow-x-auto">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs">
                Assessments
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs">
                Students
              </TabsTrigger>
              <TabsTrigger value="chapters" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs">
                Chapters
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs">
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview / Analytics & Topic Performance Visualization Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Total Enrolled</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">{students.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-[#F1E8DD] text-[#8B7EC8] border border-[#E5DCD0] rounded-xl flex items-center justify-center font-bold">
                      <UserPlus className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Class Average</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">86.7%</p>
                    </div>
                    <div className="w-10 h-10 bg-[#75B798]/15 text-[#75B798] border border-[#75B798]/30 rounded-xl flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Completion Rate</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">78.3%</p>
                    </div>
                    <div className="w-10 h-10 bg-[#F1E8DD] text-[#292724] border border-[#E5DCD0] rounded-xl flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#77716A] font-bold uppercase tracking-wider">Active Quizzes</p>
                      <p className="text-2xl font-black text-[#292724] mt-1">{assignments.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-[#E76F51]/15 text-[#E76F51] border border-[#E76F51]/30 rounded-xl flex items-center justify-center font-bold">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Topic Mastery Performance Visualization */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-serif font-bold text-[#292724]">
                    Class Topic Mastery Breakdown
                  </CardTitle>
                  <CardDescription className="text-[#77716A] text-xs">
                    Weak topic areas are highlighted for targeted intervention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Arrays & Hashing</span>
                      <span className="text-[#75B798] font-mono font-bold">91%</span>
                    </div>
                    <Progress value={91} className="h-2 bg-[#F1E8DD]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Linked Lists & Pointers</span>
                      <span className="text-[#75B798] font-mono font-bold">84%</span>
                    </div>
                    <Progress value={84} className="h-2 bg-[#F1E8DD]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Recursion & Backtracking (Attention Needed)</span>
                      <span className="text-[#E76F51] font-mono font-bold">61%</span>
                    </div>
                    <Progress value={61} className="h-2 bg-[#F1E8DD]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#292724]">Dynamic Programming</span>
                      <span className="text-[#E76F51] font-mono font-bold">48%</span>
                    </div>
                    <Progress value={48} className="h-2 bg-[#F1E8DD]" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base">Active Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-[#E5DCD0]">
                    {assignments.map((item) => (
                      <li key={item.id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.type === "Coding Quiz" && <Code className="w-5 h-5 text-[#E76F51]" />}
                          {item.type === "Test" && <FileCheck className="w-5 h-5 text-[#8B7EC8]" />}
                          {item.type === "Quiz" && <HelpCircle className="w-5 h-5 text-[#E76F51]" />}
                          {item.type === "Announcement" && <FileText className="w-5 h-5 text-[#77716A]" />}
                          <div>
                            <p className="font-bold text-[#292724] text-sm">{item.title}</p>
                            <p className="text-xs text-[#77716A]">Format: {item.type} {item.marks ? `• ${item.marks} Marks` : ""} • Due: {item.dueDate}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => setAssignments((prev) => prev.filter((a) => a.id !== item.id))}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Management Tab */}
            <TabsContent value="students">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl overflow-x-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Student Roster</CardTitle>
                    <CardDescription className="text-[#77716A] text-xs">Enrolled students in {activeClass?.className}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E5DCD0]">
                        <TableHead className="text-[#77716A] font-bold">Student Name</TableHead>
                        <TableHead className="text-[#77716A] font-bold">Email</TableHead>
                        <TableHead className="text-[#77716A] font-bold">Status</TableHead>
                        <TableHead className="text-right text-[#77716A] font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} className="border-[#E5DCD0]">
                          <TableCell className="font-bold text-[#292724]">{student.name}</TableCell>
                          <TableCell className="text-[#77716A] text-xs font-mono">{student.email}</TableCell>
                          <TableCell>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#75B798]/15 text-[#75B798] border border-[#75B798]/30">
                              {student.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs rounded-xl" onClick={() => setStudents((prev) => prev.filter((s) => s.id !== student.id))}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chapters & Audio Lecture Recorder Tab */}
            <TabsContent value="chapters" className="space-y-6">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Course Chapters & Lecture Recording</CardTitle>
                    <CardDescription className="text-[#77716A] text-xs">Record audio lectures or upload study materials for {activeClass?.className}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold text-xs shadow-2xs rounded-xl">
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
                            className="bg-white border-[#E5DCD0] text-[#292724] text-xs rounded-xl"
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
                        <div key={chap.chapterId} className={`p-5 rounded-2xl border transition-all ${
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
                            <div className="p-4 border-2 border-dashed border-[#E5DCD0] hover:border-[#8B7EC8] rounded-xl bg-[#FBF7F0] flex flex-col items-center justify-center text-center">
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
                                <Label
                                  htmlFor={`fileUpload-${chap.chapterId}`}
                                  className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E5DCD0] text-[#292724] hover:bg-[#F1E8DD] shadow-2xs"
                                >
                                  Browse File
                                </Label>
                                {file && isSelected && (
                                  <Button size="sm" className="bg-[#8B7EC8] text-white text-xs h-7 font-bold rounded-xl" onClick={handleFileUpload}>
                                    Upload
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Audio Lecture Recorder HUD */}
                            <div className="p-4 border border-[#E5DCD0] rounded-xl bg-[#FBF7F0] flex flex-col items-center justify-center text-center">
                              <Mic className={`w-5 h-5 mb-1.5 ${isRecording ? "text-[#E76F51] animate-pulse" : "text-[#E76F51]"}`} />
                              <p className="text-xs font-bold text-[#292724]">
                                {isRecording ? `Recording Audio Lecture... (${recordingTime}s)` : "Browser Audio Lecture Recorder"}
                              </p>

                              {/* Audio Waveform Simulation */}
                              {isRecording && (
                                <div className="flex items-center gap-1 my-2">
                                  <span className="w-1 h-4 bg-[#E76F51] animate-pulse" />
                                  <span className="w-1 h-6 bg-[#E76F51] animate-pulse" style={{ animationDelay: "150ms" }} />
                                  <span className="w-1 h-3 bg-[#E76F51] animate-pulse" style={{ animationDelay: "300ms" }} />
                                  <span className="w-1 h-7 bg-[#E76F51] animate-pulse" style={{ animationDelay: "450ms" }} />
                                  <span className="w-1 h-4 bg-[#E76F51] animate-pulse" style={{ animationDelay: "600ms" }} />
                                </div>
                              )}

                              <p className="text-[11px] text-[#77716A] mb-2">Record & attach audio lecture to chapter</p>
                              <Button
                                size="sm"
                                className={isRecording ? "bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold rounded-xl" : "bg-[#E76F51] hover:bg-[#d55e42] text-white text-xs font-bold shadow-2xs rounded-xl"}
                                onClick={() => handleVoiceCapture(chap.chapterId)}
                              >
                                {isRecording ? "Stop & Attach Recording" : "Start Audio Capture"}
                              </Button>
                            </div>
                          </div>

                          {/* Uploaded Content List */}
                          {contentList.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#E5DCD0]">
                              <p className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider mb-2">Attached Materials ({contentList.length})</p>
                              <ul className="space-y-1">
                                {contentList.map((item) => (
                                  <li key={item.fileId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5DCD0] text-xs">
                                    <span className="font-semibold text-[#292724] flex items-center">
                                      {item.fileType.includes("audio") ? <Volume2 className="w-3.5 h-3.5 mr-1.5 text-[#E76F51]" /> : <FileText className="w-3.5 h-3.5 mr-1.5 text-[#8B7EC8]" />}
                                      {item.fileName}
                                    </span>
                                    <span className="text-[10px] text-[#77716A] font-mono">Attached</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </CardContent>
              </Card>

              {/* AI Notes Converter */}
              <NotesAiConverter />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-serif font-bold text-[#292724]">Detailed Performance Analytics</CardTitle>
                  <CardDescription className="text-xs text-[#77716A]">Engagement & topic mastery reports for {activeClass?.className}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-[#F1E8DD]/60 rounded-xl border border-[#E5DCD0] space-y-2 text-xs">
                    <p className="font-bold text-[#292724]">💡 AI Teaching Insight:</p>
                    <p className="text-[#77716A] leading-relaxed">
                      Students in {activeClass?.className} demonstrate high proficiency in basic data structures (91%), but show call stack recursion confusion. Recommending a 15-minute interactive trace session.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}