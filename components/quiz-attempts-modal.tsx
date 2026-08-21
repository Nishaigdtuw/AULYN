'use client'

import React, { useState, useEffect } from "react"
import { Users, Send, Clock, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { QuizData, QuizAttemptData, getQuizAttemptsForQuiz, ClassroomData, updateQuizAttempt } from "@/lib/data-store"

interface QuizAttemptsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: QuizData | null
  classroom: ClassroomData
}

export function QuizAttemptsModal({
  open,
  onOpenChange,
  quiz,
  classroom
}: QuizAttemptsModalProps) {
  const [attempts, setAttempts] = useState<QuizAttemptData[]>([])

  useEffect(() => {
    if (quiz) {
      const list = getQuizAttemptsForQuiz(quiz.quizId)
      setAttempts(list)
    }
  }, [quiz, open])

  if (!quiz) return null

  const enrolledStudents = classroom.students || [
    { id: "student-demo", name: "Alex Rivera", email: "alex.rivera@aulyn.edu", score: 92, lastActive: "Just now", weakTopics: [] },
    { id: "std-2", name: "Michael Chen", email: "m.chen@aulyn.edu", score: 88, lastActive: "2 hrs ago", weakTopics: [] },
    { id: "std-3", name: "Sophia Patel", email: "s.patel@aulyn.edu", score: 95, lastActive: "Yesterday", weakTopics: [] }
  ]

  const handlePublishResultsToAll = () => {
    attempts.forEach((a) => {
      updateQuizAttempt({ ...a, released: true })
    })
    const list = getQuizAttemptsForQuiz(quiz.quizId)
    setAttempts(list)
    toast.success(`Published quiz results for "${quiz.title}" to all students!`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/15 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 uppercase tracking-wider">
              {classroom.className} • Quiz Attempts
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              Duration: {quiz.durationMinutes}m | Total Marks: {quiz.totalMarks}
            </span>
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8B7EC8]" /> Student Attempts: {quiz.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Review submission status, timestamps, scores, and manage grade publishing settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Release Results Banner */}
          <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#8B7EC8]" />
              <div>
                <span className="text-xs font-bold text-[#292724]">Results Release Mode: </span>
                <span className="text-xs font-mono font-bold text-[#8B7EC8] uppercase">{quiz.releaseResults}</span>
              </div>
            </div>
            {quiz.releaseResults === "MANUALLY" && (
              <Button
                size="sm"
                onClick={handlePublishResultsToAll}
                className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Publish Results to Students
              </Button>
            )}
          </div>

          {/* Student Roster Attempts */}
          <div className="space-y-2">
            {enrolledStudents.map((st) => {
              const attempt = attempts.find((a) => a.studentId === st.id || a.studentName === st.name)

              let statusBadge = (
                <span className="text-[10px] font-bold text-[#77716A] bg-[#77716A]/10 px-2.5 py-0.5 rounded-full">
                  Not Attempted
                </span>
              )

              if (attempt) {
                if (attempt.status === "AUTO_SUBMITTED") {
                  statusBadge = (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Auto Submitted
                    </span>
                  )
                } else if (attempt.status === "SUBMITTED" || attempt.status === "GRADED") {
                  statusBadge = (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Graded
                    </span>
                  )
                } else if (attempt.status === "IN_PROGRESS") {
                  statusBadge = (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" /> In Progress
                    </span>
                  )
                }
              }

              return (
                <Card key={st.id} className="p-3.5 bg-white border border-[#E5DCD0] rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#8B7EC8]/15 text-[#8B7EC8] flex items-center justify-center font-bold text-xs">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#292724]">{st.name}</h4>
                      <p className="text-[10px] text-[#77716A]">{st.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {attempt ? (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#E76F51]">
                          Score: {attempt.score} / {quiz.totalMarks} ({attempt.percentage}%)
                        </span>
                        <p className="text-[10px] text-[#77716A]">
                          Started: {new Date(attempt.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#77716A] italic">No submission</span>
                    )}

                    {statusBadge}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
