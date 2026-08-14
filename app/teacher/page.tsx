'use client'
import React, { useEffect, useState, useCallback, useRef } from "react"
import { FileText, LogOut, Mic, Plus, Upload, Book, Trash2, Check, X, UserPlus, FileCheck, HelpCircle, Volume2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { addChapter, addClass, addContentToChapter, getChapters, getClasses, getContent } from "@/actions/teacher/action"
import { useRouter } from "next/navigation"
import { getPresignedUrl } from "@/actions/teacher/s3"

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
}

interface AssignmentItem {
  id: string
  title: string
  type: "Test" | "Quiz" | "Announcement"
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

  // Students state
  const [students, setStudents] = useState<StudentItem[]>([
    { id: 1, name: "Alice Johnson", email: "alice@example.com", status: "Enrolled" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", status: "Pending" },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", status: "Enrolled" },
  ])
  const [newStudentName, setNewStudentName] = useState("")
  const [newStudentEmail, setNewStudentEmail] = useState("")

  // Assignments & Quizzes state
  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    { id: "asgn-1", title: "Binary Search Trees Assessment", type: "Test", dueDate: "2026-08-20", marks: 50 },
    { id: "asgn-2", title: "Solidity Basics Quiz", type: "Quiz", dueDate: "2026-08-22", marks: 20 }
  ])
  const [testTitle, setTestTitle] = useState("")
  const [testMarks, setTestMarks] = useState("50")
  const [testDueDate, setTestDueDate] = useState("")

  const [quizTitle, setQuizTitle] = useState("")
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

  // Voice capture audio recording
  const handleVoiceCapture = async (chapterId: string) => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      // Start recording
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
        toast.info("Voice capture started. Speak into your microphone...")
      } catch (err) {
        console.error("Microphone access error:", err)
        toast.error("Microphone access denied or unsupported.")
      }
    }
  }

  // Student management actions
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
      status: "Enrolled"
    }
    setStudents((prev) => [...prev, newStud])
    setNewStudentName("")
    setNewStudentEmail("")
    toast.success(`Student ${newStud.name} added!`)
  }

  // Assignment handlers
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
      type: "Quiz",
      dueDate: quizDueDate || "2026-08-26",
      marks: 20
    }
    setAssignments((prev) => [...prev, newAsgn])
    setQuizTitle("")
    toast.success(`Quiz "${newAsgn.title}" created!`)
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
    toast.success("Announcement broadcasted to students!")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.info("Logged out.")
    router.replace("/")
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            EB
          </div>
          <div>
            <h1 className="text-xl font-bold text-indigo-600 leading-none">Edubridge Teacher Portal</h1>
            <p className="text-xs text-slate-500 mt-1">Classroom Management & AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{self?.name || "Teacher"}</p>
            <p className="text-xs text-slate-500">{self?.email || "teacher@edumeet.ai"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600 border-slate-200">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-white p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Create New Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-indigo-600">Create a New Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="className">Classroom Name</Label>
                    <Input
                      id="className"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      placeholder="e.g. Advanced Web Engineering"
                    />
                  </div>
                </div>
                <DialogClose asChild>
                  <Button type="button" className="w-full bg-indigo-600 text-white" onClick={handleCreateClassroom}>
                    Create Classroom
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Your Classrooms</h2>
            <ul className="space-y-1.5">
              {yourClasses.map((cls) => {
                const isActive = activeClass?.classId === cls.classId
                return (
                  <li key={cls.classId}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left font-medium rounded-lg px-3 py-2.5 transition-all ${
                        isActive ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold" : "text-slate-700 hover:bg-slate-100"
                      }`}
                      onClick={() => setActiveClass(cls)}
                    >
                      <Book className={`w-4 h-4 mr-2.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className="truncate">{cls.className}</span>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-800 space-y-1">
              <p className="font-semibold flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Active Class:
              </p>
              <p className="truncate font-bold text-indigo-900">{activeClass?.className}</p>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
          <Tabs defaultValue="assignments" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-xl bg-white p-1 rounded-xl border shadow-sm mb-6">
              <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-medium">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-medium">
                Students ({students.length})
              </TabsTrigger>
              <TabsTrigger value="chapters" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-medium">
                Chapters
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-medium">
                Content
              </TabsTrigger>
            </TabsList>

            {/* Assignments & Tools Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-indigo-600">Quick Tools & Announcements</CardTitle>
                  <CardDescription>Create tests, quizzes, and broadcast notices to your students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Create Test Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-4 h-auto rounded-xl">
                          <Plus className="w-5 h-5 mr-3" />
                          <div>
                            <div className="font-semibold text-left">Create Test</div>
                            <div className="text-xs text-indigo-100 font-normal">Timed assessments & marks</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Assessment Test</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Test Title</Label>
                            <Input placeholder="e.g. Midterm Examination" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Total Marks</Label>
                              <Input type="number" value={testMarks} onChange={(e) => setTestMarks(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Due Date</Label>
                              <Input type="date" value={testDueDate} onChange={(e) => setTestDueDate(e.target.value)} />
                            </div>
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="w-full bg-indigo-600 text-white" onClick={handleCreateTest}>
                            Publish Test
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>

                    {/* Create Quiz Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white font-medium p-4 h-auto rounded-xl">
                          <HelpCircle className="w-5 h-5 mr-3" />
                          <div>
                            <div className="font-semibold text-left">Create Quiz</div>
                            <div className="text-xs text-purple-100 font-normal">Quick MCQ & One-word questions</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Quick Quiz</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Quiz Title</Label>
                            <Input placeholder="e.g. Weekly Review Quiz" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input type="date" value={quizDueDate} onChange={(e) => setQuizDueDate(e.target.value)} />
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="w-full bg-purple-600 text-white" onClick={handleCreateQuiz}>
                            Publish Quiz
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>

                    {/* Share Info Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start bg-slate-800 hover:bg-slate-900 text-white font-medium p-4 h-auto rounded-xl">
                          <FileText className="w-5 h-5 mr-3" />
                          <div>
                            <div className="font-semibold text-left">Share Announcement</div>
                            <div className="text-xs text-slate-300 font-normal">Post notice to class board</div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Broadcast Announcement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Announcement Message</Label>
                            <Input placeholder="e.g. Next class will cover Trees and Graphs." value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} />
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="w-full bg-slate-900 text-white" onClick={handleShareAnnouncement}>
                            Broadcast Notice
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Published Assessments List */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-800 text-lg">Active Assessments & Broadcasts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-slate-100">
                    {assignments.map((item) => (
                      <li key={item.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.type === "Test" && <FileCheck className="w-5 h-5 text-indigo-600" />}
                          {item.type === "Quiz" && <HelpCircle className="w-5 h-5 text-purple-600" />}
                          {item.type === "Announcement" && <FileText className="w-5 h-5 text-slate-600" />}
                          <div>
                            <p className="font-medium text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-500">Type: {item.type} {item.marks ? `• ${item.marks} Marks` : ""} • Due: {item.dueDate}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700" onClick={() => setAssignments((prev) => prev.filter((a) => a.id !== item.id))}>
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
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-indigo-600">Student Enrollment</CardTitle>
                    <CardDescription>Manage students enrolled in {activeClass?.className}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-indigo-600 text-white">
                        <UserPlus className="w-4 h-4 mr-1.5" /> Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enroll New Student</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Student Full Name</Label>
                          <Input placeholder="e.g. David Miller" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Student Email</Label>
                          <Input placeholder="david@example.com" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} />
                        </div>
                      </div>
                      <DialogClose asChild>
                        <Button className="w-full bg-indigo-600 text-white" onClick={handleAddStudent}>
                          Add Student
                        </Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-slate-800">{student.name}</TableCell>
                          <TableCell className="text-slate-600 text-sm">{student.email}</TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              student.status === "Enrolled" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {student.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {student.status === "Pending" ? (
                              <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAcceptStudent(student.id)}>
                                  <Check className="w-3.5 h-3.5 mr-1" /> Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRemoveStudent(student.id)}>
                                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRemoveStudent(student.id)}>
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

            {/* Chapters Tab */}
            <TabsContent value="chapters" className="space-y-6">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-indigo-600">Course Chapters</CardTitle>
                    <CardDescription>Upload notes, slides, and voice recordings for {activeClass?.className}</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Create Chapter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Chapter</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="chapterName">Chapter Name</Label>
                          <Input
                            id="chapterName"
                            placeholder="e.g. Chapter 3: Dynamic Programming"
                            value={newChapter}
                            onChange={(e) => setNewChapter(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogClose asChild>
                        <Button className="w-full bg-indigo-600 text-white" onClick={handleCreateChapter}>
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
                          isSelected ? "border-indigo-300 bg-indigo-50/30 shadow-sm" : "border-slate-200 bg-white"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-slate-800 text-base">{chap.chapterName}</h4>
                            <Button
                              variant={isSelected ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setSelectedChapter(chap)}
                              className="text-xs"
                            >
                              {isSelected ? "Selected Chapter" : "Select Chapter"}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {/* File Upload Box */}
                            <div className="p-4 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                              <Upload className="w-6 h-6 text-indigo-500 mb-2" />
                              <p className="text-xs font-semibold text-slate-700 mb-1">
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
                                  className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                >
                                  Browse File
                                </Label>
                                {file && isSelected && (
                                  <Button size="sm" className="bg-indigo-600 text-white text-xs h-7" onClick={handleFileUpload}>
                                    Upload
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Voice Capture Box */}
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                              <Mic className={`w-6 h-6 mb-2 ${isRecording ? "text-red-500 animate-pulse" : "text-purple-600"}`} />
                              <p className="text-xs font-semibold text-slate-700">
                                {isRecording ? `Recording... (${recordingTime}s)` : "Voice Lecture Capture"}
                              </p>
                              <p className="text-[11px] text-slate-500 mb-2">Record audio note directly from browser</p>
                              <Button
                                size="sm"
                                className={isRecording ? "bg-red-600 hover:bg-red-700 text-white text-xs" : "bg-purple-600 hover:bg-purple-700 text-white text-xs"}
                                onClick={() => handleVoiceCapture(chap.chapterId)}
                              >
                                {isRecording ? "Stop & Save Note" : "Start Audio Recording"}
                              </Button>
                            </div>
                          </div>

                          {/* Uploaded Content */}
                          {contentList.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Uploaded Materials ({contentList.length})</p>
                              <ul className="space-y-1.5">
                                {contentList.map((item) => (
                                  <li key={item.fileId} className="flex items-center justify-between p-2 rounded-lg bg-slate-100/70 text-xs">
                                    <span className="font-medium text-slate-700 flex items-center">
                                      {item.fileType.includes("audio") ? <Volume2 className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> : <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />}
                                      {item.fileName}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Attached</span>
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
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-indigo-600">Course Materials & Downloads</CardTitle>
                  <CardDescription>View all materials uploaded across chapters in {activeClass?.className}</CardDescription>
                </CardHeader>
                <CardContent>
                  {chapterContent.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-4">No content uploaded yet for this class.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chapterContent.map((item) => (
                          <TableRow key={item.fileId}>
                            <TableCell className="font-medium text-slate-800 flex items-center">
                              {item.fileType.includes("audio") ? <Volume2 className="w-4 h-4 mr-2 text-purple-600" /> : <FileText className="w-4 h-4 mr-2 text-indigo-600" />}
                              {item.fileName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 uppercase">{item.fileType.split("/")[1] || "DOCUMENT"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="text-xs" onClick={() => toast.info(`Opening ${item.fileName}...`)}>
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