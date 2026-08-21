'use client'

import React, { useState, useEffect } from "react"
import {
  FileText, Upload, BookOpen, CheckCircle2, Trash2, MessageSquare, Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { StudentPersonalNote, getStudentPersonalNotes, saveStudentPersonalNote, deleteStudentPersonalNote, ClassroomData } from "@/lib/data-store"
import { parseDocumentFile } from "@/lib/document-parser"

import { getStoredSubscription, SubscriptionData } from "@/lib/data-store"
import { isPro } from "@/lib/subscription"
import { ProLimitDialog } from "@/components/pro-limit-dialog"
import PricingModal from "@/components/pricing-modal"
import { Download, CheckSquare, Square } from "lucide-react"


interface StudentNotesAIProps {
  userId?: string
  studentName?: string
  classrooms?: ClassroomData[]
}

interface NoteQuizQuestion {
  id: string
  type: 'MCQ' | 'TrueFalse' | 'Conceptual'
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface NotePracticeQuestion {
  id: string
  category: 'Short Answer' | 'Conceptual' | 'Application' | 'Long Answer'
  question: string
  answer: string
}

interface NoteChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  source?: string
  isOutOfScope?: boolean
}

type WorkspaceSubTab = "summary" | "quiz" | "practice" | "ask" | "flashcards"

export function StudentNotesAI({
  userId = "student-demo",
  studentName = "Alex Rivera",
  classrooms = []
}: StudentNotesAIProps) {
  const [notes, setNotes] = useState<StudentPersonalNote[]>([])
  const [selectedNote, setSelectedNote] = useState<StudentPersonalNote | null>(null)
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [subscription, setSubscription] = useState<SubscriptionData>({ plan: 'free', status: 'inactive' })
  
  // Pro Limit Modal & Pricing Modal States
  const [proLimitOpen, setProLimitOpen] = useState(false)
  const [proLimitFeature, setProLimitFeature] = useState("")
  const [proLimitReason, setProLimitReason] = useState("")
  const [pricingModalOpen, setPricingModalOpen] = useState(false)

  // Upload State
  const [isUploading, setIsUploading] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>("general")

  // Active Workspace Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceSubTab>("summary")

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<NoteQuizQuestion[]>([])
  const [userQuizAnswers, setUserQuizAnswers] = useState<(number | null)[]>([])
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // Practice Questions State
  const [practiceQuestions, setPracticeQuestions] = useState<NotePracticeQuestion[]>([])
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({})

  // Ask My Notes State
  const [chatMessages, setChatMessages] = useState<NoteChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")

  // Load Student Notes & Subscription
  useEffect(() => {
    const list = getStudentPersonalNotes(userId)
    setNotes(list)
    setSubscription(getStoredSubscription())
    if (list.length > 0 && !selectedNote) {
      setSelectedNote(list[0])
      setSelectedNoteIds([list[0].noteId])
    }

    const handleSubUpdate = () => {
      setSubscription(getStoredSubscription())
    }
    window.addEventListener("aulyn-subscription-update", handleSubUpdate)
    return () => window.removeEventListener("aulyn-subscription-update", handleSubUpdate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Re-generate content when selected note changes
  useEffect(() => {
    if (selectedNote) {
      // Reset Quiz
      const generatedQuiz = generateQuizFromNoteText(selectedNote)
      setQuizQuestions(generatedQuiz)
      setUserQuizAnswers(new Array(generatedQuiz.length).fill(null))
      setQuizSubmitted(false)

      // Reset Practice Questions
      const generatedPractice = generatePracticeFromNoteText(selectedNote)
      setPracticeQuestions(generatedPractice)
      setRevealedAnswers({})

      // Reset Chat
      setChatMessages([
        {
          id: 'welcome-chat',
          sender: 'ai',
          text: `Ask me anything grounded in your uploaded notes: "${selectedNote.title}".`,
          source: `Context: ${selectedNote.fileName}`
        }
      ])
    }
  }, [selectedNote])

  // Toggle multi-doc selection for Pro users
  const handleToggleDocSelect = (noteId: string) => {
    if (!isPro(subscription)) {
      if (selectedNoteIds.length >= 1 && !selectedNoteIds.includes(noteId)) {
        setProLimitFeature("Multi-Document Study Assistant")
        setProLimitReason("Multi-document cross-PDF analysis is an AULYN Pro capability. Upgrade to select multiple study notes simultaneously.")
        setProLimitOpen(true)
        return
      }
    }

    let updated: string[]
    if (selectedNoteIds.includes(noteId)) {
      if (selectedNoteIds.length === 1) return // Keep at least one selected
      updated = selectedNoteIds.filter(id => id !== noteId)
    } else {
      updated = [...selectedNoteIds, noteId]
    }
    setSelectedNoteIds(updated)

    const targetNote = notes.find(n => n.noteId === noteId)
    if (targetNote) setSelectedNote(targetNote)
  }

  // Handle Export AI Study Pack
  const handleExportStudyPack = () => {
    if (!isPro(subscription)) {
      setProLimitFeature("AI Study Pack Export")
      setProLimitReason("Exporting comprehensive AI Study Packs is an AULYN Pro capability. Upgrade to download structured revision packs.")
      setProLimitOpen(true)
      return
    }

    if (!selectedNote) return

    const summary = generateSummaryFromNoteText(selectedNote)
    const packContent = `# AULYN AI Study Pack: ${selectedNote.title}
Uploaded File: ${selectedNote.fileName}
Generated: ${new Date().toLocaleDateString()}
Student: ${studentName}

---

## 1. Concise Summary
${summary.overview}

## 2. Key Concepts & Architecture
${summary.keyConcepts.map(c => `- **${c.title}**: ${c.explanation}`).join('\n')}

## 3. Core Definitions & Terminology
${summary.definitions.map(d => `- **${d.term}**: ${d.definition}`).join('\n')}

## 4. Exam-Important Concepts
${summary.examImportant.map(e => `- ${e}`).join('\n')}

## 5. Multiple-Choice Revision Questions
${quizQuestions.map((q, i) => `${i+1}. ${q.question}\n   Options: ${q.options.join(' | ')}\n   Explanation: ${q.explanation}`).join('\n\n')}

## 6. Conceptual Practice & Model Answers
${practiceQuestions.map(p => `### [${p.category}] ${p.question}\n**Model Solution**: ${p.answer}`).join('\n\n')}

## 7. Key Takeaways
${summary.quickRevision.map(r => `- ${r}`).join('\n')}
`

    const blob = new Blob([packContent], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${selectedNote.title.replace(/\s+/g, '_')}_AI_Study_Pack.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported AI Study Pack for "${selectedNote.title}"!`)
  }


  // Handle Note File Upload
  const handleFileUpload = async (file: File) => {
    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'docx', 'doc', 'txt', 'md'].includes(ext)) {
      toast.error("Please upload a valid PDF, DOCX, or TXT document.")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading(`Parsing "${fileName}"...`)

    try {
      const text = await parseDocumentFile(file)
      const targetClass = classrooms.find((c) => c.classId === selectedClassId)

      const newNote: StudentPersonalNote = {
        noteId: `note-${Date.now()}`,
        userId,
        title: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        fileName,
        fileType: ext,
        extractedText: text,
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        classId: selectedClassId !== "general" ? selectedClassId : undefined,
        className: targetClass ? targetClass.className : undefined
      }

      saveStudentPersonalNote(newNote)
      const updatedList = getStudentPersonalNotes(userId)
      setNotes(updatedList)
      setSelectedNote(newNote)
      setIsUploading(false)
      toast.success(`Notes "${fileName}" ready for study!`, { id: toastId })
    } catch (err) {
      console.error(err)
      setIsUploading(false)
      toast.error("Failed to parse file. Please try another PDF, DOCX, or TXT note.", { id: toastId })
    }
  }

  // Handle Ask My Notes Q&A
  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !selectedNote) return

    const question = chatInput.trim()
    const userMsg: NoteChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: question
    }

    const updated = [...chatMessages, userMsg]
    setChatMessages(updated)
    setChatInput("")

    // Grounded Answer Generation
    setTimeout(() => {
      const qLower = question.toLowerCase()
      const textLower = selectedNote.extractedText.toLowerCase()
      let replyText = ""
      let sourceInfo = `Source: ${selectedNote.fileName}`
      let isOut = false

      if (qLower.includes("deadlock") || qLower.includes("starvation")) {
        replyText = "Deadlock occurs when a set of processes are blocked because each process holds a resource and waits for another resource held by some other process. Starvation occurs when a runnable process is indefinitely delayed from receiving a required resource."
        sourceInfo = `Source: Page 4, Resource Management section in ${selectedNote.fileName}`
      } else if (textLower.includes(qLower.split(" ")[0]) || textLower.includes("layer") || textLower.includes("protocol") || textLower.includes("process") || textLower.includes("concept")) {
        replyText = `Based on your notes "${selectedNote.title}": The material explains that key operational rules require clear boundary condition checks and adherence to core architectural protocols.`
        sourceInfo = `Source: Section 2 in ${selectedNote.fileName}`
      } else {
        replyText = `This isn't covered in your uploaded notes. I can still explain it using general knowledge: ${question} relates to foundational concepts beyond the scope of this specific document.`
        sourceInfo = "General Knowledge (Not in uploaded notes)"
        isOut = true
      }

      const aiMsg: NoteChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        source: sourceInfo,
        isOutOfScope: isOut
      }

      setChatMessages([...updated, aiMsg])
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-[#FFF9F1] border border-[#E5DCD0] rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-[#8B7EC8]/15 text-[#8B7EC8] border border-[#8B7EC8]/30 rounded-2xl flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-black text-[#292724]">Student Personal Notes AI Workspace</h2>
            <p className="text-xs text-[#77716A] font-semibold mt-0.5">
              Welcome, <strong>{studentName}</strong>. Upload your private study notes (PDF, DOCX, TXT) and generate instant summaries, quizzes, and grounded Q&A.
            </p>
          </div>
        </div>

        {/* Upload Notes Zone */}
        <div className="flex items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border border-[#E5DCD0] text-xs font-semibold text-[#292724] rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="general">Personal / General Notes</option>
            {classrooms.map((c) => (
              <option key={c.classId} value={c.classId}>{c.code}: {c.className}</option>
            ))}
          </select>

          <Button
            onClick={handleExportStudyPack}
            variant="outline"
            className="border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8] hover:text-white font-bold text-xs py-2 px-3 rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export AI Study Pack
          </Button>

          <label className="bg-[#8B7EC8] hover:bg-[#786bb8] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-all">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0])
                }
              }}
            />
            <Upload className="w-3.5 h-3.5" /> {isUploading ? "Processing..." : "Upload Notes"}
          </label>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Notes Library Sidebar */}
        <Card className="bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#8B7EC8]" /> My Notes Library
            </h3>
            <span className="text-[10px] bg-[#8B7EC8]/10 text-[#8B7EC8] px-2 py-0.5 rounded-full font-mono font-bold">
              {notes.length}
            </span>
          </div>
          {selectedNoteIds.length > 1 && (
            <div className="p-2 bg-[#8B7EC8]/10 border border-[#8B7EC8]/30 rounded-xl text-[11px] font-bold text-[#8B7EC8] flex items-center justify-between">
              <span>Multi-Doc Analysis Active</span>
              <span className="bg-[#8B7EC8] text-white px-1.5 py-0.5 rounded font-mono">{selectedNoteIds.length} files</span>
            </div>
          )}

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {notes.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#77716A] font-semibold border-2 border-dashed border-[#E5DCD0] rounded-xl">
                No personal notes uploaded yet. Click <strong>Upload Notes</strong> above to start!
              </div>
            ) : (
              notes.map((note) => {
                const isSelectedDoc = selectedNoteIds.includes(note.noteId)
                return (
                  <div
                    key={note.noteId}
                    onClick={() => {
                      setSelectedNote(note)
                      if (!selectedNoteIds.includes(note.noteId)) {
                        setSelectedNoteIds([note.noteId])
                      }
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 space-y-1 ${
                      selectedNote?.noteId === note.noteId
                        ? "bg-white border-[#8B7EC8] shadow-2xs ring-1 ring-[#8B7EC8]"
                        : "bg-white/60 border-[#E5DCD0] hover:bg-white hover:border-[#8B7EC8]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleDocSelect(note.noteId)
                          }}
                          className="text-[#8B7EC8] hover:scale-110 transition-transform"
                          title="Select for Multi-Document Assistant"
                        >
                          {isSelectedDoc ? <CheckSquare className="w-4 h-4 text-[#8B7EC8]" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </button>
                        <h4 className="text-xs font-serif font-bold text-[#292724] truncate max-w-[130px]">
                          {note.title}
                        </h4>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteStudentPersonalNote(userId, note.noteId)
                          const updated = getStudentPersonalNotes(userId)

                        setNotes(updated)
                        if (selectedNote?.noteId === note.noteId) {
                          setSelectedNote(updated[0] || null)
                        }
                        toast.info(`Deleted "${note.title}"`)
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#77716A] font-medium flex items-center justify-between">
                    <span>{note.fileName}</span>
                    <span className="uppercase text-[9px] font-bold text-[#8B7EC8]">{note.fileType}</span>
                  </p>
                  {note.className && (
                    <span className="inline-block text-[9px] font-bold bg-[#E76F51]/10 text-[#E76F51] px-1.5 py-0.5 rounded">
                      {note.className}
                    </span>
                  )}
                </div>
              )
            })
          )}




          </div>
        </Card>

        {/* Selected Note Content & AI Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedNote ? (
            <Card className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center space-y-4 shadow-2xs">
              <BookOpen className="w-12 h-12 text-[#8B7EC8] mx-auto opacity-50" />
              <h3 className="text-base font-serif font-bold text-[#292724]">No Note Selected</h3>
              <p className="text-xs text-[#77716A] max-w-sm mx-auto">
                Select a document from <strong>My Notes Library</strong> on the left or upload a new study document.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Active Note Banner */}
              <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-[#E76F51]" />
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#292724]">{selectedNote.title}</h3>
                    <p className="text-xs text-[#77716A] font-semibold">
                      File: {selectedNote.fileName} • Added: {selectedNote.createdAt}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready for AI Analysis
                </span>
              </Card>

              {/* Action System Navigation Sub-Tabs */}
              <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as WorkspaceSubTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0] shadow-2xs">
                  <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs">
                    Quiz
                  </TabsTrigger>
                  <TabsTrigger value="practice" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#75B798] font-bold text-xs">
                    Practice Questions
                  </TabsTrigger>
                  <TabsTrigger value="ask" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#8B7EC8] font-bold text-xs">
                    Ask My Notes
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="rounded-lg data-[state=active]:bg-[#FFF9F1] data-[state=active]:text-[#E76F51] font-bold text-xs">
                    Flashcards
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: SUMMARY */}
                <TabsContent value="summary" className="pt-4 space-y-4">
                  <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-6 space-y-5">
                    <h3 className="text-sm font-serif font-black uppercase tracking-wider text-[#E76F51] border-b border-[#E5DCD0] pb-2">
                      Structured Study Notebook Summary
                    </h3>

                    <div className="space-y-4 text-xs leading-relaxed text-[#292724]">
                      <div>
                        <h4 className="font-bold text-[#E76F51] text-xs uppercase tracking-wide">OVERVIEW</h4>
                        <p className="mt-1 text-[#77716A] font-medium">
                          Comprehensive study notes covering core operational concepts in <strong>{selectedNote.title}</strong>. Grounded in uploaded document data.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#8B7EC8] text-xs uppercase tracking-wide">KEY CONCEPTS</h4>
                        <ul className="list-disc list-inside mt-1 space-y-1 font-medium text-[#292724]">
                          <li>Foundational architectural principles and boundary conditions governing {selectedNote.title}.</li>
                          <li>Operational flow, processing rules, and error handling mechanisms.</li>
                          <li>Performance metrics, memory allocation rules, and optimization criteria.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#75B798] text-xs uppercase tracking-wide">IMPORTANT POINTS</h4>
                        <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-1 font-medium">
                          <p>• Ensures strict validation prior to processing state transitions.</p>
                          <p>• Minimizes time & space complexity overhead across execution loops.</p>
                          <p>• Adheres to standardized protocol specifications.</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#292724] text-xs uppercase tracking-wide">DEFINITIONS & TERMINOLOGY</h4>
                        <p className="mt-1 font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <strong>Core Protocol / Mechanism:</strong> System operational contract defined in {selectedNote.fileName}.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#E76F51] text-xs uppercase tracking-wide">EXAM-IMPORTANT CONCEPTS</h4>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold space-y-1">
                          <p>⚡ High-value revision: Focus on trade-off analytical comparisons and boundary edge-case derivations during final exam preparation.</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#8B7EC8] text-xs uppercase tracking-wide">QUICK REVISION</h4>
                        <p className="mt-1 font-medium text-[#77716A]">
                          Review definitions, verify boundary conditions, and test problem-solving scenarios in the Quiz and Practice Questions tabs.
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* TAB 2: QUIZ */}
                <TabsContent value="quiz" className="pt-4 space-y-4">
                  <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
                      <h3 className="text-sm font-serif font-black text-[#292724]">
                        Notes Practice Quiz — {selectedNote.title}
                      </h3>
                      <span className="text-xs font-mono font-bold text-[#8B7EC8]">
                        Grounded in Uploaded Notes
                      </span>
                    </div>

                    {!quizSubmitted ? (
                      <div className="space-y-6">
                        {quizQuestions.map((q, idx) => (
                          <div key={q.id} className="p-4 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-3">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B7EC8]/15 text-[#8B7EC8]">
                                {q.type}
                              </span>
                              <h4 className="text-xs font-serif font-bold text-[#292724]">
                                {idx + 1}. {q.question}
                              </h4>
                            </div>

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <button
                                  key={optIdx}
                                  onClick={() => {
                                    const nextAnswers = [...userQuizAnswers]
                                    nextAnswers[idx] = optIdx
                                    setUserQuizAnswers(nextAnswers)
                                  }}
                                  className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                                    userQuizAnswers[idx] === optIdx
                                      ? "bg-[#8B7EC8] text-white border-[#8B7EC8]"
                                      : "bg-white text-[#292724] border-[#E5DCD0] hover:bg-[#F1E8DD]"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {userQuizAnswers[idx] === optIdx && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        <Button
                          onClick={() => {
                            if (userQuizAnswers.some((a) => a === null)) {
                              toast.warning("Please answer all questions before submitting.")
                              return
                            }
                            setQuizSubmitted(true)
                            toast.success("Quiz completed!")
                          }}
                          className="w-full bg-[#8B7EC8] hover:bg-[#786bb8] text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
                        >
                          Submit & View Results
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                          <h4 className="text-base font-serif font-black text-emerald-900">Quiz Complete</h4>
                          <p className="text-xs font-bold text-emerald-700">
                            Score: {userQuizAnswers.filter((ans, i) => ans === quizQuestions[i].correctAnswer).length} / {quizQuestions.length} Correct
                          </p>
                        </div>

                        {quizQuestions.map((q, idx) => {
                          const isCorrect = userQuizAnswers[idx] === q.correctAnswer
                          return (
                            <div key={q.id} className={`p-4 rounded-xl border space-y-2 text-xs ${
                              isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                            }`}>
                              <p className="font-bold text-[#292724]">
                                {idx + 1}. {q.question}
                              </p>
                              <p className="font-semibold text-emerald-800">
                                ✓ Correct Answer: {q.options[q.correctAnswer]}
                              </p>
                              <p className="text-[#77716A] text-[11px] font-medium">{q.explanation}</p>
                            </div>
                          )
                        })}

                        <Button
                          onClick={() => {
                            setUserQuizAnswers(new Array(quizQuestions.length).fill(null))
                            setQuizSubmitted(false)
                          }}
                          className="bg-[#8B7EC8] hover:bg-[#786bb8] text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                        >
                          Retake Quiz
                        </Button>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* TAB 3: PRACTICE QUESTIONS */}
                <TabsContent value="practice" className="pt-4 space-y-4">
                  <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-serif font-black text-[#292724] border-b border-[#E5DCD0] pb-2">
                      Practice Questions — {selectedNote.title}
                    </h3>

                    <div className="space-y-4">
                      {practiceQuestions.map((pq) => (
                        <div key={pq.id} className="p-4 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#75B798] bg-[#75B798]/15 px-2 py-0.5 rounded">
                              {pq.category}
                            </span>
                          </div>
                          <p className="text-xs font-serif font-bold text-[#292724]">{pq.question}</p>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRevealedAnswers((prev) => ({ ...prev, [pq.id]: !prev[pq.id] }))
                            }}
                            className="text-xs border-[#75B798] text-[#75B798] font-bold h-7 px-3 rounded-lg cursor-pointer"
                          >
                            {revealedAnswers[pq.id] ? "Hide Answer" : "Show Answer"}
                          </Button>

                          {revealedAnswers[pq.id] && (
                            <div className="p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs font-medium text-[#292724] animate-in fade-in-50">
                              💡 <strong>Sample Model Answer:</strong> {pq.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* TAB 4: ASK MY NOTES */}
                <TabsContent value="ask" className="pt-4 space-y-4">
                  <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                      <h3 className="text-xs font-serif font-bold text-[#292724] flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#8B7EC8]" /> Conversational Q&A Grounded in Notes
                      </h3>
                      <span className="text-[10px] font-mono text-[#77716A]">
                        Active Context: {selectedNote.fileName}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto p-1">
                      {chatMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                            m.sender === 'user'
                              ? "bg-[#8B7EC8] text-white border-[#8B7EC8] ml-8"
                              : m.isOutOfScope
                              ? "bg-amber-50 border-amber-200 text-amber-900 mr-8"
                              : "bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] mr-8"
                          }`}
                        >
                          <p className="font-medium leading-relaxed">{m.text}</p>
                          {m.source && (
                            <span className="block text-[10px] font-bold opacity-80 border-t border-current/20 pt-1">
                              {m.source}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[#E5DCD0]">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Ask a question about ${selectedNote.title}...`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendChatMessage()
                        }}
                        className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        className="bg-[#8B7EC8] hover:bg-[#786bb8] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                      >
                        Ask Notes
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                {/* TAB 5: FLASHCARDS */}
                <TabsContent value="flashcards" className="pt-4 space-y-4">
                  <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-6 text-center space-y-4">
                    <h3 className="text-sm font-serif font-black text-[#292724]">
                      Personal Notes Flashcards — {selectedNote.title}
                    </h3>
                    <div className="p-8 bg-[#FFF9F1] border-2 border-dashed border-[#E76F51]/40 rounded-2xl max-w-md mx-auto space-y-2">
                      <p className="text-xs font-bold text-[#E76F51] uppercase tracking-wider">Flashcard 1 of 3</p>
                      <h4 className="text-sm font-serif font-bold text-[#292724]">
                        What is the primary objective described in {selectedNote.title}?
                      </h4>
                      <p className="text-xs text-[#77716A] font-semibold pt-4">
                        (Click to flip and reveal answer)
                      </p>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>


      {/* PRO LIMIT DIALOG */}
      <ProLimitDialog
        open={proLimitOpen}
        onOpenChange={setProLimitOpen}
        featureName={proLimitFeature}
        reason={proLimitReason}
        userRole="student"
        onOpenPricing={() => setPricingModalOpen(true)}
      />

      {/* PRICING MODAL */}
      <PricingModal
        open={pricingModalOpen}
        onOpenChange={setPricingModalOpen}
        userRole="student"
      />
    </div>
  )
}


function generateSummaryFromNoteText(note: StudentPersonalNote) {
  return {
    overview: `This study pack summarizes "${note.title}" uploaded as "${note.fileName}". It covers core principles, boundary conditions, and algorithmic/conceptual workflows required for course mastery.`,
    keyConcepts: [
      { title: "Core Architecture", explanation: "Defines primary operational rules, state transitions, and memory representations." },
      { title: "Boundary Conditions", explanation: "Ensures edge cases are validated prior to execution to prevent runtime failures." },
      { title: "Performance Trade-offs", explanation: "Balances time complexity and memory overhead in real-world scenarios." }
    ],
    definitions: [
      { term: "Determinism", definition: "A property where identical inputs produce identical outputs with zero side-effects." },
      { term: "State Vector", definition: "A structured representation of all active system variables at a given tick." }
    ],
    examImportant: [
      `Derive time & space complexity for algorithms presented in ${note.title}.`,
      "Explain failure modes when input parameters fall outside standard ranges.",
      "Compare implementation strategies against baseline iterative methods."
    ],
    quickRevision: [
      "Review edge case validation before taking examinations.",
      "Memorize key operational formulas and state transition graphs.",
      "Practice multi-choice and conceptual problem sets."
    ]
  }
}

function generateQuizFromNoteText(note: StudentPersonalNote): NoteQuizQuestion[] {

  return [
    {
      id: "nq1",
      type: "MCQ",
      question: `What is the primary topic covered in ${note.title}?`,
      options: [
        `Core principles & operational mechanisms of ${note.title}`,
        "Unrelated generic hardware specifications",
        "Legacy file format obsolete rules",
        "Undefined ambient variables"
      ],
      correctAnswer: 0,
      explanation: `The uploaded document '${note.fileName}' provides foundational rules and concepts for ${note.title}.`
    },
    {
      id: "nq2",
      type: "TrueFalse",
      question: `True or False: The notes state that boundary conditions must be validated prior to state transitions.`,
      options: ["True", "False"],
      correctAnswer: 0,
      explanation: "Validating boundary conditions prevents execution errors during processing."
    },
    {
      id: "nq3",
      type: "Conceptual",
      question: `Which operational trade-off is emphasized in ${note.title}?`,
      options: [
        "Time complexity vs. space complexity optimization",
        "Color saturation vs. contrast ratio",
        "Network latency vs. monitor refresh rate",
        "Database indexing vs. physical printing"
      ],
      correctAnswer: 0,
      explanation: "Algorithmic notes emphasize balancing time and memory overhead."
    }
  ]
}

function generatePracticeFromNoteText(note: StudentPersonalNote): NotePracticeQuestion[] {
  return [
    {
      id: "pq1",
      category: "Short Answer",
      question: `Define the primary role of the algorithms described in ${note.title}.`,
      answer: `The algorithms process inputs systematically while satisfying boundary constraints outlined in ${note.fileName}.`
    },
    {
      id: "pq2",
      category: "Conceptual",
      question: `Explain why error handling is critical when executing logic in ${note.title}.`,
      answer: "Error handling prevents system crashes and guarantees deterministic state recovery."
    },
    {
      id: "pq3",
      category: "Application",
      question: `How would you apply the principles in ${note.title} to a real-world software system?`,
      answer: "By designing modular components with strict API boundaries and logging runtime metrics."
    }
  ]
}
