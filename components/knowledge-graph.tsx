'use client'

import React, { useState, useEffect, useCallback } from "react"
import { Sparkles, AlertTriangle, ArrowRight, Award, PlayCircle, BookOpen, Layers } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { StudentMastery } from "@/lib/data-store"
import { getStudentMastery } from "@/lib/mastery-engine"

interface KnowledgeGraphProps {
  classId?: string
  studentId?: string
  onSelectAction?: (action: string, conceptId: string) => void
}

export function KnowledgeGraph({
  classId = "dsa-2026",
  studentId = "student-demo",
  onSelectAction
}: KnowledgeGraphProps) {
  const [masteryList, setMasteryList] = useState<StudentMastery[]>([])
  const [selectedConcept, setSelectedConcept] = useState<StudentMastery | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const reloadMastery = useCallback(() => {
    const data = getStudentMastery(studentId, classId)
    setMasteryList(data)
  }, [classId, studentId])

  useEffect(() => {
    reloadMastery()
    const handleUpdate = () => reloadMastery()
    window.addEventListener("aulyn-mastery-update", handleUpdate)
    window.addEventListener("aulyn-data-update", handleUpdate)
    return () => {
      window.removeEventListener("aulyn-mastery-update", handleUpdate)
      window.removeEventListener("aulyn-data-update", handleUpdate)
    }
  }, [classId, studentId, reloadMastery])

  const handleNodeClick = (item: StudentMastery) => {
    setSelectedConcept(item)
    setModalOpen(true)
  }

  return (
    <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-sm rounded-2xl p-5 space-y-5">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-serif font-black text-[#292724] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#E76F51]" /> Personalized Knowledge Graph
          </CardTitle>
          <CardDescription className="text-xs text-[#77716A] font-semibold mt-0.5">
            Real-time concept mastery mapped from quiz attempts, assignments, AI vivas, and code visualizer execution.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Strong</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Learning</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Weak</span>
        </div>
      </CardHeader>

      <div className="p-6 bg-white border border-[#E5DCD0] rounded-2xl relative overflow-hidden space-y-6 shadow-2xs">
        <div className="hidden md:block absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="15%" y1="20%" x2="40%" y2="20%" stroke="#E76F51" strokeWidth="2" strokeDasharray="4" />
            <line x1="40%" y1="20%" x2="65%" y2="40%" stroke="#E76F51" strokeWidth="2" strokeDasharray="4" />
            <line x1="65%" y1="40%" x2="85%" y2="40%" stroke="#E76F51" strokeWidth="2" strokeDasharray="4" />
          </svg>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
          {masteryList.map((item) => {
            const isWeak = item.state === "Weak"
            const isStrong = item.state === "Strong"
            const isLearning = item.state === "Learning"

            return (
              <button
                key={item.conceptId}
                onClick={() => handleNodeClick(item)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-1 relative group ${
                  isWeak ? "bg-red-50/90 border-red-300 hover:border-red-500" :
                  isStrong ? "bg-emerald-50/90 border-emerald-300 hover:border-emerald-500" :
                  isLearning ? "bg-amber-50/90 border-amber-300 hover:border-amber-500" :
                  "bg-[#FFF9F1] border-[#E5DCD0]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77716A]">
                    {item.conceptId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isWeak ? "bg-red-200 text-red-800" :
                    isStrong ? "bg-emerald-200 text-emerald-800" :
                    isLearning ? "bg-amber-200 text-amber-800" :
                    "bg-gray-200 text-gray-800"
                  }`}>
                    {item.score}% ({item.state})
                  </span>
                </div>

                <h4 className="text-sm font-serif font-bold text-[#292724] mt-2 group-hover:text-[#E76F51] transition-colors">
                  {item.conceptName}
                </h4>

                <p className="text-[11px] text-[#77716A] font-semibold mt-1 flex items-center gap-1">
                  {item.evidenceList.length} Evidence Records attached
                </p>

                {isWeak && (
                  <div className="mt-3 pt-2 border-t border-red-200 flex items-center justify-between text-[11px] text-red-700 font-bold">
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Action Required</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedConcept && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
            <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#77716A] uppercase">{selectedConcept.conceptId}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  selectedConcept.state === "Weak" ? "bg-red-100 text-red-700 border border-red-200" :
                  selectedConcept.state === "Strong" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                  "bg-amber-100 text-amber-700 border border-amber-200"
                }`}>
                  {selectedConcept.score}% Mastery ({selectedConcept.state})
                </span>
              </div>
              <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-1">
                {selectedConcept.conceptName}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#77716A]">
                Detailed evidence trail and recommended learning action plan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#E76F51]" /> Assessment Evidence Breakdown
                </h4>

                {selectedConcept.evidenceList.length > 0 ? (
                  selectedConcept.evidenceList.map((ev) => (
                    <div key={ev.id} className="p-3 bg-white border border-[#E5DCD0] rounded-xl text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#292724]">{ev.type}: {ev.title}</span>
                        <span className="text-[#E76F51] font-mono">{ev.percentage}% ({ev.score}/{ev.maxScore})</span>
                      </div>
                      <p className="text-[11px] text-[#77716A] font-medium">{ev.notes}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#77716A] italic">No evidence recorded yet.</p>
                )}
              </div>

              <div className="p-4 bg-white border-2 border-[#E76F51]/40 rounded-2xl space-y-2 shadow-2xs">
                <h4 className="text-xs font-serif font-bold text-[#292724] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E9B949]" /> Recommended Action Plan
                </h4>
                <p className="text-xs text-[#77716A] font-semibold">
                  {selectedConcept.state === "Weak"
                    ? "Review DFS call stack principles with AI Tutor → Visualize in Code IDE → Take Adaptive Quiz."
                    : "Practice advanced algorithm challenges or attempt an AI Viva examination."}
                </p>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setModalOpen(false)
                      if (onSelectAction) onSelectAction("tutor", selectedConcept.conceptId)
                    }}
                    className="flex-1 bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1" /> Open AI Tutor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalOpen(false)
                      if (onSelectAction) onSelectAction("quiz", selectedConcept.conceptId)
                    }}
                    className="flex-1 border-[#E5DCD0] text-[#292724] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    <PlayCircle className="w-3.5 h-3.5 mr-1 text-[#8B7EC8]" /> Take Adaptive Quiz
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
