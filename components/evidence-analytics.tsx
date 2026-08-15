'use client'

import React, { useState, useEffect, useCallback } from "react"
import { TrendingUp, ShieldCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StudentMastery } from "@/lib/data-store"
import { getStudentMastery } from "@/lib/mastery-engine"

interface EvidenceAnalyticsProps {
  classId?: string
  studentId?: string
}

export function EvidenceAnalytics({
  classId = "dsa-2026",
  studentId = "student-demo"
}: EvidenceAnalyticsProps) {
  const [masteryData, setMasteryData] = useState<StudentMastery[]>([])
  const [selectedConceptId, setSelectedConceptId] = useState<string>("tree-traversal")

  const reloadData = useCallback(() => {
    const data = getStudentMastery(studentId, classId)
    setMasteryData(data)
  }, [classId, studentId])

  useEffect(() => {
    reloadData()
    const handleUpdate = () => reloadData()
    window.addEventListener("aulyn-mastery-update", handleUpdate)
    window.addEventListener("aulyn-data-update", handleUpdate)
    return () => {
      window.removeEventListener("aulyn-mastery-update", handleUpdate)
      window.removeEventListener("aulyn-data-update", handleUpdate)
    }
  }, [classId, studentId, reloadData])

  const selectedConcept = masteryData.find((m) => m.conceptId === selectedConceptId) || masteryData[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl p-5">
          <p className="text-xs font-bold text-[#77716A] uppercase tracking-wider">Before Intervention Class Mastery</p>
          <div className="text-3xl font-serif font-black text-[#77716A] mt-1">51%</div>
          <p className="text-[11px] text-[#77716A] font-semibold mt-1">Baseline metric prior to live session & AI tutor</p>
        </Card>

        <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-2 border-emerald-300 shadow-2xs rounded-2xl p-5">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">After Intervention Class Mastery</p>
          <div className="text-3xl font-serif font-black text-emerald-700 mt-1">74%</div>
          <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> +23% Class Net Improvement
          </p>
        </Card>

        <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-2xs rounded-2xl p-5">
          <p className="text-xs font-bold text-[#77716A] uppercase tracking-wider">Verified Evidence Multiplier</p>
          <div className="text-3xl font-serif font-black text-[#8B7EC8] mt-1">5 Evidence Sources</div>
          <p className="text-[11px] text-[#77716A] font-semibold mt-1">Signals + Visualizer + Quiz + Assignment + Viva</p>
        </Card>
      </div>

      <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-sm rounded-2xl p-6 space-y-6">
        <CardHeader className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-serif font-black text-[#292724] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Evidence-Based Learning Audit Log
            </CardTitle>
            <CardDescription className="text-xs text-[#77716A] font-semibold mt-0.5">
              Inspect exact empirical learning evidence explaining why student mastery score changed over time.
            </CardDescription>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {masteryData.map((m) => (
              <button
                key={m.conceptId}
                onClick={() => setSelectedConceptId(m.conceptId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                  selectedConceptId === m.conceptId
                    ? "bg-[#E76F51] text-white shadow-2xs"
                    : "bg-[#F1E8DD] text-[#292724] hover:bg-[#E5DCD0]"
                }`}
              >
                {m.conceptName}
              </button>
            ))}
          </div>
        </CardHeader>

        {selectedConcept && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-[#E5DCD0] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-[#77716A] uppercase">{selectedConcept.conceptId}</span>
                <h3 className="text-lg font-serif font-black text-[#292724]">{selectedConcept.conceptName}</h3>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase">Calculated Mastery</p>
                  <p className="text-xl font-serif font-black text-emerald-700">{selectedConcept.score}% ({selectedConcept.state})</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">
                Evidence Log Trail ({selectedConcept.evidenceList.length} Entries)
              </h4>

              <div className="space-y-2.5">
                {selectedConcept.evidenceList.length > 0 ? (
                  selectedConcept.evidenceList.map((ev, idx) => (
                    <div key={ev.id} className="p-4 bg-white border border-[#E5DCD0] rounded-2xl flex items-start justify-between gap-3 shadow-2xs hover:border-[#E76F51]/40 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-[#FFF9F1] border border-[#E5DCD0]">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-serif font-bold text-sm text-[#292724]">{ev.type}: {ev.title}</span>
                            <span className="text-[10px] font-bold text-[#77716A] bg-[#F1E8DD] px-2 py-0.5 rounded-full">
                              {ev.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-[#77716A] font-medium mt-1">{ev.notes}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-1 rounded-full border border-[#E76F51]/30">
                          {ev.percentage}% ({ev.score}/{ev.maxScore})
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#77716A] italic">No evidence recorded for this concept yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
