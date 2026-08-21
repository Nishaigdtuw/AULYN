'use client'

import React, { useState, useEffect } from "react"
import { Users, Send, Clock, FileText, Eye, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { QuizData, QuizAttemptData, getQuizAttemptsForQuiz, ClassroomData, updateQuizAttempt } from "@/lib/data-store"
import { getTeacherQuizAttemptsServer, gradeSubjectiveAnswerServer, publishQuizResultsServer } from "@/actions/quiz/action"

interface QuizAttemptsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: QuizData | null
  classroom: ClassroomData
  teacherId?: string
}

export function QuizAttemptsModal({
  open,
  onOpenChange,
  quiz,
  classroom,
  teacherId = "usr-teacher-1"
}: QuizAttemptsModalProps) {
  const [attempts, setAttempts] = useState<QuizAttemptData[]>([])
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<QuizAttemptData | null>(null)
  const [subjectiveMarks, setSubjectiveMarks] = useState<Record<string, number>>({})
  const [subjectiveFeedback, setSubjectiveFeedback] = useState<Record<string, string>>({})

  useEffect(() => {
    if (quiz && open) {
      // Fetch server attempts or fallback
      getTeacherQuizAttemptsServer(teacherId, classroom.classId, quiz.quizId).then((res) => {
        if (res.success && res.attempts && res.attempts.length > 0) {
          const mapped: QuizAttemptData[] = res.attempts.map((a) => ({
            attemptId: a.attemptId,
            quizId: a.quizId,
            quizTitle: quiz.title,
            studentId: a.studentId,
            studentName: a.user?.name || "Enrolled Student",
            classId: a.classId,
            startedAt: new Date(a.startedAt).toISOString(),
            expiresAt: new Date(a.expiresAt).toISOString(),
            submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : undefined,
            status: a.status as 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'NEEDS_REVIEW' | 'GRADED',
            score: a.score,
            totalMarks: a.totalMarks,
            percentage: a.percentage,
            released: !!a.resultPublishedAt
          }))
          setAttempts(mapped)
        } else {
          const list = getQuizAttemptsForQuiz(quiz.quizId)
          setAttempts(list)
        }
      })
    }
  }, [quiz, open, teacherId, classroom.classId])

  if (!quiz) return null

  const enrolledStudents = classroom.students || [
    { id: "student-demo", name: "Alex Rivera", email: "alex.rivera@aulyn.edu", score: 92, lastActive: "Just now", weakTopics: [] },
    { id: "std-2", name: "Michael Chen", email: "m.chen@aulyn.edu", score: 88, lastActive: "2 hrs ago", weakTopics: [] },
    { id: "std-3", name: "Sophia Patel", email: "s.patel@aulyn.edu", score: 95, lastActive: "Yesterday", weakTopics: [] }
  ]

  const handlePublishResultsToAll = async () => {
    const toastId = toast.loading("Publishing quiz results to enrolled students...")
    await publishQuizResultsServer(teacherId, quiz.quizId)
    
    attempts.forEach((a) => {
      updateQuizAttempt({ ...a, released: true })
    })
    const list = getQuizAttemptsForQuiz(quiz.quizId)
    setAttempts(list)
    toast.success(`Published quiz results for "${quiz.title}" to all students!`, { id: toastId })
  }

  const handleSaveSubjectiveGrade = async (qId: string, maxMarks: number) => {
    if (!selectedAttemptForReview) return
    const marks = Number(subjectiveMarks[qId]) || 0
    const fb = subjectiveFeedback[qId] || "Reviewed by teacher."

    if (marks < 0 || marks > maxMarks) {
      toast.warning(`Marks must be between 0 and ${maxMarks}.`)
      return
    }

    const toastId = toast.loading("Saving subjective grade...")
    const res = await gradeSubjectiveAnswerServer(teacherId, selectedAttemptForReview.attemptId, qId, marks, fb)
    
    if (res.success && res.attempt) {
      const updated: QuizAttemptData = {
        ...selectedAttemptForReview,
        score: res.attempt.score,
        percentage: res.attempt.percentage,
        status: res.attempt.status as 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'NEEDS_REVIEW' | 'GRADED'
      }
      updateQuizAttempt(updated)
      setSelectedAttemptForReview(updated)
      setAttempts((prev) => prev.map((a) => (a.attemptId === updated.attemptId ? updated : a)))
      toast.success("Subjective grade saved!", { id: toastId })
    } else {
      // Local fallback
      const updated: QuizAttemptData = {
        ...selectedAttemptForReview,
        score: Math.min(quiz.totalMarks, selectedAttemptForReview.score + marks),
        status: "GRADED"
      }
      updateQuizAttempt(updated)
      setSelectedAttemptForReview(updated)
      setAttempts((prev) => prev.map((a) => (a.attemptId === updated.attemptId ? updated : a)))
      toast.success("Subjective grade saved!", { id: toastId })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
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
            Review submission status, timestamps, scores, grade subjective answers, and manage result publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Release Results Banner */}
          <div className="p-3 bg-white border border-[#E5DCD0] rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#8B7EC8]" />
              <div>
                <span className="text-xs font-bold text-[#292724]">Results Release Policy: </span>
                <span className="text-xs font-mono font-bold text-[#8B7EC8] uppercase">{quiz.releaseResults}</span>
              </div>
            </div>
            {quiz.releaseResults === "MANUALLY" && (
              <Button
                size="sm"
                onClick={handlePublishResultsToAll}
                className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" /> Publish Results to All Students
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
                if (attempt.status === "NEEDS_REVIEW") {
                  statusBadge = (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Needs Review
                    </span>
                  )
                } else if (attempt.status === "AUTO_SUBMITTED") {
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

                    {attempt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAttemptForReview(attempt)}
                        className="text-xs font-bold rounded-xl border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8]/10 cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* DETAILED ATTEMPT REVIEW MODAL */}
        {selectedAttemptForReview && (
          <Dialog open={!!selectedAttemptForReview} onOpenChange={() => setSelectedAttemptForReview(null)}>
            <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[85vh] overflow-y-auto">
              <DialogHeader className="border-b border-[#E5DCD0] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 uppercase">
                    Attempt Review • {selectedAttemptForReview.studentName}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E76F51]">
                    Total Score: {selectedAttemptForReview.score} / {quiz.totalMarks} ({selectedAttemptForReview.percentage}%)
                  </span>
                </div>
                <DialogTitle className="text-lg font-serif font-bold text-[#292724] mt-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#E76F51]" /> Attempt Breakdown: {quiz.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#77716A]">
                  Started: {new Date(selectedAttemptForReview.startedAt).toLocaleString()} | Submitted: {selectedAttemptForReview.submittedAt ? new Date(selectedAttemptForReview.submittedAt).toLocaleString() : 'In Progress'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-3">
                {quiz.questions.map((q, idx) => {
                  const uAns = selectedAttemptForReview.userAnswers?.[q.id]
                  const isSubjective = q.type === "ShortAnswer"
                  const isCorrect = String(uAns) === String(q.correctAnswer)

                  return (
                    <Card key={q.id} className="p-4 bg-white border border-[#E5DCD0] rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                        <span className="text-xs font-mono font-bold text-[#292724]">
                          Q{idx + 1}. {q.type} ({q.marks || 5} Marks)
                        </span>
                        <span className={`text-xs font-bold ${isSubjective ? 'text-amber-700' : (isCorrect ? 'text-emerald-600' : 'text-red-600')}`}>
                          {isSubjective ? 'Subjective Review' : (isCorrect ? '✓ Correct' : '✗ Incorrect')}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#292724]">{q.questionText || q.question}</p>

                      <div className="p-3 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] text-xs space-y-1">
                        <p><strong>Student Answer:</strong> {uAns !== undefined && uAns !== null ? String(uAns) : <span className="italic text-[#77716A]">No answer provided</span>}</p>
                        <p><strong>Expected Key / Answer:</strong> {String(q.correctAnswer)}</p>
                      </div>

                      {/* Subjective Grading Form */}
                      {isSubjective && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                          <Label className="text-xs font-bold text-amber-900">Award Marks (Max: {q.marks || 5})</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min={0}
                              max={q.marks || 5}
                              value={subjectiveMarks[q.id] ?? (isCorrect ? q.marks : 0)}
                              onChange={(e) => setSubjectiveMarks({ ...subjectiveMarks, [q.id]: Number(e.target.value) })}
                              className="w-24 bg-white border-[#E5DCD0] text-xs font-mono font-bold rounded-xl"
                            />
                            <Input
                              placeholder="Teacher feedback notes..."
                              value={subjectiveFeedback[q.id] || ""}
                              onChange={(e) => setSubjectiveFeedback({ ...subjectiveFeedback, [q.id]: e.target.value })}
                              className="bg-white border-[#E5DCD0] text-xs rounded-xl flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveSubjectiveGrade(q.id, q.marks || 5)}
                              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Save Grade
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
