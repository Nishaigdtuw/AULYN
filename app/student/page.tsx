'use client'

import React, { useEffect, useState, useCallback, useRef } from "react"
import { FileText, Download, ArrowUpRight, Menu, LogOut, ChevronDown, ChevronRight, Settings, LayoutDashboard, FolderOpen, Eye, Bell, User, Save, BookOpen, Sparkles, Award, ArrowLeft, RefreshCw, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Ecosystem Components
import CodeVisualizer from "@/components/code-visualizer"
import PricingModal from "@/components/pricing-modal"
import { QuizModal, FlashcardsModal, MockTestModal } from "@/components/practice-modals"
import { AiTutorDialog } from "@/components/ai-tutor-dialog"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { LiveSessionModal } from "@/components/live-session-modal"
import { AdaptiveQuizModal } from "@/components/adaptive-quiz-modal"
import { AiVivaModal } from "@/components/ai-viva-modal"
import { AssignmentSubmissionModal } from "@/components/assignment-submission-modal"
import { DoubtThreadsModal } from "@/components/doubt-threads-modal"
import { StudentGroupsModal } from "@/components/student-groups-modal"
import { PeerStudyRoomModal } from "@/components/peer-study-room-modal"
import { NotificationsDrawer } from "@/components/notifications-drawer"
import { StudentReportModal } from "@/components/student-report-modal"


import { getStoredClassrooms, saveStoredClassrooms, ClassroomData, getSubmissions, SubmissionData, NotificationItem, AssignmentData, viewDocumentFile, downloadDocumentFile } from "@/lib/data-store"

import { getAuthenticatedUser, clearAuthenticatedUser, setAuthenticatedUser } from "@/lib/auth-guard"

export default function StudentPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId?: string; name?: string; email?: string; role?: string } | null>(null)

  // Classrooms Data Store & State
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [activeClassroom, setActiveClassroom] = useState<ClassroomData | null>(null)
  const activeClassroomRef = useRef<ClassroomData | null>(null)
  activeClassroomRef.current = activeClassroom

  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0)

  // Settings State
  const [studentName, setStudentName] = useState("Alex Rivera")
  const [studentEmail, setStudentEmail] = useState("alex.rivera@aulyn.edu")
  const [studentMajor, setStudentMajor] = useState("Computer Science & Engineering")

  // Workspace tab & navigation
  const [activeMainTab, setActiveMainTab] = useState("overview")
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)

  // Ecosystem Modals state
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false)
  const [mockTestModalOpen, setMockTestModalOpen] = useState(false)
  const [aiTutorOpen, setAiTutorOpen] = useState(false)
  const [liveSessionOpen, setLiveSessionOpen] = useState(false)
  const [adaptiveQuizOpen, setAdaptiveQuizOpen] = useState(false)
  const [aiVivaOpen, setAiVivaOpen] = useState(false)
  const [asgnSubmissionOpen, setAsgnSubmissionOpen] = useState(false)
  const [doubtThreadsOpen, setDoubtThreadsOpen] = useState(false)
  const [studentGroupsOpen, setStudentGroupsOpen] = useState(false)
  const [peerStudyOpen, setPeerStudyOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [studentReportOpen, setStudentReportOpen] = useState(false)


  // Active Selection for Submission Modal
  const [selectedAsgn, setSelectedAsgn] = useState<AssignmentData | null>(null)

  // Notifications List
  const [notifications] = useState<NotificationItem[]>([
    { id: "n1", recipientRole: "student", title: "Live Session Started", message: "Prof. Jenkins started live lecture: Trees & Tree Traversal.", timestamp: "10 mins ago", read: false },
    { id: "n2", recipientRole: "student", title: "Assignment Feedback", message: "Prof. Jenkins commented on your BST Implementation submission.", timestamp: "1 hour ago", read: false }
  ])

  // Loaded Notes state
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [activeNoteText, setActiveNoteText] = useState<string>("")
  const [activeNoteFile, setActiveNoteFile] = useState<string>("Trees_Lecture_Notes.pdf")




  // Submission Form State
  const [, setUserSubmissions] = useState<SubmissionData[]>([])

  // Sidebar Submenus State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    ecosystem: true,
    practice: true
  })

  // Help Engine Action Navigator
  const handleHelpNavigation = (target: string) => {
    if (target.startsWith("tab:")) {
      const tabName = target.replace("tab:", "")
      setActiveMainTab(tabName)
    } else if (target.startsWith("modal:")) {
      const modalName = target.replace("modal:", "")
      if (modalName === "quiz") setQuizModalOpen(true)
      if (modalName === "adaptive_quiz") setAdaptiveQuizOpen(true)
      if (modalName === "ai_viva") setAiVivaOpen(true)
      if (modalName === "flashcards") setFlashcardsModalOpen(true)
      if (modalName === "mock_test") setMockTestModalOpen(true)
      if (modalName === "live_session") setLiveSessionOpen(true)
      if (modalName === "doubt_threads") setDoubtThreadsOpen(true)
      if (modalName === "peer_study") setPeerStudyOpen(true)
      if (modalName === "student_groups") setStudentGroupsOpen(true)
      if (modalName === "pricing") setPricingOpen(true)
      if (modalName === "ai_tutor") setAiTutorOpen(true)
      if (modalName === "asgn_submission" && activeClassroom?.assignments?.[0]) {
        setSelectedAsgn(activeClassroom.assignments[0])
        setAsgnSubmissionOpen(true)
      }
    }
  }

  // Data Reload Handler - Safe from loops
  const loadClassroomData = useCallback(() => {
    try {
      const list = getStoredClassrooms() || []
      setClassrooms(list)

      if (list.length > 0) {
        let target = list[0]
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search)
          const classParam = params.get("class")
          if (classParam) {
            const found = list.find((c) => c.classId === classParam || c.code?.toLowerCase() === classParam.toLowerCase())
            if (found) target = found
          } else if (activeClassroomRef.current) {
            const found = list.find((c) => c.classId === activeClassroomRef.current?.classId)
            if (found) target = found
          }
        }

        setActiveClassroom(target)
        const firstChap = target.chapters?.[0]
        if (firstChap) {
          setActiveNoteText(firstChap.sourceNoteContent || "")
          setActiveNoteFile(firstChap.sourceNoteFile || "")
        } else {
          setActiveNoteText("")
          setActiveNoteFile("")
        }
      }
    } catch (err) {
      console.error("Error loading classroom data:", err)
    }
  }, [])

  useEffect(() => {
    loadClassroomData()
    const handleDataUpdate = () => loadClassroomData()
    window.addEventListener("aulyn-data-update", handleDataUpdate)
    return () => window.removeEventListener("aulyn-data-update", handleDataUpdate)
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

    setUserSubmissions(getSubmissions() || [])
  }, [router])

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }))
  }

  // Classroom Switch Handler
  const handleSelectClassroom = (cls: ClassroomData) => {
    if (!cls) return
    setActiveClassroom(cls)
    setSelectedChapterIdx(0)
    const firstChap = cls.chapters?.[0]
    if (firstChap) {
      setActiveNoteText(firstChap.sourceNoteContent || "")
      setActiveNoteFile(firstChap.sourceNoteFile || "")
    } else {
      setActiveNoteText("")
      setActiveNoteFile("")
    }
    setMobileDrawerOpen(false)

    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set("class", cls.classId)
        window.history.pushState({}, "", url.toString())
      } catch {
        // Safe catch
      }
    }

    toast.info(`Active Class: ${cls.className} (${cls.code})`)
  }

  // Acknowledge Announcement Handler
  const handleAcknowledgeAnnouncement = (annId: string) => {
    if (!activeClassroom) return
    const classroomsList = getStoredClassrooms() || []
    const cls = classroomsList.find((c) => c.classId === activeClassroom.classId)
    if (cls && cls.announcements) {
      const targetAnn = cls.announcements.find((a) => a.id === annId)
      if (targetAnn) {
        if (!targetAnn.acknowledgements) targetAnn.acknowledgements = []
        const already = targetAnn.acknowledgements.find((ack) => ack.studentId === "student-demo")
        if (!already) {
          targetAnn.acknowledgements.push({
            announcementId: annId,
            studentId: "student-demo",
            studentName,
            acknowledgedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          })
          saveStoredClassrooms(classroomsList)
          toast.success("Announcement acknowledged!")
        } else {
          toast.info("Announcement already acknowledged.")
        }
      }
    }
  }

  // Functional Load Notes
  const handleLoadNotes = () => {
    if (!activeClassroom) return
    setIsNotesLoading(true)
    const toastId = toast.loading(`Loading lecture notes for ${activeClassroom.className}...`)

    setTimeout(() => {
      const activeChap = activeClassroom.chapters?.[selectedChapterIdx] || activeClassroom.chapters?.[0]
      if (activeChap) {
        setActiveNoteText(activeChap.sourceNoteContent || "")
        setActiveNoteFile(activeChap.sourceNoteFile || "")
        toast.success(`Notes Loaded: "${activeChap.chapterName}"`, { id: toastId })
      } else {
        toast.error("Notes unavailable for selected chapter", { id: toastId })
      }
      setIsNotesLoading(false)
    }, 300)
  }

  // Material View/Open Handler
  const handleViewMaterial = (fileName: string, fileUrl?: string) => {
    toast.info(`Opening "${fileName}"...`)
    viewDocumentFile(fileName, fileUrl)
  }

  // Material Download Handler
  const handleDownloadMaterial = (fileName: string, fileUrl?: string) => {
    toast.info(`Downloading "${fileName}"...`)
    downloadDocumentFile(fileName, fileUrl)
    toast.success(`Downloaded "${fileName}" successfully!`)
  }


  // Save Settings & Profile
  const handleSaveSettings = () => {
    const updatedUser = {
      ...(self || {}),
      userId: self?.userId || "student-demo",
      name: studentName,
      email: studentEmail,
      role: "student" as const
    }
    setAuthenticatedUser(updatedUser)
    setSelf(updatedUser)
    toast.success("Profile & Preferences saved successfully!")
  }

  // Navigation: Exit Demo
  const handleExitDemo = () => {
    clearAuthenticatedUser()
    toast.info("Exited Demo Workspace. Returned to AULYN Home.")
    router.replace("/")
  }

  // Navigation: Switch Role to Teacher Demo
  const handleSwitchRole = (newRole: 'teacher' | 'student') => {
    const mockUser = newRole === 'teacher'
      ? { userId: 'teacher-demo', name: 'Prof. Sarah Jenkins', email: 'sarah.jenkins@aulyn.edu', role: 'teacher' as const }
      : { userId: 'student-demo', name: 'Alex Rivera', email: 'alex.rivera@aulyn.edu', role: 'student' as const }

    setAuthenticatedUser(mockUser)
    toast.success(`Switched role to ${newRole === 'teacher' ? 'Teacher' : 'Student'} Workspace`)
    router.replace(newRole === 'teacher' ? '/teacher' : '/student')
  }

  const currentChapter = activeClassroom?.chapters?.[selectedChapterIdx] || activeClassroom?.chapters?.[0] || null

  // Sidebar Content Component
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Live Session Banner Trigger */}
        <Button
          onClick={() => { setLiveSessionOpen(true); setMobileDrawerOpen(false) }}
          className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2.5 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          🔴 Join Live Classroom Session
        </Button>

        {/* Navigation Items */}
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

          {/* Intelligent Ecosystem Workflows Submenu */}
          <div>
            <button
              onClick={() => toggleSection("ecosystem")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200 cursor-pointer"
            >
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Intelligent Ecosystem
              </span>
              {expandedSections.ecosystem ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.ecosystem && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setAiTutorOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  🤖 AI Tutor & Product Help
                </button>
                <button onClick={() => { setAdaptiveQuizOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  ⚡ Take Adaptive Quiz
                </button>
                <button onClick={() => { setAiVivaOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  🎙️ AI Oral Viva Defense
                </button>
                <button onClick={() => { setDoubtThreadsOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  ❓ Contextual Doubt Threads
                </button>
                <button onClick={() => { setPeerStudyOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  🔥 Peer Study Room & Streaks
                </button>
                <button onClick={() => { setStudentGroupsOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  👥 Group Collaborations
                </button>
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
                <Award className="w-4 h-4 mr-2.5 text-[#75B798]" /> Practice Assessment
              </span>
              {expandedSections.practice ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.practice && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setQuizModalOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer">
                  🎯 Chapter Quiz MCQs
                </button>
                <button onClick={() => { setFlashcardsModalOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer">
                  🃏 3D Flip Flashcards
                </button>
                <button onClick={() => { setMockTestModalOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer">
                  ⏱️ Timed Mock Examination
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

      <div className="pt-4 border-t border-[#E5DCD0] space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSwitchRole("teacher")}
          className="w-full border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8]/10 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Switch to Teacher Demo
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[#77716A] hover:text-[#E76F51] text-xs font-semibold cursor-pointer"
          onClick={handleExitDemo}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> ← Back to AULYN / Exit Demo
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent text-[#292724] flex flex-col justify-between relative overflow-x-hidden animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <header className="flex justify-between items-center px-4 sm:px-8 py-3.5 bg-[#FFF9F1]/95 backdrop-blur-md border-b border-[#E5DCD0] sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center space-x-3">
          {/* Mobile Drawer Trigger */}
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
            <p className="text-[10px] text-[#77716A] font-medium mt-0.5 hidden sm:block">Adaptive Learning System</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Evaluation Report & Graphs Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStudentReportOpen(true)}
            className="border-[#75B798] bg-[#FFF9F1] text-[#75B798] hover:bg-[#75B798]/10 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Award className="w-4 h-4 text-[#75B798]" /> Evaluation Report & Graphs
          </Button>

          {/* AI Assistant Help Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiTutorOpen(true)}
            className="border-[#8B7EC8] bg-[#FFF9F1] text-[#8B7EC8] hover:bg-[#8B7EC8]/10 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-4 h-4 text-[#8B7EC8]" /> AI Assistant Help

          </Button>


          {/* Notifications Drawer Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(true)}
            className="relative text-[#292724] hover:bg-[#F1E8DD]/60 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E76F51] rounded-full animate-ping" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-[#E5DCD0] bg-[#FFF9F1] text-[#292724] hover:bg-[#F1E8DD] font-bold text-xs rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            onClick={() => setPricingOpen(true)}
          >
            Upgrade to Pro
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitDemo}
            className="text-[#E76F51] hover:bg-[#E76F51]/10 font-bold text-xs rounded-xl hidden sm:flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Exit Demo
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#292724]">{studentName}</p>
            <p className="text-[10px] font-semibold text-[#4A453F]">{studentEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleExitDemo} className="text-[#77716A] hover:text-red-600 border-[#E5DCD0] text-xs font-semibold rounded-xl cursor-pointer">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      {/* ECOSYSTEM MODALS & DRAWERS */}
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="student" />
      <NotificationsDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} userRole="student" notifications={notifications} />

      {activeClassroom && (
        <>
          <LiveSessionModal open={liveSessionOpen} onOpenChange={setLiveSessionOpen} classroom={activeClassroom} userRole="student" studentName={studentName} />
          <AdaptiveQuizModal open={adaptiveQuizOpen} onOpenChange={setAdaptiveQuizOpen} classroom={activeClassroom} studentName={studentName} />
          <AiVivaModal open={aiVivaOpen} onOpenChange={setAiVivaOpen} classId={activeClassroom.classId} studentName={studentName} />
          <DoubtThreadsModal open={doubtThreadsOpen} onOpenChange={setDoubtThreadsOpen} classId={activeClassroom.classId} className={activeClassroom.className} userRole="student" studentName={studentName} />
          <StudentGroupsModal open={studentGroupsOpen} onOpenChange={setStudentGroupsOpen} classId={activeClassroom.classId} className={activeClassroom.className} userRole="student" studentName={studentName} />
          <PeerStudyRoomModal open={peerStudyOpen} onOpenChange={setPeerStudyOpen} classId={activeClassroom.classId} className={activeClassroom.className} studentName={studentName} />
          <StudentReportModal open={studentReportOpen} onOpenChange={setStudentReportOpen} studentId="student-demo" studentName={studentName} />


          {selectedAsgn && (
            <AssignmentSubmissionModal open={asgnSubmissionOpen} onOpenChange={setAsgnSubmissionOpen} assignment={selectedAsgn} userRole="student" studentName={studentName} onStartViva={() => setAiVivaOpen(true)} />
          )}

          <QuizModal open={quizModalOpen} onOpenChange={setQuizModalOpen} quiz={activeClassroom.quizzes?.[0] || { quizId: `quiz-${activeClassroom.classId}`, chapterId: "c1", title: `${activeClassroom.code} Quiz`, topic: activeClassroom.subject || "Core", timeMinutes: 10, totalMarks: 20, questions: [] }} classroom={activeClassroom} studentName={studentName} />
          <FlashcardsModal open={flashcardsModalOpen} onOpenChange={setFlashcardsModalOpen} flashcards={activeClassroom.flashcards || []} classroom={activeClassroom} />
          <MockTestModal open={mockTestModalOpen} onOpenChange={setMockTestModalOpen} classroom={activeClassroom} studentName={studentName} />
          <AiTutorDialog
            open={aiTutorOpen}
            onOpenChange={setAiTutorOpen}
            activeClassName={activeClassroom.className || "General Course"}
            activeChapterName={currentChapter?.chapterName || "Overview"}
            sourceNoteContent={activeNoteText}
            userRole="student"
            currentMainTab={activeMainTab}
            currentModal={liveSessionOpen ? "live_session" : asgnSubmissionOpen ? "asgn_submission" : undefined}
            onNavigate={handleHelpNavigation}
          />
        </>
      )}

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Desktop Sidebar */}
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
                Active Classroom: <span className="text-[#E76F51] font-bold">{activeClassroom?.className || "Loading..."}</span> ({activeClassroom?.code}) • Professor: <span className="text-[#8B7EC8] font-bold">{activeClassroom?.instructor}</span>
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

          {/* LIVE SESSION ACTIVE NOTIFICATION BANNER */}
          <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping shrink-0" />
              <div>
                <h4 className="text-xs font-serif font-bold text-red-900 uppercase tracking-wider">Live Lecture Active Now</h4>
                <p className="text-xs text-[#292724] font-semibold mt-0.5">
                  Prof. Sarah Jenkins is conducting <strong>Trees & Tree Traversal</strong> in {activeClassroom?.className}.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setLiveSessionOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs shrink-0 cursor-pointer"
            >
              Join Live Session & Confusion Signal
            </Button>
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
              {/* PERSONALIZED STUDENT KNOWLEDGE GRAPH */}
              <KnowledgeGraph
                classId={activeClassroom?.classId}
                studentId="student-demo"
                onSelectAction={(action) => {
                  if (action === "tutor") setAiTutorOpen(true)
                  if (action === "quiz") setAdaptiveQuizOpen(true)
                }}
              />

              {/* Classroom Announcement Banner with Acknowledge Button */}
              {activeClassroom?.announcements && activeClassroom.announcements.length > 0 ? (
                <div className="p-4 bg-[#FFF9F1]/95 border-2 border-[#E76F51]/40 rounded-2xl shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
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

                  <Button
                    size="sm"
                    onClick={() => handleAcknowledgeAnnouncement(activeClassroom.announcements[0].id)}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer shrink-0"
                  >
                    Acknowledge
                  </Button>
                </div>
              ) : null}

              {/* Ecosystem Quick Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  onClick={() => setAdaptiveQuizOpen(true)}
                  className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center justify-between">
                      Take Adaptive Quiz <ArrowUpRight className="w-4 h-4 text-[#E76F51] group-hover:translate-x-0.5 transition-transform" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-serif font-bold text-[#E76F51]">Dynamic Difficulty</div>
                    <p className="text-xs text-[#77716A] font-semibold mt-1">Adapts to your mastery level</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setAiVivaOpen(true)}
                  className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center justify-between">
                      AI Oral Viva Defense <ArrowUpRight className="w-4 h-4 text-[#8B7EC8] group-hover:translate-x-0.5 transition-transform" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-serif font-bold text-[#8B7EC8]">Conceptual Oral Q&A</div>
                    <p className="text-xs text-[#77716A] font-semibold mt-1">Defend your assignment logic</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setDoubtThreadsOpen(true)}
                  className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center justify-between">
                      Contextual Doubt Threads <ArrowUpRight className="w-4 h-4 text-[#75B798] group-hover:translate-x-0.5 transition-transform" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-serif font-bold text-[#75B798]">Doubt Bounty (+10 Pts)</div>
                    <p className="text-xs text-[#77716A] font-semibold mt-1">Ask questions & earn points</p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Course Assignments */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#E76F51]" /> Active Assignments ({activeClassroom?.className})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeClassroom?.assignments && activeClassroom.assignments.length > 0 ? (
                    activeClassroom.assignments.map((asgn) => (
                      <div key={asgn.id} className="p-4 bg-white border border-[#E5DCD0] rounded-xl space-y-3 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-[#292724]">{asgn.title}</h4>
                            <p className="text-xs font-semibold text-[#77716A]">
                              Format: {asgn.type} • Max Marks: {asgn.totalMarks} • Due: {asgn.dueDate}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAsgn(asgn)
                              setAsgnSubmissionOpen(true)
                            }}
                            className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer self-start sm:self-auto"
                          >
                            Open Submission & Discussion Thread
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#77716A] italic">No active assignments for this classroom yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MATERIALS & NOTES TAB */}
            <TabsContent value="materials" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-[#292724] font-serif font-bold text-base">Course Materials & Published Lecture Notes</CardTitle>
                    <CardDescription className="text-[#292724] font-semibold text-xs">
                      Official lecture slides and study documents for {activeClassroom?.className}
                    </CardDescription>
                  </div>

                  <Button
                    onClick={handleLoadNotes}
                    disabled={isNotesLoading}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 mr-1.5" /> {isNotesLoading ? "Loading..." : "Load Active Notes"}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs font-bold text-[#292724]">Select Chapter / Live Note:</Label>
                    <select
                      value={selectedChapterIdx}
                      onChange={(e) => {
                        const idx = Number(e.target.value)
                        setSelectedChapterIdx(idx)
                        const ch = activeClassroom?.chapters?.[idx]
                        if (ch) {
                          setActiveNoteText(ch.sourceNoteContent || "")
                          setActiveNoteFile(ch.sourceNoteFile || "")
                        }
                      }}
                      className="bg-white border border-[#E5DCD0] text-[#292724] font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      {activeClassroom?.chapters?.map((ch, idx) => (
                        <option key={ch.chapterId} value={idx}>
                          {ch.chapterName}
                        </option>
                      ))}
                    </select>

                    {activeNoteFile && (
                      <span className="text-[10px] font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 border border-[#8B7EC8]/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#8B7EC8]" /> Active: {activeNoteFile}
                      </span>
                    )}
                  </div>


                  <div className="space-y-2">
                    {activeClassroom?.materials && activeClassroom.materials.length > 0 ? (
                      activeClassroom.materials.map((mat) => (
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
                      ))
                    ) : (
                      <p className="text-xs text-[#77716A] italic">No course materials uploaded yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CODE IDE TAB */}
            <TabsContent value="visualizer" className="animate-in fade-in-50 duration-200">
              <CodeVisualizer />
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