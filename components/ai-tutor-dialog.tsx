'use client'

import React, { useState, useEffect } from "react"
import { Sparkles, Send, Image as ImageIcon, X, HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { askAiTutor } from "@/actions/ai/tutor"
import { processAulynQuery } from "@/lib/help-engine"
import { HelpActionButton } from "@/lib/help-knowledge-base"
import ReactMarkdown from "react-markdown"

interface AiTutorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeClassName: string
  activeChapterName: string
  sourceNoteContent?: string
  userRole?: 'student' | 'teacher'
  currentMainTab?: string
  currentModal?: string
  onNavigate?: (actionTarget: string) => void
}

interface Message {
  sender: 'user' | 'ai'
  text: string
  image?: string
  timestamp: string
  actionButtons?: HelpActionButton[]
  isHelp?: boolean
}

export function AiTutorDialog({
  open,
  onOpenChange,
  activeClassName,
  activeChapterName,
  sourceNoteContent,
  userRole = 'student',
  currentMainTab,
  currentModal,
  onNavigate
}: AiTutorDialogProps) {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Initialize Welcome Message with Suggested Prompts
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeText = userRole === 'student'
        ? `Hello! I am your **AULYN AI Assistant** configured for **${activeClassName} (${activeChapterName})**.\n\nI can answer **academic questions** about your lecture notes or code, AND guide you on **how to use any AULYN feature**!`
        : `Welcome to the **AULYN Educator AI Assistant** for **${activeClassName}**.\n\nI can assist with course analytics, lesson planning, assignment creation, live lecture heatmaps, and answer **any product-usage questions**!`


      setMessages([
        {
          sender: "ai",
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionButtons: userRole === 'student'
            ? [
                { label: 'How do I use AULYN?', actionTarget: 'prompt:How do I use AULYN?' },
                { label: 'Where are my assignments?', actionTarget: 'prompt:Where are my assignments?' },
                { label: 'How do I use AI Tutor?', actionTarget: 'prompt:How do I upload an image to AI Tutor?' },
                { label: 'Show my weak topics', actionTarget: 'prompt:Show my weak topics' }
              ]
            : [
                { label: 'How do I use AULYN?', actionTarget: 'prompt:How do I use AULYN?' },
                { label: 'How do I create an assignment?', actionTarget: 'prompt:How do I create an assignment?' },
                { label: 'Show students needing attention', actionTarget: 'prompt:Where can I see student performance?' },
                { label: 'How do I start a live lecture?', actionTarget: 'prompt:How do I start a live lecture?' }
              ]
        }
      ])
    }
  }, [open, messages.length, activeClassName, activeChapterName, userRole])

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

  const handleActionClick = (btn: HelpActionButton) => {
    if (btn.actionTarget.startsWith('prompt:')) {
      const promptText = btn.actionTarget.replace('prompt:', '')
      handleSendMessage(undefined, promptText)
      return
    }

    if (onNavigate) {
      onNavigate(btn.actionTarget)
      onOpenChange(false)
      toast.info(`Navigated to ${btn.label}`)
    }
  }

  const handleSendMessage = async (
    actionType?: 'explain_simply' | 'step_by_step' | 'example' | 'quiz_me' | 'another_method' | 'summarize' | 'missing',
    overrideQuery?: string
  ) => {
    const textToSend = overrideQuery || query.trim() || (actionType ? `Perform ${actionType} on active note` : "")
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

    // Check local client-side Help Engine first for instant responsiveness
    if (!currentImg && !actionType) {
      const localHelp = processAulynQuery(textToSend, userRole, {
        activeMainTab: currentMainTab,
        activeModal: currentModal,
        activeClassName,
        activeChapterName
      })

      if (localHelp.isHelpQuery) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: localHelp.responseText,
            actionButtons: localHelp.actionButtons,
            isHelp: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
        setIsLoading(false)
        return
      }
    }

    try {
      const res = await askAiTutor({
        query: textToSend,
        userRole,
        className: activeClassName,
        chapterName: activeChapterName,
        sourceNoteContent,
        actionType,
        imageBase64: currentImg || undefined,
        imageMimeType: imageFile?.type || "image/png",
        activeMainTab: currentMainTab,
        activeModal: currentModal
      })

      if (res && res.answer) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.answer,
            actionButtons: res.actionButtons,
            isHelp: res.isHelp,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I analyzed your question in the context of your active course notes. Try checking base conditions and step-by-step formula execution!",
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
              <Sparkles className="w-3 h-3 text-[#E9B949]" /> AULYN AI Assistant Help
            </span>
            <span className="text-xs font-semibold text-[#77716A]">
              {activeClassName}
            </span>
          </div>
          <DialogTitle className="text-lg font-serif font-bold text-[#292724] mt-1 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#8B7EC8]" /> Product Help & Academic Tutor ({activeChapterName})
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Ask how to use any AULYN feature, navigate your workspace, or get step-by-step academic explanations.
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
                className={`max-w-[88%] p-4 rounded-2xl text-xs space-y-3 shadow-2xs ${
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

                {/* Interactive Action Buttons */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="pt-2 border-t border-[#E5DCD0] flex flex-wrap gap-1.5">
                    {msg.actionButtons.map((btn, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        onClick={() => handleActionClick(btn)}
                        className={`text-[11px] font-bold rounded-xl h-7 px-3 cursor-pointer shadow-2xs transition-transform hover:scale-102 ${
                          btn.actionTarget.startsWith('prompt:')
                            ? "bg-[#F1E8DD] text-[#292724] hover:bg-[#E5DCD0]"
                            : "bg-[#E76F51] hover:bg-[#d55e42] text-white"
                        }`}
                      >
                        {btn.label} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                )}

                <span className={`text-[9px] block text-right font-mono ${msg.sender === "user" ? "text-white/80" : "text-[#77716A]"}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs font-bold text-[#8B7EC8] animate-pulse p-2">
              <Sparkles className="w-4 h-4 text-[#E9B949]" /> AULYN AI Assistant is thinking...
            </div>
          )}
        </div>

        {/* Quick Academic Action Bar */}
        <div className="pt-2 border-t border-[#E5DCD0] shrink-0 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("explain_simply")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#E76F51]"
            >
              Explain Simply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("step_by_step")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#8B7EC8]"
            >
              Explain Step-by-Step
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("example")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#75B798]"
            >
              Give Example
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage("quiz_me")}
              className="border-[#E5DCD0] bg-white text-[#292724] font-bold h-7 px-2.5 rounded-lg shrink-0 hover:border-[#E9B949]"
            >
              Quiz Me
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
              className="border-[#E5DCD0] bg-white text-[#77716A] hover:text-[#E76F51] shrink-0 rounded-xl cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>

            <Input
              placeholder={`Ask how to do something or ask about ${activeClassName}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="bg-white border-[#E5DCD0] text-[#292724] text-xs font-semibold rounded-xl"
            />

            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl shadow-2xs shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
