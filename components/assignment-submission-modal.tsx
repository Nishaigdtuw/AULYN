'use client'

import React, { useState } from "react"
import { Send, MessageSquare, CheckCircle, Sparkles, Award, CheckCircle2, AlertCircle, FileText, Download, Eye, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AssignmentData, SubmissionData, saveSubmission, getSubmissions, AssignmentComment, viewDocumentFile, downloadDocumentFile } from "@/lib/data-store"
import { sendNotificationEmail } from "@/lib/email-service"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

interface AssignmentSubmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentData
  userRole: 'student' | 'teacher'
  studentName?: string
  onStartViva?: () => void
}

export function AssignmentSubmissionModal({
  open,
  onOpenChange,
  assignment,
  userRole,
  studentName = "Alex Rivera",
  onStartViva
}: AssignmentSubmissionModalProps) {
  const [solutionContent, setSolutionContent] = useState("")
  const [newComment, setNewComment] = useState("")
  
  // PDF Upload State
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const [existingSubmission, setExistingSubmission] = useState<SubmissionData | null>(() => {
    const list = getSubmissions(assignment?.classId)
    return list.find((s) => s.assignmentId === assignment?.id) || null
  })

  // Handle PDF File Selector / Drag & Drop
  const handlePdfSelect = (file: File) => {
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF document (.pdf).")
      return
    }

    setPdfFile(file)
    setIsUploading(true)
    setUploadProgress(20)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 25
      })
    }, 100)

    const reader = new FileReader()
    reader.onload = () => {
      setPdfDataUrl(reader.result as string)
      setUploadProgress(100)
      setIsUploading(false)
      clearInterval(interval)
      toast.success(`PDF "${file.name}" ready for submission!`)
    }
    reader.onerror = () => {
      setIsUploading(false)
      clearInterval(interval)
      toast.error("Failed to read PDF file.")
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePdf = () => {
    setPdfFile(null)
    setPdfDataUrl(null)
    setUploadProgress(0)
  }

  const handleSubmitSolution = () => {
    if (!pdfFile && !solutionContent.trim()) {
      toast.warning("Please upload an Assignment PDF or type written solution notes before submitting.")
      return
    }

    const fileUrl = pdfDataUrl || undefined
    const fileName = pdfFile?.name || undefined

    const sub: SubmissionData = {
      submissionId: `sub-${assignment.id}-${Date.now()}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentId: "student-demo",
      studentName,
      classId: assignment.classId,
      submittedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content: solutionContent.trim() || `Submitted PDF document: ${fileName || "Assignment_Submission.pdf"}`,
      fileUrl: fileUrl,
      status: "Submitted",
      comments: []
    }


    saveSubmission(sub)
    setExistingSubmission(sub)
    setSolutionContent("")
    setPdfFile(null)
    setPdfDataUrl(null)

    saveMasteryEvidence("student-demo", assignment.classId, "tree-traversal", {
      type: "Assignment",
      title: assignment.title,
      score: 45,
      maxScore: 50,
      percentage: 90,
      notes: "PDF assignment submission uploaded and logged."
    })

    sendNotificationEmail({
      toEmail: "sarah.jenkins@aulyn.edu",
      toName: "Prof. Sarah Jenkins",
      subject: `New Assignment Submission: ${assignment.title}`,
      messageBody: `${studentName} submitted a PDF solution for ${assignment.title}.`,
      category: "Assignment"
    })

    toast.success(`Assignment "${assignment.title}" submitted successfully!`)
  }

  const handleAddThreadComment = () => {
    if (!newComment.trim() || !existingSubmission) return

    const commentObj: AssignmentComment = {
      id: `comm-${Date.now()}`,
      assignmentId: assignment.id,
      submissionId: existingSubmission.submissionId,
      authorId: userRole === 'teacher' ? 'teacher-demo' : 'student-demo',
      authorName: userRole === 'teacher' ? 'Prof. Sarah Jenkins' : studentName,
      authorRole: userRole,
      content: newComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedSub = {
      ...existingSubmission,
      comments: [...(existingSubmission.comments || []), commentObj]
    }

    saveSubmission(updatedSub)
    setExistingSubmission(updatedSub)
    setNewComment("")

    toast.success("Comment added to submission thread!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              {assignment?.type} Assignment
            </span>
            <span className="text-xs font-bold text-[#77716A]">Due: {assignment?.dueDate}</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            {assignment?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            {assignment?.instructions || "Review attached document and submit your completed lab work."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Teacher Uploaded Assignment File Card */}
          {(assignment?.fileName || assignment?.fileUrl) && (
            <Card className="p-3.5 bg-white border border-[#E5DCD0] rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-[#E76F51] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#292724]">{assignment.fileName || `${assignment.title}_Assignment.pdf`}</h4>
                  <p className="text-[10px] text-[#77716A] font-semibold">{assignment.fileSize || "Official Course Document"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.info(`Opening "${assignment.fileName || assignment.title}"...`)
                    viewDocumentFile(assignment.fileName || `${assignment.title}.pdf`, assignment.fileUrl)
                  }}
                  className="text-xs border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8] hover:text-white font-bold h-7 px-3 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.info(`Downloading "${assignment.fileName || assignment.title}"...`)
                    downloadDocumentFile(assignment.fileName || `${assignment.title}.pdf`, assignment.fileUrl)
                  }}
                  className="text-xs bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold h-7 px-3 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            </Card>
          )}

          {/* Student Upload Form: Drag & Drop PDF Upload Zone */}
          {userRole === 'student' && !existingSubmission && (
            <div className="space-y-4 bg-white p-4 rounded-2xl border border-[#E5DCD0] shadow-2xs">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#E76F51]" /> Submit Assignment PDF
              </h4>

              {/* Upload Dropzone */}
              {!pdfFile ? (
                <label className="border-2 border-dashed border-[#E76F51]/40 hover:border-[#E76F51] bg-[#FFF9F1] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePdfSelect(e.target.files[0])
                      }
                    }}
                  />
                  <FileText className="w-8 h-8 text-[#E76F51] animate-bounce" />
                  <p className="text-xs font-bold text-[#292724]">Upload Assignment PDF</p>
                  <p className="text-[10px] text-[#77716A]">Drag & Drop your completed PDF here or <span className="text-[#E76F51] underline">Browse File</span></p>
                </label>
              ) : (
                /* Uploaded PDF Card with progress & remove button */
                <div className="p-3 bg-[#FFF9F1] border border-[#E76F51]/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-5 h-5 text-[#E76F51]" />
                      <div>
                        <p className="text-xs font-bold text-[#292724]">{pdfFile.name}</p>
                        <p className="text-[10px] text-[#77716A]">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemovePdf}
                      className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>

                  {/* Upload Progress Bar */}
                  <div className="w-full bg-[#E5DCD0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#E76F51] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Optional Text / Logic Response */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#77716A]">Optional Written Response / Notes:</label>
                <textarea
                  value={solutionContent}
                  onChange={(e) => setSolutionContent(e.target.value)}
                  placeholder="Add any notes, proof explanations, or comments for Professor..."
                  rows={3}
                  className="w-full bg-[#FFF9F1] border border-[#E5DCD0] text-xs font-medium text-[#292724] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                />
              </div>

              <Button
                onClick={handleSubmitSolution}
                disabled={isUploading}
                className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Assignment
              </Button>
            </div>
          )}

          {/* Submitted Assignment State Display */}
          {existingSubmission && (
            <Card className="bg-white border-2 border-emerald-300 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Assignment Submitted
                </span>
                <div className="flex items-center space-x-2">
                  {existingSubmission.marks !== undefined && (
                    <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/15 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
                      Score: {existingSubmission.marks} / {assignment?.totalMarks || 50}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    {existingSubmission.status}
                  </span>
                </div>
              </div>

              {/* View Submitted PDF & Actions */}
              <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-6 h-6 text-[#E76F51] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#292724]">solution.pdf</p>
                    <p className="text-[10px] text-[#77716A]">Submitted: {existingSubmission.submittedAt}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewDocumentFile(`${existingSubmission.assignmentTitle || "solution"}.pdf`, existingSubmission.fileUrl)}

                    className="text-xs border-[#8B7EC8] text-[#8B7EC8] font-bold h-7 px-3 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Submission
                  </Button>
                  {userRole === 'student' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setExistingSubmission(null)
                        setPdfFile(null)
                        setPdfDataUrl(null)
                        toast.info("Select a new PDF to replace your current submission.")
                      }}
                      className="text-xs bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold h-7 px-3 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" /> Replace PDF
                    </Button>
                  )}
                </div>
              </div>

              {existingSubmission.content && (
                <p className="text-xs text-[#292724] bg-[#FFF9F1] p-3 rounded-xl border border-[#E5DCD0] font-mono">
                  {existingSubmission.content}
                </p>
              )}

              {/* Evaluation Report Display */}
              {existingSubmission.evaluationReport && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-[#8B7EC8]/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#8B7EC8]/30 pb-2">
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-[#8B7EC8]" />
                      <h4 className="text-xs font-serif font-bold text-indigo-950">AI Evaluation Report & Instructor Feedback</h4>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold">
                      {existingSubmission.evaluationReport.percentage}% Score
                    </span>
                  </div>

                  {existingSubmission.feedback && (
                    <p className="text-xs font-semibold text-indigo-900 bg-white/80 p-2.5 rounded-xl border border-indigo-200">
                      💬 <strong>Instructor Note:</strong> {existingSubmission.feedback}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white/90 border border-emerald-200 rounded-xl space-y-1">
                      <h5 className="font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                      </h5>
                      <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                        {existingSubmission.evaluationReport.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white/90 border border-amber-200 rounded-xl space-y-1">
                      <h5 className="font-bold text-amber-900 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Improvement Guidance
                      </h5>
                      <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                        {existingSubmission.evaluationReport.recommendations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {assignment?.vivaRequired && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-serif font-bold text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" /> AI Viva Defense Required
                    </h5>
                    <p className="text-[10px] text-indigo-700 font-semibold">Professor Jenkins requires a brief 3-question AI Viva defense for this lab.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      if (onStartViva) onStartViva()
                    }}
                    className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Start AI Viva
                  </Button>
                </div>
              )}
            </Card>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
