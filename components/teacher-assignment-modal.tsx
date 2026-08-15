'use client'

import React, { useState } from "react"
import { Sparkles, Trash2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ClassroomData, AssignmentData, getStoredClassrooms, saveStoredClassrooms } from "@/lib/data-store"

interface CreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeClass: ClassroomData | null
}

export function CreateAssignmentModal({ open, onOpenChange, activeClass }: CreateAssignmentModalProps) {
  const [title, setTitle] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [type, setType] = useState<'Descriptive' | 'MCQ' | 'Coding' | 'Short Answer' | 'Mixed'>("Coding")
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>("Intermediate")
  const [totalMarks, setTotalMarks] = useState(50)
  const [dueDate, setDueDate] = useState("2026-08-30")
  const [instructions, setInstructions] = useState("")
  
  // AI Draft Generator state
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState<string[]>([])

  const handleGenerateAiDraft = () => {
    if (!title.trim()) {
      toast.warning("Please enter an assignment title / topic first")
      return
    }
    setIsGenerating(true)
    setTimeout(() => {
      setDraftQuestions([
        `Q1. Explain the primary structural constraints of ${title} and derive its time complexity in average vs worst case.`,
        `Q2. Implement a working code solution resolving edge cases for ${title} with proper inline documentation.`,
        `Q3. Analyze a failure scenario where naive iteration underperforms compared to ${title}.`
      ])
      setIsGenerating(false)
      toast.success("AI Assignment Draft generated! Preview and edit below.")
    }, 800)
  }

  const handlePublishAssignment = () => {
    if (!title.trim()) {
      toast.warning("Please enter an assignment title")
      return
    }
    if (!activeClass) {
      toast.warning("No active classroom selected")
      return
    }

    const newAssignment: AssignmentData = {
      id: `asgn-${Date.now()}`,
      classId: activeClass.classId,
      chapterId: chapterId || activeClass.chapters[0]?.chapterId || "chap-1",
      title: title.trim(),
      type,
      difficulty,
      dueDate,
      totalMarks,
      instructions: instructions || "Complete all questions and submit before the deadline.",
      published: true,
      submissionsCount: 0
    }

    const classrooms = getStoredClassrooms()
    const targetClass = classrooms.find((c) => c.classId === activeClass.classId)
    if (targetClass) {
      targetClass.assignments.unshift(newAssignment)
      saveStoredClassrooms(classrooms)
    }

    toast.success(`Published assignment "${title}" to all students in ${activeClass.className}!`)
    onOpenChange(false)
    setTitle("")
    setDraftQuestions([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6">
        <DialogHeader className="border-b border-[#E5DCD0] pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              {activeClass?.code || "COURSE"} • Educator Studio
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-bold text-[#292724] mt-1">
            Create Course Assignment ({activeClass?.className})
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Define questions, set marks, due dates, and optionally generate an AI draft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Title & Chapter Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Assignment Title / Topic</Label>
              <Input
                placeholder="e.g. Graph Traversal & Shortest Path Lab"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Target Chapter</Label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full bg-white border border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl p-2 h-9"
              >
                {activeClass?.chapters.map((ch) => (
                  <option key={ch.chapterId} value={ch.chapterId}>
                    {ch.chapterName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type, Difficulty & Marks */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Format Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'Descriptive' | 'MCQ' | 'Coding' | 'Short Answer' | 'Mixed')}
                className="w-full bg-white border border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl p-2 h-9"
              >
                <option value="Coding">Coding</option>
                <option value="Descriptive">Descriptive</option>
                <option value="MCQ">MCQ</option>
                <option value="Short Answer">Short Answer</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Difficulty</Label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                className="w-full bg-white border border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl p-2 h-9"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Total Marks</Label>
              <Input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
              />
            </div>
          </div>

          {/* Due Date & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Instructions / Submission Notes</Label>
              <Input
                placeholder="e.g. Upload PDF or code repository link before midnight."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
              />
            </div>
          </div>

          {/* AI Generator Toggle */}
          <div className="p-3 bg-white border border-[#E5DCD0] rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#E9B949]" />
              <div>
                <p className="text-xs font-bold text-[#292724]">AI Assistant Question Draft</p>
                <p className="text-[11px] text-[#77716A]">Automatically generate sample problem sets based on topic & difficulty</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateAiDraft}
              disabled={isGenerating}
              className="text-xs border-[#E9B949] text-[#292724] font-bold rounded-xl hover:bg-[#E9B949]/10"
            >
              {isGenerating ? "Generating..." : "Generate AI Questions"}
            </Button>
          </div>

          {/* AI Draft Question Preview */}
          {draftQuestions.length > 0 && (
            <div className="p-4 bg-[#F1E8DD]/60 border border-[#E5DCD0] rounded-xl space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#292724] uppercase tracking-wider">AI Drafted Questions Preview</span>
                <span className="text-[10px] text-[#75B798] font-bold">3 Questions Drafted</span>
              </div>
              {draftQuestions.map((q, idx) => (
                <div key={idx} className="p-2.5 bg-white border border-[#E5DCD0] rounded-lg text-xs font-semibold text-[#292724] flex items-center justify-between">
                  <span>{q}</span>
                  <button
                    onClick={() => setDraftQuestions(draftQuestions.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-[#E5DCD0] flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#E5DCD0] text-[#77716A] text-xs font-bold rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublishAssignment}
            className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Publish to Classroom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
