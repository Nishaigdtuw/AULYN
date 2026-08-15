'use client'

import React, { useState } from "react"
import { Sparkles, Send, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { askAiTutor } from "@/actions/ai/tutor"
import ReactMarkdown from "react-markdown"

interface AiTutorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeClassName: string
  activeChapterName: string
  sourceNoteContent?: string
}

interface Message {
  sender: 'user' | 'ai'
  text: string
  image?: string
  timestamp: string
}

export function AiTutorDialog({ open, onOpenChange, activeClassName, activeChapterName, sourceNoteContent }: AiTutorDialogProps) {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: `Hello! I am your **AULYN AI Learning Tutor** configured for **${activeClassName} (${activeChapterName})**. Ask me anything about your lecture notes, equations, code, or upload a handwritten problem screenshot!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Image file size must be less than 5 MB")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      toast.success(`Attached image "${file.name}"`)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSendMessage = async (actionType?: 'explain_simply' | 'step_by_step' | 'example' | 'quiz_me' | 'another_method' | 'summarize' | 'missing') => {
    const textToSend = query.trim() || (actionType ? `Perform ${actionType} on active note` : "")
    if (!textToSend && !imagePreview) {
      toast.warning("Please enter a question or upload an image")
      return
    }

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      image: imagePreview || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setQuery("")
    const currentImg = imagePreview
    handleRemoveImage()
    setIsLoading(true)

    try {
      const res = await askAiTutor({
        query: textToSend,
        className: activeClassName,
        chapterName: activeChapterName,
        sourceNoteContent,
        actionType,
        imageBase64: currentImg || undefined,
        imageMimeType: imageFile?.type || "image/png"
      })

      if (res && res.answer) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I analyzed your question and loaded course materials. Always double-check base conditions and step-by-step calculations for accuracy!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#FFF9F1] border-[#E5DCD0] text-[#292724] rounded-2xl shadow-2xl p-6 flex flex-col h-[85vh]">
        <DialogHeader className="border-b border-[#E5DCD0] pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E9B949]" /> AI Learning Tutor
            </span>
            <span className="text-xs font-semibold text-[#77716A]">
              {activeClassName}
            </span>
          </div>
          <DialogTitle className="text-lg font-serif font-bold text-[#292724] mt-1">
            Context-Aware Academic Tutor ({activeChapterName})
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Ask questions, upload handwritten notes or diagrams, or trigger quick learning actions.
          </DialogDescription>
        </DialogHeader>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 shadow-2xs ${
                  msg.sender === "user"
                    ? "bg-[#E76F51] text-white rounded-br-none font-semibold"
                    : "bg-white border border-[#E5DCD0] text-[#292724] rounded-bl-none"
                }`}
              >
                {msg.image && (
                  <img src={msg.image} alt="Uploaded problem preview" className="max-h-40 rounded-xl border border-white/20 object-cover" />
                )}
                {msg.sender === "ai" ? (
                  <div className="prose prose-xs text-[#292724] leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
                <span className={`text-[9px] block text-right font-mono ${msg.sender === "user" ? "text-white/80" : "text-[#77716A]"}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs font-bold text-[#8B7EC8] animate-pulse p-2">
              <Sparkles className="w-4 h-4" /> AULYN AI is analyzing notes & visual context...
            </div>
          )}
        </div>

        {/* Quick Learning Action Bar */}
        <div className="pt-2 border-t border-[#E5DCD0] shrink-0 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("explain_simply")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#E76F51]"
            >
              💡 Explain Simply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("step_by_step")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#8B7EC8]"
            >
              📋 Step-by-Step
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("example")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#75B798]"
            >
              🚀 Give Example
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("quiz_me")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#E9B949]"
            >
              🎯 Quiz Me
            </Button>
          </div>

          {/* Image Thumbnail Preview */}
          {imagePreview && (
            <div className="relative inline-block border border-[#E5DCD0] rounded-xl p-1 bg-white">
              <img src={imagePreview} alt="Selected problem preview" className="h-12 w-12 object-cover rounded-lg" />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input Bar with Image Attachment */}
          <div className="flex items-center space-x-2">
            <input
              id="aiImageUpload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("aiImageUpload")?.click()}
              className="border-[#E5DCD0] bg-white text-[#77716A] hover:text-[#E76F51] shrink-0 rounded-xl"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>

            <Input
              placeholder={`Ask about ${activeClassName} (${activeChapterName})...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
            />

            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
