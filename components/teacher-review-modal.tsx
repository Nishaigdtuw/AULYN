'use client'

import React, { useState, useEffect } from "react"
import { FileCheck, Send, Code2, Eye, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { SubmissionData, gradeSubmission, viewDocumentFile, downloadDocumentFile } from "@/lib/data-store"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

interface TeacherReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: SubmissionData | null
}

export function TeacherReviewModal({
  open,
  onOpenChange,
  submission
}: TeacherReviewModalProps) {
  const [marks, setMarks] = useState<number>(45)
  const [maxMarks] = useState<number>(50)
  const [feedback, setFeedback] = useState("Excellent recursive tree traversal logic with proper boundary checks.")

  useEffect(() => {
    if (submission) {
      setMarks(submission.marks !== undefined ? submission.marks : 45)
      setFeedback(
        submission.feedback ||
          "Great recursion structure! Inorder traversal logic accurately handles left child recursion before processing current node."
      )
    }
  }, [submission, open])

  const handlePublishGrade = () => {
    if (!submission) return

    const pct = Math.round((marks / maxMarks) * 100)

    gradeSubmission(submission.submissionId, marks, feedback, undefined, "Prof. Sarah Jenkins")

    // Save empirical mastery evidence
    saveMasteryEvidence(submission.studentId, submission.classId, "tree-traversal", {
      type: "Assignment",
      title: `Assignment Graded: ${submission.assignmentTitle}`,
      score: marks,
      maxScore: maxMarks,
      percentage: pct,
      notes: `Instructor evaluation: ${feedback}`
    })

    toast.success(`Published Grade (${marks}/${maxMarks}) to ${submission.studentName}!`)
    onOpenChange(false)
  }

  if (!submission) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/15 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 uppercase tracking-wider">
              Student Submission Evaluation
            </span>
            <span className="text-xs text-[#77716A] font-semibold">Submitted {submission.submittedAt}</span>
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#E76F51]" /> {submission.assignmentTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Student: <strong className="text-[#292724]">{submission.studentName}</strong> ({submission.studentId})
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
          {/* Left Column: Submitted Content & PDF Preview */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Submission Content</h4>
            <Card className="bg-[#292724] text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-2xs border border-[#3E3A35] min-h-[160px]">
              <div className="flex items-center justify-between text-[11px] text-[#A19A91] pb-2 border-b border-[#3E3A35] mb-2">
                <span className="flex items-center gap-1 font-bold"><Code2 className="w-3.5 h-3.5 text-[#E76F51]" /> Submitted Solution File</span>
                <span className="bg-[#3E3A35] px-2 py-0.5 rounded text-white font-sans text-[10px]">PDF / Text</span>
              </div>
              <pre className="whitespace-pre-wrap">{submission.content}</pre>
            </Card>

            <div className="flex items-center space-x-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => viewDocumentFile(`${submission.assignmentTitle}.pdf`, submission.fileUrl)}
                className="w-1/2 border-[#8B7EC8] text-[#8B7EC8] font-bold text-xs h-8 rounded-xl cursor-pointer flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View Submission
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadDocumentFile(`${submission.assignmentTitle}.pdf`, submission.fileUrl)}
                className="w-1/2 border-[#E76F51] text-[#E76F51] font-bold text-xs h-8 rounded-xl cursor-pointer flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            </div>
          </div>

          {/* Right Column: Instructor Evaluation Form */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Evaluation & Marks</h4>

              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#E5DCD0]">
                <Label className="text-xs font-bold text-[#292724]">Assigned Marks (out of {maxMarks})</Label>
                <div className="flex items-center space-x-2 pt-1">
                  <Input
                    type="number"
                    min={0}
                    max={maxMarks}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="bg-[#FFF9F1] border-[#E5DCD0] font-mono font-bold text-sm text-[#292724] rounded-xl w-24"
                  />
                  <span className="text-xs font-bold text-[#77716A]">/ {maxMarks}</span>
                  <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-1 rounded-lg ml-auto">
                    {Math.round((marks / maxMarks) * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#292724]">Instructor Feedback / Comment</Label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Enter constructive feedback for the student..."
                  className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                />
              </div>
            </div>

            <Button
              onClick={handlePublishGrade}
              className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-3 text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Send className="w-4 h-4" /> Publish Grade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
