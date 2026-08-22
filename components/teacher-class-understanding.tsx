"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Brain,
  AlertTriangle,
  Users,
  PlayCircle,
  PlusCircle,
  Shuffle
} from "lucide-react"
import { getClassroomUnderstandingServer } from "@/actions/intelligence/action"

interface TeacherClassUnderstandingProps {
  classId: string
  onCreateQuizForConcept?: (conceptName: string) => void
  onOpenLiveSession?: () => void
}

interface ConceptStatItem {
  conceptId: string
  conceptName: string
  category: string
  mastered: number
  strong: number
  developing: number
  needsAttention: number
  avgScore?: number | null
}

interface NeedingAttentionItem {
  conceptId: string
  conceptName: string
  studentsNeedingAttentionCount: number
  primaryWeaknessSummary: string
  affectedStudents: { id: string; name: string; score: number }[]
}

interface MismatchItem {
  studentId: string
  studentName: string
  writtenScore: number
  vivaScore: number
  difference: number
  insight: string
}

export function TeacherClassUnderstanding({
  classId,
  onCreateQuizForConcept,
  onOpenLiveSession
}: TeacherClassUnderstandingProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<ConceptStatItem[]>([])
  const [needingAttention, setNeedingAttention] = useState<NeedingAttentionItem[]>([])
  const [mismatches, setMismatches] = useState<MismatchItem[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getClassroomUnderstandingServer(classId)
      if (res.success) {
        setStats((res.conceptStats as unknown as ConceptStatItem[]) || [])
        setNeedingAttention((res.conceptsNeedingAttention as NeedingAttentionItem[]) || [])
        setMismatches((res.understandingMismatches as MismatchItem[]) || [])
      }
    } catch (err) {
      console.warn("Failed to fetch teacher class understanding:", err)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#292724] text-[#FFF9F1] p-6 rounded-2xl border border-[#3D3A36]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-6 h-6 text-[#E76F51]" />
            <h2 className="text-xl font-bold tracking-tight">Classroom Learning Intelligence</h2>
          </div>
          <p className="text-sm text-[#FFF9F1]/70">
            Real-time concept mastery distribution across your roster, driven by quizzes, assignments, and viva defenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#1F1D1B] px-4 py-2 rounded-xl border border-[#3D3A36]">
            <div className="text-xs text-[#FFF9F1]/60">Concepts Monitored</div>
            <div className="text-lg font-bold text-[#FFF9F1]">{stats.length}</div>
          </div>
          <div className="bg-[#1F1D1B] px-4 py-2 rounded-xl border border-[#3D3A36]">
            <div className="text-xs text-[#FFF9F1]/60">Needs Attention</div>
            <div className="text-lg font-bold text-rose-400">{needingAttention.length}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500 animate-pulse">
          Analyzing roster evidence and assembling class understanding overview...
        </div>
      ) : (
        <>
          {/* CONCEPTS NEEDING ATTENTION */}
          {needingAttention.length > 0 && (
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>Concepts Needing Action ({needingAttention.length})</span>
                </div>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  High friction points detected across roster
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {needingAttention.map((item) => (
                  <div
                    key={item.conceptId}
                    className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                          {item.conceptName}
                        </h4>
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {item.studentsNeedingAttentionCount} Students
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                        {item.primaryWeaknessSummary}
                      </p>

                      {/* Affected Students List Pill */}
                      {item.affectedStudents && item.affectedStudents.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                            Affected Students:
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.affectedStudents.map((stud: { id: string; name: string; score: number }) => (
                              <span
                                key={stud.id}
                                className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                              >
                                {stud.name} ({stud.score}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Teacher Action Buttons */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onCreateQuizForConcept && onCreateQuizForConcept(item.conceptName)}
                        className="px-3 py-1.5 bg-[#E76F51] hover:bg-[#D65D3F] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Create Revision Quiz
                      </button>

                      {onOpenLiveSession && (
                        <button
                          onClick={onOpenLiveSession}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-[#E76F51]" /> Review in Live Lecture
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UNDERSTANDING MISMATCHES (Written vs Verbal Reasoning) */}
          {mismatches.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-base">
                  <Shuffle className="w-5 h-5 text-amber-600" />
                  <span>Understanding Mismatches Detected ({mismatches.length})</span>
                </div>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Significant divergence between written grades and verbal viva reasoning
                </span>
              </div>

              <div className="space-y-3">
                {mismatches.map((m) => (
                  <div
                    key={m.studentId}
                    className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-amber-200 dark:border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {m.studentName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {m.difference}% Divergence
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {m.insight}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <div className="text-center px-3 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                        <div className="text-[10px] text-stone-400 font-medium">Written Grade</div>
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{m.writtenScore}%</div>
                      </div>
                      <div className="text-center px-3 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                        <div className="text-[10px] text-stone-400 font-medium">Spoken Viva</div>
                        <div className="text-sm font-bold text-rose-500">{m.vivaScore}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL SYLLABUS CONCEPTS OVERVIEW */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#E76F51]" /> Syllabus Concept Distribution
            </h3>

            <div className="space-y-3">
              {stats.map((s) => (
                <div
                  key={s.conceptId}
                  className="p-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      {s.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      {s.conceptName}
                    </h4>
                  </div>

                  {/* Distribution badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {s.mastered} Mastered
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {s.strong} Strong
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {s.developing} Developing
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {s.needsAttention} Needs Action
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
