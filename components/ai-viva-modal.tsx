'use client'

import React, { useState, useEffect } from "react"
import { Sparkles, Mic, Send, Award, ShieldCheck, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { saveVivaSession, VivaSessionData, ClassroomData, getStoredClassrooms, SubscriptionData, getStoredSubscription } from "@/lib/data-store"

import { saveMasteryEvidence } from "@/lib/mastery-engine"
import { isPro } from "@/lib/subscription"
import { ProLimitDialog } from "@/components/pro-limit-dialog"

import PricingModal from "@/components/pricing-modal"


interface AiVivaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId?: string
  assignmentTitle?: string
  classId?: string
  classroom?: ClassroomData
  studentName?: string
}

interface VivaQuestionItem {
  id: string
  questionText: string
  difficulty: 'Core' | 'Prerequisite' | 'Advanced'
  topic: string
}

interface VivaQAHistory {
  question: string
  studentAnswer: string
  feedback: string
  score: number
  difficulty: string
}

interface VivaFinalEvaluation {
  vivaScore: number
  understandingScore: number
  memorizationRisk: 'Low' | 'Moderate' | 'High'
  strongAreas: string[]
  weakAreas: string[]
  overallFeedback: string
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
  const [targetClassroom, setTargetClassroom] = useState<ClassroomData | undefined>(passedClassroom)
  const [subscription, setSubscription] = useState<SubscriptionData>({ plan: 'free', status: 'inactive' })
  const [proLimitOpen, setProLimitOpen] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)

  const [currentStep, setCurrentStep] = useState<number>(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [qaHistory, setQaHistory] = useState<VivaQAHistory[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<VivaQuestionItem | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<VivaFinalEvaluation | null>(null)

  useEffect(() => {
    if (open) {
      const sub = getStoredSubscription()
      setSubscription(sub)

      const activeClass = passedClassroom || (classId ? getStoredClassrooms().find((c) => c.classId === classId) : getStoredClassrooms()[0])
      setTargetClassroom(activeClass)

      // Reset session
      setCurrentStep(0)
      setCurrentAnswer("")
      setQaHistory([])
      setIsCompleted(false)
      setIsAnalyzing(false)
      setEvaluationResult(null)

      if (activeClass?.materials && activeClass.materials.length > 0) {
        const initialQ = generateInitialQuestion(activeClass)
        setCurrentQuestion(initialQ)
      } else {
        setCurrentQuestion(null)
      }
    }
  }, [open, passedClassroom, classId])


  const hasMaterials = Boolean(targetClassroom?.materials && targetClassroom.materials.length > 0)

  // Handle Answer Submission & Adaptive Next Question Generation
  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim() || !currentQuestion || !targetClassroom) return

    if (!isPro(subscription) && currentStep >= 2) {
      setProLimitOpen(true)
      return
    }

    setIsAnalyzing(true)

    const userText = currentAnswer.trim()
    const wordCount = userText.split(/\s+/).length

    // Evaluate answer quality
    let answerScore = 8.5
    let feedback = "Demonstrated clear conceptual reasoning and accurate domain terminology."

    if (wordCount < 6 || userText.toLowerCase().includes("don't know") || userText.toLowerCase().includes("not sure")) {
      answerScore = 4.5
      feedback = "Answer was incomplete or lacked specific core mechanisms."
    } else if (wordCount > 25 && (userText.toLowerCase().includes("recursion") || userText.toLowerCase().includes("queue") || userText.toLowerCase().includes("stack") || userText.toLowerCase().includes("derivative") || userText.toLowerCase().includes("force"))) {
      answerScore = 9.5
      feedback = "Outstanding response with rigorous technical detail and structural clarity."
    }

    const newQA: VivaQAHistory = {
      question: currentQuestion.questionText,
      studentAnswer: userText,
      feedback,
      score: answerScore,
      difficulty: currentQuestion.difficulty
    }

    const updatedHistory = [...qaHistory, newQA]
    setQaHistory(updatedHistory)
    setCurrentAnswer("")

    setTimeout(() => {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)

      if (nextStep >= 3) {
        // Complete Viva session & calculate final scores
        completeVivaSession(updatedHistory)
      } else {
        // Generate adaptive next question based on score
        const nextQ = generateAdaptiveNextQuestion(targetClassroom, answerScore, nextStep)
        setCurrentQuestion(nextQ)
        setIsAnalyzing(false)
      }
    }, 600)
  }

  // Calculate final performance summary
  const completeVivaSession = (history: VivaQAHistory[]) => {
    const avgScore = history.reduce((acc, q) => acc + q.score, 0) / history.length
    const roundedScore = Math.round(avgScore * 10) / 10

    const strong: string[] = []
    const weak: string[] = []

    history.forEach((h, idx) => {
      if (h.score >= 7.5) {
        strong.push(`Q${idx + 1}: High mastery of ${h.difficulty} conceptual principles`)
      } else {
        weak.push(`Q${idx + 1}: Needs review on ${h.difficulty} definitions & edge cases`)
      }
    })

    if (strong.length === 0) strong.push("Basic attempt of foundational concepts")
    if (weak.length === 0) weak.push("None identified — solid grasp across all viva questions!")

    const finalEval: VivaFinalEvaluation = {
      vivaScore: roundedScore,
      understandingScore: Math.min(10, Math.round((roundedScore + 0.5) * 10) / 10),
      memorizationRisk: roundedScore >= 8.5 ? 'Low' : roundedScore >= 6.5 ? 'Moderate' : 'High',
      strongAreas: strong,
      weakAreas: weak,
      overallFeedback: `Student completed ${history.length} viva defense questions grounded in ${targetClassroom?.className}. Demonstrated good technical articulation.`
    }

    setEvaluationResult(finalEval)
    setIsAnalyzing(false)
    setIsCompleted(true)

    // Save session to data store
    const vivaSession: VivaSessionData = {
      vivaId: `viva-${Date.now()}`,
      assignmentId,
      assignmentTitle,
      studentId: "student-demo",
      studentName,
      classId: targetClassroom?.classId || "class-1",
      questions: history.map(h => ({
        question: h.question,
        studentAnswer: h.studentAnswer,
        feedback: h.feedback,
        score: h.score
      })),
      vivaScore: finalEval.vivaScore,
      understandingScore: finalEval.understandingScore,
      memorizationRisk: finalEval.memorizationRisk,
      weakConcept: weak[0] || "Conceptual Application",
      completedAt: new Date().toLocaleDateString()
    }
    saveVivaSession(vivaSession)

    saveMasteryEvidence("student-demo", targetClassroom?.classId || "class-1", "core-concept", {
      type: "Viva",
      title: `AI Oral Viva: ${targetClassroom?.className || assignmentTitle}`,
      score: finalEval.vivaScore,
      maxScore: 10,
      percentage: finalEval.vivaScore * 10,
      notes: `Completed adaptive oral defense for ${targetClassroom?.className}.`
    })

    toast.success("AI Viva Assessment completed successfully!")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" /> AI Viva Examiner
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              {hasMaterials && !isCompleted ? `Question ${currentStep + 1} of 3` : "Course Material Required"}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Conceptual Oral Question — {targetClassroom?.className || assignmentTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Adaptive, grounded oral assessment based on your teacher&apos;s uploaded course material.
          </DialogDescription>
        </DialogHeader>

        {/* 1. NO COURSE MATERIAL WARNING */}
        {!hasMaterials ? (
          <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-8 text-center space-y-4 shadow-2xs my-4">
            <div className="w-14 h-14 bg-purple-100 text-[#8B7EC8] rounded-full flex items-center justify-center mx-auto border border-purple-200">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-black text-[#292724]">No course material available yet.</h3>
              <p className="text-xs text-[#77716A] font-semibold max-w-md mx-auto">
                Your teacher needs to upload notes before an AI Oral Viva can be generated.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs py-2 px-6 rounded-xl shadow-2xs cursor-pointer"
            >
              Back to Workspace
            </Button>
          </Card>

        /* 2. ACTIVE VIVA QUESTION SESSION */
        ) : !isCompleted ? (
          <div className="space-y-5 pt-3">
            {currentQuestion && (
              <>
                <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#8B7EC8]">
                      <Mic className="w-5 h-5 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">AI Examiner Prompt:</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      currentQuestion.difficulty === 'Prerequisite' ? 'bg-amber-100 text-amber-800' :
                      currentQuestion.difficulty === 'Advanced' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentQuestion.difficulty} Question
                    </span>
                  </div>

                  <p className="text-sm font-serif font-bold text-[#292724] leading-relaxed">
                    &quot;{currentQuestion.questionText}&quot;
                  </p>
                </Card>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#292724]">Your Answer / Conceptual Defense:</label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Explain your conceptual understanding in detail..."
                    rows={4}
                    className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]"
                  />
                </div>

                <Button
                  onClick={handleAnswerSubmit}
                  disabled={isAnalyzing || !currentAnswer.trim()}
                  className="w-full bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold py-2.5 text-xs rounded-xl shadow-2xs cursor-pointer"
                >
                  {isAnalyzing ? "Evaluating Response & Adapting..." : currentStep === 2 ? "Submit Final Answer & Finish Viva" : "Submit Answer & Continue"} <Send className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </>
            )}
          </div>

        /* 3. FINAL VIVA EVALUATION SUMMARY */
        ) : (
          <div className="space-y-5 pt-3">
            <Card className="bg-white border-2 border-[#75B798]/40 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-black text-[#292724]">AI Viva Defense Evaluation Summary</h3>
                <p className="text-xs text-[#77716A] font-semibold">
                  Course: {targetClassroom?.className}
                </p>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Viva Score</p>
                  <p className="text-lg font-serif font-bold text-[#E76F51]">{evaluationResult?.vivaScore} / 10</p>
                </div>
                <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Understanding</p>
                  <p className="text-lg font-serif font-bold text-[#8B7EC8]">{evaluationResult?.understandingScore} / 10</p>
                </div>
                <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Memory Risk</p>
                  <p className="text-lg font-serif font-bold text-[#75B798]">{evaluationResult?.memorizationRisk}</p>
                </div>
              </div>

              {/* Strong Areas */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Strong Areas:</h4>
                <ul className="list-disc list-inside text-xs text-[#292724] font-medium space-y-0.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  {evaluationResult?.strongAreas.map((sa, i) => (
                    <li key={i}>{sa}</li>
                  ))}
                </ul>
              </div>

              {/* Weak Areas */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Weak Areas / Revision Focus:</h4>
                <ul className="list-disc list-inside text-xs text-[#292724] font-medium space-y-0.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  {evaluationResult?.weakAreas.map((wa, i) => (
                    <li key={i}>{wa}</li>
                  ))}
                </ul>
              </div>

              {/* Detailed Feedback */}
              <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#8B7EC8] flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#8B7EC8]" /> Examiner Advisory Feedback:
                </p>
                <p className="text-[#292724] font-medium leading-relaxed">
                  {evaluationResult?.overallFeedback}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-[#75B798] hover:bg-[#64a587] text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-2xs cursor-pointer"
                >
                  Close Viva Assessment
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
      </Dialog>

      {/* PRO LIMIT DIALOG */}
      <ProLimitDialog
        open={proLimitOpen}
        onOpenChange={setProLimitOpen}
        featureName="Higher AI Oral Viva Sessions"
        reason="Unlimited AI Viva practice is an AULYN Pro capability. Upgrade to unlock unlimited conceptual oral Q&A sessions."
        userRole="student"
        onOpenPricing={() => setPricingModalOpen(true)}
      />

      {/* PRICING MODAL */}
      <PricingModal
        open={pricingModalOpen}
        onOpenChange={setPricingModalOpen}
        userRole="student"
      />
    </>
  )
}


// Generate initial question grounded in classroom materials/subject
function generateInitialQuestion(classroom: ClassroomData): VivaQuestionItem {
  const subjectLower = (classroom.subject || classroom.className || "").toLowerCase()
  const matName = classroom.materials?.[0]?.fileName?.replace(/\.[^/.]+$/, "") || classroom.className

  if (subjectLower.includes("math") || subjectLower.includes("calculus") || subjectLower.includes("algebra")) {
    return {
      id: "q1",
      questionText: `Based on your course materials in ${matName}: Explain geometrically what the derivative of a function represents at a specific point x = a.`,
      difficulty: "Core",
      topic: "Calculus & Derivatives"
    }
  }

  if (subjectLower.includes("phys") || subjectLower.includes("mechanic")) {
    return {
      id: "q1",
      questionText: `Based on your course materials in ${matName}: How does Newton's Second Law explain the change in velocity of an object when an unbalanced external force is applied?`,
      difficulty: "Core",
      topic: "Newtonian Physics"
    }
  }

  return {
    id: "q1",
    questionText: `Based on ${matName}: What is the primary conceptual difference between Depth-First Search (DFS) and Breadth-First Search (BFS) in tree traversal?`,
    difficulty: "Core",
    topic: "Tree Traversal"
  }
}

// Generate adaptive next question based on student performance
function generateAdaptiveNextQuestion(classroom: ClassroomData, previousScore: number, stepIndex: number): VivaQuestionItem {
  const subjectLower = (classroom.subject || classroom.className || "").toLowerCase()

  // Case 1: Weak Answer (< 6.0) -> Simpler Prerequisite Question

  if (previousScore < 6.0) {
    if (subjectLower.includes("math") || subjectLower.includes("calculus")) {
      return {
        id: `q${stepIndex + 1}`,
        questionText: `Let's simplify: What is the fundamental formula for calculating the slope between two points (x1, y1) and (x2, y2)?`,
        difficulty: "Prerequisite",
        topic: "Foundational Math"
      }
    }
    return {
      id: `q${stepIndex + 1}`,
      questionText: `Let's simplify: What basic data structure does Breadth-First Search (BFS) use to process nodes level by level?`,
      difficulty: "Prerequisite",
      topic: "Basic Data Structures"
    }
  }

  // Case 2: Strong Answer (>= 6.0) -> Deeper Application Question
  if (subjectLower.includes("math") || subjectLower.includes("calculus")) {
    return {
      id: `q${stepIndex + 1}`,
      questionText: `Great work! How does the Fundamental Theorem of Calculus link integration with differentiation?`,
      difficulty: "Advanced",
      topic: "Advanced Calculus"
    }
  }

  return {
    id: `q${stepIndex + 1}`,
    questionText: `Excellent reasoning! How would you modify DFS to detect whether a cycle exists in a directed graph?`,
    difficulty: "Advanced",
    topic: "Algorithmic Design"
  }
}
