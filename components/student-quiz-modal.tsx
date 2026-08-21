'use client'

import React, { useState, useEffect, useCallback } from "react"
import { Clock, CheckCircle2, Send, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { QuizData, QuizAttemptData, saveQuizAttempt, updateQuizAttempt, getStudentQuizAttempt, ClassroomData } from "@/lib/data-store"

interface StudentQuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: QuizData | null
  classroom: ClassroomData
  studentName?: string
}

export function StudentQuizModal({
  open,
  onOpenChange,
  quiz,
  classroom,
  studentName = "Alex Rivera"
}: StudentQuizModalProps) {
  const [attempt, setAttempt] = useState<QuizAttemptData | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({})
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [quizStarted, setQuizStarted] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

  // Availability Window Calculation
  const now = new Date()

  const isScheduled = quiz?.mode === "SCHEDULED"
  let startDateTime: Date | null = null
  let endDateTime: Date | null = null

  if (isScheduled && quiz?.startDate && quiz?.startTime) {
    try {
      startDateTime = new Date(`${quiz.startDate}T${quiz.startTime}`)
    } catch {
      startDateTime = null
    }
  }

  if (isScheduled && quiz?.endDate && quiz?.endTime) {
    try {
      endDateTime = new Date(`${quiz.endDate}T${quiz.endTime}`)
    } catch {
      endDateTime = null
    }
  }

  const isNotStartedYet = startDateTime ? now < startDateTime : false
  const isClosed = endDateTime ? now > endDateTime : false

  // Load existing attempt or timer on open
  useEffect(() => {
    if (quiz && open) {
      const existing = getStudentQuizAttempt(quiz.quizId, "student-demo")
      if (existing) {
        setAttempt(existing)
        setUserAnswers(existing.userAnswers || {})
        if (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED" || existing.status === "GRADED") {
          setIsSubmitted(true)
          setQuizStarted(true)
        } else {
          // Resume existing active attempt timer
          setQuizStarted(true)
          const expiresMs = new Date(existing.expiresAt).getTime()
          const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000))
          setRemainingSeconds(diffSec)
        }
      } else {
        setAttempt(null)
        setUserAnswers({})
        setQuizStarted(false)
        setIsSubmitted(false)
      }
    }
  }, [quiz, open])

  const handleAutoSubmit = useCallback((messageStr?: string) => {
    if (isSubmitted || !quiz) return
    setIsSubmitted(true)

    // Calculate score
    let earnedMarks = 0
    quiz.questions.forEach((q) => {
      const uAns = userAnswers[q.id]
      if (q.type === "ShortAnswer") {
        if (typeof uAns === "string" && uAns.trim().length > 0) {
          earnedMarks += (q.marks || 5) * 0.8 // Partial credit draft for short answer
        }
      } else {
        if (uAns !== undefined && String(uAns) === String(q.correctAnswer)) {
          earnedMarks += q.marks || 5
        }
      }
    })

    const pct = Math.round((earnedMarks / (quiz.totalMarks || 1)) * 100)
    const finalAttempt: QuizAttemptData = {
      ...(attempt || {
        attemptId: `att-${quiz.quizId}-${Date.now()}`,
        quizId: quiz.quizId,
        quizTitle: quiz.title,
        studentId: "student-demo",
        studentName,
        classId: classroom.classId,
        startedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        totalMarks: quiz.totalMarks
      }),
      submittedAt: new Date().toISOString(),
      status: messageStr ? "AUTO_SUBMITTED" : "SUBMITTED",
      userAnswers,
      score: Math.round(earnedMarks),
      percentage: pct,
      completedAt: new Date().toLocaleDateString()
    }

    updateQuizAttempt(finalAttempt)
    setAttempt(finalAttempt)

    if (messageStr) {
      toast.warning(messageStr)
    } else {
      toast.success(`Quiz "${quiz.title}" submitted successfully!`)
    }
  }, [isSubmitted, quiz, userAnswers, attempt, studentName, classroom.classId])

  // Countdown Interval Effect
  useEffect(() => {
    if (!quizStarted || isSubmitted || remainingSeconds <= 0) return

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit("Time is up. Your quiz has been submitted automatically.")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, isSubmitted, remainingSeconds, handleAutoSubmit])

  if (!quiz) return null

  const handleStartQuiz = () => {
    if (isNotStartedYet) {
      toast.warning(`Quiz has not started yet. Opens at ${quiz.startDate} ${quiz.startTime}.`)
      return
    }

    if (isClosed) {
      toast.error("This quiz is closed to new attempts.")
      return
    }

    const durationMs = (quiz.durationMinutes || 30) * 60 * 1000
    const personalExpiresMs = Date.now() + durationMs
    let finalExpiresMs = personalExpiresMs

    if (endDateTime && endDateTime.getTime() < personalExpiresMs) {
      finalExpiresMs = endDateTime.getTime()
    }

    const newAttempt: QuizAttemptData = {
      attemptId: `att-${quiz.quizId}-${Date.now()}`,
      quizId: quiz.quizId,
      quizTitle: quiz.title,
      studentId: "student-demo",
      studentName,
      classId: classroom.classId,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(finalExpiresMs).toISOString(),
      status: "IN_PROGRESS",
      userAnswers: {},
      score: 0,
      totalMarks: quiz.totalMarks,
      percentage: 0,
      released: quiz.releaseResults === "IMMEDIATELY"
    }

    saveQuizAttempt(newAttempt)
    setAttempt(newAttempt)
    setQuizStarted(true)
    setIsSubmitted(false)
    setRemainingSeconds(Math.floor((finalExpiresMs - Date.now()) / 1000))
    toast.success(`Quiz started! You have ${quiz.durationMinutes} minutes.`)
  }

  const handleSelectAnswer = (questionId: string, answer: string | number) => {
    if (isSubmitted) return
    const updated = { ...userAnswers, [questionId]: answer }
    setUserAnswers(updated)

    if (attempt) {
      updateQuizAttempt({ ...attempt, userAnswers: updated })
    }
  }



  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 uppercase tracking-wider">
              {classroom.className} • Quiz
            </span>

            {/* Countdown Timer Header */}
            {quizStarted && !isSubmitted && (
              <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-[#E76F51] bg-[#E76F51]/15 px-3 py-1 rounded-full border border-[#E76F51]/40 animate-pulse shadow-2xs">
                <Clock className="w-4 h-4 text-[#E76F51]" />
                <span>Time Remaining: {formatCountdown(remainingSeconds)}</span>
              </div>
            )}

            {isSubmitted && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                Quiz Submitted
              </span>
            )}
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#E76F51]" /> {quiz.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            {quiz.description || "Answer all questions. Progress is stored automatically."}
          </DialogDescription>
        </DialogHeader>

        {/* BEFORE START SCREEN */}
        {!quizStarted && (
          <div className="py-6 space-y-5 text-center">
            <Card className="p-5 bg-white border border-[#E5DCD0] rounded-2xl max-w-md mx-auto space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-[#E76F51]/10 text-[#E76F51] flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#292724]">Ready to begin {quiz.title}?</h4>
              <div className="text-xs text-[#77716A] space-y-1 font-medium">
                <p><strong>Duration:</strong> {quiz.durationMinutes} Minutes</p>
                <p><strong>Total Marks:</strong> {quiz.totalMarks}</p>
                <p><strong>Passing Marks:</strong> {quiz.passingMarks || 10}</p>
                {quiz.instructions && <p className="italic pt-1 text-[#292724]">&quot;{quiz.instructions}&quot;</p>}
              </div>

              {isNotStartedYet && (
                <p className="text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Quiz has not started yet. Opens on {quiz.startDate} at {quiz.startTime}.
                </p>
              )}

              {isClosed && (
                <p className="text-xs font-bold text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  This quiz closed on {quiz.endDate} at {quiz.endTime}.
                </p>
              )}

              <Button
                onClick={handleStartQuiz}
                disabled={isNotStartedYet || isClosed}
                className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-3 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                Start Quiz Now
              </Button>
            </Card>
          </div>
        )}

        {/* ACTIVE QUIZ QUESTIONS SCREEN */}
        {quizStarted && (
          <div className="space-y-5 pt-3">
            {/* Submitted Result Overview */}
            {isSubmitted && (
              <Card className="p-4 bg-white border-2 border-emerald-300 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Quiz Submission Logged
                  </span>
                  <span className="text-xs font-mono font-bold text-[#E76F51]">
                    {quiz.releaseResults === "IMMEDIATELY"
                      ? `Score: ${attempt?.score} / ${quiz.totalMarks} (${attempt?.percentage}%)`
                      : "Submitted — Result pending Teacher release"}
                  </span>
                </div>
                <p className="text-xs text-[#77716A]">
                  {attempt?.status === "AUTO_SUBMITTED"
                    ? "Time expired and answers were auto-submitted."
                    : "Your answers were saved and submitted successfully."}
                </p>
              </Card>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {quiz.questions.map((q, idx) => (
                <Card key={q.id} className="p-4 bg-white border border-[#E5DCD0] rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                    <span className="text-xs font-mono font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
                      Question {idx + 1} of {quiz.questions.length} • ({q.marks || 5} Marks)
                    </span>
                    {isSubmitted && quiz.releaseResults === "IMMEDIATELY" && (
                      <span className={`text-xs font-bold ${String(userAnswers[q.id]) === String(q.correctAnswer) ? "text-emerald-600" : "text-amber-600"}`}>
                        {String(userAnswers[q.id]) === String(q.correctAnswer) ? "✓ Correct" : "✗ Review"}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-[#292724] leading-relaxed">{q.question}</p>

                  {/* Options Input */}
                  {q.type === "ShortAnswer" ? (
                    <div className="space-y-1">
                      <textarea
                        value={String(userAnswers[q.id] || "")}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        disabled={isSubmitted}
                        placeholder="Type short conceptual answer..."
                        rows={2}
                        className="w-full bg-[#FFF9F1] border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options?.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx || userAnswers[q.id] === opt
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectAnswer(q.id, optIdx)}
                            className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#E76F51] bg-[#FFF9F1] font-bold text-[#292724]"
                                : "border-[#E5DCD0] bg-white text-[#77716A] hover:border-[#E76F51]/40"
                            } ${isSubmitted ? "cursor-not-allowed opacity-90" : ""}`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#E76F51] shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Explanation after release */}
                  {isSubmitted && quiz.releaseResults === "IMMEDIATELY" && q.explanation && (
                    <div className="p-3 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] text-[11px] text-[#77716A]">
                      <strong className="text-[#292724]">Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Submit Action */}
            {!isSubmitted && (
              <div className="pt-2">
                <Button
                  onClick={() => handleAutoSubmit()}
                  className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-3 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Submit Quiz Answers
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
