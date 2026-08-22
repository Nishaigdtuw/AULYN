'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Sparkles, Mic, MicOff, Award, ShieldCheck, BookOpen, Volume2, RotateCcw, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
  saveVivaSession,
  VivaSessionData,
  ClassroomData,
  getStoredClassrooms,
  SubscriptionData,
  getStoredSubscription
} from "@/lib/data-store"

import { saveMasteryEvidence } from "@/lib/mastery-engine"
import { isPro } from "@/lib/subscription"
import { ProLimitDialog } from "@/components/pro-limit-dialog"
import PricingModal from "@/components/pricing-modal"
import {
  startVivaSessionServer,
  submitVivaResponseServer,
  finalizeVivaSessionServer,
  retryWeakConceptsServer,
  VivaQuestionItem,
  VivaReportData
} from "@/actions/viva/action"

interface AiVivaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId?: string
  assignmentTitle?: string
  classId?: string
  classroom?: ClassroomData
  studentId?: string
  studentName?: string
}

type VivaState =
  | 'PREPARING'
  | 'EXAMINER_SPEAKING'
  | 'YOUR_TURN'
  | 'LISTENING'
  | 'ANSWER_CAPTURED'
  | 'PROCESSING'
  | 'VIVA_COMPLETED'

export function AiVivaModal({
  open,
  onOpenChange,
  assignmentId = "asgn-1",
  assignmentTitle = "Course Laboratory Defense",
  classId,
  classroom: passedClassroom,
  studentId = "student-demo",
  studentName = "Alex Rivera"
}: AiVivaModalProps) {
  const [targetClassroom, setTargetClassroom] = useState<ClassroomData | undefined>(passedClassroom)
  const [subscription, setSubscription] = useState<SubscriptionData>({ plan: 'free', status: 'inactive' })
  const [proLimitOpen, setProLimitOpen] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)

  // Viva Session & State Machine
  const [vivaState, setVivaState] = useState<VivaState>('PREPARING')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<VivaQuestionItem[]>([])
  const [currentIdx, setCurrentIdx] = useState<number>(0)
  const [report, setReport] = useState<VivaReportData | null>(null)

  // Speech Recognition & Audio States
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [micError, setMicError] = useState<string | null>(null)
  const [isSpeakingTts, setIsSpeakingTts] = useState(false)

  const recognitionRef = useRef<unknown>(null)

  const currentQ = questions[currentIdx] || null
  const hasMaterials = Boolean(
    targetClassroom &&
    ((targetClassroom.materials && targetClassroom.materials.length > 0) ||
      (targetClassroom.chapters && targetClassroom.chapters.length > 0))
  )

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const windowObj = window as unknown as { SpeechRecognition: new () => { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: (e: { results: Array<Array<{ transcript: string }> > }) => void; onerror: (e: { error: string }) => void; onend: () => void }; webkitSpeechRecognition: new () => { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: (e: { results: Array<Array<{ transcript: string }> > }) => void; onerror: (e: { error: string }) => void; onend: () => void } }
      const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
          let currentTranscript = ""
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          setTranscript(currentTranscript)
        }

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setIsRecording(false)
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicPermission('denied')
            setMicError("Microphone access denied. Please enable microphone permissions in your browser settings.")
          }
        }

        recognition.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  // Text-To-Speech (TTS) Question Playback
  const speakQuestionAloud = useCallback((text: string) => {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel() // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => {
      setIsSpeakingTts(true)
      setVivaState('EXAMINER_SPEAKING')
    }

    utterance.onend = () => {
      setIsSpeakingTts(false)
      setVivaState('YOUR_TURN')
    }

    utterance.onerror = () => {
      setIsSpeakingTts(false)
      setVivaState('YOUR_TURN')
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  const initSession = useCallback(async (clsId: string) => {
    setVivaState('PREPARING')
    const res = await startVivaSessionServer(studentId, clsId)

    if (res.success && res.questions && res.questions.length > 0) {
      const sessId = res.session?.id || res.sessionId || `viva-sess-${Date.now()}`
      setSessionId(sessId)

      const qList: VivaQuestionItem[] = res.questions.map((q) => ({
        id: q.id,
        sessionId: q.sessionId || sessId,
        order: q.order || 1,
        concept: q.concept || "Core Fundamentals",
        questionText: q.questionText,
        difficulty: (q.difficulty as 'Basic' | 'Medium' | 'Advanced') || "Medium",
        isFollowUp: !!q.isFollowUp,
        parentQuestionId: q.parentQuestionId || undefined
      }))

      setQuestions(qList)
      const lastAnsweredIdx = qList.findIndex((q) => !q.transcript)
      const activeIdx = lastAnsweredIdx !== -1 ? lastAnsweredIdx : qList.length - 1
      setCurrentIdx(activeIdx)

      const firstQ = qList[activeIdx]
      if (firstQ) {
        speakQuestionAloud(firstQ.questionText)
      } else {
        setVivaState('YOUR_TURN')
      }
    } else {
      setVivaState('YOUR_TURN')
    }
  }, [studentId, speakQuestionAloud])

  // Initialize or Restore Viva Session on Modal Open
  useEffect(() => {
    if (open) {
      const sub = getStoredSubscription()
      setSubscription(sub)

      const activeClass = passedClassroom || (classId ? getStoredClassrooms().find((c) => c.classId === classId) : getStoredClassrooms()[0])
      setTargetClassroom(activeClass)

      // Reset state
      setTranscript("")
      setMicError(null)

      if (activeClass) {
        initSession(activeClass.classId)
      }
    } else {
      if (typeof window !== "undefined" && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [open, passedClassroom, classId, initSession])

  // Microphone Control Handlers
  const startRecording = async () => {
    setMicError(null)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicPermission('granted')
      }

      const rec = recognitionRef.current as { start: () => void; stop: () => void } | null
      if (rec) {
        setTranscript("")
        rec.start()
        setIsRecording(true)
        setVivaState('LISTENING')
      } else {
        setMicError("Web Speech API is not supported in this browser. Please use Google Chrome or Safari.")
      }
    } catch {
      setMicPermission('denied')
      setMicError("Microphone access is required for the oral viva. Please enable microphone permissions in your browser.")
    }
  }

  const stopRecording = () => {
    const rec = recognitionRef.current as { start: () => void; stop: () => void } | null
    if (rec && isRecording) {
      rec.stop()
      setIsRecording(false)
      setVivaState('ANSWER_CAPTURED')
    }
  }

  // Submit Spoken Answer to Server Action
  const handleAnswerSubmit = async () => {
    if (!transcript.trim()) {
      toast.warning("No speech captured yet. Please speak your response aloud.")
      return
    }

    if (!isPro(subscription) && currentIdx >= 2) {
      setProLimitOpen(true)
      return
    }

    if (!sessionId || !currentQ) return

    setVivaState('PROCESSING')
    const toastId = toast.loading("Examiner processing your verbal answer...")

    const res = await submitVivaResponseServer(studentId, sessionId, currentQ.id, transcript)

    if (res.success) {
      toast.dismiss(toastId)

      if (res.isCompleted) {
        // Finalize Session & Generate Report
        const finalRes = await finalizeVivaSessionServer(studentId, sessionId)
        if (finalRes.success && finalRes.report) {
          setReport(finalRes.report)
          setVivaState('VIVA_COMPLETED')

          // Local store sync
          const vivaSessionData: VivaSessionData = {
            vivaId: finalRes.report.sessionId,
            assignmentId,
            assignmentTitle,
            studentId,
            studentName,
            classId: targetClassroom?.classId || "class-1",
            topic: finalRes.report.topic,
            status: "COMPLETED",
            vivaScore: finalRes.report.overallScore,
            overallScore: finalRes.report.overallScore,
            conceptualScore: finalRes.report.conceptualScore,
            correctnessScore: finalRes.report.correctnessScore,
            reasoningScore: finalRes.report.reasoningScore,
            communicationScore: finalRes.report.communicationScore,
            deliveryFluencyScore: finalRes.report.deliveryFluencyScore,
            summary: finalRes.report.summary,
            strengths: finalRes.report.strengths,
            weaknesses: finalRes.report.weaknesses,
            conceptMastery: finalRes.report.conceptMastery,
            recommendedNextSteps: finalRes.report.recommendedNextSteps,
            questions: finalRes.report.questions.map((q) => ({
              id: q.id,
              order: q.order,
              concept: q.concept,
              questionText: q.questionText,
              transcript: q.transcript,
              feedback: q.conceptualFeedback,
              conceptualFeedback: q.conceptualFeedback,
              whatExplainedWell: q.whatExplainedWell,
              whatWasMissing: q.whatWasMissing,
              score: q.score,
              difficulty: q.difficulty,
              isFollowUp: q.isFollowUp,
              parentQuestionId: q.parentQuestionId
            })),
            completedAt: new Date().toLocaleDateString()
          }

          saveVivaSession(vivaSessionData)
          saveMasteryEvidence(studentId, targetClassroom?.classId || "class-1", "core-concept", {
            type: "Viva",
            title: `AI Oral Viva: ${targetClassroom?.className || assignmentTitle}`,
            score: finalRes.report.overallScore,
            maxScore: 10,
            percentage: finalRes.report.overallScore * 10,
            notes: `Completed adaptive oral viva defense for ${targetClassroom?.className}.`
          })

          toast.success("Viva Assessment completed successfully!")
        }
      } else if (res.nextQuestion) {
        const nextQ = res.nextQuestion
        setQuestions((prev) => [...prev, nextQ])
        setCurrentIdx((prev) => prev + 1)
        setTranscript("")
        speakQuestionAloud(nextQ.questionText)
      }
    } else {
      toast.error(res.message || "Failed to evaluate answer. Please try again.", { id: toastId })
      setVivaState('YOUR_TURN')
    }
  }

  // Handle Retry Weak Concepts
  const handleRetryWeakConcepts = async () => {
    if (!targetClassroom || !report) return
    const weakTopics = report.conceptMastery
      .filter((c) => c.status === 'Needs Revision' || c.status === 'Moderate')
      .map((c) => c.concept)

    const toastId = toast.loading("Generating targeted revision viva for weak concepts...")
    const res = await retryWeakConceptsServer(studentId, targetClassroom.classId, weakTopics)

    if (res.success && res.questions) {
      toast.success("New targeted Viva session ready!", { id: toastId })
      setReport(null)
      setSessionId(res.session?.id || res.sessionId || `viva-${Date.now()}`)
      const qList: VivaQuestionItem[] = res.questions.map((q) => ({
        id: q.id,
        sessionId: q.sessionId,
        order: q.order || 1,
        concept: q.concept || "Weak Concept Focus",
        questionText: q.questionText,
        difficulty: (q.difficulty as 'Basic' | 'Medium' | 'Advanced') || "Medium",
        isFollowUp: !!q.isFollowUp
      }))
      setQuestions(qList)
      setCurrentIdx(0)
      setTranscript("")
      speakQuestionAloud(qList[0].questionText)
    } else {
      toast.error("Failed to start retry session.", { id: toastId })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/15 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" /> AI Examiner • Adaptive Oral Viva
              </span>
              <span className="text-xs font-mono font-bold text-[#77716A]">
                {vivaState === 'VIVA_COMPLETED' ? "Viva Completed" : `Concepts Evaluated: ${questions.filter(q => q.transcript).length} / 5`}
              </span>
            </div>
            <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#8B7EC8]" /> Oral Assessment: {targetClassroom?.className || assignmentTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77716A]">
              Adaptive, voice-first conceptual defense grounded in your teacher&apos;s course materials.
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
                  Your teacher needs to upload course material before a classroom-based viva can begin.
                </p>
              </div>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs py-2 px-6 rounded-xl shadow-2xs cursor-pointer"
              >
                Back to Workspace
              </Button>
            </Card>

          /* 2. ACTIVE VIVA VOICE-FIRST EXAM SESSION */
          ) : vivaState !== 'VIVA_COMPLETED' ? (
            <div className="space-y-5 pt-3">
              {/* Status State Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  vivaState === 'EXAMINER_SPEAKING' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  vivaState === 'LISTENING' ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' :
                  vivaState === 'PROCESSING' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {vivaState === 'EXAMINER_SPEAKING' && "Examiner Speaking..."}
                  {vivaState === 'YOUR_TURN' && "Your Turn — Speak Your Answer"}
                  {vivaState === 'LISTENING' && "Listening to Voice Answer..."}
                  {vivaState === 'ANSWER_CAPTURED' && "Answer Captured — Ready to Submit"}
                  {vivaState === 'PROCESSING' && "Examiner Evaluating Context..."}
                  {vivaState === 'PREPARING' && "Preparing Examiner Prompt..."}
                </span>

                {currentQ?.isFollowUp && (
                  <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30">
                    Follow-Up Probing Question
                  </span>
                )}
              </div>

              {/* Examiner Question Card */}
              {currentQ && (
                <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                    <span className="text-xs font-mono font-bold text-[#8B7EC8]">
                      Turn {currentIdx + 1} • Concept: {currentQ.concept}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => speakQuestionAloud(currentQ.questionText)}
                      disabled={isSpeakingTts}
                      className="text-xs font-bold text-[#8B7EC8] border-[#8B7EC8] hover:bg-[#8B7EC8]/10 rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Replay Question
                    </Button>
                  </div>

                  <p className="text-base font-serif font-bold text-[#292724] leading-relaxed">
                    &quot;{currentQ.questionText}&quot;
                  </p>
                </Card>
              )}

              {/* Voice Microphone Controls (Zero Typing Input) */}
              <Card className="bg-white border border-[#E5DCD0] rounded-2xl p-5 space-y-4 text-center shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Voice Response Mode</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      micPermission === 'granted' ? 'bg-emerald-100 text-emerald-800' :
                      micPermission === 'denied' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      Mic: {micPermission}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#77716A]">Speak clearly into your microphone to answer the examiner.</p>
                </div>

                {/* Mic Error Banner */}
                {micError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-center justify-between">
                    <span>{micError}</span>
                    <Button size="sm" variant="outline" onClick={startRecording} className="text-xs font-bold rounded-xl border-red-300 text-red-800">
                      Enable Mic
                    </Button>
                  </div>
                )}

                {/* Recording Control Button */}
                <div className="flex justify-center items-center space-x-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={vivaState === 'PROCESSING' || vivaState === 'EXAMINER_SPEAKING'}
                      className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Mic className="w-5 h-5" /> Start Spoken Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md cursor-pointer flex items-center gap-2 animate-pulse"
                    >
                      <MicOff className="w-5 h-5" /> Stop & Capture Answer
                    </Button>
                  )}
                </div>

                {/* Captured Transcript Display (Read-Only Transparency) */}
                <div className="space-y-1 text-left bg-[#FFF9F1] p-3.5 rounded-xl border border-[#E5DCD0]">
                  <span className="text-[10px] font-bold text-[#77716A] uppercase block">Captured Speech Transcript:</span>
                  <p className="text-xs font-medium text-[#292724] min-h-[40px]">
                    {transcript || <span className="text-[#77716A] italic">Click &quot;Start Spoken Answer&quot; and speak aloud...</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTranscript("")
                      setVivaState('YOUR_TURN')
                    }}
                    disabled={!transcript}
                    className="text-xs font-bold rounded-xl border-[#E5DCD0] cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-record Answer
                  </Button>

                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={!transcript.trim() || vivaState === 'PROCESSING'}
                    className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    Submit Voice Answer & Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>

          /* 3. FINAL VIVA PERFORMANCE REPORT SCREEN (Matching Reference Layout) */
          ) : (
            <div className="space-y-6 pt-3">
              {/* OVERALL PERFORMANCE CARD */}
              <Card className="bg-white border-2 border-[#8B7EC8]/40 rounded-2xl p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#E5DCD0] pb-4">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-xs font-bold text-[#8B7EC8] uppercase tracking-wider">Official Viva Defense Report</span>
                    <h3 className="text-2xl font-serif font-black text-[#292724]">Overall Viva Performance</h3>
                    <p className="text-xs text-[#77716A] font-semibold">{report?.summary}</p>
                  </div>
                  <div className="p-4 bg-[#FFF9F1] border-2 border-[#8B7EC8] rounded-2xl text-center min-w-[140px]">
                    <span className="text-[10px] font-bold text-[#77716A] uppercase block">Overall Score</span>
                    <span className="text-3xl font-serif font-black text-[#E76F51]">{report?.overallScore} / 10</span>
                  </div>
                </div>

                {/* SKILL EVALUATION 5-DIMENSION BREAKDOWN */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Skill Evaluation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                    <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                      <span className="text-[10px] font-bold text-[#77716A] block">Conceptual</span>
                      <span className="text-base font-bold text-[#8B7EC8]">{report?.conceptualScore} / 10</span>
                    </div>
                    <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                      <span className="text-[10px] font-bold text-[#77716A] block">Correctness</span>
                      <span className="text-base font-bold text-[#75B798]">{report?.correctnessScore} / 10</span>
                    </div>
                    <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                      <span className="text-[10px] font-bold text-[#77716A] block">Reasoning</span>
                      <span className="text-base font-bold text-[#E76F51]">{report?.reasoningScore} / 10</span>
                    </div>
                    <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center">
                      <span className="text-[10px] font-bold text-[#77716A] block">Communication</span>
                      <span className="text-base font-bold text-[#8B7EC8]">{report?.communicationScore} / 10</span>
                    </div>
                    <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center col-span-2 md:col-span-1">
                      <span className="text-[10px] font-bold text-[#77716A] block">Delivery Fluency</span>
                      <span className="text-base font-bold text-amber-700">{report?.deliveryFluencyScore} / 10</span>
                    </div>
                  </div>
                </div>

                {/* CONCEPT MASTERY BADGES */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Concept Mastery</h4>
                  <div className="flex flex-wrap gap-2">
                    {report?.conceptMastery.map((cm, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between min-w-[180px] ${
                          cm.status === 'Strong'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : cm.status === 'Moderate'
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        }`}
                      >
                        <span>{cm.concept}</span>
                        <span className="font-mono text-xs font-bold ml-2">{cm.status} ({cm.score})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STRENGTHS & AREAS TO IMPROVE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                    <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Demonstrated Strengths
                    </h5>
                    <ul className="list-disc list-inside text-xs text-emerald-950 font-medium space-y-1">
                      {report?.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="space-y-1.5 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                    <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Areas to Improve
                    </h5>
                    <ul className="list-disc list-inside text-xs text-amber-950 font-medium space-y-1">
                      {report?.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>

                {/* RECOMMENDED NEXT STEPS */}
                <div className="p-4 bg-[#FFF9F1] border border-[#E5DCD0] rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-[#8B7EC8] uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#8B7EC8]" /> Recommended Revision Pathway
                  </h5>
                  <ul className="list-decimal list-inside text-xs text-[#292724] font-medium space-y-1">
                    {report?.recommendedNextSteps.map((step, i) => <li key={i}>{step}</li>)}
                  </ul>
                </div>
              </Card>

              {/* HIERARCHICAL QUESTION BREAKDOWN */}
              <div className="space-y-3">
                <h4 className="text-sm font-serif font-bold text-[#292724] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#8B7EC8]" /> Turn-by-Turn Question Breakdown & Transcripts
                </h4>

                {report?.questions.map((q, idx) => (
                  <Card key={q.id} className="p-4 bg-white border border-[#E5DCD0] rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                      <span className="text-xs font-mono font-bold text-[#E76F51]">
                        Q{idx + 1}. {q.concept} {q.isFollowUp ? "(Follow-Up Probing)" : "(Primary Concept)"}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#8B7EC8]">
                        Score: {q.score} / 10
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#292724]">&quot;{q.questionText}&quot;</p>

                    <div className="p-3 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] text-xs space-y-1">
                      <span className="font-bold text-[#77716A] uppercase text-[10px] block">Your Spoken Answer Transcript:</span>
                      <p className="text-[#292724] font-medium italic">&quot;{q.transcript || "No verbal answer captured"}&quot;</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <strong className="text-emerald-800 block text-[10px] uppercase">What You Explained Well:</strong>
                        <p className="text-emerald-950 font-medium">{q.whatExplainedWell || "Demonstrated core understanding."}</p>
                      </div>
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                        <strong className="text-amber-800 block text-[10px] uppercase">What Was Missing / Needs Improvement:</strong>
                        <p className="text-amber-950 font-medium">{q.whatWasMissing || "Expand on structural complexity."}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* ACTION BUTTONS FOOTER */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E5DCD0]">
                <Button
                  onClick={handleRetryWeakConcepts}
                  className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Retry Weak Concepts (New Targeted Viva)
                </Button>

                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-[#75B798] hover:bg-[#64a587] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-2xs cursor-pointer"
                >
                  Close & Return to Dashboard
                </Button>
              </div>
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
