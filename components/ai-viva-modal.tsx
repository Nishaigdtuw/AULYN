'use client'

import React, { useState } from "react"
import { Sparkles, Mic, Send, Award, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { saveVivaSession, VivaSessionData } from "@/lib/data-store"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

interface AiVivaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId?: string
  assignmentTitle?: string
  classId?: string
  studentName?: string
}

interface VivaQA {
  question: string
  studentAnswer: string
  feedback: string
  score: number
}

const INITIAL_VIVA_QUESTIONS = [
  "You used recursion in your inorder traversal solution. What would happen to system memory if the tree became 10,000 levels deep?",
  "Why does In-Order traversal specifically visit nodes in strictly ascending sorted order for any BST?",
  "How would you refactor recursive DFS to run iteratively without risking a stack overflow error?"
]

export function AiVivaModal({
  open,
  onOpenChange,
  assignmentId = "asgn-dsa-1",
  assignmentTitle = "BST Implementation & Rotations Lab",
  classId = "dsa-2026",
  studentName = "Alex Rivera"
}: AiVivaModalProps) {
  const [step, setStep] = useState<number>(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [qaHistory, setQaHistory] = useState<VivaQA[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [vivaResult, setVivaResult] = useState<{
    vivaScore: number
    understandingScore: number
    memorizationRisk: 'Low' | 'Moderate' | 'High'
  } | null>(null)

  const handleNextVivaQuestion = () => {
    if (!currentAnswer.trim()) {
      toast.warning("Please provide an answer before submitting")
      return
    }

    const currentQ = INITIAL_VIVA_QUESTIONS[step]
    const newQA: VivaQA = {
      question: currentQ,
      studentAnswer: currentAnswer.trim(),
      feedback: "Demonstrated clear understanding of stack frame allocation and BST invariants.",
      score: 8.5
    }

    const updated = [...qaHistory, newQA]
    setQaHistory(updated)
    setCurrentAnswer("")

    if (step < INITIAL_VIVA_QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      setIsAnalyzing(true)
      setTimeout(() => {
        setIsAnalyzing(false)
        const result = {
          vivaScore: 8,
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
          classId,
          questions: updated,
          vivaScore: result.vivaScore,
          understandingScore: result.understandingScore,
          memorizationRisk: result.memorizationRisk,
          weakConcept: "Tree Traversal",
          completedAt: new Date().toLocaleDateString()
        }
        saveVivaSession(vivaSession)

        saveMasteryEvidence("student-demo", classId, "tree-traversal", {
          type: "Viva",
          title: `AI Viva: ${assignmentTitle}`,
          score: result.vivaScore,
          maxScore: 10,
          percentage: result.vivaScore * 10,
          notes: "Demonstrated strong reasoning regarding call stack mechanics during oral defense."
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
              Question {step + 1} of {INITIAL_VIVA_QUESTIONS.length}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            AI Oral Viva Defense — {assignmentTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            The AI Examiner asks follow-up conceptual questions based on your submitted assignment logic.
          </DialogDescription>
        </DialogHeader>

        {!isCompleted ? (
          <div className="space-y-5 pt-3">
            <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center space-x-2 text-[#8B7EC8]">
                <Mic className="w-5 h-5 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider">AI Examiner Prompt:</h4>
              </div>
              <p className="text-sm font-serif font-bold text-[#292724] leading-relaxed">
                &quot;{INITIAL_VIVA_QUESTIONS[step]}&quot;
              </p>
            </Card>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#292724]">Your Answer / Defense Explanation:</label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Explain your reasoning (e.g. Recursion causes stack overflow because each call pushes a frame onto the stack...)"
                rows={4}
                className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]"
              />
            </div>

            <Button
              onClick={handleNextVivaQuestion}
              disabled={isAnalyzing || !currentAnswer.trim()}
              className="w-full bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold py-2.5 text-xs rounded-xl shadow-2xs cursor-pointer"
            >
              {isAnalyzing ? "Evaluating Viva Defense..." : step === INITIAL_VIVA_QUESTIONS.length - 1 ? "Submit Defense & Complete Viva" : "Next Viva Question"} <Send className="w-3.5 h-3.5 ml-1.5" />
            </Button>
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
                <p>Student successfully defended their recursive algorithm and understood stack overflow implications. Knowledge graph updated.</p>
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
