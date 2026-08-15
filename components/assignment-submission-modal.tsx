'use client'

import React, { useState } from "react"
import { Send, MessageSquare, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AssignmentData, SubmissionData, saveSubmission, getSubmissions, AssignmentComment } from "@/lib/data-store"
import { sendNotificationEmail } from "@/lib/email-service"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

interface AssignmentSubmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentData
  userRole: 'student' | 'teacher'
  studentName?: string
  onStartViva?: () => void
}

export function AssignmentSubmissionModal({
  open,
  onOpenChange,
  assignment,
  userRole,
  studentName = "Alex Rivera",
  onStartViva
}: AssignmentSubmissionModalProps) {
  const [solutionContent, setSolutionContent] = useState("")
  const [newComment, setNewComment] = useState("")
  const [existingSubmission, setExistingSubmission] = useState<SubmissionData | null>(() => {
    const list = getSubmissions(assignment?.classId)
    return list.find((s) => s.assignmentId === assignment?.id) || null
  })

  const handleSubmitSolution = () => {
    if (!solutionContent.trim()) {
      toast.warning("Please type your solution before submitting")
      return
    }

    const sub: SubmissionData = {
      submissionId: `sub-${assignment.id}-${Date.now()}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentId: "student-demo",
      studentName,
      classId: assignment.classId,
      submittedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content: solutionContent.trim(),
      status: "Submitted",
      comments: [
        {
          id: `c-1`,
          assignmentId: assignment.id,
          submissionId: `sub-${assignment.id}-${Date.now()}`,
          authorId: "student-demo",
          authorName: studentName,
          authorRole: "student",
          content: "Initial solution submitted for evaluation.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }

    saveSubmission(sub)
    setExistingSubmission(sub)
    setSolutionContent("")

    saveMasteryEvidence("student-demo", assignment.classId, "tree-traversal", {
      type: "Assignment",
      title: assignment.title,
      score: 45,
      maxScore: 50,
      percentage: 90,
      notes: "Solution submitted and algorithm logic verified."
    })

    sendNotificationEmail({
      toEmail: "sarah.jenkins@aulyn.edu",
      toName: "Prof. Sarah Jenkins",
      subject: `New Assignment Submission: ${assignment.title}`,
      messageBody: `${studentName} submitted a solution for ${assignment.title}.`,
      category: "Assignment"
    })

    toast.success(`Assignment "${assignment.title}" submitted successfully!`)
  }

  const handleAddThreadComment = () => {
    if (!newComment.trim() || !existingSubmission) return

    const commentObj: AssignmentComment = {
      id: `comm-${Date.now()}`,
      assignmentId: assignment.id,
      submissionId: existingSubmission.submissionId,
      authorId: userRole === 'teacher' ? 'teacher-demo' : 'student-demo',
      authorName: userRole === 'teacher' ? 'Prof. Sarah Jenkins' : studentName,
      authorRole: userRole,
      content: newComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedSub = {
      ...existingSubmission,
      comments: [...(existingSubmission.comments || []), commentObj]
    }

    saveSubmission(updatedSub)
    setExistingSubmission(updatedSub)
    setNewComment("")

    toast.success("Comment added to submission thread!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              {assignment?.type} Assignment
            </span>
            <span className="text-xs font-bold text-[#77716A]">Due: {assignment?.dueDate}</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            {assignment?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            {assignment?.instructions}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {userRole === 'student' && !existingSubmission && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#292724]">Solution Submission (Code / Text Response):</label>
              <textarea
                value={solutionContent}
                onChange={(e) => setSolutionContent(e.target.value)}
                placeholder="Paste code or written answer logic here..."
                rows={5}
                className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
              />
              <Button
                onClick={handleSubmitSolution}
                className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Assignment Solution
              </Button>
            </div>
          )}

          {existingSubmission && (
            <Card className="bg-white border-2 border-emerald-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Submitted on {existingSubmission.submittedAt}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {existingSubmission.status}
                </span>
              </div>
              <p className="text-xs text-[#292724] bg-[#FFF9F1] p-3 rounded-xl border border-[#E5DCD0] font-mono">
                {existingSubmission.content}
              </p>

              {assignment?.vivaRequired && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-serif font-bold text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" /> AI Viva Defense Required
                    </h5>
                    <p className="text-[10px] text-indigo-700 font-semibold">Professor Jenkins requires a brief 3-question AI Viva defense for this lab.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      if (onStartViva) onStartViva()
                    }}
                    className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Start AI Viva
                  </Button>
                </div>
              )}
            </Card>
          )}

          {existingSubmission && (
            <div className="space-y-3 pt-2 border-t border-[#E5DCD0]">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#8B7EC8]" /> Threaded Assignment Discussion
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingSubmission.comments?.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      c.authorRole === 'teacher' ? 'bg-[#FFF9F1] border-[#8B7EC8]/40' : 'bg-white border-[#E5DCD0]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className={c.authorRole === 'teacher' ? 'text-[#8B7EC8]' : 'text-[#292724]'}>
                        {c.authorName} ({c.authorRole === 'teacher' ? 'Instructor' : 'Student'})
                      </span>
                      <span className="text-[10px] text-[#77716A]">{c.timestamp}</span>
                    </div>
                    <p className="text-[#292724] text-xs font-medium">{c.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a comment or question about this submission..."
                  className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
                />
                <Button
                  onClick={handleAddThreadComment}
                  className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
