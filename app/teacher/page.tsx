'use client'
import React, { useEffect, useState, useCallback, useRef } from "react"
import { FileText, LogOut, Mic, Plus, Upload, Book, Trash2, Check, X, UserPlus, FileCheck, HelpCircle, Volume2, Sparkles, BarChart3, TrendingUp, Award, Code, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { addChapter, addClass, addContentToChapter, getChapters, getClasses, getContent } from "@/actions/teacher/action"
import { useRouter } from "next/navigation"
import { getPresignedUrl } from "@/actions/teacher/s3"
import NotesAiConverter from "@/components/notes-ai-converter"
import PricingModal from "@/components/pricing-modal"
import AnimatedLearningBackground from "@/components/animated-learning-background"

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
  { classId: "class-1", className: "Data Structures 101", ownerId: "teacher-demo" },
  { classId: "class-2", className: "Blockchain & Web3", ownerId: "teacher-demo" },
  { classId: "class-3", className: "AI & Machine Learning", ownerId: "teacher-demo" }
]

const DEFAULT_CHAPTERS: CustomChapter[] = [
  { chapterId: "chap-1", chapterName: "Chapter 1: Introduction to Trees", classId: "class-1", teacherId: "teacher-demo" },
  { chapterId: "chap-2", chapterName: "Chapter 2: Smart Contracts & Ethereum", classId: "class-2", teacherId: "teacher-demo" }
]

export default function TeacherPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId: string; name: string; email: string } | null>(null)
  const [pricingOpen, setPricingOpen] = useState(false)

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
    { id: 2, name: "Bob Smith", email: "bob@example.com", status: "Pending", score: 78, completion: 60 },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", status: "Enrolled", score: 88, completion: 85 },
  ])
  const [newStudentName, setNewStudentName] = useState("")
  const [newStudentEmail, setNewStudentEmail] = useState("")

  // Assignments & Quizzes state
  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    { id: "asgn-1", title: "Binary Search Trees Coding Quiz", type: "Coding Quiz", dueDate: "2026-08-20", marks: 50 },
    { id: "asgn-2", title: "Solidity Basics Topic MCQ", type: "Quiz", dueDate: "2026-08-22", marks: 20 }
  ])
  const [testTitle, setTestTitle] = useState("")
  const [testMarks, setTestMarks] = useState("50")
  const [testDueDate, setTestDueDate] = useState("")

  const [quizTitle, setQuizTitle] = useState("")
  const [quizType, setQuizType] = useState<"Quiz" | "Coding Quiz">("Coding Quiz")
  const [quizDueDate, setQuizDueDate] = useState("")

  const [announcementText, setAnnouncementText] = useState("")

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

  const fetchContentByClass = useCallback(async () => {
    if (!activeClass) return
    const cc = await getContent(activeClass.classId)
    if (cc && cc.length > 0) {
      setChapterContent(cc)
    }
  }, [activeClass])

  useEffect(() => {
    fetchChapters()
    fetchContentByClass()
  }, [activeClass, fetchChapters, fetchContentByClass])

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
    toast.success(`Class "${finalClass.className}" created successfully!`)
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
    toast.success(`Uploaded "${file.name}" to ${selectedChapter.chapterName}!`)
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
          const voiceFile = new File([audioBlob], `Voice_Note_${Date.now()}.webm`, { type: "audio/webm" })
          
          const newVoiceContent: CustomContent = {
            fileId: `voice-${Date.now()}`,
            chapterId,
            fileName: voiceFile.name,
            fileUrl: URL.createObjectURL(audioBlob),
            fileType: "audio/webm",
            classId: activeClass?.classId || "class-1"
          }

          setChapterContent((prev) => [...prev, newVoiceContent])
          toast.success("Voice recording saved to chapter!")
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

  const handleAcceptStudent = (id: number) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Enrolled" } : s)))
    toast.success("Student accepted!")
  }

  const handleRemoveStudent = (id: number) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
    toast.success("Student removed.")
  }

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      toast.warning("Please fill in student name and email")
      return
    }
    const newStud: StudentItem = {
      id: Date.now(),
      name: newStudentName.trim(),
      email: newStudentEmail.trim(),
      status: "Enrolled",
      score: 85,
      completion: 75
    }
    setStudents((prev) => [...prev, newStud])
    setNewStudentName("")
    setNewStudentEmail("")
    toast.success(`Student ${newStud.name} added!`)
  }

  const handleCreateTest = () => {
    if (!testTitle.trim()) {
      toast.warning("Please enter a test title")
      return
    }
    const newAsgn: AssignmentItem = {
      id: `test-${Date.now()}`,
      title: testTitle.trim(),
      type: "Test",
      dueDate: testDueDate || "2026-08-25",
      marks: parseInt(testMarks) || 50
    }
    setAssignments((prev) => [...prev, newAsgn])
    setTestTitle("")
    toast.success(`Test "${newAsgn.title}" published!`)
  }

  const handleCreateQuiz = () => {
    if (!quizTitle.trim()) {
      toast.warning("Please enter a quiz title")
      return
    }
    const newAsgn: AssignmentItem = {
      id: `quiz-${Date.now()}`,
      title: quizTitle.trim(),
      type: quizType,
      dueDate: quizDueDate || "2026-08-26",
      marks: quizType === "Coding Quiz" ? 40 : 20
    }
    setAssignments((prev) => [...prev, newAsgn])
    setQuizTitle("")
    toast.success(`${quizType} "${newAsgn.title}" created!`)
  }

  const handleShareAnnouncement = () => {
    if (!announcementText.trim()) {
      toast.warning("Please enter announcement message")
      return
    }
    const newAsgn: AssignmentItem = {
      id: `ann-${Date.now()}`,
      title: announcementText.trim(),
      type: "Announcement",
      dueDate: "Today"
    }
    setAssignments((prev) => [...prev, newAsgn])
    setAnnouncementText("")
    toast.success("Announcement broadcasted!")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.info("Logged out.")
    router.replace("/")
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Animated Floating Nodes Background */}
      <AnimatedLearningBackground />

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 studio-panel border-b border-slate-200/80 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md">
            EB
          </div>
          <div>
            <h1 className="text-xl font-black gradient-text-coral leading-none">Teacher Control Center</h1>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Classroom Analytics & AI Summarizer</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs"
            onClick={() => setPricingOpen(true)}
          >
            <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Upgrade Pro
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{self?.name || "Teacher"}</p>
            <p className="text-[10px] text-slate-500">{self?.email || "teacher@edumeet.ai"}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600 border-slate-200 text-xs font-bold">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="teacher" />

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Sidebar */}
        <aside className="w-72 border-r border-slate-200/80 studio-panel p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 rounded-2xl shadow-md text-xs">
                  <Plus className="w-4 h-4 mr-2" /> Create New Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md studio-panel border-slate-200 text-slate-900 rounded-3xl bg-white/95">
                <DialogHeader>
                  <DialogTitle className="text-orange-600 font-black">Create a New Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="className" className="text-slate-700 text-xs font-bold">Classroom Name</Label>
                    <Input
                      id="className"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      placeholder="e.g. Advanced Web Engineering"
                      className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <DialogClose asChild>
                  <Button type="button" className="w-full bg-orange-500 text-white font-bold text-xs" onClick={handleCreateClassroom}>
                    Create Classroom
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-1">Your Classrooms</h2>
            <ul className="space-y-1.5">
              {yourClasses.map((cls) => {
                const isActive = activeClass?.classId === cls.classId
                return (
                  <li key={cls.classId}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left font-bold rounded-xl px-3 py-2.5 transition-all text-xs ${
                        isActive ? "bg-orange-100/80 text-orange-900 border border-orange-200 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      onClick={() => setActiveClass(cls)}
                    >
                      <Book className={`w-4 h-4 mr-2.5 ${isActive ? "text-orange-600" : "text-slate-400"}`} />
                      <span className="truncate">{cls.className}</span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200/80">
            <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200 text-xs text-orange-950 space-y-1">
              <p className="font-bold flex items-center text-orange-700">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Active Classroom:
              </p>
              <p className="truncate font-black text-slate-900">{activeClass?.className}</p>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-5 max-w-2xl bg-slate-100/90 p-1 rounded-2xl border border-slate-200 shadow-sm mb-6">
              <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold text-xs">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold text-xs">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold text-xs">
                Students ({students.length})
              </TabsTrigger>
              <TabsTrigger value="chapters" className="rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold text-xs">
                Chapters & AI
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold text-xs">
                Content
              </TabsTrigger>
            </TabsList>

            {/* Analytics Dashboard Tab (from handwritten note) */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border border-indigo-200/80 shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-indigo-700 font-black uppercase tracking-wider">Total Enrolled</p>
                      <p className="text-2xl font-black text-indigo-950 mt-1">{students.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
                      <UserPlus className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border border-emerald-200/80 shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">Class Average</p>
                      <p className="text-2xl font-black text-emerald-950 mt-1">86.7%</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-50/90 to-blue-50/90 border border-cyan-200/80 shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-cyan-700 font-black uppercase tracking-wider">Completion Rate</p>
                      <p className="text-2xl font-black text-cyan-950 mt-1">78.3%</p>
                    </div>
                    <div className="w-10 h-10 bg-cyan-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50/90 to-orange-50/90 border border-amber-200/80 shadow-md rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Active Quizzes</p>
                      <p className="text-2xl font-black text-amber-950 mt-1">{assignments.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Student Performance Analysis Table */}
              <Card className="studio-panel border-slate-200/80 rounded-3xl shadow-xl overflow-hidden bg-white/95">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" /> Student Performance & Topic Mastery Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs">Individual student scores, assignment completion, and AI recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="text-slate-500 font-bold">Student Name</TableHead>
                        <TableHead className="text-slate-500 font-bold">Avg Score</TableHead>
                        <TableHead className="text-slate-500 font-bold">Course Completion</TableHead>
                        <TableHead className="text-slate-500 font-bold">Status</TableHead>
                        <TableHead className="text-right text-slate-500 font-bold">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} className="border-slate-100 hover:bg-slate-50/80">
                          <TableCell className="font-bold text-slate-800">{student.name}</TableCell>
                          <TableCell className="font-black text-indigo-700">{student.score}%</TableCell>
                          <TableCell className="w-48">
                            <div className="space-y-1">
                              <Progress value={student.completion} className="h-2 bg-slate-100" />
                              <span className="text-[10px] text-slate-500 font-mono font-semibold">{student.completion}% completed</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {student.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            {student.score >= 85 ? (
                              <span className="text-emerald-700 font-extrabold flex items-center justify-end gap-1">🌟 Mastered</span>
                            ) : (
                              <span className="text-amber-700 font-extrabold flex items-center justify-end gap-1">⚠️ Needs Practice</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments & Tools Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <Card className="studio-panel border-slate-200/80 rounded-3xl shadow-xl bg-white/95">
                <CardHeader>
                  <CardTitle className="text-orange-600 font-black">Assignment & Quiz Builders</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">Create Coding Quizzes, Topic MCQs, Short Answer Q&As, and Announcements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Create Coding / Topic Quiz Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold p-4 h-auto rounded-2xl shadow-md">
                          <Code className="w-5 h-5 mr-3 text-purple-200" />
                          <div>
                            <div className="font-bold text-left text-sm">Coding & Topic Quiz</div>
                            <div className="text-xs text-purple-100 font-normal">Create Coding Quizzes & MCQs</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="studio-panel border-slate-200 text-slate-900 rounded-3xl bg-white/95">
                        <DialogHeader>
                          <DialogTitle className="text-purple-700 font-black">Create Coding / Topic Quiz</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="text-slate-700 text-xs font-bold">Quiz Title</Label>
                            <Input placeholder="e.g. Binary Tree Traversal Coding Quiz" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-700 text-xs font-bold">Quiz Format</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant={quizType === "Coding Quiz" ? "secondary" : "outline"}
                                className={quizType === "Coding Quiz" ? "bg-purple-600 text-white font-bold text-xs" : "border-slate-200 text-slate-700 text-xs"}
                                onClick={() => setQuizType("Coding Quiz")}
                              >
                                Coding Quiz
                              </Button>
                              <Button
                                type="button"
                                variant={quizType === "Quiz" ? "secondary" : "outline"}
                                className={quizType === "Quiz" ? "bg-purple-600 text-white font-bold text-xs" : "border-slate-200 text-slate-700 text-xs"}
                                onClick={() => setQuizType("Quiz")}
                              >
                                Topic MCQ
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-700 text-xs font-bold">Due Date</Label>
                            <Input type="date" value={quizDueDate} onChange={(e) => setQuizDueDate(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="w-full bg-purple-600 text-white font-bold text-xs" onClick={handleCreateQuiz}>
                            Publish Quiz
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>

                    {/* Create Test Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold p-4 h-auto rounded-2xl shadow-md">
                          <Plus className="w-5 h-5 mr-3 text-orange-100" />
                          <div>
                            <div className="font-bold text-left text-sm">Create Test</div>
                            <div className="text-xs text-orange-100 font-normal">Timed assessments & Q&A</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="studio-panel border-slate-200 text-slate-900 rounded-3xl bg-white/95">
                        <DialogHeader>
                          <DialogTitle className="text-orange-600 font-black">Create Assessment Test</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="text-slate-700 text-xs font-bold">Test Title</Label>
                            <Input placeholder="e.g. Midterm Examination" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-700 text-xs font-bold">Total Marks</Label>
                              <Input type="number" value={testMarks} onChange={(e) => setTestMarks(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-700 text-xs font-bold">Due Date</Label>
                              <Input type="date" value={testDueDate} onChange={(e) => setTestDueDate(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                            </div>
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="w-full bg-orange-500 text-white font-bold text-xs" onClick={handleCreateTest}>
                            Publish Test
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>

                    {/* Share Announcement Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start bg-slate-800 hover:bg-slate-900 text-white font-bold p-4 h-auto rounded-2xl shadow-md">
                          <FileText className="w-5 h-5 mr-3 text-slate-300" />
                          <div>
                            <div className="font-bold text-left text-sm">Share Notice</div>
                            <div className="text-xs text-slate-300 font-normal">Broadcast to class board</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="studio-panel border-slate-200 text-slate-900 rounded-3xl bg-white/95">
                        <DialogHeader>
                          <DialogTitle className="text-slate-900 font-black">Broadcast Announcement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="text-slate-700 text-xs font-bold">Announcement Message</Label>
                            <Input placeholder="e.g. Next class will cover Trees and Graphs." value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="w-full bg-slate-800 text-white font-bold text-xs" onClick={handleShareAnnouncement}>
                            Broadcast Notice
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Published Assessments List */}
              <Card className="studio-card border-slate-200 rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-lg font-black">Active Quizzes & Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-slate-100">
                    {assignments.map((item) => (
                      <li key={item.id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.type === "Coding Quiz" && <Code className="w-5 h-5 text-purple-600" />}
                          {item.type === "Test" && <FileCheck className="w-5 h-5 text-indigo-600" />}
                          {item.type === "Quiz" && <HelpCircle className="w-5 h-5 text-purple-600" />}
                          {item.type === "Announcement" && <FileText className="w-5 h-5 text-slate-600" />}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                            <p className="text-xs text-slate-500">Format: {item.type} {item.marks ? `• ${item.marks} Marks` : ""} • Due: {item.dueDate}</p>
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
              <Card className="studio-card border-slate-200 rounded-3xl bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-orange-600 font-black">Student Roster</CardTitle>
                    <CardDescription className="text-slate-500 text-xs">Manage students enrolled in {activeClass?.className}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm">
                        <UserPlus className="w-4 h-4 mr-1.5" /> Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="studio-panel border-slate-200 text-slate-900 rounded-3xl bg-white/95">
                      <DialogHeader>
                        <DialogTitle className="text-orange-600 font-black">Enroll New Student</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-bold">Student Full Name</Label>
                          <Input placeholder="e.g. David Miller" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs font-bold">Student Email</Label>
                          <Input placeholder="david@example.com" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl" />
                        </div>
                      </div>
                      <DialogClose asChild>
                        <Button className="w-full bg-orange-500 text-white font-bold text-xs" onClick={handleAddStudent}>
                          Add Student
                        </Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100">
                        <TableHead className="text-slate-500 font-bold">Student Name</TableHead>
                        <TableHead className="text-slate-500 font-bold">Email</TableHead>
                        <TableHead className="text-slate-500 font-bold">Status</TableHead>
                        <TableHead className="text-right text-slate-500 font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} className="border-slate-100">
                          <TableCell className="font-bold text-slate-900">{student.name}</TableCell>
                          <TableCell className="text-slate-500 text-xs font-mono">{student.email}</TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              student.status === "Enrolled" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}>
                              {student.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {student.status === "Pending" ? (
                              <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs" onClick={() => handleAcceptStudent(student.id)}>
                                  <Check className="w-3.5 h-3.5 mr-1" /> Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRemoveStudent(student.id)}>
                                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs" onClick={() => handleRemoveStudent(student.id)}>
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chapters & AI Bullet Summarizer Tab */}
            <TabsContent value="chapters" className="space-y-6">
              <Card className="studio-card border-slate-200 rounded-3xl bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-purple-700 font-black">Course Chapters & Uploads</CardTitle>
                    <CardDescription className="text-slate-500 text-xs">Upload notes, slides, and voice recordings for {activeClass?.className}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Create Chapter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="studio-panel border-slate-200 text-slate-900 rounded-3xl bg-white/95">
                      <DialogHeader>
                        <DialogTitle className="text-purple-700 font-black">Create a New Chapter</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="chapterName" className="text-slate-700 text-xs font-bold">Chapter Name</Label>
                          <Input
                            id="chapterName"
                            placeholder="e.g. Chapter 3: Dynamic Programming"
                            value={newChapter}
                            onChange={(e) => setNewChapter(e.target.value)}
                            className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                      <DialogClose asChild>
                        <Button className="w-full bg-purple-600 text-white font-bold text-xs" onClick={handleCreateChapter}>
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
                          isSelected ? "border-purple-300 bg-purple-50/50 shadow-sm" : "border-slate-200 bg-white"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-slate-900 text-base">{chap.chapterName}</h4>
                            <Button
                              variant={isSelected ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setSelectedChapter(chap)}
                              className={`text-xs font-bold ${isSelected ? "bg-purple-600 text-white" : "border-slate-200 text-slate-700"}`}
                            >
                              {isSelected ? "Selected Chapter" : "Select Chapter"}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {/* File Upload Box */}
                            <div className="p-4 border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center">
                              <Upload className="w-6 h-6 text-purple-600 mb-2" />
                              <p className="text-xs font-bold text-slate-700 mb-1">
                                {file && isSelected ? file.name : "Select PDF / PPT / Document"}
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
                                  className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                                >
                                  Browse File
                                </Label>
                                {file && isSelected && (
                                  <Button size="sm" className="bg-purple-600 text-white text-xs h-7 font-bold" onClick={handleFileUpload}>
                                    Upload
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Voice Capture Box */}
                            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center">
                              <Mic className={`w-6 h-6 mb-2 ${isRecording ? "text-rose-600 animate-pulse" : "text-indigo-600"}`} />
                              <p className="text-xs font-bold text-slate-800">
                                {isRecording ? `Recording Audio... (${recordingTime}s)` : "Voice Lecture Capture"}
                              </p>
                              <p className="text-[11px] text-slate-500 mb-2">Record live audio note from browser</p>
                              <Button
                                size="sm"
                                className={isRecording ? "bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold" : "bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"}
                                onClick={() => handleVoiceCapture(chap.chapterId)}
                              >
                                {isRecording ? "Stop & Save Recording" : "Start Voice Capture"}
                              </Button>
                            </div>
                          </div>

                          {/* Uploaded Content */}
                          {contentList.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Uploaded Materials ({contentList.length})</p>
                              <ul className="space-y-1.5">
                                {contentList.map((item) => (
                                  <li key={item.fileId} className="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs">
                                    <span className="font-semibold text-slate-800 flex items-center">
                                      {item.fileType.includes("audio") ? <Volume2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" /> : <FileText className="w-3.5 h-3.5 mr-1.5 text-purple-600" />}
                                      {item.fileName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">Attached</span>
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

              {/* AI Notes Bullet Summarizer Tool (from handwritten note) */}
              <NotesAiConverter />
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content">
              <Card className="studio-card border-slate-200 rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-orange-600 font-black">Course Materials & Downloads</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">View all materials uploaded across chapters in {activeClass?.className}</CardDescription>
                </CardHeader>
                <CardContent>
                  {chapterContent.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-4">No content uploaded yet for this class.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100">
                          <TableHead className="text-slate-500 font-bold">File Name</TableHead>
                          <TableHead className="text-slate-500 font-bold">Type</TableHead>
                          <TableHead className="text-right text-slate-500 font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chapterContent.map((item) => (
                          <TableRow key={item.fileId} className="border-slate-100">
                            <TableCell className="font-bold text-slate-900 flex items-center">
                              {item.fileType.includes("audio") ? <Volume2 className="w-4 h-4 mr-2 text-rose-600" /> : <FileText className="w-4 h-4 mr-2 text-purple-600" />}
                              {item.fileName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 uppercase font-mono">{item.fileType.split("/")[1] || "DOCUMENT"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="text-xs border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => toast.info(`Opening ${item.fileName}...`)}>
                                Download / View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}