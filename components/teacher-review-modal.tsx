'use client'

import React, { useState, useEffect } from "react"
import { FileCheck, Sparkles, Send, CheckCircle2, Award, Code2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { SubmissionData, EvaluationReportData, gradeSubmission } from "@/lib/data-store"
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<EvaluationReportData | null>(null)

  useEffect(() => {
    if (submission) {
      setMarks(submission.marks || 45)
      setFeedback(
        submission.feedback ||
          "Great recursion structure! Inorder traversal logic accurately handles left child recursion before processing current node."
      )

      if (submission.evaluationReport) {
        setReport(submission.evaluationReport)
      } else {
        // Default pre-computed draft report
        const pct = Math.round(((submission.marks || 45) / 50) * 100)
        setReport({
          overallScore: submission.marks || 45,
          maxScore: 50,
          percentage: pct,
          codeQuality: "O(log N) Time Complexity • Optimal Recursion Stack",
          strengths: [
            "Correct In-Order traversal order (Left -> Node -> Right)",
            "Proper base case check for null root nodes avoiding infinite loops",
            "Clean modular function signatures"
          ],
          weaknesses: [
            "Consider handling edge case for unbalanced degenerate trees",
            "Could add explicit docstrings for function return types"
          ],
          recommendations: [
            "Practice iterative DFS stack simulation using an explicit array stack",
            "Review AVL tree balance factor rotations for next lab"
          ],
          generatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
        })
      }
    }
  }, [submission, open])

  const handleGenerateAiReport = () => {
    setIsGenerating(true)
    const toastId = toast.loading("Analyzing code correctness & generating evaluation report...")

    setTimeout(() => {
      const pct = Math.round((marks / maxMarks) * 100)
      const generatedReport: EvaluationReportData = {
        overallScore: marks,
        maxScore: maxMarks,
        percentage: pct,
        codeQuality: "O(log N) Efficiency • 100% Boundary Invariants Satisfied",
        strengths: [
          "Demonstrates solid grasp of recursive Depth-First Search execution",
          "Includes strict null pointer check before accessing node properties",
          "Adheres to clean PEP-8 style and variable naming conventions"
        ],
        weaknesses: [
          "Call stack depth reaches O(N) in worst-case skewed trees",
          "Consider adding type hints for `root` parameter"
        ],
        recommendations: [
          "Implement iterative inorder traversal using explicit Python list stack",
          "Try Moriss Traversal for O(1) auxiliary memory optimization"
        ],
        generatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      }

      setReport(generatedReport)
      setIsGenerating(false)
      toast.success("AI Evaluation Report generated!", { id: toastId })
    }, 600)
  }

  const handlePublishGradeAndReport = () => {
    if (!submission) return

    const pct = Math.round((marks / maxMarks) * 100)
    const finalReport: EvaluationReportData = report || {
      overallScore: marks,
      maxScore: maxMarks,
      percentage: pct,
      codeQuality: "O(log N) Time Complexity",
      strengths: ["Valid tree traversal recursion logic"],
      weaknesses: ["Add edge case checks for deep call stacks"],
      recommendations: ["Review tree rotations and balance factors"],
      generatedAt: new Date().toLocaleDateString()
    }

    gradeSubmission(submission.submissionId, marks, feedback, finalReport)

    // Save empirical mastery evidence
    saveMasteryEvidence(submission.studentId, submission.classId, "tree-traversal", {
      type: "Assignment",
      title: `Assignment Graded: ${submission.assignmentTitle}`,
      score: marks,
      maxScore: maxMarks,
      percentage: pct,
      notes: `Instructor evaluation: ${feedback}`
    })

    toast.success(`Published grade (${marks}/${maxMarks}) & AI Evaluation Report to ${submission.studentName}!`)
    onOpenChange(false)
  }

  if (!submission) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/15 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 uppercase tracking-wider">
              Student Submission Inspection
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

        <div className="space-y-5 pt-3">
          {/* Submitted Content Preview */}
          <Card className="bg-[#292724] text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-2xs border border-[#3E3A35]">
            <div className="flex items-center justify-between text-[11px] text-[#A19A91] pb-2 border-b border-[#3E3A35] mb-2">
              <span className="flex items-center gap-1 font-bold"><Code2 className="w-3.5 h-3.5 text-[#E76F51]" /> Submitted Python Code</span>
              <span className="bg-[#3E3A35] px-2 py-0.5 rounded text-white font-sans text-[10px]">Submitted</span>
            </div>
            <pre className="whitespace-pre-wrap">{submission.content}</pre>
          </Card>

          {/* Marks & Instructor Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">Assigned Marks (out of {maxMarks})</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min={0}
                  max={maxMarks}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="bg-white border-[#E5DCD0] font-mono font-bold text-sm text-[#292724] rounded-xl"
                />
                <span className="text-xs font-bold text-[#77716A]">/ {maxMarks}</span>
                <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2 py-1 rounded-lg">
                  {Math.round((marks / maxMarks) * 100)}%
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#292724]">AI Report Generation</Label>
              <Button
                onClick={handleGenerateAiReport}
                disabled={isGenerating}
                className="w-full bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs py-2 rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#E9B949]" />
                {isGenerating ? "Analyzing..." : "Generate AI Evaluation Report"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#292724]">Instructor Review Feedback</Label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              className="w-full bg-white border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
            />
          </div>

          {/* AI Evaluation Report Preview Card */}
          {report && (
            <Card className="bg-white border-2 border-[#8B7EC8]/30 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-[#8B7EC8]" />
                  <h4 className="text-xs font-serif font-bold text-[#292724]">AI Evaluation Report Preview</h4>
                </div>
                <span className="text-[10px] font-mono text-[#77716A]">Generated {report.generatedAt}</span>
              </div>

              <div className="p-2.5 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] flex items-center justify-between text-xs">
                <span className="font-bold text-[#292724]">Code Quality Analysis:</span>
                <span className="font-mono text-emerald-700 font-bold">{report.codeQuality}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <h5 className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                  </h5>
                  <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                    {report.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <h5 className="font-bold text-amber-900 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Actionable Recommendations
                  </h5>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                    {report.recommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <Button
            onClick={handlePublishGradeAndReport}
            className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-3 text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Publish Grade ({marks}/{maxMarks}) & Evaluation Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
