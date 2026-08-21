'use client'

import React, { useState, useEffect } from "react"
import { Video, BookOpen } from "lucide-react"


import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ClassroomData, LiveSessionData, getLiveSession } from "@/lib/data-store"

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
  const router = useRouter()
  const [session, setSession] = useState<LiveSessionData | null>(null)

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
          confusionSignalsCount: 0,
          heatmapTimeline: [],
          transcriptSummary: "Today we covered binary tree nodes, BST search invariants, and recursive DFS call stack execution."
        }
        setSession(defaultSession)
      }
    }
  }, [classroom, open])

  const handleLaunchVirtualMeeting = () => {
    onOpenChange(false)
    const targetSessionId = session?.sessionId || `sess-${classroom.classId}-1`
    router.push(`/live/${targetSessionId}`)
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
                {session.status} Session
              </span>
              <span className="text-xs font-bold text-[#77716A]">{session.startedAt}</span>
            </div>

            <Button
              onClick={handleLaunchVirtualMeeting}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Video className="w-4 h-4" /> Open Virtual Meeting Room
            </Button>
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            {session.className} — {session.topic}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            {userRole === 'teacher'
              ? 'Educator host control panel for live virtual classroom and lecture notes.'
              : 'Join the live virtual meeting room and view live lecture notes so far.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-red-900 uppercase tracking-wider">Virtual Class Meeting Room Ready</h4>
                <p className="text-xs text-[#292724] font-semibold mt-0.5">
                  Enter the virtual meeting with camera, microphone, in-meeting live chat, and Notes So Far.
                </p>
              </div>
            </div>

            <Button
              onClick={handleLaunchVirtualMeeting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-2xs cursor-pointer shrink-0"
            >
              Enter Meeting Room
            </Button>
          </div>

          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-[#8B7EC8]">
              <BookOpen className="w-5 h-5" />
              <h3 className="text-sm font-serif font-bold text-[#292724]">Live Class Notes Preview</h3>
            </div>
            <p className="text-xs text-[#77716A] font-semibold leading-relaxed">
              Notes are generated continuously while the lecture is in progress. Enter the meeting room to view the real-time <strong>Notes So Far</strong> panel.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
