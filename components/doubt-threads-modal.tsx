'use client'

import React, { useState, useEffect, useCallback } from "react"
import { HelpCircle, Send, CheckCircle2, Award, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { DoubtThread, DoubtReply, getDoubtThreads, saveDoubtThread } from "@/lib/data-store"

interface DoubtThreadsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  className?: string
  userRole: 'student' | 'teacher'
  studentName?: string
}

export function DoubtThreadsModal({
  open,
  onOpenChange,
  classId = "dsa-2026",
  className = "Data Structures & Algorithms",
  userRole,
  studentName = "Alex Rivera"
}: DoubtThreadsModalProps) {
  const [threads, setThreads] = useState<DoubtThread[]>([])
  const [selectedThread, setSelectedThread] = useState<DoubtThread | null>(null)
  const [newQuestion, setNewQuestion] = useState("")
  const [newReply, setNewReply] = useState("")

  const reloadThreads = useCallback(() => {
    const data = getDoubtThreads(classId)
    if (data.length === 0) {
      const initial: DoubtThread = {
        id: "d-1",
        classId,
        className,
        contextType: "Chapter",
        contextTitle: "Trees & Tree Traversal",
        studentId: "s-2",
        studentName: "Bob Smith",
        question: "Why is the In-Order traversal of a Binary Search Tree guaranteed to output elements in sorted order?",
        status: "Answered",
        createdAt: "2026-08-14 02:15 PM",
        bountyPoints: 10,
        replies: [
          {
            id: "r-1",
            threadId: "d-1",
            authorId: "student-demo",
            authorName: "Alex Rivera",
            authorRole: "student",
            content: "Because in a BST, for every node X, all left keys are smaller and all right keys are larger. In-order visits Left -> Node -> Right, which inherently steps from smallest to largest key!",
            timestamp: "2026-08-14 02:20 PM",
            isHelpful: true
          }
        ]
      }
      saveDoubtThread(initial)
      setThreads([initial])
      setSelectedThread(initial)
    } else {
      setThreads(data)
      setSelectedThread(data[0] || null)
    }
  }, [classId, className])

  useEffect(() => {
    if (open) {
      reloadThreads()
    }
  }, [open, reloadThreads])

  const handlePostNewDoubt = () => {
    if (!newQuestion.trim()) {
      toast.warning("Please type your doubt question before posting")
      return
    }

    const t: DoubtThread = {
      id: `d-${Date.now()}`,
      classId,
      className,
      contextType: "Classroom",
      contextTitle: `${className} Core Concept`,
      studentId: "student-demo",
      studentName,
      question: newQuestion.trim(),
      status: "Open",
      createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      bountyPoints: 10,
      replies: []
    }

    saveDoubtThread(t)
    setThreads(getDoubtThreads(classId))
    setSelectedThread(t)
    setNewQuestion("")
    toast.success("Doubt thread published! Knowledge bounty (+10 Points) active.")
  }

  const handlePostReply = () => {
    if (!newReply.trim() || !selectedThread) return

    const r: DoubtReply = {
      id: `r-${Date.now()}`,
      threadId: selectedThread.id,
      authorId: userRole === 'teacher' ? 'teacher-demo' : 'student-demo',
      authorName: userRole === 'teacher' ? 'Prof. Sarah Jenkins' : studentName,
      authorRole: userRole,
      content: newReply.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedThread: DoubtThread = {
      ...selectedThread,
      status: "Answered",
      replies: [...selectedThread.replies, r]
    }

    saveDoubtThread(updatedThread)
    setSelectedThread(updatedThread)
    setThreads(getDoubtThreads(classId))
    setNewReply("")
    toast.success("Reply posted to doubt thread!")
  }

  const handleMarkHelpful = (replyId: string) => {
    if (!selectedThread) return
    const updatedReplies = selectedThread.replies.map((rep) => {
      if (rep.id === replyId) return { ...rep, isHelpful: true }
      return rep
    })

    const updatedThread: DoubtThread = {
      ...selectedThread,
      status: "Resolved",
      replies: updatedReplies
    }

    saveDoubtThread(updatedThread)
    setSelectedThread(updatedThread)
    setThreads(getDoubtThreads(classId))
    toast.success("Answer marked as Helpful! +10 Knowledge Points awarded to answer author.", {
      icon: "🏆"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#E9B949]" /> Doubt Bounty System (+10 Points)
            </span>
            <span className="text-xs font-bold text-[#77716A]">{className}</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Contextual Doubt Threads & Peer Discussions
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Ask questions, collaborate on academic doubts, and earn Knowledge Reputation Points.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
          <div className="space-y-3 md:border-r md:border-[#E5DCD0] md:pr-3">
            <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Active Doubts</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThread(t)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedThread?.id === t.id ? "bg-[#FFF9F1] border-[#E76F51] shadow-2xs" : "bg-white border-[#E5DCD0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#E76F51]">{t.contextType}</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">{t.status}</span>
                  </div>
                  <h5 className="text-xs font-serif font-bold text-[#292724] line-clamp-1 mt-1">{t.question}</h5>
                  <p className="text-[10px] text-[#77716A] font-semibold mt-1">Asked by {t.studentName}</p>
                </button>
              ))}
            </div>

            {userRole === 'student' && (
              <div className="space-y-2 pt-2 border-t border-[#E5DCD0]">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ask a doubt about this classroom..."
                  className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
                />
                <Button
                  onClick={handlePostNewDoubt}
                  className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2 rounded-xl shadow-2xs cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" /> Post Academic Doubt
                </Button>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            {selectedThread ? (
              <>
                <Card className="bg-white border border-[#E5DCD0] rounded-2xl p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#77716A] uppercase">{selectedThread.contextTitle}</span>
                    <span className="text-[10px] font-bold text-[#E9B949] bg-[#E9B949]/15 px-2 py-0.5 rounded-full border border-[#E9B949]/30">
                      🏆 +{selectedThread.bountyPoints} Knowledge Points
                    </span>
                  </div>
                  <h3 className="text-sm font-serif font-bold text-[#292724]">{selectedThread.question}</h3>
                  <p className="text-[10px] text-[#77716A]">Asked by <strong>{selectedThread.studentName}</strong> on {selectedThread.createdAt}</p>
                </Card>

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {selectedThread.replies.map((r) => (
                    <div key={r.id} className={`p-3 rounded-xl border text-xs space-y-1.5 ${r.isHelpful ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-[#E5DCD0]'}`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className={r.authorRole === 'teacher' ? 'text-[#8B7EC8]' : 'text-[#292724]'}>
                          {r.authorName} ({r.authorRole === 'teacher' ? 'Instructor' : 'Peer'})
                        </span>
                        <span className="text-[10px] text-[#77716A]">{r.timestamp}</span>
                      </div>
                      <p className="text-[#292724] font-medium">{r.content}</p>

                      {r.isHelpful ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Helpful Answer Verified (+10 Points)
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkHelpful(r.id)}
                          className="text-[10px] text-emerald-700 hover:bg-emerald-100 font-bold h-6 px-2 rounded-lg cursor-pointer"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" /> Mark Helpful
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Input
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Provide a helpful explanation..."
                    className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
                  />
                  <Button
                    onClick={handlePostReply}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" /> Answer
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#77716A] italic">Select a doubt thread to view responses.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
