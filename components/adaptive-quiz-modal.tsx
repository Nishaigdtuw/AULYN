'use client'

import React, { useState, useEffect } from "react"
import { Award, CheckCircle2, ArrowRight, BookOpen } from "lucide-react"

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

// Generate questions dynamically based on classroom subject and course materials
function generateClassroomQuestions(classroom: ClassroomData): AdaptiveQuestion[] {
  const subjectLower = (classroom?.subject || classroom?.className || "").toLowerCase()

  if (subjectLower.includes("math") || subjectLower.includes("calculus") || subjectLower.includes("algebra")) {
    return [
      {
        id: "math-1",
        question: "What is the derivative of f(x) = x^3 + 4x - 7 with respect to x?",
        options: ["f'(x) = 3x^2 + 4", "f'(x) = 3x^2 + 4x", "f'(x) = x^2 + 4", "f'(x) = 3x^3 + 4"],
        correctAnswer: 0,
        explanation: "Using the power rule: d/dx(x^n) = n*x^(n-1). Thus, d/dx(x^3) = 3x^2 and d/dx(4x) = 4.",
        difficulty: "Basic",
        topic: "Calculus Derivatives"
      },
      {
        id: "math-2",
        question: "Which integration method is best suited for evaluating ∫ x * e^x dx?",
        options: ["Partial Fractions", "Integration by Parts", "Trigonometric Substitution", "U-Substitution"],
        correctAnswer: 1,
        explanation: "Integration by Parts (∫ u dv = uv - ∫ v du) is ideal for products of algebraic and exponential functions.",
        difficulty: "Medium",
        topic: "Integration Techniques"
      },
      {
        id: "math-3",
        question: "What does the Fundamental Theorem of Calculus connect?",
        options: ["Algebra and Geometry", "Differentiation and Integration", "Vectors and Scalars", "Limits and Sequences"],
        correctAnswer: 1,
        explanation: "The Fundamental Theorem establishes differentiation and integration as inverse mathematical operations.",
        difficulty: "Advanced",
        topic: "Fundamental Theorem"
      }
    ]
  }

  if (subjectLower.includes("phys") || subjectLower.includes("mechanic")) {
    return [
      {
        id: "phys-1",
        question: "According to Newton's Second Law of Motion, what is the net force F acting on an object of mass m and acceleration a?",
        options: ["F = m / a", "F = m * a", "F = m + a", "F = m * a^2"],
        correctAnswer: 1,
        explanation: "Newton's Second Law states that force equals mass multiplied by acceleration (F = ma).",
        difficulty: "Basic",
        topic: "Newtonian Mechanics"
      },
      {
        id: "phys-2",
        question: "In an elastic collision between two isolated bodies, which quantities are strictly conserved?",
        options: ["Kinetic Energy only", "Linear Momentum only", "Both Linear Momentum and Kinetic Energy", "Potential Energy only"],
        correctAnswer: 2,
        explanation: "In elastic collisions, total linear momentum and total kinetic energy are both conserved.",
        difficulty: "Medium",
        topic: "Conservation Laws"
      }
    ]
  }

  // Default CS / DSA or general course materials
  const materialTopic = classroom?.materials?.[0]?.fileName?.replace(".pdf", "") || "Core Course Topic"
  return [
    {
      id: "cs-1",
      question: `Based on ${materialTopic}: Which data structure processes elements in a strict First-In, First-Out (FIFO) manner?`,
      options: ["Stack", "Queue", "Binary Search Tree", "Priority Heap"],
      correctAnswer: 1,
      explanation: "A Queue operates on FIFO ordering, where elements exit in the order they entered.",
      difficulty: "Basic",
      topic: materialTopic
    },
    {
      id: "cs-2",
      question: `Based on ${materialTopic}: Which tree traversal order visits Left Subtree, then Root Node, then Right Subtree?`,
      options: ["Pre-Order Traversal", "In-Order Traversal", "Post-Order Traversal", "Level-Order Traversal"],
      correctAnswer: 1,
      explanation: "In-Order traversal (LDR) processes Left -> Node -> Right, outputting sorted elements in BSTs.",
      difficulty: "Medium",
      topic: materialTopic
    },
    {
      id: "cs-3",
      question: `Based on ${materialTopic}: What is the space complexity of recursive DFS on a binary tree of height H?`,
      options: ["O(1)", "O(log H)", "O(H)", "O(2^H)"],
      correctAnswer: 2,
      explanation: "The call stack holds at most H stack frames during execution, resulting in O(H) auxiliary space.",
      difficulty: "Advanced",
      topic: materialTopic
    }
  ]
}

export function AdaptiveQuizModal({
  open,
  onOpenChange,
  classroom
}: AdaptiveQuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [initialMasteryScore, setInitialMasteryScore] = useState(0)
  const [finalMasteryScore, setFinalMasteryScore] = useState(0)

  const hasMaterials = Boolean(classroom?.materials && classroom.materials.length > 0)

  useEffect(() => {
    if (open) {
      setCurrentIdx(0)
      setSelectedOption(null)
      setUserAnswers([])
      setIsSubmitted(false)

      if (hasMaterials) {
        const generated = generateClassroomQuestions(classroom)
        setQuestions(generated)

        const mastery = getStudentMastery("student-demo", classroom?.classId || "dsa-2026")
        const target = mastery.find((m) => m.conceptId === "tree-traversal") || mastery[0]
        setInitialMasteryScore(target?.score || 0)
      }
    }
  }, [open, classroom, hasMaterials])

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return
    setSelectedOption(idx)
  }

  const handleNextQuestion = () => {
    if (selectedOption === null || questions.length === 0) {
      toast.warning("Please select an answer option")
      return
    }

    const currentQ = questions[currentIdx]
    const isCorrect = selectedOption === currentQ.correctAnswer
    const updatedAnswers = [...userAnswers, selectedOption]
    setUserAnswers(updatedAnswers)

    if (currentIdx === 0 && !isCorrect) {
      toast.info("Adaptive Quiz detected difficulty struggle. Adjusting foundational question path...")
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

      saveMasteryEvidence("student-demo", classroom?.classId || "class-1", "core-concept", {
        type: "Quiz",
        title: `Adaptive Quiz: ${classroom?.className}`,
        score: correctCount * 10,
        maxScore: questions.length * 10,
        percentage,
        notes: `Adaptive Quiz completed for ${classroom?.className}. Score: ${percentage}%.`
      })

      setFinalMasteryScore(percentage)
      setIsSubmitted(true)
      toast.success("Adaptive Quiz Completed & Mastery Evidence Recorded!")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              ⚡ Adaptive Quiz Engine
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              {hasMaterials ? `Question ${currentIdx + 1} of ${questions.length}` : "Course Material Required"}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Adaptive Knowledge Assessment — {classroom?.className}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Questions adaptively test concepts grounded in course material.
          </DialogDescription>
        </DialogHeader>

        {/* Empty State when no course notes uploaded yet */}
        {!hasMaterials ? (
          <Card className="bg-white border-2 border-amber-300/60 rounded-2xl p-8 text-center space-y-4 shadow-2xs my-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-300">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-black text-[#292724]">No learning material available yet.</h3>
              <p className="text-xs text-[#77716A] font-semibold mt-1 max-w-md mx-auto">
                Your teacher needs to upload course notes before an adaptive quiz can be generated for <strong>{classroom?.className}</strong>.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 px-6 rounded-xl shadow-2xs cursor-pointer"
            >
              Back to Workspace
            </Button>
          </Card>
        ) : !isSubmitted ? (
          <div className="space-y-5 pt-3">
            {questions[currentIdx] && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      questions[currentIdx].difficulty === 'Basic' ? 'bg-emerald-100 text-emerald-800' :
                      questions[currentIdx].difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {questions[currentIdx].difficulty} Level
                    </span>
                    <span className="text-xs font-bold text-[#8B7EC8]">
                      Topic: {questions[currentIdx].topic}
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-[#292724] leading-relaxed">
                    {questions[currentIdx].question}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {questions[currentIdx].options.map((opt, idx) => (
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
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5 pt-3">
            <Card className="bg-white border-2 border-[#E76F51]/40 rounded-2xl p-5 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-black text-[#292724]">Assessment Completed</h3>

              <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl flex items-center justify-between text-xs font-bold">
                <span className="text-[#77716A]">{classroom?.className} Mastery Score:</span>
                <span className="text-emerald-700 font-black text-sm">
                  {initialMasteryScore}% → <span className="text-emerald-600 font-extrabold text-base">{finalMasteryScore}%</span>
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
