'use client'

import React, { useState } from "react"
import { Users, Flame, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface PeerStudyRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  className?: string
  studentName?: string
}

interface PeerChatMessage {
  id: string
  sender: string
  text: string
  time: string
}

export function PeerStudyRoomModal({
  open,
  onOpenChange,
  className = "Data Structures & Algorithms"
}: PeerStudyRoomModalProps) {
  const [messages, setMessages] = useState<PeerChatMessage[]>([
    { id: "m1", sender: "Bob Smith", text: "Anyone working on the Tree Traversal recursion lab?", time: "10:14 AM" },
    { id: "m2", sender: "Elena Rostova", text: "Yes! Remember base case `if not root: return` or you'll get recursion depth error.", time: "10:16 AM" }
  ])
  const [inputText, setInputText] = useState("")
  const [streakDays] = useState(4)

  const handleSendMessage = () => {
    if (!inputText.trim()) return
    const newMsg: PeerChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "Alex Rivera",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText("")
    toast.success("Message sent to Peer Study Room!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#E76F51]" /> {streakDays}-Day Study Streak Active!
            </span>
            <span className="text-xs font-bold text-[#77716A]">{className}</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Peer Study Lounge & Focus Room
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Collaborate in real-time with classmates and keep your daily learning streak alive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#292724]">3 Peers Online Now</h4>
                <p className="text-[10px] text-[#77716A] font-semibold">Bob Smith, Elena Rostova, Alex Rivera</p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Focus Mode On
            </span>
          </Card>

          <Card className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="p-2.5 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#E76F51]">{m.sender}</span>
                    <span className="text-[10px] text-[#77716A]">{m.time}</span>
                  </div>
                  <p className="text-[#292724] font-medium">{m.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#E5DCD0]">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Share a tip or ask peers..."
                className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
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
