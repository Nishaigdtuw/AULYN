'use client'

import React, { useState, useEffect } from "react"
import { Play, Pause, Square, AlertCircle, Sparkles, Send, Clock, Flame, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ClassroomData, LiveSessionData, getLiveSession, saveLiveSession, saveStoredClassrooms, getStoredClassrooms } from "@/lib/data-store"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

interface LiveSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroom: ClassroomData
  userRole: 'student' | 'teacher'
  studentName?: string
}

export function LiveSessionModal({
  open,
  onOpenChange,
  classroom,
  userRole
}: LiveSessionModalProps) {
  const [session, setSession] = useState<LiveSessionData | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Teacher AI Notes State
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const [notesTitle, setNotesTitle] = useState("Trees & Tree Traversal — Live Lecture Notes")
  const [notesSummary, setNotesSummary] = useState(
    "Depth-First Search (DFS) traverses down a tree branch completely using recursion/stack frames before backtracking. In-Order traversal (Left -> Node -> Right) visits BST nodes in strictly sorted order."
  )
  const [notesCode] = useState(
    `def inorder(root):\n    if not root: return\n    inorder(root.left)   # Visit Left Subtree\n    print(root.val)      # Process Current Node\n    inorder(root.right)  # Visit Right Subtree`
  )

  useEffect(() => {
    if (classroom) {
      const active = getLiveSession(classroom.classId)
      if (active) {
        setSession(active)
      } else {
        const defaultSession: LiveSessionData = {
          sessionId: `sess-${classroom.classId}-1`,
          classId: classroom.classId,
          className: classroom.className,
          topic: "Trees & Tree Traversal",
          status: "Live",
          startedAt: "10:00 AM",
          confusionSignalsCount: 14,
          heatmapTimeline: [
            { timeLabel: "10:03", topic: "Tree Terminology & Nodes", confusionCount: 2, level: "Low" },
            { timeLabel: "10:11", topic: "Binary Search Tree Insertion", confusionCount: 4, level: "Moderate" },
            { timeLabel: "10:18", topic: "DFS Traversal & Call Stack", confusionCount: 14, level: "High Spike" },
            { timeLabel: "10:26", topic: "BFS Level Order Queue", confusionCount: 3, level: "Low" }
          ],
          transcriptSummary: "Today we covered binary tree nodes, BST search invariants, and recursive DFS call stack execution."
        }
        setSession(defaultSession)
      }
    }
  }, [classroom, open])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleStudentConfusionSignal = () => {
    if (!session || cooldown > 0) return

    setCooldown(6)
    const updatedSignals = session.confusionSignalsCount + 1
    const updatedTimeline = session.heatmapTimeline.map((item) => {
      if (item.topic.includes("DFS") || item.topic.includes("Traversal")) {
        return { ...item, confusionCount: item.confusionCount + 1, level: "High Spike" as const }
      }
      return item
    })

    const updatedSession: LiveSessionData = {
      ...session,
      confusionSignalsCount: updatedSignals,
      heatmapTimeline: updatedTimeline
    }

    setSession(updatedSession)
    saveLiveSession(updatedSession)

    saveMasteryEvidence("student-demo", classroom.classId, "tree-traversal", {
      type: "Confusion",
      title: "Live Lecture Confusion Signal",
      score: 4,
      maxScore: 10,
      percentage: 40,
      notes: `Reported confusion during live explanation of ${session.topic}`
    })

    toast.success("Anonymous confusion signal sent to professor. Identity remains 100% private.", {
      icon: "🤫"
    })
  }

  const handleToggleSessionStatus = (newStatus: 'Live' | 'Paused' | 'Ended') => {
    if (!session) return
    const updated = { ...session, status: newStatus }
    setSession(updated)
    saveLiveSession(updated)
    toast.info(`Live session status updated to ${newStatus}`)
  }

  const handleGenerateAiNotes = () => {
    setIsGeneratingNotes(true)
    setTimeout(() => {
      setIsGeneratingNotes(false)
      toast.success("AI Live Notes generated from lecture transcript!")
    }, 600)
  }

  const handlePublishLiveNotes = () => {
    if (!session) return
    const classrooms = getStoredClassrooms()
    const targetClass = classrooms.find((c) => c.classId === classroom.classId)
    if (targetClass) {
      if (!targetClass.chapters) targetClass.chapters = []
      const newChap = {
        chapterId: `chap-live-${Date.now()}`,
        chapterName: notesTitle,
        description: "Live lecture summary and published algorithm code.",
        sourceNoteFile: "Live_Lecture_Notes.pdf",
        sourceNoteContent: `${notesSummary}\n\nCode Implementation:\n${notesCode}`,
        materials: [
          {
            fileId: `mat-${Date.now()}`,
            fileName: "Live_Lecture_Notes.pdf",
            fileType: "application/pdf",
            fileUrl: "/materials/Trees_Lecture_Notes.pdf",
            uploadedAt: new Date().toLocaleDateString(),
            size: "1.4 MB"
          }
        ]
      }
      targetClass.chapters.unshift(newChap)
      saveStoredClassrooms(classrooms)
    }

    toast.success(`Published live lecture notes to all enrolled students in ${classroom.className}!`)
    onOpenChange(false)
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
                {session.status} Session
              </span>
              <span className="text-xs font-bold text-[#77716A]">{session.startedAt}</span>
            </div>

            {userRole === 'teacher' && (
              <div className="flex items-center space-x-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleSessionStatus(session.status === 'Live' ? 'Paused' : 'Live')}
                  className="text-xs font-bold border-[#E5DCD0] rounded-xl cursor-pointer"
                >
                  {session.status === 'Live' ? <Pause className="w-3.5 h-3.5 mr-1 text-[#E9B949]" /> : <Play className="w-3.5 h-3.5 mr-1 text-[#75B798]" />}
                  {session.status === 'Live' ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleToggleSessionStatus('Ended')}
                  className="text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 mr-1" /> End Session
                </Button>
              </div>
            )}
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            {session.className} — {session.topic}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            {userRole === 'teacher'
              ? 'Real-time confusion heatmap analysis and live AI lecture notes publishing.'
              : '&quot;I&apos;m confused&quot; button lets you report confusion anonymously.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {userRole === 'student' && (
            <Card className="bg-white border-2 border-[#E76F51]/30 shadow-md rounded-2xl p-5 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-[#E76F51]">
                <Flame className="w-6 h-6 animate-pulse" />
                <h3 className="text-base font-serif font-bold text-[#292724]">Live Lecture Support</h3>
              </div>
              <p className="text-xs text-[#77716A] font-semibold max-w-md mx-auto">
                Having trouble following <strong>{session.topic}</strong>? Tap below to notify Professor Jenkins anonymously.
              </p>

              <Button
                onClick={handleStudentConfusionSignal}
                disabled={cooldown > 0 || session.status !== 'Live'}
                className="w-full max-w-sm bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-3 text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {cooldown > 0 ? (
                  <span className="flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2 animate-spin" /> Cooldown ({cooldown}s)
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    🤔 I&apos;m Confused (Anonymous Signal)
                  </span>
                )}
              </Button>
              <p className="text-[10px] text-[#77716A] italic">
                🔒 Your name is never attached to confusion signals.
              </p>
            </Card>
          )}

          {userRole === 'teacher' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start space-x-3.5 shadow-2xs">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-amber-900">
                    🔥 Confusion Spike Detected in &quot;Tree Traversal&quot;
                  </h4>
                  <p className="text-xs text-amber-800 font-medium">
                    <strong>68% of recent student signals</strong> occurred during the DFS recursive call stack explanation.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" onClick={() => toast.info("Broadcasted visual diagram explanation to student screens!")} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer">
                      💡 Explain Again Visually
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Pushed quick 1-question check to students!")} className="border-amber-300 text-amber-900 font-bold text-xs rounded-xl cursor-pointer">
                      ✍️ Create Quick Check
                    </Button>
                  </div>
                </div>
              </div>

              <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">
                  Live Classroom Understanding Timeline
                </h4>
                <div className="space-y-2">
                  {session.heatmapTimeline.map((pt, idx) => (
                    <div key={idx} className="p-2.5 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-[11px] text-[#77716A]">{pt.timeLabel}</span>
                        <span className="text-[#292724]">{pt.topic}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          pt.level === 'High Spike' ? 'bg-red-100 text-red-700 border border-red-300 font-black' :
                          pt.level === 'Moderate' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}>
                          {pt.confusionCount} Signals ({pt.level})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#E76F51]" />
                <h3 className="text-sm font-serif font-bold text-[#292724]">Live AI Lecture Notes & Code Summary</h3>
              </div>
              {userRole === 'teacher' && (
                <Button
                  size="sm"
                  onClick={handleGenerateAiNotes}
                  disabled={isGeneratingNotes}
                  className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#E9B949]" />
                  {isGeneratingNotes ? 'Generating...' : 'Refresh AI Notes'}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#77716A] uppercase">Note Title</label>
                <Input
                  value={notesTitle}
                  onChange={(e) => setNotesTitle(e.target.value)}
                  disabled={userRole === 'student'}
                  className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-bold text-[#292724] rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#77716A] uppercase">Summary & Core Definitions</label>
                <textarea
                  value={notesSummary}
                  onChange={(e) => setNotesSummary(e.target.value)}
                  disabled={userRole === 'student'}
                  rows={3}
                  className="w-full bg-[#FFF9F1] border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#77716A] uppercase">Published Code Snippet</label>
                <pre className="p-3 bg-[#292724] text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto">
                  {notesCode}
                </pre>
              </div>
            </div>

            {userRole === 'teacher' && (
              <Button
                onClick={handlePublishLiveNotes}
                className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2.5 text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                <Send className="w-4 h-4 mr-1.5" /> Publish Notes to Classroom Students
              </Button>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
