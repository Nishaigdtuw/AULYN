"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Info,
  PlayCircle,
  FileText,
  Mic,
  Code,
  Award,
  X,
  ShieldCheck
} from "lucide-react"
import { getStudentUnderstandingServer } from "@/actions/intelligence/action"
import { ConceptMasterySummary, MasteryStatus } from "@/lib/mastery-engine"

interface StudentUnderstandingGraphProps {
  studentId: string
  classId: string
  onOpenVisualizer?: () => void
  onOpenViva?: () => void
  onOpenPractice?: () => void
}

export function StudentUnderstandingGraph({
  studentId,
  classId,
  onOpenVisualizer,
  onOpenViva,
  onOpenPractice
}: StudentUnderstandingGraphProps) {
  const [summaries, setSummaries] = useState<ConceptMasterySummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedConcept, setSelectedConcept] = useState<ConceptMasterySummary | null>(null)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All")

  const fetchGraphData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getStudentUnderstandingServer(studentId, classId)
      if (res.success && res.summaries) {
        setSummaries(res.summaries)
      }
    } catch (err) {
      console.warn("Failed to fetch understanding graph:", err)
    } finally {
      setLoading(false)
    }
  }, [studentId, classId])

  useEffect(() => {
    fetchGraphData()

    const handleUpdate = () => fetchGraphData()
    window.addEventListener("aulyn-evidence-recorded", handleUpdate)
    window.addEventListener("aulyn-mastery-update", handleUpdate)

    return () => {
      window.removeEventListener("aulyn-evidence-recorded", handleUpdate)
      window.removeEventListener("aulyn-mastery-update", handleUpdate)
    }
  }, [fetchGraphData])

  const categories = ["All", ...Array.from(new Set(summaries.map((s) => s.category)))]

  const filteredSummaries = activeCategoryFilter === "All"
    ? summaries
    : summaries.filter((s) => s.category === activeCategoryFilter)

  // Overall statistics
  const masteredCount = summaries.filter((s) => s.status === 'Mastered').length
  const strongCount = summaries.filter((s) => s.status === 'Strong').length
  const developingCount = summaries.filter((s) => s.status === 'Developing').length
  const attentionCount = summaries.filter((s) => s.status === 'Needs Attention').length
  const noEvidenceCount = summaries.filter((s) => s.status === 'Not Enough Evidence').length

  const getStatusBadge = (status: MasteryStatus) => {
    switch (status) {
      case "Mastered":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Mastered</span>
      case "Strong":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Strong</span>
      case "Developing":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Developing</span>
      case "Needs Attention":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Needs Attention</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Not Enough Evidence</span>
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "QUIZ": return <FileText className="w-4 h-4 text-blue-500" />
      case "ASSIGNMENT": return <Award className="w-4 h-4 text-indigo-500" />
      case "VIVA": return <Mic className="w-4 h-4 text-rose-500" />
      case "CODE_REASONING": return <Code className="w-4 h-4 text-amber-500" />
      default: return <FileText className="w-4 h-4 text-slate-500" />
    }
  }

  const handleActionClick = (actionText?: string) => {
    if (!actionText) return
    const lower = actionText.toLowerCase()
    if (lower.includes("visualizer") && onOpenVisualizer) onOpenVisualizer()
    else if (lower.includes("viva") && onOpenViva) onOpenViva()
    else if (onOpenPractice) onOpenPractice()
  }

  return (
    <div className="space-y-6">
      {/* Header Summary Banner */}
      <div className="bg-[#292724] text-[#FFF9F1] p-6 rounded-2xl shadow-sm border border-[#3D3A36]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-6 h-6 text-[#E76F51]" />
            <h2 className="text-xl font-bold tracking-tight">Your Student Understanding Map</h2>
          </div>
          <p className="text-sm text-[#FFF9F1]/70">
            Explainable concept mastery derived from real quizzes, assignments, spoken viva defenses, and code reasoning.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#1F1D1B] px-3 py-1.5 rounded-xl border border-[#3D3A36] text-center">
            <div className="text-xs text-[#FFF9F1]/60 font-medium">Mastered</div>
            <div className="text-base font-bold text-emerald-400">{masteredCount}</div>
          </div>
          <div className="bg-[#1F1D1B] px-3 py-1.5 rounded-xl border border-[#3D3A36] text-center">
            <div className="text-xs text-[#FFF9F1]/60 font-medium">Strong</div>
            <div className="text-base font-bold text-teal-400">{strongCount}</div>
          </div>
          <div className="bg-[#1F1D1B] px-3 py-1.5 rounded-xl border border-[#3D3A36] text-center">
            <div className="text-xs text-[#FFF9F1]/60 font-medium">Developing</div>
            <div className="text-base font-bold text-amber-400">{developingCount}</div>
          </div>
          <div className="bg-[#1F1D1B] px-3 py-1.5 rounded-xl border border-[#3D3A36] text-center">
            <div className="text-xs text-[#FFF9F1]/60 font-medium">Needs Attention</div>
            <div className="text-base font-bold text-rose-400">{attentionCount}</div>
          </div>
          {noEvidenceCount > 0 && (
            <div className="bg-[#1F1D1B] px-3 py-1.5 rounded-xl border border-[#3D3A36] text-center">
              <div className="text-xs text-[#FFF9F1]/60 font-medium">No Evidence</div>
              <div className="text-base font-bold text-slate-400">{noEvidenceCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategoryFilter === cat
                ? "bg-[#E76F51] text-white shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Concept Cards Tree Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 animate-pulse">
          Analyzing evidence and assembling your Understanding Map...
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="p-12 text-center bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-500">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 text-stone-400" />
          <p className="font-semibold text-stone-700 dark:text-stone-300">No Concepts Available Yet</p>
          <p className="text-xs text-stone-500 mt-1">Complete classroom quizzes, assignments, or oral viva assessments to build your map.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSummaries.map((summary) => (
            <div
              key={summary.conceptId}
              onClick={() => setSelectedConcept(summary)}
              className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-[#E76F51]/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    {summary.category}
                  </span>
                  {getStatusBadge(summary.status)}
                </div>

                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#E76F51] transition-colors mb-2">
                  {summary.conceptName}
                </h3>

                {/* Score Progress Bar (Only when evidence exists) */}
                {summary.masteryScore !== null ? (
                  <div className="space-y-1.5 my-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-stone-600 dark:text-stone-400">Mastery Level</span>
                      <span className="text-stone-900 dark:text-stone-100 font-bold">{summary.masteryScore}%</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          summary.masteryScore >= 85
                            ? "bg-emerald-500"
                            : summary.masteryScore >= 70
                            ? "bg-teal-500"
                            : summary.masteryScore >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${summary.masteryScore}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="my-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs text-slate-500 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>No evidence collected yet. Complete classroom activities to assess mastery.</span>
                  </div>
                )}

                {/* Primary Weakness snippet if needs attention */}
                {summary.primaryWeakness && summary.status === "Needs Attention" && (
                  <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 mb-3">
                    <span className="font-bold">Focus Area: </span>
                    {summary.primaryWeakness}
                  </div>
                )}
              </div>

              {/* Footer Links & Confidence */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                  <span>Confidence: <strong className="text-stone-700 dark:text-stone-300">{summary.confidence}</strong></span>
                </div>
                <button className="text-[#E76F51] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Why this score? <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WHY THIS SCORE? MODAL */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedConcept(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              <span>{selectedConcept.category}</span>
            </div>

            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {selectedConcept.conceptName}
              </h3>
              {getStatusBadge(selectedConcept.status)}
            </div>

            {/* Score & Confidence Summary Box */}
            <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-800 grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-xs text-stone-500">Calculated Score</div>
                <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {selectedConcept.masteryScore !== null ? `${selectedConcept.masteryScore}%` : "No Evidence"}
                </div>
              </div>

              <div>
                <div className="text-xs text-stone-500">Evidence Confidence</div>
                <div className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#E76F51]" />
                  {selectedConcept.confidence}
                </div>
              </div>

              <div>
                <div className="text-xs text-stone-500">Evidence Signals</div>
                <div className="text-base font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                  {selectedConcept.evidenceCount} Sources
                </div>
              </div>
            </div>

            {/* Primary Weakness Analysis */}
            {selectedConcept.primaryWeakness && (
              <div className="mb-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-1">
                  <Info className="w-4 h-4" /> Primary Weakness & Diagnostic Note
                </div>
                <p className="text-sm text-rose-900 dark:text-rose-200 font-medium">
                  {selectedConcept.primaryWeakness}
                </p>
              </div>
            )}

            {/* Recommended Next Action Button */}
            {selectedConcept.recommendedAction && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-0.5">
                    Recommended Next Action
                  </div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {selectedConcept.recommendedAction}
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleActionClick(selectedConcept.recommendedAction)
                    setSelectedConcept(null)
                  }}
                  className="px-4 py-2 bg-[#E76F51] hover:bg-[#D65D3F] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                >
                  <PlayCircle className="w-4 h-4" /> Launch Action
                </button>
              </div>
            )}

            {/* Supporting Evidence Breakdown Trail */}
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#E76F51]" /> Supporting Learning Evidence Trail
              </h4>

              {selectedConcept.evidenceList.length === 0 ? (
                <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl text-xs text-stone-500 text-center">
                  No learning evidence has been logged yet for this concept.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedConcept.evidenceList.map((ev) => (
                    <div
                      key={ev.evidenceId}
                      className="p-3.5 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-stone-800 rounded-lg shadow-xs border border-stone-200 dark:border-stone-700">
                          {getSourceIcon(ev.sourceType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                              {ev.sourceTitle}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 uppercase">
                              {ev.sourceType}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {ev.summary || `Achieved score ${ev.score}/${ev.maxScore}`}
                          </p>
                          <div className="text-[10px] text-stone-400 mt-1">
                            Logged: {new Date(ev.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                          {ev.percentage}%
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium">
                          Score: {ev.score}/{ev.maxScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
