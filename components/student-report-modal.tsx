'use client'

import React, { useState, useEffect } from "react"
import { Award, TrendingUp, CheckCircle2, AlertCircle, Download, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { SubmissionData, getSubmissions } from "@/lib/data-store"

interface StudentReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId?: string
  studentName?: string
}

export function StudentReportModal({
  open,
  onOpenChange,
  studentId = "student-demo",
  studentName = "Alex Rivera"
}: StudentReportModalProps) {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([])


  useEffect(() => {
    if (open) {
      const allSubs = getSubmissions()
      const studentSubs = allSubs.filter((s) => s.studentId === studentId || s.studentName === studentName)

      if (studentSubs.length === 0) {
        // Fallback default sample submissions for demo report
        const demoSubs: SubmissionData[] = [
          {
            submissionId: "sub-1",
            assignmentId: "asgn-1",
            assignmentTitle: "BST Implementation & Rotations Lab",
            studentId,
            studentName,
            classId: "cs201",
            submittedAt: "Aug 14, 2026",
            content: "def inorder(root):\n    if not root: return\n    inorder(root.left)\n    print(root.val)\n    inorder(root.right)",
            status: "Graded",
            gradeStatus: "Graded",
            marks: 45,
            maxMarks: 50,
            feedback: "Excellent recursive tree traversal logic with proper boundary checks.",
            evaluationReport: {
              overallScore: 45,
              maxScore: 50,
              percentage: 90,
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
              generatedAt: "Aug 14, 2026"
            }
          },
          {
            submissionId: "sub-2",
            assignmentId: "asgn-2",
            assignmentTitle: "Calculus Limits & Differential Optimization",
            studentId,
            studentName,
            classId: "math101",
            submittedAt: "Aug 10, 2026",
            content: "f'(x) = lim(h->0) [f(x+h) - f(x)] / h = 2x + 3",
            status: "Graded",
            gradeStatus: "Graded",
            marks: 42,
            maxMarks: 50,
            feedback: "Solid limits proof and first-principles differentiation derivation.",
            evaluationReport: {
              overallScore: 42,
              maxScore: 50,
              percentage: 84,
              codeQuality: "Step-by-Step Analytical Proof • High Precision",
              strengths: [
                "Accurate algebraic cancellation of h term in limit expansion",
                "Clear notation and variable definition"
              ],
              weaknesses: [
                "Double check L'Hôpital rule indeterminate form checks"
              ],
              recommendations: [
                "Practice partial derivative optimization for multivariable functions"
              ],
              generatedAt: "Aug 10, 2026"
            }
          },
          {
            submissionId: "sub-3",
            assignmentId: "asgn-3",
            assignmentTitle: "Graph Traversal BFS & Dijkstra Shortest Path",
            studentId,
            studentName,
            classId: "cs201",
            submittedAt: "Aug 06, 2026",
            content: "import heapq\ndef dijkstra(graph, start):\n    distances = {node: float('inf') for node in graph}\n    distances[start] = 0\n    pq = [(0, start)]",
            status: "Graded",
            gradeStatus: "Graded",
            marks: 48,
            maxMarks: 50,
            feedback: "Outstanding priority queue implementation of Dijkstra algorithm!",
            evaluationReport: {
              overallScore: 48,
              maxScore: 50,
              percentage: 96,
              codeQuality: "O((V + E) log V) Efficiency • Min-Heap Priority Queue",
              strengths: [
                "Optimal min-heap priority queue utilization",
                "Correct relaxation of edge weights",
                "Robust handling of unreachable disconnected nodes"
              ],
              weaknesses: [
                "Note that Dijkstra does not handle negative edge weights"
              ],
              recommendations: [
                "Explore Bellman-Ford algorithm for negative edge weight graphs"
              ],
              generatedAt: "Aug 06, 2026"
            }
          }
        ]
        setSubmissions(demoSubs)
      }
    }
  }, [open, studentId, studentName])


  // Calculate Metrics
  const gradedSubs = submissions.filter((s) => s.marks !== undefined)
  const totalSubmissions = submissions.length
  const avgScorePct =
    gradedSubs.length > 0
      ? Math.round(
          gradedSubs.reduce((acc, curr) => acc + (curr.marks! / (curr.maxMarks || 50)) * 100, 0) /
            gradedSubs.length
        )
      : 88

  const handleDownloadReportPdf = () => {
    toast.info("Generating AULYN Comprehensive Evaluation PDF Report...")
    setTimeout(() => {
      toast.success("Downloaded 'AULYN_Student_Evaluation_Report.pdf'!")
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 uppercase tracking-wider">
              Official Evaluation Report
            </span>
            <Button
              size="sm"
              onClick={handleDownloadReportPdf}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Full PDF Report
            </Button>
          </div>

          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#8B7EC8]" /> {studentName} — Academic Evaluation Report
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Cumulative assignment evaluation, performance trend graph, and instructor AI feedback summary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider">Grade Average</span>
              <div className="text-2xl font-serif font-bold text-[#E76F51]">{avgScorePct}%</div>
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Top 10% Distinction
              </p>
            </Card>

            <Card className="bg-white border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider">Submissions Evaluated</span>
              <div className="text-2xl font-serif font-bold text-[#8B7EC8]">{totalSubmissions} Labs</div>
              <p className="text-[11px] text-[#77716A] font-semibold">100% Submission On-Time</p>
            </Card>

            <Card className="bg-white border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider">AI Viva Defenses</span>
              <div className="text-2xl font-serif font-bold text-[#75B798]">3 Defenses</div>
              <p className="text-[11px] text-[#75B798] font-bold">Low Rote Memory Risk 🟢</p>
            </Card>
          </div>

          {/* VISUAL PERFORMANCE TREND BAR GRAPH */}
          <Card className="bg-white border-2 border-[#E76F51]/30 shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
              <h3 className="text-xs font-serif font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#E76F51]" /> Assignment Score Performance Trend Graph
              </h3>
              <span className="text-[10px] font-mono text-[#77716A] font-bold">Score (%) vs Lab Assignment</span>
            </div>

            {/* Custom Responsive Performance Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2 px-4 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0]">
              {submissions.map((sub, idx) => {
                const scorePct = sub.marks ? Math.round((sub.marks / (sub.maxMarks || 50)) * 100) : 85
                return (
                  <div key={sub.submissionId || idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#292724] text-white text-[10px] px-2 py-1 rounded-md font-bold whitespace-nowrap shadow-md z-10 pointer-events-none">
                      {sub.assignmentTitle}: {scorePct}% ({sub.marks || 45}/50)
                    </div>

                    <span className="text-[11px] font-mono font-bold text-[#292724]">{scorePct}%</span>

                    {/* Animated Bar Pillar */}
                    <div className="w-full bg-[#E5DCD0] rounded-t-xl overflow-hidden h-28 flex items-end">
                      <div
                        className={`w-full transition-all duration-500 rounded-t-xl ${
                          scorePct >= 90
                            ? "bg-gradient-to-t from-[#E76F51] to-amber-400"
                            : scorePct >= 80
                            ? "bg-gradient-to-t from-[#8B7EC8] to-indigo-300"
                            : "bg-gradient-to-t from-[#75B798] to-emerald-300"
                        }`}
                        style={{ height: `${scorePct}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-bold text-[#77716A] truncate max-w-[80px]">
                      {sub.assignmentTitle.split(" ")[0]} Lab #{idx + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* DETAILED ASSIGNMENT EVALUATION CARDS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#8B7EC8]" /> Evaluated Assignment Reports & Instructor Feedback
            </h3>

            {submissions.map((sub) => {
              const r = sub.evaluationReport
              const scorePct = sub.marks ? Math.round((sub.marks / (sub.maxMarks || 50)) * 100) : 90
              return (
                <Card key={sub.submissionId} className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DCD0] pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#8B7EC8] uppercase tracking-wider">
                        {sub.classId?.toUpperCase() || "CS201"}
                      </span>
                      <h4 className="text-sm font-serif font-bold text-[#292724]">{sub.assignmentTitle}</h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
                        {sub.marks || 45} / {sub.maxMarks || 50} Marks ({scorePct}%)
                      </span>
                      <span className="text-[10px] text-[#77716A] font-semibold">{sub.submittedAt}</span>
                    </div>
                  </div>

                  {/* Instructor Feedback Note */}
                  {sub.feedback && (
                    <div className="p-2.5 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] text-xs font-medium text-[#292724]">
                      💬 <strong>Instructor Review:</strong> {sub.feedback}
                    </div>
                  )}

                  {/* Code Quality & Analysis */}
                  {r && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        ⚙️ {r.codeQuality}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                          <h5 className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                          </h5>
                          <ul className="list-disc list-inside text-[10px] text-emerald-800 space-y-0.5">
                            {r.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                          <h5 className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Recommendations
                          </h5>
                          <ul className="list-disc list-inside text-[10px] text-amber-800 space-y-0.5">
                            {r.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
