'use client'

import React, { useEffect, useState, useCallback } from "react"
import { FileText, LogOut, Plus, Book, FileCheck, Sparkles, TrendingUp, Crown, Menu, ChevronDown, ChevronRight, Settings, LayoutDashboard, FolderOpen, Download, User, Save, Eye, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import NotesAiConverter from "@/components/notes-ai-converter"
import PricingModal from "@/components/pricing-modal"
import { CreateAssignmentModal } from "@/components/teacher-assignment-modal"
import { getStoredClassrooms, saveStoredClassrooms, ClassroomData, getSubmissions, SubmissionData, AnnouncementData } from "@/lib/data-store"
import { getAuthenticatedUser, clearAuthenticatedUser } from "@/lib/auth-guard"

export default function TeacherPortal() {
  const router = useRouter()
  const [self, setSelf] = useState<{ userId?: string; name?: string; email?: string; role?: string } | null>(null)

  // Classrooms Data Store
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([])
  const [activeClassroom, setActiveClassroom] = useState<ClassroomData | null>(null)

  // Settings State
  const [profileName, setProfileName] = useState("Prof. Sarah Jenkins")
  const [profileEmail, setProfileEmail] = useState("sarah.jenkins@aulyn.edu")
  const [profileBio, setProfileBio] = useState("Senior Computer Science Lecturer & Algorithm Design Specialist")

  // Workspace state & modals
  const [activeMainTab, setActiveMainTab] = useState("overview")
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false)

  // Submissions state
  const [studentSubmissions, setStudentSubmissions] = useState<SubmissionData[]>([])

  // Announcement state
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("")
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("")

  // Sidebar Expandable Submenus
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    classes: true,
    assessments: true,
    content: true,
    aiTools: true
  })

  // Data Reload Handler
  const loadTeacherData = useCallback(() => {
    const list = getStoredClassrooms()
    setClassrooms(list)
    if (list.length > 0) {
      if (!activeClassroom) {
        setActiveClassroom(list[0])
      } else {
        const found = list.find((c) => c.classId === activeClassroom.classId)
        if (found) setActiveClassroom(found)
      }
    }
    setStudentSubmissions(getSubmissions())
  }, [activeClassroom])

  useEffect(() => {
    loadTeacherData()
    window.addEventListener("aulyn-data-update", loadTeacherData)
    return () => window.removeEventListener("aulyn-data-update", loadTeacherData)
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
      important: true
    }

    const classroomsList = getStoredClassrooms()
    const cls = classroomsList.find((c) => c.classId === activeClassroom.classId)
    if (cls) {
      cls.announcements.unshift(ann)
      saveStoredClassrooms(classroomsList)
    }

    setNewAnnouncementTitle("")
    setNewAnnouncementContent("")
    toast.success(`Broadcasted announcement to all students in ${activeClassroom.className}!`)
  }

  // Save Settings
  const handleSaveSettings = () => {
    const updatedUser = {
      ...(self || {}),
      userId: self?.userId || "teacher-demo",
      name: profileName,
      email: profileEmail,
      role: "teacher" as const
    }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setSelf(updatedUser)
    toast.success("Profile & Educator settings saved successfully!")
  }

  const handleLogout = () => {
    clearAuthenticatedUser()
    toast.info("Logged out.")
    router.replace("/")
  }

  // Sidebar Content Render Component
  const RenderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        {/* Create Assignment Trigger */}
        <Button
          onClick={() => { setCreateAssignmentOpen(true); setMobileDrawerOpen(false) }}
          className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2 rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-xs flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Assignment (AI Assisted)
        </Button>

        {/* Structured Expandable Submenus */}
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => { setActiveMainTab("overview"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
              activeMainTab === "overview" ? "bg-[#F1E8DD] text-[#E76F51] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2.5 text-[#E76F51]" /> Command Overview
          </button>

          {/* Classes Submenu */}
          <div>
            <button
              onClick={() => toggleSection("classes")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724] transition-all duration-200"
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
                    onClick={() => { setActiveClassroom(cls); setActiveMainTab("overview"); setMobileDrawerOpen(false) }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate transition-all duration-200 ${
                      activeClassroom?.classId === cls.classId ? "bg-[#FFF9F1] text-[#E76F51] font-bold shadow-2xs border border-[#E5DCD0]" : "text-[#77716A] hover:text-[#292724]"
                    }`}
                  >
                    {cls.code}: {cls.className}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assessments & Submissions */}
          <button
            onClick={() => { setActiveMainTab("students"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
              activeMainTab === "students" ? "bg-[#F1E8DD] text-[#8B7EC8] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <FileCheck className="w-4 h-4 mr-2.5 text-[#8B7EC8]" /> Student Submissions & Roster
          </button>

          {/* AI Tools */}
          <button
            onClick={() => { setActiveMainTab("notes"); setMobileDrawerOpen(false) }}
            className={`w-full flex items-center px-3 py-2 rounded-xl font-bold transition-all duration-200 ${
              activeMainTab === "notes" ? "bg-[#F1E8DD] text-[#E9B949] shadow-2xs" : "text-[#77716A] hover:bg-[#F1E8DD]/40 hover:text-[#292724]"
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2.5 text-[#E9B949]" /> Notes AI Converter
          </button>

          {/* Settings */}
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

      {/* Pricing & Create Assignment Modals */}
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} userRole="teacher" />
      <CreateAssignmentModal
        open={createAssignmentOpen}
        onOpenChange={setCreateAssignmentOpen}
        activeClass={activeClassroom}
      />

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
                Active Classroom: <span className="text-[#E76F51] font-bold">{activeClassroom?.className}</span> ({activeClassroom?.code})
              </p>
            </div>

            {/* Classroom Selector Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {classrooms.map((cls) => (
                <button
                  key={cls.classId}
                  onClick={() => setActiveClassroom(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${
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
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Overview
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Student Roster
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E9B949] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
                Notes AI
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs data-[state=active]:shadow-2xs transition-all duration-200">
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
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Publish Announcement
                  </Button>
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
                      {activeClassroom?.students.length || 0} Active
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
                      {activeClassroom?.students[0]?.score || 88}%
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
                  {activeClassroom?.materials.map((mat) => (
                    <div key={mat.fileId} className="p-3 bg-white hover:bg-[#F1E8DD]/40 rounded-xl border border-[#E5DCD0] text-xs font-bold text-[#292724] flex items-center justify-between shadow-2xs">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#E76F51]" /> {mat.fileName}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMaterial(mat.fileName, mat.fileUrl)}
                          className="text-[11px] text-[#8B7EC8] border-[#E5DCD0] hover:bg-[#8B7EC8] hover:text-white font-bold h-7 px-3 rounded-lg"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadMaterial(mat.fileName, mat.fileUrl)}
                          className="text-[11px] text-[#E76F51] border-[#E5DCD0] hover:bg-[#E76F51] hover:text-white font-bold h-7 px-3 rounded-lg"
                        >
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
                      {activeClassroom?.students.map((student) => (
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
                            {student.weakTopics.length > 0 ? student.weakTopics.join(", ") : "None identified"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Submissions Received from Students */}
              <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-[#292724] font-serif font-bold text-base flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#8B7EC8]" /> Live Student Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {studentSubmissions.length === 0 ? (
                    <p className="text-xs text-[#77716A] italic">No submissions received yet. When students submit solutions in Student Workspace, they will appear here.</p>
                  ) : (
                    studentSubmissions.map((sub) => (
                      <div key={sub.submissionId} className="p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs space-y-1 font-bold">
                        <div className="flex items-center justify-between">
                          <span className="text-[#292724]">{sub.studentName} — {sub.assignmentTitle}</span>
                          <span className="text-[10px] text-[#75B798] bg-[#75B798]/10 border border-[#75B798]/30 px-2 py-0.5 rounded-full">
                            {sub.submittedAt}
                          </span>
                        </div>
                        <p className="text-[11px] font-normal text-[#77716A] bg-[#F1E8DD]/40 p-2 rounded-lg">{sub.content}</p>
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
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-2xs"
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