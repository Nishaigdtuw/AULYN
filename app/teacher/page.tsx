'use client'

import React, { useEffect, useState, useCallback, useRef } from "react"
import { FileText, LogOut, Plus, Book, FileCheck, Sparkles, TrendingUp, Crown, Menu, ChevronDown, ChevronRight, Settings, LayoutDashboard, FolderOpen, Download, User, Save, Eye, Send, ArrowLeft, RefreshCw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Ecosystem Components
import NotesAiConverter from "@/components/notes-ai-converter"
import PricingModal from "@/components/pricing-modal"
import { CreateAssignmentModal } from "@/components/teacher-assignment-modal"
import { LiveSessionModal } from "@/components/live-session-modal"
import { EvidenceAnalytics } from "@/components/evidence-analytics"
import { AssignmentSubmissionModal } from "@/components/assignment-submission-modal"
import { DoubtThreadsModal } from "@/components/doubt-threads-modal"
import { StudentGroupsModal } from "@/components/student-groups-modal"
import { NotificationsDrawer } from "@/components/notifications-drawer"

import { getStoredClassrooms, saveStoredClassrooms, ClassroomData, getSubmissions, SubmissionData, AnnouncementData, NotificationItem, AssignmentData } from "@/lib/data-store"
import { getAuthenticatedUser, clearAuthenticatedUser, setAuthenticatedUser } from "@/lib/auth-guard"

export default function TeacherPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId?: string; name?: string; email?: string; role?: string } | null>(null)

  // Classrooms Data Store & State
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [activeClassroom, setActiveClassroom] = useState<ClassroomData | null>(null)
  const activeClassroomRef = useRef<ClassroomData | null>(null)
  activeClassroomRef.current = activeClassroom

  // Settings State
  const [profileName, setProfileName] = useState("Prof. Sarah Jenkins")
  const [profileEmail, setProfileEmail] = useState("sarah.jenkins@aulyn.edu")
  const [profileBio, setProfileBio] = useState("Senior Computer Science Lecturer & Algorithm Design Specialist")

  // Workspace state & navigation
  const [activeMainTab, setActiveMainTab] = useState("overview")
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false)

  // Ecosystem Modals
  const [liveSessionOpen, setLiveSessionOpen] = useState(false)
  const [doubtThreadsOpen, setDoubtThreadsOpen] = useState(false)
  const [studentGroupsOpen, setStudentGroupsOpen] = useState(false)
  const [asgnSubmissionOpen, setAsgnSubmissionOpen] = useState(false)
  const [selectedAsgn, setSelectedAsgn] = useState<AssignmentData | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Submissions state
  const [studentSubmissions, setStudentSubmissions] = useState<SubmissionData[]>([])

  // Announcement state
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("")
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("")

  // Notifications List
  const [notifications] = useState<NotificationItem[]>([
    { id: "tn1", recipientRole: "teacher", title: "Confusion Spike Detected", message: "68% of recent signals occurred during Tree Traversal.", timestamp: "5 mins ago", read: false },
    { id: "tn2", recipientRole: "teacher", title: "New Assignment Submission", message: "Alex Rivera submitted solution for BST Implementation Lab.", timestamp: "30 mins ago", read: false }
  ])

  // Sidebar Submenus State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    ecosystem: true,
    content: true
  })

  // Data Reload Handler - Safe from loop
  const loadTeacherData = useCallback(() => {
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
      }
      setStudentSubmissions(getSubmissions() || [])
    } catch (err) {
      console.error("Error loading teacher data:", err)
    }
  }, [])

  useEffect(() => {
    loadTeacherData()
    const handleDataUpdate = () => loadTeacherData()
    window.addEventListener("aulyn-data-update", handleDataUpdate)
    return () => window.removeEventListener("aulyn-data-update", handleDataUpdate)
  }, [loadTeacherData])

  // Authenticated Session Check
  useEffect(() => {
    const user = getAuthenticatedUser()
    if (!user) {
      router.replace("/")
      return
    }
    if (user.role === "student") {
      toast.info("Redirected to Student Workspace")
      router.replace("/student")
      return
    }
    setSelf(user)
    if (user.name) setProfileName(user.name)
    if (user.email) setProfileEmail(user.email)
  }, [router])

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }))
  }

  // Classroom Selection Handler
  const handleSelectClassroom = (cls: ClassroomData) => {
    if (!cls) return
    setActiveClassroom(cls)
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

  // Material View/Open Handler
  const handleViewMaterial = (fileName: string, fileUrl?: string) => {
    const urlToUse = fileUrl || `/materials/${fileName}`
    toast.info(`Opening "${fileName}"...`)
    if (typeof window !== "undefined") {
      window.open(urlToUse, "_blank")
    }
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

  // Publish Announcement Broadcast
  const handlePublishAnnouncement = () => {
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) {
      toast.warning("Please fill in announcement title and content")
      return
    }
    if (!activeClassroom) return

    const ann: AnnouncementData = {
      id: `ann-${Date.now()}`,
      classId: activeClassroom.classId,
      author: profileName,
      title: newAnnouncementTitle.trim(),
      content: newAnnouncementContent.trim(),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      important: true,
      acknowledgements: []
    }

    const classroomsList = getStoredClassrooms() || []
    const cls = classroomsList.find((c) => c.classId === activeClassroom.classId)
    if (cls) {
      if (!cls.announcements) cls.announcements = []
      cls.announcements.unshift(ann)
      saveStoredClassrooms(classroomsList)
    }

    setNewAnnouncementTitle("")
    setNewAnnouncementContent("")
    toast.success(`Broadcasted announcement to all students in ${activeClassroom.className}!`)
  }

  // Save Settings & Profile
  const handleSaveSettings = () => {
    const updatedUser = {
      ...(self || {}),
      userId: self?.userId || "teacher-demo",
      name: profileName,
      email: profileEmail,
      role: "teacher" as const
    }
    setAuthenticatedUser(updatedUser)
    setSelf(updatedUser)
    toast.success("Profile & Educator settings saved successfully!")
  }

  // Navigation: Exit Demo
  const handleExitDemo = () => {
    clearAuthenticatedUser()
    toast.info("Exited Demo Workspace. Returned to AULYN Home.")
    router.replace("/")
  }

  // Navigation: Switch Role to Student Demo
  const handleSwitchRole = (newRole: 'teacher' | 'student') => {
    const mockUser = newRole === 'teacher'
      ? { userId: 'teacher-demo', name: 'Prof. Sarah Jenkins', email: 'sarah.jenkins@aulyn.edu', role: 'teacher' as const }
      : { userId: 'student-demo', name: 'Alex Rivera', email: 'alex.rivera@aulyn.edu', role: 'student' as const }

    setAuthenticatedUser(mockUser)
    toast.success(`Switched role to ${newRole === 'teacher' ? 'Teacher' : 'Student'} Workspace`)
    router.replace(newRole === 'teacher' ? '/teacher' : '/student')
  }

  // Sidebar Content Component
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Start Live Session Trigger */}
        <Button
          onClick={() => { setLiveSessionOpen(true); setMobileDrawerOpen(false) }}
          className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          🔴 Start Live Classroom Session
        </Button>

        {/* Create Assignment Trigger */}
        <Button
          onClick={() => { setCreateAssignmentOpen(true); setMobileDrawerOpen(false) }}
          className="w-full bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold py-2 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Assignment (AI Assisted)
        </Button>

        {/* Navigation Items */}
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => { setActiveMainTab("overview"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
              activeMainTab === "overview" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Command Overview
          </button>

          {/* Classes Submenu */}
          <div>
            <button
              onClick={() => toggleSection("classes")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200 cursor-pointer"
            >
              <span className="flex items-center">
                <Book className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Managed Classrooms
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

          {/* Intelligent Ecosystem Submenu */}
          <div>
            <button
              onClick={() => toggleSection("ecosystem")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200 cursor-pointer"
            >
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Intelligent Tools
              </span>
              {expandedSections.ecosystem ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {expandedSections.ecosystem && (
              <div className="ml-4 pl-2 border-l border-[#E5DCD0] space-y-1 mt-1">
                <button onClick={() => { setActiveMainTab("analytics"); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  📊 Evidence Analytics
                </button>
                <button onClick={() => { setDoubtThreadsOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  ❓ Doubt Threads & Bounties
                </button>
                <button onClick={() => { setStudentGroupsOpen(true); setMobileDrawerOpen(false) }} className="w-full text-left px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#292724] font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
                  👥 Group Assignment Workspaces
                </button>
              </div>
            )}
          </div>

          {/* Assessments & Submissions */}
          <button
            onClick={() => { setActiveMainTab("students"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
              activeMainTab === "students" ? "bg-[#F1E8DD] text-[#8B7EC8] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <FileCheck className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Student Roster & Submissions
          </button>

          {/* AI Notes Converter */}
          <button
            onClick={() => { setActiveMainTab("notes"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
              activeMainTab === "notes" ? "bg-[#F1E8DD] text-[#E9B949] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2.5 text-[#E9B949]" /> Notes AI Converter
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
          onClick={() => handleSwitchRole("student")}
          className="w-full border-[#E76F51] text-[#E76F51] hover:bg-[#E76F51]/10 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Switch to Student Demo
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
                <SheetTitle className="text-left font-serif font-bold text-[#292724]">AULYN Educator</SheetTitle>
              </SheetHeader>
              <div className="pt-4 h-[calc(100vh-120px)]">
                <RenderSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          <img src="/aulyn-logo.png" alt="AULYN Logo" className="w-9 h-9 object-contain rounded-lg shadow-2xs hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-base sm:text-lg font-serif font-black text-[#292724] leading-none tracking-tight">AULYN</h1>
            <p className="text-[10px] text-[#77716A] font-medium mt-0.5 hidden sm:block">Teacher Command Center</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
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
            <Crown className="w-3.5 h-3.5 mr-1.5 text-[#E9B949]" /> Pro Educator
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
            <p className="text-xs font-bold text-[#292724]">{profileName}</p>
            <p className="text-[10px] font-semibold text-[#4A453F]">{profileEmail}</p>
          </div>

          <Button variant="outline" size="sm" onClick={handleExitDemo} className="text-[#77716A] hover:text-red-600 border-[#E5DCD0] text-xs font-semibold rounded-xl cursor-pointer">
            <LogOut className="w-4 h-4 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      {/* ECOSYSTEM MODALS & DRAWERS */}
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="teacher" />
      <NotificationsDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} userRole="teacher" notifications={notifications} />

      {activeClassroom && (
        <>
          <LiveSessionModal open={liveSessionOpen} onOpenChange={setLiveSessionOpen} classroom={activeClassroom} userRole="teacher" />
          <CreateAssignmentModal open={createAssignmentOpen} onOpenChange={setCreateAssignmentOpen} activeClass={activeClassroom} />
          <DoubtThreadsModal open={doubtThreadsOpen} onOpenChange={setDoubtThreadsOpen} classId={activeClassroom.classId} className={activeClassroom.className} userRole="teacher" />
          <StudentGroupsModal open={studentGroupsOpen} onOpenChange={setStudentGroupsOpen} classId={activeClassroom.classId} className={activeClassroom.className} userRole="teacher" />

          {selectedAsgn && (
            <AssignmentSubmissionModal open={asgnSubmissionOpen} onOpenChange={setAsgnSubmissionOpen} assignment={selectedAsgn} userRole="teacher" />
          )}
        </>
      )}

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Desktop Sidebar */}
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
                Active Classroom: <span className="text-[#E76F51] font-bold">{activeClassroom?.className || "Loading..."}</span> ({activeClassroom?.code})
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
            <TabsList className="grid w-full grid-cols-5 max-w-2xl bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs mb-6">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#75B798] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Evidence Analytics
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Roster
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E9B949] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Notes AI
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200 cursor-pointer">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Broadcast Announcement Form Card */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#E76F51]" /> Broadcast Class Announcement ({activeClassroom?.code})
                  </CardTitle>
                  <CardDescription className="text-xs text-[#77716A]">
                    Post announcements that instantly alert all enrolled students in {activeClassroom?.className}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Announcement Title (e.g. Midterm Review Schedule Shift)"
                    value={newAnnouncementTitle}
                    onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                    className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                  />
                  <Input
                    placeholder="Message content for enrolled students..."
                    value={newAnnouncementContent}
                    onChange={(e) => setNewAnnouncementContent(e.target.value)}
                    className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                  />
                  <Button
                    onClick={handlePublishAnnouncement}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Publish Announcement
                  </Button>

                  {/* Announcement Acknowledgement Status Audit */}
                  {activeClassroom?.announcements && activeClassroom.announcements.length > 0 && (
                    <div className="pt-2 border-t border-[#E5DCD0] flex items-center justify-between text-xs font-semibold text-[#77716A]">
                      <span>Latest Announcement Acknowledged:</span>
                      <span className="font-bold text-[#292724] bg-[#F1E8DD] px-2.5 py-0.5 rounded-full">
                        {activeClassroom.announcements[0].acknowledgements?.length || 1} / {activeClassroom.students.length} Students Acknowledged
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider">Enrolled Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold text-[#292724]">
                      {activeClassroom?.students?.length || 0} Active
                    </div>
                    <p className="text-xs text-[#75B798] font-bold mt-1 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> +2 this week
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider">Average Class Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold text-[#8B7EC8]">
                      {activeClassroom?.students?.[0]?.score || 88}%
                    </div>
                    <p className="text-xs text-[#292724] font-semibold mt-1">Synced across real quiz attempts</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-[#292724] uppercase tracking-wider">Submissions Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-serif font-bold text-[#E76F51]">
                      {studentSubmissions.filter((s) => s.classId === activeClassroom?.classId).length} Received
                    </div>
                    <p className="text-xs text-[#292724] font-semibold mt-1">Real-time student submissions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Class Material Downloads */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#8B7EC8]" /> Course Document Downloads ({activeClassroom?.className})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {activeClassroom?.materials && activeClassroom.materials.length > 0 ? (
                    activeClassroom.materials.map((mat) => (
                      <div key={mat.fileId} className="p-3 bg-white hover:bg-[#F1E8DD]/40 rounded-xl border border-[#E5DCD0] text-xs font-bold text-[#292724] flex items-center justify-between shadow-2xs">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#E76F51]" /> {mat.fileName}
                        </span>
                        <div className="flex items-center space-x-1.5">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* EVIDENCE ANALYTICS TAB */}
            <TabsContent value="analytics" className="animate-in fade-in-50 duration-200">
              <EvidenceAnalytics classId={activeClassroom?.classId} />
            </TabsContent>

            {/* STUDENT ROSTER & SUBMISSIONS TAB */}
            <TabsContent value="students" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base">Enrolled Roster & Real-Time Submissions</CardTitle>
                  <CardDescription className="text-xs text-[#77716A]">Student performance metrics for {activeClassroom?.className}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E5DCD0]">
                        <TableHead className="text-xs font-bold text-[#292724]">Student Name</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Email</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Status</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Avg Score</TableHead>
                        <TableHead className="text-xs font-bold text-[#292724]">Weak Topics</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeClassroom?.students && activeClassroom.students.length > 0 ? (
                        activeClassroom.students.map((student) => (
                          <TableRow key={student.id} className="border-[#E5DCD0]">
                            <TableCell className="font-bold text-xs text-[#292724]">{student.name}</TableCell>
                            <TableCell className="text-xs font-semibold text-[#292724]">{student.email}</TableCell>
                            <TableCell>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#75B798]/15 text-[#75B798] border-[#75B798]/30">
                                {student.status}
                              </span>
                            </TableCell>
                            <TableCell className="font-bold text-xs text-[#292724] font-mono">{student.score}%</TableCell>
                            <TableCell className="text-xs text-red-600 font-semibold">
                              {student.weakTopics && student.weakTopics.length > 0 ? student.weakTopics.join(", ") : "None identified"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs text-[#77716A] py-4">No enrolled students in this classroom yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Submissions Received from Students */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#8B7EC8]" /> Live Student Submissions ({activeClassroom?.code})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {studentSubmissions.filter((s) => s.classId === activeClassroom?.classId).length === 0 ? (
                    <p className="text-xs text-[#77716A] italic">No submissions received for {activeClassroom?.className} yet.</p>
                  ) : (
                    studentSubmissions.filter((s) => s.classId === activeClassroom?.classId).map((sub) => (
                      <div key={sub.submissionId} className="p-3.5 bg-white border border-[#E5DCD0] rounded-xl text-xs space-y-2 font-bold shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#292724]">{sub.studentName} — {sub.assignmentTitle}</span>
                          <Button
                            size="sm"
                            onClick={() => {
                              const targetAsgn: AssignmentData = activeClassroom?.assignments?.find((a) => a.id === sub.assignmentId) || {
                                id: sub.assignmentId,
                                classId: sub.classId,
                                chapterId: "c1",
                                title: sub.assignmentTitle,
                                type: "Coding",
                                difficulty: "Intermediate",
                                dueDate: "2026-08-25",
                                totalMarks: 50,
                                instructions: "Review student code submission.",
                                published: true,
                                submissionsCount: 1
                              }
                              setSelectedAsgn(targetAsgn)
                              setAsgnSubmissionOpen(true)
                            }}
                            className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-[11px] h-7 rounded-lg cursor-pointer"
                          >
                            Inspect Submission & Thread
                          </Button>
                        </div>
                        <p className="text-[11px] font-mono text-[#77716A] bg-[#FFF9F1] p-2.5 rounded-lg border border-[#E5DCD0]">{sub.content}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES AI TAB */}
            <TabsContent value="notes" className="animate-in fade-in-50 duration-200">
              <NotesAiConverter />
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-[#E76F51]" /> Educator Profile & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#292724]">Full Name</Label>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#292724]">Email Address</Label>
                      <Input
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#292724]">Academic Specialization</Label>
                    <Input
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-2xs cursor-pointer"
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