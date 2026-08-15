'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Check, ArrowRight, RotateCcw, Clock, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { QuizData, FlashcardData, ClassroomData, saveQuizAttempt, QuizAttemptData } from "@/lib/data-store"

// --- 1. START QUIZ MODAL ---
interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: QuizData
  classroom: ClassroomData
  studentName: string
}

export function QuizModal({ open, onOpenChange, quiz, classroom, studentName }: QuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)

  const currentQ = quiz.questions[currentIdx] || quiz.questions[0]

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return
    setSelectedOption(idx)
  }

  const handleNextQuestion = () => {
    if (selectedOption === null) {
      toast.warning("Please select an answer before continuing")
      return
    }

    const updatedAnswers = [...userAnswers, selectedOption]
    setUserAnswers(updatedAnswers)
    setSelectedOption(null)
    setIsSubmitted(false)

    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(currentIdx + 1)
    } else {
      // Finished quiz! Calculate score
      let correct = 0
      const weak: string[] = []
      quiz.questions.forEach((q, i) => {
        if (updatedAnswers[i] === q.correctAnswer) {
          correct += 1
        } else {
          weak.push(q.question.slice(0, 30) + "...")
        }
      })

      const percentage = Math.round((correct / quiz.questions.length) * 100)
      const attempt: QuizAttemptData = {
        attemptId: `att-${Date.now()}`,
        quizId: quiz.quizId,
        quizTitle: quiz.title,
        studentId: "student-demo",
        studentName: studentName || "Alex Rivera",
        classId: classroom.classId,
        score: correct * Math.round(quiz.totalMarks / quiz.questions.length),
        totalMarks: quiz.totalMarks,
        percentage,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weakTopics: weak
      }

      saveQuizAttempt(attempt)
      setShowResult(true)
      toast.success(`Quiz Completed! Score: ${percentage}%`)
    }
  }

  const handleReset = () => {
    setCurrentIdx(0)
    setSelectedOption(null)
    setIsSubmitted(false)
    setUserAnswers([])
    setShowResult(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
        <DialogHeader className="border-b border-[#E5DCD0] pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              {classroom.code} • Quiz
            </span>
            <span className="text-xs font-semibold text-[#77716A]">
              Question {currentIdx + 1} of {quiz.questions.length}
            </span>
          </div>
          <DialogTitle className="text-lg font-serif font-bold text-[#292724] mt-1">
            {quiz.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            {classroom.className} ({quiz.topic})
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-5 pt-3">
            {/* Progress Bar */}
            <Progress value={((currentIdx + 1) / quiz.questions.length) * 100} className="h-1.5 bg-[#E5DCD0]" />

            {/* Question Text */}
            <div className="p-4 bg-white border border-[#E5DCD0] rounded-xl shadow-2xs">
              <p className="text-sm font-bold text-[#292724] leading-relaxed">
                {currentQ?.question || "Question loading..."}
              </p>
            </div>

            {/* Option Choices */}
            <div className="space-y-2">
              {currentQ?.options.map((opt, idx) => {
                const isSelected = selectedOption === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? "border-[#E76F51] bg-[#E76F51]/10 text-[#E76F51] shadow-2xs"
                        : "border-[#E5DCD0] bg-white text-[#292724] hover:bg-[#F1E8DD]/50"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected ? "border-[#E76F51] bg-[#E76F51] text-white" : "border-[#E5DCD0] text-[#77716A]"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Next Button */}
            <Button
              onClick={handleNextQuestion}
              disabled={selectedOption === null}
              className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200"
            >
              {currentIdx + 1 === quiz.questions.length ? "Submit Quiz & Calculate Score" : "Next Question"} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        ) : (
          /* Result Summary Screen */
          <div className="space-y-5 pt-4 text-center">
            <div className="w-16 h-16 bg-[#75B798]/15 border border-[#75B798]/30 text-[#75B798] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#292724]">Quiz Completed!</h3>
              <p className="text-xs text-[#77716A] mt-0.5">Your attempt has been recorded and synced to {classroom.instructor}&apos;s dashboard.</p>
            </div>

            <div className="p-4 bg-white border border-[#E5DCD0] rounded-2xl shadow-2xs grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">Score</span>
                <span className="text-2xl font-bold font-mono text-[#E76F51]">
                  {userAnswers.filter((ans, i) => ans === quiz.questions[i]?.correctAnswer).length} / {quiz.questions.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">Mastery Level</span>
                <span className="text-2xl font-bold font-mono text-[#75B798]">
                  {Math.round((userAnswers.filter((ans, i) => ans === quiz.questions[i]?.correctAnswer).length / quiz.questions.length) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="w-1/2 border-[#E5DCD0] text-[#292724] font-bold text-xs rounded-xl">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retake Quiz
              </Button>
              <Button onClick={() => onOpenChange(false)} className="w-1/2 bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl">
                Close & Return
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- 2. REVIEW FLASHCARD DECK MODAL ---
interface FlashcardsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flashcards: FlashcardData[]
  classroom: ClassroomData
}

export function FlashcardsModal({ open, onOpenChange, flashcards, classroom }: FlashcardsModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCount, setKnownCount] = useState(0)

  const cards = flashcards.length > 0 ? flashcards : [
    { id: "fc-def", chapterId: "chap-1", front: "What is a Binary Search Tree?", back: "A tree where left child < parent < right child.", category: "Core" }
  ]
  const card = cards[currentIdx] || cards[0]

  const handleNextCard = (known: boolean) => {
    if (known) setKnownCount((prev) => prev + 1)
    setIsFlipped(false)
    if (currentIdx + 1 < cards.length) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      toast.success(`Deck Review Complete! Mastery: ${knownCount + (known ? 1 : 0)} / ${cards.length}`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
        <DialogHeader className="border-b border-[#E5DCD0] pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30">
              {classroom.code} • Flashcard Deck
            </span>
            <span className="text-xs font-semibold text-[#77716A]">
              Card {currentIdx + 1} of {cards.length}
            </span>
          </div>
          <DialogTitle className="text-lg font-serif font-bold text-[#292724] mt-1">
            Active Review Deck ({card.category})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[180px] p-6 bg-white hover:bg-[#F1E8DD]/40 border-2 border-dashed border-[#8B7EC8]/40 hover:border-[#8B7EC8] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-sm"
          >
            <span className="text-[10px] font-bold text-[#8B7EC8] uppercase tracking-wider mb-2">
              {isFlipped ? "Answer / Explanation (Click to flip)" : "Question / Term (Click to reveal)"}
            </span>
            <p className="text-sm font-bold text-[#292724] leading-relaxed">
              {isFlipped ? card.back : card.front}
            </p>
          </div>

          {/* Known / Review Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleNextCard(false)}
              className="border-[#E5DCD0] text-[#E76F51] hover:bg-[#E76F51]/10 font-bold text-xs py-2.5 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Review Again
            </Button>
            <Button
              onClick={() => handleNextCard(true)}
              className="bg-[#75B798] hover:bg-[#63a284] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" /> Known
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// --- 3. TAKE MOCK TEST MODAL ---
interface MockTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroom: ClassroomData
  studentName: string
}

export function MockTestModal({ open, onOpenChange, classroom, studentName }: MockTestModalProps) {
  const [timeLeft, setTimeLeft] = useState(300) // 5-minute timed test
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isFinished, setIsFinished] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const testQuestions = [
    { id: 1, q: `In ${classroom.className}, what primary law governs structural reduction?`, opts: ["First Principle Theorem", "Second Law of Conservation", "Chain Rule / Iteration", "Standard Base Condition"], ans: 0 },
    { id: 2, q: `Which metric determines standard execution efficiency in ${classroom.code}?`, opts: ["Memory Latency", "Asymptotic Time Complexity O(N)", "Line Count", "File Size"], ans: 1 },
    { id: 3, q: `What condition prevents infinite regression or unhandled exceptions?`, opts: ["Static Typing", "Base Case Termination", "Manual Heap Allocation", "Garbage Collection"], ans: 1 }
  ]

  const handleAutoSubmit = useCallback(() => {
    setIsFinished(true)
    let score = 0
    testQuestions.forEach((q, i) => {
      if (answers[i] === q.ans) score += 1
    })
    const percentage = Math.round((score / testQuestions.length) * 100)
    saveQuizAttempt({
      attemptId: `mock-${Date.now()}`,
      quizId: `mock-${classroom.classId}`,
      quizTitle: `${classroom.code} Midterm Mock Exam`,
      studentId: "student-demo",
      studentName: studentName || "Alex Rivera",
      classId: classroom.classId,
      score: score * 30,
      totalMarks: 90,
      percentage,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weakTopics: percentage < 70 ? ["Time Pressure Execution"] : []
    })
    toast.info("Mock Test Submitted!")
  }, [answers, classroom.classId, classroom.code, studentName, testQuestions])

  useEffect(() => {
    if (open && !isFinished) {
      setTimeLeft(300)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [open, isFinished, handleAutoSubmit])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
        <DialogHeader className="border-b border-[#E5DCD0] pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time Remaining: {formatTime(timeLeft)}
            </span>
            <span className="text-xs font-semibold text-[#77716A]">
              Timed Mock Examination
            </span>
          </div>
          <DialogTitle className="text-lg font-serif font-bold text-[#292724] mt-1">
            {classroom.className} Official Mock Exam
          </DialogTitle>
        </DialogHeader>

        {!isFinished ? (
          <div className="space-y-4 pt-3">
            {testQuestions.map((q, qIdx) => (
              <div key={q.id} className="p-4 bg-white border border-[#E5DCD0] rounded-xl space-y-2">
                <p className="text-xs font-bold text-[#292724]">{qIdx + 1}. {q.q}</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.opts.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => setAnswers({ ...answers, [qIdx]: oIdx })}
                      className={`p-2 rounded-lg text-left text-[11px] font-bold border transition-colors ${
                        answers[qIdx] === oIdx ? "border-[#E76F51] bg-[#E76F51]/10 text-[#E76F51]" : "border-[#E5DCD0] text-[#77716A]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <Button
              onClick={handleAutoSubmit}
              className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs"
            >
              Submit Mock Exam
            </Button>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-[#75B798]/20 text-[#75B798] rounded-full flex items-center justify-center mx-auto font-bold text-xl">
              ✓
            </div>
            <h4 className="font-serif font-bold text-xl text-[#292724]">Mock Test Submitted Successfully</h4>
            <p className="text-xs text-[#77716A]">Your answers have been evaluated and added to your performance score.</p>
            <Button onClick={() => onOpenChange(false)} className="bg-[#E76F51] text-white font-bold text-xs px-6 py-2 rounded-xl">
              Return to Workspace
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
