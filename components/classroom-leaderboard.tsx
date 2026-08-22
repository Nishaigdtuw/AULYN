"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Trophy,
  ChevronRight,
  Info,
  X,
  Flame
} from "lucide-react"
import { getClassroomLeaderboardServer } from "@/actions/intelligence/action"
import { StudentLeaderboardEntry, RisingLearnerEntry } from "@/lib/mastery-engine"

interface ClassroomLeaderboardProps {
  classId: string
  currentStudentId?: string
}

export function ClassroomLeaderboard({ classId, currentStudentId = "student-demo" }: ClassroomLeaderboardProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [top5, setTop5] = useState<StudentLeaderboardEntry[]>([])
  const [risingLearners, setRisingLearners] = useState<RisingLearnerEntry[]>([])
  const [currentStudentEntry, setCurrentStudentEntry] = useState<StudentLeaderboardEntry | undefined>()
  const [totalEnrolled, setTotalEnrolled] = useState<number>(0)
  const [selectedEntry, setSelectedEntry] = useState<StudentLeaderboardEntry | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getClassroomLeaderboardServer(classId, currentStudentId)
      if (res.success) {
        setTop5(res.top5 || [])
        setRisingLearners(res.risingLearners || [])
        setCurrentStudentEntry(res.currentStudentEntry)
        setTotalEnrolled(res.totalEnrolled || 0)
      }
    } catch (err) {
      console.warn("Failed to fetch classroom leaderboard:", err)
    } finally {
      setLoading(false)
    }
  }, [classId, currentStudentId])

  useEffect(() => {
    fetchLeaderboard()

    const handleUpdate = () => fetchLeaderboard()
    window.addEventListener("aulyn-evidence-recorded", handleUpdate)

    return () => {
      window.removeEventListener("aulyn-evidence-recorded", handleUpdate)
    }
  }, [fetchLeaderboard])

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-black text-sm shadow-xs">
          🥇 1
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 flex items-center justify-center font-black text-sm shadow-xs">
          🥈 2
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-black text-sm shadow-xs">
          🥉 3
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-xs flex items-center justify-center border border-stone-200 dark:border-stone-700">
        #{rank}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#292724] text-[#FFF9F1] p-6 rounded-2xl border border-[#3D3A36]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold tracking-tight">Classroom Mastery League</h2>
          </div>
          <p className="text-sm text-[#FFF9F1]/70">
            Top learning performance based on real quiz accuracy, assignment implementations, oral viva reasoning, and practice consistency.
          </p>
        </div>

        <div className="bg-[#1F1D1B] px-4 py-2 rounded-xl border border-[#3D3A36] text-center">
          <div className="text-xs text-[#FFF9F1]/60 font-medium">Class Roster</div>
          <div className="text-lg font-bold text-amber-400">{totalEnrolled} Students</div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500 animate-pulse">
          Calculating transparent classroom performance ranks...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TOP 5 LEADERBOARD BOARD (2 Columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Top 5 Classroom Performers
              </h3>
              <span className="text-xs text-stone-400 font-medium">Real Roster Calculation</span>
            </div>

            {top5.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                Leaderboard will appear after enough assessment evidence is collected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {top5.map((entry) => (
                  <div
                    key={entry.studentId}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      entry.isCurrentStudent
                        ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 shadow-xs"
                        : "bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-amber-400/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankBadge(entry.rank)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {entry.studentName}
                          </span>
                          {entry.isCurrentStudent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E76F51] text-white">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                          {entry.quizScore !== null && <span>Quiz: {entry.quizScore}%</span>}
                          {entry.assignmentScore !== null && <span>Assign: {entry.assignmentScore}%</span>}
                          {entry.vivaScore !== null && <span>Viva: {entry.vivaScore}%</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-base font-black text-stone-900 dark:text-stone-100">
                          {entry.performanceScore}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          Score
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Current Student Rank Card if outside Top 5 */}
            {currentStudentEntry && currentStudentEntry.rank > 5 && (
              <div className="mt-4 p-4 bg-[#292724] text-[#FFF9F1] rounded-xl border border-[#3D3A36] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E76F51] text-white font-bold text-xs flex items-center justify-center">
                    #{currentStudentEntry.rank}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#FFF9F1]">Your Personal Rank</div>
                    <div className="text-xs text-[#FFF9F1]/70">
                      Keep completing viva defenses and practice quizzes to climb the leaderboard!
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-amber-400">
                    {currentStudentEntry.performanceScore}
                  </div>
                  <button
                    onClick={() => setSelectedEntry(currentStudentEntry)}
                    className="text-[11px] text-[#E76F51] font-semibold underline mt-0.5"
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RISING LEARNERS & LEADERBOARD RULES */}
          <div className="space-y-6">
            {/* Rising Learners Box */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm border-b border-stone-100 dark:border-stone-800 pb-2.5">
                <Flame className="w-4 h-4 text-rose-500" /> Rising Learners (Most Improved)
              </div>

              {risingLearners.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">
                  Not enough learning history yet to compute improvement trends.
                </div>
              ) : (
                <div className="space-y-2">
                  {risingLearners.map((rl) => (
                    <div
                      key={rl.studentId}
                      className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">{rl.studentName}</div>
                        <div className="text-[10px] text-stone-500">{rl.conceptName}</div>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                        +{rl.scoreImprovement}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transparent Calculation Breakdown Explanation Box */}
            <div className="bg-stone-50 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mb-1">
                <Info className="w-4 h-4 text-[#E76F51]" /> How Score is Calculated
              </div>
              <ul className="space-y-1 pl-4 list-disc text-[11px]">
                <li><strong>Quizzes (30%)</strong>: Accuracy on timed objective quizzes</li>
                <li><strong>Assignments (25%)</strong>: Evaluated written submissions</li>
                <li><strong>Spoken Viva (25%)</strong>: Verified verbal reasoning depth</li>
                <li><strong>Improvement (15%)</strong>: Positive trend across attempts</li>
                <li><strong>Consistency (5%)</strong>: Regular activity participation</li>
              </ul>
              <p className="text-[10px] text-stone-400 pt-1 border-t border-stone-200 dark:border-stone-700">
                Weights normalize dynamically if optional evidence is pending.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PERFORMANCE BREAKDOWN POPUP MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              {getRankBadge(selectedEntry.rank)}
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {selectedEntry.studentName}
                </h3>
                <div className="text-xs text-stone-500 font-medium">
                  Class Performance Breakdown
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 text-center mb-5">
              <div className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                Overall Performance Score
              </div>
              <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-1">
                {selectedEntry.performanceScore} / 100
              </div>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg">
                <span className="text-stone-600 dark:text-stone-400 font-medium">Quiz Accuracy Component (30%)</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {selectedEntry.quizScore !== null ? `${selectedEntry.quizScore}%` : "No Quizzes"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg">
                <span className="text-stone-600 dark:text-stone-400 font-medium">Assignment Component (25%)</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {selectedEntry.assignmentScore !== null ? `${selectedEntry.assignmentScore}%` : "No Submissions"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg">
                <span className="text-stone-600 dark:text-stone-400 font-medium">Spoken Viva Component (25%)</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {selectedEntry.vivaScore !== null ? `${selectedEntry.vivaScore}%` : "No Viva"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg">
                <span className="text-stone-600 dark:text-stone-400 font-medium">Learning Trend (15%)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{selectedEntry.improvementScore}% Trend
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg">
                <span className="text-stone-600 dark:text-stone-400 font-medium">Consistency (5%)</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {selectedEntry.consistencyScore}% Score
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
