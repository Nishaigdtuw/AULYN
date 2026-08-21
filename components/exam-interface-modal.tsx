'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Clock, AlertTriangle, ArrowLeft, ArrowRight, Bookmark, ShieldCheck, CheckSquare, Square, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { QuizData, QuizAttemptData, saveQuizAttempt, updateQuizAttempt, getStudentQuizAttempt, ClassroomData } from "@/lib/data-store"
import { startQuizAttemptServer, saveQuestionAnswerServer, submitQuizAttemptServer } from "@/actions/quiz/action"

interface ExamInterfaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: QuizData | null
  classroom: ClassroomData
  studentId?: string
  studentName?: string
  onAttemptFinished?: () => void
}

export function ExamInterfaceModal({
  open,
  onOpenChange,
  quiz,
  classroom,
  studentId = "student-demo",
  studentName = "Alex Rivera",
  onAttemptFinished
}: ExamInterfaceModalProps) {
  // Navigation & Attempt States
  const [readInstructions, setReadInstructions] = useState(false)
  const [attemptStarted, setAttemptStarted] = useState(false)
  const [attempt, setAttempt] = useState<QuizAttemptData | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)

  // Exam Answers & Palette States
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({})
  const [questionStates, setQuestionStates] = useState<Record<string, { answered: boolean; markedForReview: boolean; visited: boolean }>>({})
  
  // Timer & Autosave States
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Scheduling Check
  const now = new Date()
  const isScheduled = quiz?.mode === "SCHEDULED"
  let startDateTime: Date | null = null
  let endDateTime: Date | null = null

  if (isScheduled && quiz?.startDate && quiz?.startTime) {
    try { startDateTime = new Date(`${quiz.startDate}T${quiz.startTime}`) } catch { startDateTime = null }
  }
  if (isScheduled && quiz?.endDate && quiz?.endTime) {
    try { endDateTime = new Date(`${quiz.endDate}T${quiz.endTime}`) } catch { endDateTime = null }
  }

  const isNotStartedYet = startDateTime ? now < startDateTime : false
  const isClosed = endDateTime ? now > endDateTime : false

  const questions = useMemo(() => quiz?.questions || [], [quiz])
  const currentQ = questions[currentIdx] || questions[0]
  const qId = currentQ?.id || `q-${currentIdx}`

  // Load existing active attempt on open
  useEffect(() => {
    if (quiz && open) {
      const existing = getStudentQuizAttempt(quiz.quizId, studentId)
      if (existing) {
        setAttempt(existing)
        setUserAnswers(existing.userAnswers || {})
        setQuestionStates(existing.questionStates || {})
        
        if (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED" || existing.status === "GRADED" || existing.status === "NEEDS_REVIEW") {
          setAttemptStarted(true)
        } else {
          // Resume active timer based on persisted expiresAt
          setAttemptStarted(true)
          const expiresMs = new Date(existing.expiresAt).getTime()
          const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000))
          setRemainingSeconds(diffSec)
        }
      } else {
        setAttempt(null)
        setUserAnswers({})
        setQuestionStates({})
        setReadInstructions(false)
        setAttemptStarted(false)
        setCurrentIdx(0)
      }
    }
  }, [quiz, open, studentId])

  // Final Submit Handler (useCallback)
  const handleFinalSubmit = useCallback(async (isAuto: boolean = false) => {
    if (!attempt || !quiz || isSubmitting) return
    setIsSubmitting(true)

    const toastId = toast.loading(isAuto ? "Time expired! Auto-submitting exam..." : "Finalizing exam submission...")

    await submitQuizAttemptServer(studentId, attempt.attemptId, isAuto)
    
    // Local calculation fallback
    let earnedScore = 0
    let hasSubjective = false
    questions.forEach((q) => {
      const uAns = userAnswers[q.id]
      if (q.type === "ShortAnswer") {
        hasSubjective = true
      } else {
        if (uAns !== undefined && String(uAns) === String(q.correctAnswer)) {
          earnedScore += q.marks || 5
        }
      }
    })

    const finalPct = Math.round((earnedScore / (quiz.totalMarks || 1)) * 100)
    const finalStatus = hasSubjective ? "NEEDS_REVIEW" : (isAuto ? "AUTO_SUBMITTED" : "GRADED")

    const finalAttempt: QuizAttemptData = {
      ...attempt,
      submittedAt: new Date().toISOString(),
      status: finalStatus,
      userAnswers,
      questionStates,
      score: earnedScore,
      percentage: finalPct,
      released: quiz.releaseResultsMode === "IMMEDIATELY" && !hasSubjective
    }

    updateQuizAttempt(finalAttempt)
    setAttempt(finalAttempt)
    setConfirmSubmitOpen(false)
    setIsSubmitting(false)

    if (isAuto) {
      toast.warning("Time is up. Your exam has been submitted automatically.", { id: toastId })
    } else {
      toast.success("Exam submitted successfully!", { id: toastId })
    }

    if (onAttemptFinished) onAttemptFinished()
  }, [attempt, quiz, isSubmitting, studentId, questions, userAnswers, questionStates, onAttemptFinished])

  // Countdown timer effect (Uses server expiresAt authority)
  useEffect(() => {
    if (!attemptStarted || !attempt || attempt.status !== "IN_PROGRESS" || remainingSeconds <= 0) return

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinalSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [attemptStarted, attempt, remainingSeconds, handleFinalSubmit])

  // Ensure current question is marked visited
  useEffect(() => {
    if (attemptStarted && attempt?.status === "IN_PROGRESS" && currentQ) {
      setQuestionStates((prev) => {
        const existing = prev[qId] || { answered: false, markedForReview: false, visited: false }
        if (!existing.visited) {
          return { ...prev, [qId]: { ...existing, visited: true } }
        }
        return prev
      })
    }
  }, [currentIdx, attemptStarted, attempt, currentQ, qId])

  // Answered / Review Summary Counts
  const answeredCount = useMemo(() => {
    return Object.values(questionStates).filter((s) => s.answered).length
  }, [questionStates])

  const markedForReviewCount = useMemo(() => {
    return Object.values(questionStates).filter((s) => s.markedForReview).length
  }, [questionStates])

  const unansweredCount = Math.max(0, questions.length - answeredCount)

  if (!quiz) return null

  // Handle Start Quiz (Attempt Creation)
  const handleStartQuiz = async () => {
    if (isNotStartedYet) {
      toast.warning(`Quiz has not started yet. Opens at ${quiz.startDate} ${quiz.startTime}.`)
      return
    }
    if (isClosed) {
      toast.error("This quiz is closed to new attempts.")
      return
    }

    const toastId = toast.loading("Initializing exam session...")

    // Call server action to start attempt
    const res = await startQuizAttemptServer(studentId, classroom.classId, quiz.quizId)
    if (res.success && res.attempt) {
      const serverAttempt = res.attempt
      const expiresMs = new Date(serverAttempt.expiresAt).getTime()
      const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000))

      const localAttempt: QuizAttemptData = {
        attemptId: serverAttempt.attemptId,
        quizId: quiz.quizId,
        quizTitle: quiz.title,
        studentId,
        studentName,
        classId: classroom.classId,
        startedAt: new Date(serverAttempt.startedAt).toISOString(),
        expiresAt: new Date(serverAttempt.expiresAt).toISOString(),
        status: "IN_PROGRESS",
        userAnswers: {},
        questionStates: {},
        score: 0,
        totalMarks: quiz.totalMarks,
        percentage: 0
      }

      saveQuizAttempt(localAttempt)
      setAttempt(localAttempt)
      setRemainingSeconds(diffSec)
      setAttemptStarted(true)
      toast.success("Exam started! Good luck.", { id: toastId })
    } else {
      // Fallback local attempt if server offline
      const durationMs = (quiz.durationMinutes || 30) * 60 * 1000
      const expiresAt = new Date(Date.now() + durationMs).toISOString()
      const localAttempt: QuizAttemptData = {
        attemptId: `att-${quiz.quizId}-${Date.now()}`,
        quizId: quiz.quizId,
        quizTitle: quiz.title,
        studentId,
        studentName,
        classId: classroom.classId,
        startedAt: new Date().toISOString(),
        expiresAt,
        status: "IN_PROGRESS",
        userAnswers: {},
        questionStates: {},
        score: 0,
        totalMarks: quiz.totalMarks,
        percentage: 0
      }

      saveQuizAttempt(localAttempt)
      setAttempt(localAttempt)
      setRemainingSeconds(Math.floor(durationMs / 1000))
      setAttemptStarted(true)
      toast.success("Exam started! Good luck.", { id: toastId })
    }
  }

  // Answer selection & debounced autosave
  const handleAnswerChange = (val: string | number) => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return

    setUserAnswers((prev) => ({ ...prev, [qId]: val }))
    setQuestionStates((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { markedForReview: false, visited: true }),
        answered: String(val).trim().length > 0,
        visited: true
      }
    }))

    setSaveStatus('saving')
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(async () => {
      const currentState = questionStates[qId]
      const isMarked = currentState?.markedForReview || false
      
      const serverRes = await saveQuestionAnswerServer(studentId, attempt.attemptId, qId, String(val), isMarked, true)
      if (serverRes.expired) {
        setSaveStatus('error')
        toast.error("Quiz time expired. Your attempt is auto-submitting...")
        handleFinalSubmit(true)
      } else {
        setSaveStatus('saved')
        // Update local sync
        updateQuizAttempt({
          ...attempt,
          userAnswers: { ...userAnswers, [qId]: val },
          questionStates: {
            ...questionStates,
            [qId]: { answered: true, markedForReview: isMarked, visited: true }
          }
        })
      }
    }, 600)
  }

  // Question action: Mark for Review & Next
  const handleMarkForReviewAndNext = () => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return

    setQuestionStates((prev) => {
      const existing = prev[qId] || { answered: false, markedForReview: false, visited: true }
      const newReview = !existing.markedForReview
      const updated = { ...prev, [qId]: { ...existing, markedForReview: newReview, visited: true } }
      
      updateQuizAttempt({
        ...attempt,
        userAnswers,
        questionStates: updated
      })
      return updated
    })

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  // Question action: Clear Response
  const handleClearResponse = () => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return

    setUserAnswers((prev) => {
      const updated = { ...prev }
      delete updated[qId]
      return updated
    })

    setQuestionStates((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { markedForReview: false, visited: true }),
        answered: false,
        visited: true
      }
    }))

    toast.info("Answer response cleared.")
  }





  // Timer format (MM:SS)
  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-0 text-[#292724] max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* PRE-START INSTRUCTIONS SCREEN */}
        {!attemptStarted && (
          <div className="p-6 overflow-y-auto space-y-6">
            <DialogHeader className="border-b border-[#E5DCD0] pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 uppercase tracking-wider">
                  {classroom.className} • Official Examination
                </span>
                <span className="text-xs font-mono font-bold text-[#77716A]">
                  Attempts Allowed: 1
                </span>
              </div>
              <DialogTitle className="text-2xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#E76F51]" /> {quiz.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#77716A]">
                {quiz.description || "Review instructions before beginning your timed examination."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-white border border-[#E5DCD0] rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-[#77716A] uppercase">Duration</span>
                <p className="text-xl font-bold font-mono text-[#E76F51]">{quiz.durationMinutes} Minutes</p>
              </Card>
              <Card className="p-4 bg-white border border-[#E5DCD0] rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-[#77716A] uppercase">Total Questions</span>
                <p className="text-xl font-bold font-mono text-[#292724]">{questions.length}</p>
              </Card>
              <Card className="p-4 bg-white border border-[#E5DCD0] rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-[#77716A] uppercase">Total Marks</span>
                <p className="text-xl font-bold font-mono text-[#75B798]">{quiz.totalMarks}</p>
              </Card>
            </div>

            <Card className="p-5 bg-white border border-[#E5DCD0] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E5DCD0] pb-2">
                <FileText className="w-4 h-4 text-[#E76F51]" /> Examination Rules & Instructions
              </h4>
              <ul className="text-xs text-[#77716A] space-y-2 list-disc pl-5 font-medium leading-relaxed">
                <li>Your countdown timer begins immediately after clicking <strong>&quot;Start Quiz&quot;</strong>.</li>
                <li>All answer choices and short responses are <strong>saved automatically</strong> to the server.</li>
                <li>Refreshing or closing your browser window <strong>will NOT reset your timer</strong>.</li>
                <li>Questions can be navigated freely using the <strong>Question Palette</strong> on the sidebar.</li>
                <li>The exam will <strong>auto-submit automatically</strong> when your duration expires or when the global quiz closing time arrives.</li>
                <li>You cannot edit your responses once final submission is confirmed.</li>
              </ul>
            </Card>

            {isNotStartedYet && (
              <p className="text-xs font-bold text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                Quiz has not started yet. Opens on {quiz.startDate} at {quiz.startTime}.
              </p>
            )}

            {isClosed && (
              <p className="text-xs font-bold text-red-800 bg-red-50 p-3 rounded-xl border border-red-200">
                This quiz closed on {quiz.endDate} at {quiz.endTime}.
              </p>
            )}

            {/* Read Instructions Confirmation Checkbox */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setReadInstructions(!readInstructions)}
                className="flex items-center space-x-2 text-xs font-bold text-[#292724] cursor-pointer"
              >
                {readInstructions ? (
                  <CheckSquare className="w-5 h-5 text-[#E76F51]" />
                ) : (
                  <Square className="w-5 h-5 text-[#77716A]" />
                )}
                <span>I have read and understood all examination instructions.</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5DCD0]">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs font-bold rounded-xl cursor-pointer">
                Cancel
              </Button>
              <Button
                onClick={handleStartQuiz}
                disabled={!readInstructions || isNotStartedYet || isClosed}
                className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                Start Quiz Now &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* ACTIVE EXAM INTERFACE */}
        {attemptStarted && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* EXAM HEADER */}
            <div className="p-4 bg-white border-b border-[#E5DCD0] flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
                  {classroom.code}
                </span>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#292724]">{quiz.title}</h3>
                  <span className="text-[11px] text-[#77716A]">
                    Question {currentIdx + 1} of {questions.length} • ({answeredCount} / {questions.length} Answered)
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Save Status Indicator */}
                <div className="text-[11px] font-mono font-semibold">
                  {saveStatus === 'saving' && <span className="text-amber-600">Saving...</span>}
                  {saveStatus === 'saved' && <span className="text-emerald-600">Saved ✓</span>}
                  {saveStatus === 'error' && <span className="text-red-600">Save error</span>}
                </div>

                {/* Persistent Countdown Timer */}
                {attempt?.status === "IN_PROGRESS" && (
                  <div className={`flex items-center space-x-1.5 font-mono text-xs font-bold px-3 py-1.5 rounded-full border shadow-2xs ${
                    remainingSeconds <= 300
                      ? "bg-red-100 text-red-800 border-red-300 animate-pulse"
                      : "bg-[#FFF9F1] text-[#E76F51] border-[#E5DCD0]"
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTimer(remainingSeconds)}</span>
                  </div>
                )}



                {/* Final Submit Button */}
                {attempt?.status === "IN_PROGRESS" && (
                  <Button
                    onClick={() => setConfirmSubmitOpen(true)}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow-2xs"
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>

            {/* MAIN EXAM BODY (Split: Question View + Sidebar Palette) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: One Question At A Time */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {/* Question Card */}
                <Card className="p-5 bg-white border border-[#E5DCD0] rounded-2xl space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                    <span className="text-xs font-mono font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full">
                      Question {currentIdx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#77716A]">
                      Marks: {currentQ?.marks || 5}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-[#292724] leading-relaxed">
                    {currentQ?.questionText || "Question loading..."}
                  </p>

                  {/* Options / Textarea */}
                  {currentQ?.type === "ShortAnswer" ? (
                    <div className="space-y-1.5 pt-2">
                      <textarea
                        value={String(userAnswers[qId] || "")}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        disabled={attempt?.status !== "IN_PROGRESS"}
                        rows={4}
                        placeholder="Type your conceptual response..."
                        className="w-full bg-[#FFF9F1] border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      {(currentQ?.options || []).map((opt, optIdx) => {
                        const isSelected = userAnswers[qId] === optIdx || userAnswers[qId] === opt
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleAnswerChange(optIdx)}
                            className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#E76F51] bg-[#FFF9F1] font-bold text-[#292724] shadow-2xs"
                                : "border-[#E5DCD0] bg-white text-[#77716A] hover:border-[#E76F51]/40"
                            } ${attempt?.status !== "IN_PROGRESS" ? "cursor-not-allowed opacity-90" : ""}`}
                          >
                            <span>{opt}</span>
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected ? "border-[#E76F51] bg-[#E76F51] text-white" : "border-[#E5DCD0] text-[#77716A]"
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>

                {/* Question Actions Controls Footer */}
                {attempt?.status === "IN_PROGRESS" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                        disabled={currentIdx === 0}
                        className="text-xs font-bold rounded-xl cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearResponse}
                        className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl cursor-pointer"
                      >
                        Clear Response
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleMarkForReviewAndNext}
                        className="border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8]/10 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {questionStates[qId]?.markedForReview ? "Unmark Review & Next" : "Mark for Review & Next"}
                      </Button>

                      <Button
                        onClick={() => {
                          if (currentIdx + 1 < questions.length) {
                            setCurrentIdx((prev) => prev + 1)
                          } else {
                            setConfirmSubmitOpen(true)
                          }
                        }}
                        className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-2xs"
                      >
                        {currentIdx + 1 === questions.length ? "Review & Submit" : "Save & Next"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Question Palette Sidebar (Desktop) */}
              <div className="hidden md:block w-72 bg-white border-l border-[#E5DCD0] p-4 overflow-y-auto shrink-0 space-y-4">
                <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider border-b border-[#E5DCD0] pb-2">
                  Question Palette ({questions.length})
                </h4>

                {/* 5 State Palette Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const st = questionStates[q.id] || { answered: false, markedForReview: false, visited: false }
                    const isCurrent = currentIdx === idx

                    let btnClass = "border-[#E5DCD0] bg-[#FFF9F1] text-[#77716A]" // Not Visited
                    if (st.visited && !st.answered && !st.markedForReview) {
                      btnClass = "border-amber-400 bg-amber-50 text-amber-900 font-bold" // Not Answered
                    }
                    if (st.answered && !st.markedForReview) {
                      btnClass = "border-emerald-500 bg-emerald-500 text-white font-bold" // Answered
                    }
                    if (st.markedForReview && !st.answered) {
                      btnClass = "border-purple-500 bg-purple-100 text-purple-950 font-bold rounded-full" // Marked for Review
                    }
                    if (st.markedForReview && st.answered) {
                      btnClass = "border-purple-600 bg-purple-600 text-white font-bold" // Answered & Marked for Review
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 w-9 text-xs rounded-xl border flex items-center justify-center cursor-pointer transition-all ${btnClass} ${
                          isCurrent ? "ring-2 ring-[#E76F51] ring-offset-1 font-black" : ""
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>

                {/* Palette Legend */}
                <div className="space-y-2 pt-3 border-t border-[#E5DCD0] text-[11px] text-[#77716A]">
                  <span className="font-bold text-[#292724] uppercase text-[10px] block">Legend</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-400" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-100 border border-purple-500" />
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-purple-600 border border-purple-700" />
                    <span>Answered & Marked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-[#FFF9F1] border border-[#E5DCD0]" />
                    <span>Not Visited</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION SUBMIT MODAL */}
        <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
          <DialogContent className="max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl p-6">
            <DialogHeader className="border-b border-[#E5DCD0] pb-3">
              <DialogTitle className="text-lg font-serif font-bold text-[#292724] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E76F51]" /> Confirm Final Submission
              </DialogTitle>
              <DialogDescription className="text-xs text-[#77716A]">
                Once submitted, your answers will be locked and finalized.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Answered</span>
                  <span className="text-xl font-bold font-mono text-emerald-700">{answeredCount}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Unanswered</span>
                  <span className="text-xl font-bold font-mono text-amber-700">{unansweredCount}</span>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Review</span>
                  <span className="text-xl font-bold font-mono text-purple-700">{markedForReviewCount}</span>
                </div>
              </div>

              {unansweredCount > 0 && (
                <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                  You still have {unansweredCount} unanswered question(s). You can return to complete them before submitting.
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)} className="text-xs font-bold rounded-xl cursor-pointer">
                  Return to Quiz
                </Button>
                <Button
                  onClick={() => handleFinalSubmit(false)}
                  disabled={isSubmitting}
                  className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
                >
                  Confirm & Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
