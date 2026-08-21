'use client'

import React from "react"
import { Download, MessageSquare, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { FinalLectureSummary } from "@/lib/data-store"


interface StudentLectureSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: FinalLectureSummary | null
  onAskAiTutor?: (summaryText: string) => void
}

export function StudentLectureSummaryModal({
  open,
  onOpenChange,
  summary,
  onAskAiTutor
}: StudentLectureSummaryModalProps) {
  if (!summary) return null

  const handleDownload = () => {
    const formattedContent = `# ${summary.className} — ${summary.topic}
Lecture Date: ${summary.lectureDate}
Instructor: ${summary.teacherName}

## Overview
${summary.overview}

## Core Concepts Covered
${summary.coreConcepts.map(c => `- ${c.title}: ${c.explanation}`).join('\n')}

## Important Definitions
${summary.importantDefinitions.map(d => `- ${d.term}: ${d.definition}`).join('\n')}

## Algorithms & Code Logic
${summary.codeLogic || "N/A"}

## Examples Covered
${summary.examplesCovered.map(e => `- ${e}`).join('\n')}

## Common Mistakes / Clarifications
${summary.commonMistakes.map(m => `- ${m}`).join('\n')}

## Quick Revision
${summary.quickRevision.map(q => `- ${q}`).join('\n')}

## Key Takeaways
${summary.keyTakeaways.map(k => `- ${k}`).join('\n')}
`
    const blob = new Blob([formattedContent], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${summary.topic.replace(/\s+/g, '_')}_Lecture_Summary.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded Lecture Summary!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published Lecture Summary
            </span>
            <span className="text-xs font-mono font-bold text-[#77716A]">
              Lecture Date: {summary.lectureDate}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            {summary.className} — {summary.topic}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Official final lecture study note generated from live class & verified by {summary.teacherName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Lecture Overview */}
          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-1.5">
            <h4 className="text-xs font-bold text-[#E76F51] uppercase tracking-wide">Lecture Overview</h4>
            <p className="text-xs text-[#292724] font-medium leading-relaxed">
              {summary.overview}
            </p>
          </Card>

          {/* Core Concepts */}
          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#8B7EC8] uppercase tracking-wide">Core Concepts</h4>
            <div className="space-y-2">
              {summary.coreConcepts.map((cc, i) => (
                <div key={i} className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs space-y-0.5">
                  <p className="font-bold text-[#292724]">{cc.title}</p>
                  <p className="text-[#77716A] font-medium">{cc.explanation}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Definitions */}
          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-[#75B798] uppercase tracking-wide">Important Definitions</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              {summary.importantDefinitions.map((d, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong>{d.term}:</strong> {d.definition}
                </div>
              ))}
            </div>
          </Card>

          {/* Code Logic */}
          {summary.codeLogic && (
            <Card className="bg-slate-900 border border-slate-800 text-slate-100 shadow-2xs rounded-2xl p-4 space-y-2 font-mono text-xs">
              <h4 className="font-bold text-amber-400 uppercase tracking-wide font-sans text-xs">Algorithms / Code Logic</h4>
              <pre className="overflow-x-auto p-3 bg-slate-950 rounded-xl border border-slate-800 leading-relaxed text-[11px]">
                {summary.codeLogic}
              </pre>
            </Card>
          )}

          {/* Quick Revision & Key Takeaways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-amber-50 border border-amber-200 shadow-2xs rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Quick Revision</h4>
              <ul className="list-disc list-inside text-xs text-amber-900 font-semibold space-y-1">
                {summary.quickRevision.map((qr, i) => (
                  <li key={i}>{qr}</li>
                ))}
              </ul>
            </Card>

            <Card className="bg-emerald-50 border border-emerald-200 shadow-2xs rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Key Takeaways</h4>
              <ul className="list-disc list-inside text-xs text-emerald-900 font-semibold space-y-1">
                {summary.keyTakeaways.map((kt, i) => (
                  <li key={i}>{kt}</li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="pt-3 border-t border-[#E5DCD0] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="text-xs border-[#E5DCD0] text-[#E76F51] hover:bg-[#E76F51] hover:text-white font-bold h-8 px-3 rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Summary
              </Button>
              {onAskAiTutor && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onAskAiTutor(`${summary.topic}: ${summary.overview}`)
                  }}
                  className="bg-[#8B7EC8] hover:bg-[#786bb8] text-white font-bold text-xs h-8 px-4 rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask AI Tutor About Lecture
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold h-8">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
