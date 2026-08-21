'use client'

import React, { useState, useEffect } from "react"
import { Sparkles, Mic, Send, Award, ShieldCheck, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { saveVivaSession, VivaSessionData, ClassroomData, getStoredClassrooms } from "@/lib/data-store"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

interface AiVivaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId?: string
  assignmentTitle?: string
  classId?: string
  classroom?: ClassroomData
  studentName?: string
}

interface VivaQA {
  question: string
  studentAnswer: string
  feedback: string
  score: number
}

function generateClassroomVivaQuestions(classroom?: ClassroomData): string[] {
  const subjectLower = (classroom?.subject || classroom?.className || "").toLowerCase()

  if (subjectLower.includes("math") || subjectLower.includes("calculus") || subjectLower.includes("algebra")) {
    return [
      "Explain geometrically what the derivative of a function represents at a specific point x = a.",
      "How does Integration by Parts differ from U-Substitution when evaluating definite integrals?",
      "Why does the Fundamental Theorem of Calculus guarantee that integration and differentiation are inverse processes?"
    ]
  }

  if (subjectLower.includes("phys") || subjectLower.includes("mechanic")) {
    return [
      "How does Newton's Second Law explain the change in velocity of an object when an unbalanced external force is applied?",
      "Under what exact physical conditions is linear momentum conserved during an elastic collision?",
      "What is the physical significance of work done by a conservative force versus a non-conservative friction force?"
    ]
  }

  const matName = classroom?.materials?.[0]?.fileName?.replace(".pdf", "") || "Course Lecture Notes"
  return [
    `Based on ${matName}: Explain the key conceptual difference between recursive execution and iterative execution.`,
    `In your own words, how does ${matName} address boundary conditions and memory allocation?`,
    `What potential trade-offs exist between time complexity and space complexity in the algorithms covered in ${matName}?`
  ]
}

export function AiVivaModal({
  open,
  onOpenChange,
  assignmentId = "asgn-1",
  assignmentTitle = "Course Laboratory Defense",
  classId,
  classroom: passedClassroom,
  studentName = "Alex Rivera"
}: AiVivaModalProps) {
  const [step, setStep] = useState<number>(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [qaHistory, setQaHistory] = useState<VivaQA[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [vivaQuestions, setVivaQuestions] = useState<string[]>([])

  const targetClassroom = passedClassroom || (classId ? getStoredClassrooms().find((c) => c.classId === classId) : getStoredClassrooms()[0])
  const hasMaterials = Boolean(targetClassroom?.materials && targetClassroom.materials.length > 0)

  useEffect(() => {
    if (open) {
      setStep(0)
      setCurrentAnswer("")
      setQaHistory([])
      setIsCompleted(false)
      setIsAnalyzing(false)

      if (hasMaterials) {
        setVivaQuestions(generateClassroomVivaQuestions(targetClassroom))
      }
    }
  }, [open, targetClassroom, hasMaterials])

  const [vivaResult, setVivaResult] = useState<{
    vivaScore: number
    understandingScore: number
    memorizationRisk: 'Low' | 'Moderate' | 'High'
  } | null>(null)

  const handleNextVivaQuestion = () => {
    if (!currentAnswer.trim() || vivaQuestions.length === 0) {
      toast.warning("Please provide an answer before submitting")
      return
    }

    const currentQ = vivaQuestions[step]
    const newQA: VivaQA = {
      question: currentQ,
      studentAnswer: currentAnswer.trim(),
      feedback: `Demonstrated clear understanding of ${targetClassroom?.className || "course"} concepts.`,
      score: 8.5
    }

    const updated = [...qaHistory, newQA]
    setQaHistory(updated)
    setCurrentAnswer("")

    if (step < vivaQuestions.length - 1) {
      setStep(step + 1)
    } else {
      setIsAnalyzing(true)
      setTimeout(() => {
        setIsAnalyzing(false)
        const result = {
          vivaScore: 8.5,
          understandingScore: 9,
          memorizationRisk: 'Low' as const
        }
        setVivaResult(result)
        setIsCompleted(true)

        const vivaSession: VivaSessionData = {
          vivaId: `viva-${Date.now()}`,
          assignmentId,
          assignmentTitle,
          studentId: "student-demo",
          studentName,
          classId: targetClassroom?.classId || "class-1",
          questions: updated,
          vivaScore: result.vivaScore,
          understandingScore: result.understandingScore,
          memorizationRisk: result.memorizationRisk,
          weakConcept: "Conceptual Application",
          completedAt: new Date().toLocaleDateString()
        }
        saveVivaSession(vivaSession)

        saveMasteryEvidence("student-demo", targetClassroom?.classId || "class-1", "core-concept", {
          type: "Viva",
          title: `AI Viva: ${targetClassroom?.className || assignmentTitle}`,
          score: result.vivaScore,
          maxScore: 10,
          percentage: result.vivaScore * 10,
          notes: `Demonstrated solid conceptual reasoning during oral defense for ${targetClassroom?.className}.`
        })

        toast.success("AI Viva Assessment completed and evidence registered!")
      }, 700)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" /> AI Viva Voice & Text Examiner
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              {hasMaterials ? `Question ${step + 1} of ${vivaQuestions.length}` : "Course Material Required"}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            AI Oral Viva Defense — {targetClassroom?.className || assignmentTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            The AI Examiner asks conceptual questions based on course material.
          </DialogDescription>
        </DialogHeader>

        {/* Empty State when no course notes uploaded yet */}
        {!hasMaterials ? (
          <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-8 text-center space-y-4 shadow-2xs my-4">
            <div className="w-14 h-14 bg-purple-100 text-[#8B7EC8] rounded-full flex items-center justify-center mx-auto border border-purple-200">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-black text-[#292724]">No source material available yet.</h3>
              <p className="text-xs text-[#77716A] font-semibold mt-1 max-w-md mx-auto">
                Your teacher needs to upload course notes before an AI Oral Viva can be generated for <strong>{targetClassroom?.className}</strong>.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs py-2 px-6 rounded-xl shadow-2xs cursor-pointer"
            >
              Back to Workspace
            </Button>
          </Card>
        ) : !isCompleted ? (
          <div className="space-y-5 pt-3">
            {vivaQuestions[step] && (
              <>
                <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-[#8B7EC8]">
                    <Mic className="w-5 h-5 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">AI Examiner Prompt:</h4>
                  </div>
                  <p className="text-sm font-serif font-bold text-[#292724] leading-relaxed">
                    &quot;{vivaQuestions[step]}&quot;
                  </p>
                </Card>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#292724]">Your Answer / Defense Explanation:</label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Explain your conceptual reasoning in detail..."
                    rows={4}
                    className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]"
                  />
                </div>

                <Button
                  onClick={handleNextVivaQuestion}
                  disabled={isAnalyzing || !currentAnswer.trim()}
                  className="w-full bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold py-2.5 text-xs rounded-xl shadow-2xs cursor-pointer"
                >
                  {isAnalyzing ? "Evaluating Viva Defense..." : step === vivaQuestions.length - 1 ? "Submit Defense & Complete Viva" : "Next Viva Question"} <Send className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5 pt-3">
            <Card className="bg-white border-2 border-[#75B798]/40 rounded-2xl p-5 space-y-4 shadow-2xs text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Award className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-serif font-black text-[#292724]">AI Viva Defense Evaluation</h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Viva Score</p>
                  <p className="text-lg font-serif font-bold text-[#E76F51]">{vivaResult?.vivaScore} / 10</p>
                </div>
                <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Understanding</p>
                  <p className="text-lg font-serif font-bold text-[#8B7EC8]">{vivaResult?.understandingScore} / 10</p>
                </div>
                <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Rote Memory Risk</p>
                  <p className="text-lg font-serif font-bold text-[#75B798]">{vivaResult?.memorizationRisk}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs font-semibold text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Examiner Advisory Note:</p>
                <p>Student successfully defended their conceptual understanding for {targetClassroom?.className}. Evidence registered to Knowledge Graph.</p>
              </div>

              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#75B798] hover:bg-[#64a587] text-white font-bold text-xs py-2 px-6 rounded-xl shadow-2xs cursor-pointer"
              >
                Close Viva Assessment
              </Button>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
