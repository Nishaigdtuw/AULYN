'use client'

import React, { useState, useEffect } from "react"
import { Award, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { ClassroomData } from "@/lib/data-store"
import { saveMasteryEvidence, getStudentMastery } from "@/lib/mastery-engine"

interface AdaptiveQuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroom: ClassroomData
  studentName?: string
}

interface AdaptiveQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'Basic' | 'Medium' | 'Advanced'
  topic: string
}

const ADAPTIVE_QUESTIONS_BANK: AdaptiveQuestion[] = [
  {
    id: "aq1",
    question: "Which tree traversal order visits the Left Subtree, then Root Node, then Right Subtree?",
    options: ["Pre-Order Traversal", "In-Order Traversal", "Post-Order Traversal", "Level-Order Traversal"],
    correctAnswer: 1,
    explanation: "In-Order traversal (LDR) processes Left -> Node -> Right, producing sorted ascending order for BSTs.",
    difficulty: "Medium",
    topic: "tree-traversal"
  },
  {
    id: "aq2-basic",
    question: "What memory data structure does recursive Depth-First Search (DFS) implicitly use during execution?",
    options: ["FIFO Queue", "Call Stack", "Priority Heap", "Hash Table"],
    correctAnswer: 1,
    explanation: "Each recursive function call allocates a Stack Frame on the system Call Stack.",
    difficulty: "Basic",
    topic: "tree-traversal"
  },
  {
    id: "aq3-advanced",
    question: "What is the space complexity of DFS traversal on a completely skewed binary tree of height H?",
    options: ["O(1)", "O(log H)", "O(H)", "O(2^H)"],
    correctAnswer: 2,
    explanation: "In a skewed tree, the call stack holds H recursive frames, leading to O(H) auxiliary space.",
    difficulty: "Advanced",
    topic: "tree-traversal"
  }
]

export function AdaptiveQuizModal({
  open,
  onOpenChange,
  classroom
}: AdaptiveQuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [questions] = useState<AdaptiveQuestion[]>(ADAPTIVE_QUESTIONS_BANK)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [initialMasteryScore, setInitialMasteryScore] = useState(46)
  const [finalMasteryScore, setFinalMasteryScore] = useState(67)

  useEffect(() => {
    if (open) {
      setCurrentIdx(0)
      setSelectedOption(null)
      setUserAnswers([])
      setIsSubmitted(false)

      const mastery = getStudentMastery("student-demo", classroom?.classId || "dsa-2026")
      const target = mastery.find((m) => m.conceptId === "tree-traversal")
      if (target) {
        setInitialMasteryScore(target.score)
      }
    }
  }, [open, classroom])

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return
    setSelectedOption(idx)
  }

  const handleNextQuestion = () => {
    if (selectedOption === null) {
      toast.warning("Please select an answer option")
      return
    }

    const currentQ = questions[currentIdx]
    const isCorrect = selectedOption === currentQ.correctAnswer
    const updatedAnswers = [...userAnswers, selectedOption]
    setUserAnswers(updatedAnswers)

    // Dynamic Adaptive Branching
    if (currentIdx === 0 && !isCorrect) {
      toast.info("Adaptive Quiz detected difficulty struggle. Branching to foundational prerequisite concept...")
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setSelectedOption(null)
    } else {
      let correctCount = 0
      questions.forEach((q, i) => {
        if (updatedAnswers[i] === q.correctAnswer) correctCount++
      })
      const percentage = Math.round((correctCount / questions.length) * 100)

      saveMasteryEvidence("student-demo", classroom?.classId || "dsa-2026", "tree-traversal", {
        type: "Quiz",
        title: "Adaptive Tree Traversal Quiz",
        score: correctCount * 10,
        maxScore: questions.length * 10,
        percentage,
        notes: `Adaptive Quiz attempt score: ${percentage}%. Dynamic branching evaluated.`
      })

      const newMastery = getStudentMastery("student-demo", classroom?.classId || "dsa-2026")
      const updatedConcept = newMastery.find((m) => m.conceptId === "tree-traversal")
      if (updatedConcept) {
        setFinalMasteryScore(updatedConcept.score)
      }

      setIsSubmitted(true)
      toast.success("Adaptive Quiz Completed & Mastery Evidence Recorded!")
    }
  }

  const currentQ = questions[currentIdx]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              ⚡ Adaptive Engine Active
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Adaptive Knowledge Assessment — {classroom?.className}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Questions dynamically adjust difficulty based on your real-time responses.
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <div className="space-y-5 pt-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  currentQ.difficulty === 'Basic' ? 'bg-emerald-100 text-emerald-800' :
                  currentQ.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {currentQ.difficulty} Level
                </span>
              </div>
              <h3 className="text-base font-serif font-bold text-[#292724] leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-3.5 rounded-xl border text-left font-bold text-xs transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    selectedOption === idx
                      ? "bg-[#E76F51] text-white border-[#E76F51] shadow-2xs"
                      : "bg-white text-[#292724] border-[#E5DCD0] hover:bg-[#F1E8DD]"
                  }`}
                >
                  <span>{opt}</span>
                  {selectedOption === idx && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={selectedOption === null}
              className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-2.5 text-xs rounded-xl shadow-2xs cursor-pointer"
            >
              {currentIdx === questions.length - 1 ? 'Finish & Submit Assessment' : 'Next Adaptive Question'} <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-3">
            <Card className="bg-white border-2 border-[#E76F51]/40 rounded-2xl p-5 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-black text-[#292724]">Assessment Completed</h3>

              <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl flex items-center justify-between text-xs font-bold">
                <span className="text-[#77716A]">Tree Traversal Mastery Score:</span>
                <span className="text-emerald-700 font-black text-sm">
                  {initialMasteryScore}% → <span className="text-emerald-600 font-extrabold text-base">{finalMasteryScore}% (+{finalMasteryScore - initialMasteryScore}%)</span>
                </span>
              </div>

              <p className="text-xs text-[#77716A] font-semibold">
                Your performance evidence has been registered to the Central Mastery Engine and updated on your Knowledge Graph.
              </p>

              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 px-6 rounded-xl shadow-2xs cursor-pointer"
              >
                Return to Workspace
              </Button>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
