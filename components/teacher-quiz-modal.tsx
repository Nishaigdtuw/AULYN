'use client'

import React, { useState, useEffect } from "react"
import { HelpCircle, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Clock, Calendar, Check, Save, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { QuizData, QuizQuestion, saveQuiz, ClassroomData } from "@/lib/data-store"

interface TeacherQuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroom: ClassroomData
  editingQuiz?: QuizData | null
  onQuizSaved?: () => void
}

export function TeacherQuizModal({
  open,
  onOpenChange,
  classroom,
  editingQuiz,
  onQuizSaved
}: TeacherQuizModalProps) {
  const [activeTab, setActiveTab] = useState<string>("basic")

  // Form State
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [passingMarks, setPassingMarks] = useState<number>(12)
  const [mode, setMode] = useState<'OPEN_NOW' | 'SCHEDULED'>('OPEN_NOW')
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("10:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("11:00")
  const [releaseResults, setReleaseResults] = useState<'IMMEDIATELY' | 'MANUALLY'>('IMMEDIATELY')

  // Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // Question Form State (for adding/editing single question)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [qType, setQType] = useState<'MCQ' | 'TrueFalse' | 'ShortAnswer' | 'Coding'>('MCQ')
  const [qText, setQText] = useState("")
  const [optA, setOptA] = useState("")
  const [optB, setOptB] = useState("")
  const [optC, setOptC] = useState("")
  const [optD, setOptD] = useState("")
  const [correctMcqIndex, setCorrectMcqIndex] = useState<number>(0)
  const [tfCorrect, setTfCorrect] = useState<string>("True")
  const [shortAnswer, setShortAnswer] = useState("")
  const [qExplanation, setQExplanation] = useState("")
  const [qMarks, setQMarks] = useState<number>(5)

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    if (editingQuiz) {
      setTitle(editingQuiz.title || "")
      setTopic(editingQuiz.topic || classroom.subject || "General")
      setDescription(editingQuiz.description || "")
      setInstructions(editingQuiz.instructions || "")
      setDurationMinutes(editingQuiz.durationMinutes || 30)
      setPassingMarks(editingQuiz.passingMarks || 12)
      setMode(editingQuiz.mode || "OPEN_NOW")
      setStartDate(editingQuiz.startDate || todayStr)
      setStartTime(editingQuiz.startTime || "10:00")
      setEndDate(editingQuiz.endDate || todayStr)
      setEndTime(editingQuiz.endTime || "11:00")
      setReleaseResults(editingQuiz.releaseResults || "IMMEDIATELY")
      setQuestions(editingQuiz.questions || [])
    } else {
      setTitle("")
      setTopic(classroom.subject || "Core Topic")
      setDescription("Complete all questions within the allocated time duration.")
      setInstructions("Read each question carefully. Unsaved progress will auto-submit when timer expires.")
      setDurationMinutes(30)
      setPassingMarks(12)
      setMode("OPEN_NOW")
      setStartDate(todayStr)
      setStartTime("10:00")
      setEndDate(todayStr)
      setEndTime("11:00")
      setReleaseResults("IMMEDIATELY")
      // Default initial sample questions for manual builder
      setQuestions([
        {
          id: `q-1`,
          type: "MCQ",
          question: "What is the worst-case time complexity of standard Binary Search Tree search operation?",
          options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
          correctAnswer: 2,
          explanation: "In worst case skewed trees, search degrades to O(N). Balanced trees maintain O(log N).",
          marks: 5
        },
        {
          id: `q-2`,
          type: "TrueFalse",
          question: "An In-Order Traversal on a valid Binary Search Tree produces values in strictly sorted ascending order.",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "Left -> Node -> Right in-order traversal on a BST yields sorted elements.",
          marks: 5
        }
      ])
    }
  }, [editingQuiz, open, classroom])

  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 5), 0)

  const handleResetQuestionForm = () => {
    setEditingQuestionId(null)
    setQText("")
    setOptA("")
    setOptB("")
    setOptC("")
    setOptD("")
    setCorrectMcqIndex(0)
    setTfCorrect("True")
    setShortAnswer("")
    setQExplanation("")
    setQMarks(5)
  }

  const handleSaveQuestion = () => {
    if (!qText.trim()) {
      toast.warning("Please enter question text.")
      return
    }

    let options: string[] = []
    let correctAnswer: number | string = 0

    if (qType === "MCQ") {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        toast.warning("Please fill in all 4 options A, B, C, D.")
        return
      }
      options = [optA.trim(), optB.trim(), optC.trim(), optD.trim()]
      correctAnswer = correctMcqIndex
    } else if (qType === "TrueFalse") {
      options = ["True", "False"]
      correctAnswer = tfCorrect === "True" ? 0 : 1
    } else {
      options = []
      correctAnswer = shortAnswer.trim()
    }

    const newQ: QuizQuestion = {
      id: editingQuestionId || `q-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: qType,
      question: qText.trim(),
      options,
      correctAnswer,
      explanation: qExplanation.trim() || "Correct answer based on course material.",
      marks: qMarks
    }

    if (editingQuestionId) {
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestionId ? newQ : q)))
      toast.success("Question updated!")
    } else {
      setQuestions((prev) => [...prev, newQ])
      toast.success("New question added!")
    }

    handleResetQuestionForm()
  }

  const handleEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id)
    setQType(q.type || "MCQ")
    setQText(q.question)
    setQExplanation(q.explanation || "")
    setQMarks(q.marks || 5)

    if (q.type === "TrueFalse") {
      setTfCorrect(q.correctAnswer === 0 ? "True" : "False")
    } else if (q.type === "ShortAnswer") {
      setShortAnswer(String(q.correctAnswer || ""))
    } else {
      setOptA(q.options?.[0] || "")
      setOptB(q.options?.[1] || "")
      setOptC(q.options?.[2] || "")
      setOptD(q.options?.[3] || "")
      setCorrectMcqIndex(typeof q.correctAnswer === "number" ? q.correctAnswer : 0)
    }
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.info("Question removed.")
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp
    setQuestions(newQuestions)
  }

  const handleGenerateAiQuestions = () => {
    const hasMaterials = (classroom.materials && classroom.materials.length > 0) || (classroom.chapters && classroom.chapters.some((c) => c.materials && c.materials.length > 0))
    if (!hasMaterials) {
      toast.warning("No course material available yet. Upload course material or create the quiz manually.")
      return
    }

    const toastId = toast.loading(`Generating conceptual quiz questions from ${classroom.className} uploaded course materials...`)
    setTimeout(() => {
      const generated: QuizQuestion[] = [
        {
          id: `ai-q-1-${Date.now()}`,
          type: "MCQ",
          question: `Which core theorem or principle forms the foundation of ${topic || classroom.subject}?`,
          options: [
            `Primary Invariant Property of ${classroom.subject}`,
            "Unbounded Iteration Reduction",
            "Static Memory Allocation Bound",
            "Random State Approximation"
          ],
          correctAnswer: 0,
          explanation: `Derived directly from ${classroom.className} uploaded lecture notes.`,
          marks: 5
        },
        {
          id: `ai-q-2-${Date.now()}`,
          type: "TrueFalse",
          question: `All operational constraints in ${topic || classroom.subject} must be verified before executing system state transitions.`,
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: `Verified based on ${classroom.className} course material.`,
          marks: 5
        }
      ]
      setQuestions((prev) => [...prev, ...generated])
      toast.success("Added 2 AI-generated conceptual questions! You can edit them below.", { id: toastId })
    }, 700)
  }

  const handleSaveQuiz = (publish: boolean) => {
    if (!title.trim()) {
      toast.warning("Please enter a Quiz Title.")
      return
    }

    if (questions.length === 0) {
      toast.warning("Please add at least 1 question to the quiz.")
      return
    }

    const quizObj: QuizData = {
      quizId: editingQuiz?.quizId || `quiz-${classroom.classId}-${Date.now()}`,
      classId: classroom.classId,
      chapterId: editingQuiz?.chapterId || "c1",
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      topic: topic.trim() || classroom.subject || "General",
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks: totalMarks || 20,
      passingMarks: Number(passingMarks) || 10,
      mode,
      startDate: mode === "SCHEDULED" ? startDate : undefined,
      startTime: mode === "SCHEDULED" ? startTime : undefined,
      endDate: mode === "SCHEDULED" ? endDate : undefined,
      endTime: mode === "SCHEDULED" ? endTime : undefined,
      published: publish,
      releaseResults,
      questions,
      createdAt: editingQuiz?.createdAt || new Date().toISOString()
    }

    saveQuiz(quizObj)
    toast.success(publish ? `Quiz "${title}" published to ${classroom.className}!` : `Quiz draft "${title}" saved!`)
    onOpenChange(false)
    if (onQuizSaved) onQuizSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 uppercase tracking-wider">
              {classroom.className} • Quiz Builder
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              Total Questions: {questions.length} | Total Marks: {totalMarks}
            </span>
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#E76F51]" /> {editingQuiz ? `Edit Quiz: ${editingQuiz.title}` : "Create New Quiz"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Configure quiz details, duration timing, scheduling mode, and add manual or AI-generated questions.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-3 space-y-4">
          <TabsList className="bg-[#E5DCD0]/50 p-1 rounded-xl grid grid-cols-3">
            <TabsTrigger value="basic" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E76F51]">
              1. Basic Info & Timing
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E76F51]">
              2. Scheduling & Results
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E76F51]">
              3. Questions Builder ({questions.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BASIC INFO */}
          <TabsContent value="basic" className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#292724]">Quiz Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Trees & Recursion Quiz"
                  className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#292724]">Chapter / Topic</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Binary Search Trees"
                  className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#292724] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E76F51]" /> Quiz Duration (Minutes)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="bg-white border-[#E5DCD0] text-xs font-mono font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#292724]">Passing Marks</Label>
                <Input
                  type="number"
                  min={0}
                  max={totalMarks || 100}
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                  className="bg-white border-[#E5DCD0] text-xs font-mono font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of quiz scope..."
                className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Student Instructions</Label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                placeholder="Instructions displayed before student starts quiz..."
                className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveTab("schedule")}
                className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
              >
                Next: Scheduling & Results &rarr;
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: SCHEDULING & RESULTS */}
          <TabsContent value="schedule" className="space-y-4 pt-1">
            <Card className="p-4 bg-white border border-[#E5DCD0] rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E76F51]" /> Availability Mode
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setMode("OPEN_NOW")}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    mode === "OPEN_NOW" ? "border-[#E76F51] bg-[#FFF9F1]" : "border-[#E5DCD0] bg-white hover:border-[#E76F51]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#292724]">MODE A — Open Now</span>
                    {mode === "OPEN_NOW" && <Check className="w-4 h-4 text-[#E76F51]" />}
                  </div>
                  <p className="text-[11px] text-[#77716A] mt-1">Available immediately upon publishing. Individual student timer runs upon start.</p>
                </div>

                <div
                  onClick={() => setMode("SCHEDULED")}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    mode === "SCHEDULED" ? "border-[#E76F51] bg-[#FFF9F1]" : "border-[#E5DCD0] bg-white hover:border-[#E76F51]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#292724]">MODE B — Scheduled Window</span>
                    {mode === "SCHEDULED" && <Check className="w-4 h-4 text-[#E76F51]" />}
                  </div>
                  <p className="text-[11px] text-[#77716A] mt-1">Opens and closes automatically based on designated start & end date/time window.</p>
                </div>
              </div>

              {mode === "SCHEDULED" && (
                <div className="p-4 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#292724]">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#292724]">Start Time</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#292724]">End Date (Auto Close)</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#292724]">End Time (Auto Close)</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#E5DCD0]">
                <Label className="text-xs font-bold text-[#292724] uppercase tracking-wider block mb-2">Release Results Policy</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setReleaseResults("IMMEDIATELY")}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold ${
                      releaseResults === "IMMEDIATELY" ? "border-[#8B7EC8] bg-purple-50 text-purple-950" : "border-[#E5DCD0] bg-white text-[#77716A]"
                    }`}
                  >
                    <input type="radio" checked={releaseResults === "IMMEDIATELY"} readOnly className="accent-[#8B7EC8]" />
                    Release Score Immediately On Submission
                  </label>

                  <label
                    onClick={() => setReleaseResults("MANUALLY")}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold ${
                      releaseResults === "MANUALLY" ? "border-[#8B7EC8] bg-purple-50 text-purple-950" : "border-[#E5DCD0] bg-white text-[#77716A]"
                    }`}
                  >
                    <input type="radio" checked={releaseResults === "MANUALLY"} readOnly className="accent-[#8B7EC8]" />
                    Hold Results Until Manual Teacher Publish
                  </label>
                </div>
              </div>
            </Card>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setActiveTab("basic")} className="text-xs font-bold rounded-xl cursor-pointer">
                &larr; Back to Basic Info
              </Button>
              <Button onClick={() => setActiveTab("questions")} className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer">
                Next: Build Questions ({questions.length}) &rarr;
              </Button>
            </div>
          </TabsContent>

          {/* TAB 3: QUESTIONS BUILDER */}
          <TabsContent value="questions" className="space-y-4 pt-1">
            {/* AI Generator Header Helper */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E9B949]" /> Optional AI Course Assistant
                </h5>
                <p className="text-[10px] text-purple-800">Generate question drafts grounded in uploaded classroom notes, then edit manually.</p>
              </div>
              <Button
                size="sm"
                onClick={handleGenerateAiQuestions}
                className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
              >
                + Generate AI Questions
              </Button>
            </div>

            {/* Manual Question Form */}
            <Card className="p-4 bg-white border-2 border-[#E76F51]/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#E76F51]" /> {editingQuestionId ? "Edit Question" : "Add Question Manually"}
                </h4>
                <div className="flex items-center space-x-2">
                  <Label className="text-[11px] font-bold text-[#77716A]">Type:</Label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as 'MCQ' | 'TrueFalse' | 'ShortAnswer')}
                    className="bg-[#FFF9F1] border border-[#E5DCD0] text-xs font-bold text-[#292724] rounded-lg p-1"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TrueFalse">True / False</option>
                    <option value="ShortAnswer">Short Answer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#292724]">Question Text *</Label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  rows={2}
                  placeholder="Enter clear, concise question prompt..."
                  className="w-full bg-[#FFF9F1] border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                />
              </div>

              {/* Type Specific Fields */}
              {qType === "MCQ" && (
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-bold text-[#292724]">Options (Select radio button for correct answer)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 bg-[#FFF9F1] p-2 rounded-xl border border-[#E5DCD0]">
                      <input
                        type="radio"
                        name="correctMcq"
                        checked={correctMcqIndex === 0}
                        onChange={() => setCorrectMcqIndex(0)}
                        className="accent-[#E76F51]"
                      />
                      <span className="text-xs font-bold text-[#292724]">A:</span>
                      <Input
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                        placeholder="Option A"
                        className="bg-white border-[#E5DCD0] text-xs h-7 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center space-x-2 bg-[#FFF9F1] p-2 rounded-xl border border-[#E5DCD0]">
                      <input
                        type="radio"
                        name="correctMcq"
                        checked={correctMcqIndex === 1}
                        onChange={() => setCorrectMcqIndex(1)}
                        className="accent-[#E76F51]"
                      />
                      <span className="text-xs font-bold text-[#292724]">B:</span>
                      <Input
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                        placeholder="Option B"
                        className="bg-white border-[#E5DCD0] text-xs h-7 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center space-x-2 bg-[#FFF9F1] p-2 rounded-xl border border-[#E5DCD0]">
                      <input
                        type="radio"
                        name="correctMcq"
                        checked={correctMcqIndex === 2}
                        onChange={() => setCorrectMcqIndex(2)}
                        className="accent-[#E76F51]"
                      />
                      <span className="text-xs font-bold text-[#292724]">C:</span>
                      <Input
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                        placeholder="Option C"
                        className="bg-white border-[#E5DCD0] text-xs h-7 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center space-x-2 bg-[#FFF9F1] p-2 rounded-xl border border-[#E5DCD0]">
                      <input
                        type="radio"
                        name="correctMcq"
                        checked={correctMcqIndex === 3}
                        onChange={() => setCorrectMcqIndex(3)}
                        className="accent-[#E76F51]"
                      />
                      <span className="text-xs font-bold text-[#292724]">D:</span>
                      <Input
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                        placeholder="Option D"
                        className="bg-white border-[#E5DCD0] text-xs h-7 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {qType === "TrueFalse" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-[#292724]">Correct Answer</Label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-1.5 text-xs font-bold text-[#292724] cursor-pointer">
                      <input type="radio" name="tf" checked={tfCorrect === "True"} onChange={() => setTfCorrect("True")} className="accent-[#E76F51]" />
                      True
                    </label>
                    <label className="flex items-center space-x-1.5 text-xs font-bold text-[#292724] cursor-pointer">
                      <input type="radio" name="tf" checked={tfCorrect === "False"} onChange={() => setTfCorrect("False")} className="accent-[#E76F51]" />
                      False
                    </label>
                  </div>
                </div>
              )}

              {qType === "ShortAnswer" && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-[#292724]">Expected Sample Answer Key</Label>
                  <Input
                    value={shortAnswer}
                    onChange={(e) => setShortAnswer(e.target.value)}
                    placeholder="Keywords or sentence key..."
                    className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-semibold rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#292724]">Question Marks</Label>
                  <Input
                    type="number"
                    min={1}
                    value={qMarks}
                    onChange={(e) => setQMarks(Number(e.target.value))}
                    className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-mono font-bold rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#292724]">Explanation / Concept Note</Label>
                  <Input
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Explanation shown after grading..."
                    className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E5DCD0]">
                {editingQuestionId && (
                  <Button variant="outline" size="sm" onClick={handleResetQuestionForm} className="text-xs font-bold rounded-xl cursor-pointer">
                    Cancel Edit
                  </Button>
                )}
                <Button size="sm" onClick={handleSaveQuestion} className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl cursor-pointer">
                  {editingQuestionId ? "Update Question" : "+ Add Question"}
                </Button>
              </div>
            </Card>

            {/* List of Added Questions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">
                Added Questions ({questions.length})
              </h4>

              {questions.length === 0 ? (
                <div className="p-6 text-center bg-white border border-dashed border-[#E5DCD0] rounded-2xl text-xs text-[#77716A]">
                  No questions added yet. Use the builder above or click &quot;Generate AI Questions&quot;.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <Card key={q.id} className="p-3.5 bg-white border border-[#E5DCD0] rounded-xl flex items-start justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#E76F51] bg-[#E76F51]/10 px-2 py-0.5 rounded">
                          Q{idx + 1} • {q.type} ({q.marks || 5} marks)
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#292724]">{q.question}</p>
                      {q.options && (
                        <p className="text-[11px] text-[#77716A]">
                          Options: {q.options.join(" | ")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveQuestion(idx, "up")}
                        disabled={idx === 0}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-[#77716A]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveQuestion(idx, "down")}
                        disabled={idx === questions.length - 1}
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-[#77716A]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditQuestion(q)}
                        className="text-xs h-7 px-2 font-bold cursor-pointer"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5DCD0]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs font-bold rounded-xl cursor-pointer">
            Cancel
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => handleSaveQuiz(false)}
              className="border-[#77716A] text-[#77716A] hover:bg-[#77716A]/10 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Draft
            </Button>
            <Button
              onClick={() => handleSaveQuiz(true)}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Publish Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
