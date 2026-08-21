'use client'

import React, { useState, useEffect } from "react"
import { MessageSquare, Send, Users, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface DiscussionGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  className?: string
  studentName?: string
}

interface DiscussionMessage {
  id: string
  sender: string
  text: string
  time: string
  isCode?: boolean
}

// LocalStorage key for persistent classroom discussion messages
function getDiscussionStorageKey(classId: string = "default"): string {
  return `aulyn_discussion_chat_${classId}`
}

function getStoredDiscussionMessages(classId: string = "default", defaultClassName: string = "Course"): DiscussionMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getDiscussionStorageKey(classId))
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.error("Error reading discussion messages:", err)
  }

  // Initial initial sample discussion thread if empty
  return [
    {
      id: "m1",
      sender: "Elena Rostova",
      text: `Welcome to the ${defaultClassName} Discussion Group! Ask questions, discuss assignments, and help classmates.`,
      time: "10:00 AM"
    },
    {
      id: "m2",
      sender: "Bob Smith",
      text: "Can someone share a hint for Question 2 in the latest assignment?",
      time: "10:15 AM"
    },
    {
      id: "m3",
      sender: "Alex Rivera",
      text: "Make sure to check boundary conditions for empty or null inputs!",
      time: "10:18 AM"
    }
  ]
}

function saveDiscussionMessages(classId: string = "default", messages: DiscussionMessage[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(getDiscussionStorageKey(classId), JSON.stringify(messages))
    window.dispatchEvent(new Event("aulyn-discussion-update"))
  } catch (err) {
    console.error("Error saving discussion messages:", err)
  }
}

export function PeerStudyRoomModal({
  open,
  onOpenChange,
  classId = "class-default",
  className = "Class Discussion Group",
  studentName = "Alex Rivera"
}: DiscussionGroupModalProps) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([])
  const [inputText, setInputText] = useState("")

  useEffect(() => {
    if (open) {
      const msgs = getStoredDiscussionMessages(classId, className)
      setMessages(msgs)
    }
  }, [open, classId, className])

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    const newMsg: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      sender: studentName,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [...messages, newMsg]
    setMessages(updated)
    saveDiscussionMessages(classId, updated)
    setInputText("")
    toast.success("Discussion message posted!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-[#8B7EC8]" /> Classroom Peer Chat
            </span>
            <span className="text-xs font-bold text-[#77716A]">{className}</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Discussion Group — {className}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Discuss course materials, ask assignment questions, and share solutions with classmates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Active Members Banner */}
          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-purple-100 text-[#8B7EC8] rounded-xl flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#292724]">Classmates Active in Discussion</h4>
                <p className="text-[10px] text-[#77716A] font-semibold">Bob Smith, Elena Rostova, {studentName}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-1 rounded-full border border-[#8B7EC8]/20 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#8B7EC8]" /> Peer Q&A Active
            </span>
          </Card>

          {/* Chat Messages Log */}
          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
            <div className="space-y-2.5 max-h-64 overflow-y-auto p-1">
              {messages.map((m) => (
                <div key={m.id} className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className={m.sender === studentName ? "text-[#E76F51]" : "text-[#8B7EC8]"}>
                      {m.sender} {m.sender === studentName ? "(You)" : ""}
                    </span>
                    <span className="text-[10px] text-[#77716A]">{m.time}</span>
                  </div>
                  <p className="text-[#292724] font-medium leading-relaxed font-sans">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="flex gap-2 pt-2 border-t border-[#E5DCD0]">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question, share a tip, or discuss course work..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage()
                }}
                className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Send
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
