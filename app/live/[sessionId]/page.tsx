'use client'

import React, { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, Flame, BookOpen, AlertCircle, Send, CheckCircle2, ArrowLeft, X, Sparkles, Smile } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth-guard"
import {
  LiveMeetingSession,
  getStoredMeeting,
  saveStoredMeeting,
  requestMediaStream
} from "@/lib/webrtc-meeting"
import { saveMasteryEvidence } from "@/lib/mastery-engine"

export default function LiveMeetingRoomPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = (params?.sessionId as string) || "sess-dsa-1"

  const [self, setSelf] = useState<{ name?: string; role?: 'student' | 'teacher' } | null>(null)
  const [session, setSession] = useState<LiveMeetingSession | null>(null)

  // Pre-join & Media Stream State
  const [joined, setJoined] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stageVideoRef = useRef<HTMLVideoElement | null>(null)

  // In-Meeting Panels State
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'participants' | 'notes'>('none')
  const [chatInput, setChatInput] = useState("")
  const [cooldown, setCooldown] = useState(0)

  // Live Real-Time Meeting Reactions State
  const [activeReactions, setActiveReactions] = useState<Array<{ id: string; emoji: string; senderName: string }>>([])
  const [showReactionsMenu, setShowReactionsMenu] = useState(false)
  const [reactionCooldown, setReactionCooldown] = useState(false)

  const triggerReactionAnimation = (emoji: string, senderName: string) => {
    const reactionId = `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    setActiveReactions((prev) => [...prev, { id: reactionId, emoji, senderName }])
    setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== reactionId))
    }, 2500)
  }

  const handleSendReaction = (emoji: string) => {
    if (reactionCooldown) return
    setReactionCooldown(true)
    setTimeout(() => setReactionCooldown(false), 800)

    const sender = self?.name || "Participant"
    triggerReactionAnimation(emoji, sender)

    try {
      const channel = new BroadcastChannel(`aulyn_meeting_reactions_${sessionId}`)
      channel.postMessage({ emoji, senderName: sender, timestamp: Date.now() })
      channel.close()
    } catch {
      localStorage.setItem(`aulyn_reaction_${sessionId}`, JSON.stringify({ emoji, senderName: sender, timestamp: Date.now() }))
    }
    setShowReactionsMenu(false)
  }

  // Real-time broadcast listener for meeting reactions
  useEffect(() => {
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(`aulyn_meeting_reactions_${sessionId}`)
      channel.onmessage = (event) => {
        if (event.data?.emoji && event.data?.senderName) {
          triggerReactionAnimation(event.data.emoji, event.data.senderName)
        }
      }
    } catch {
      // fallback
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `aulyn_reaction_${sessionId}`) {
        try {
          const data = JSON.parse(e.newValue || '{}')
          if (data.emoji && data.senderName) {
            triggerReactionAnimation(data.emoji, data.senderName)
          }
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener("storage", handleStorage)
    }
  }, [sessionId])

  useEffect(() => {
    const user = getAuthenticatedUser()
    if (user) {
      setSelf({ name: user.name, role: user.role as 'student' | 'teacher' })
    } else {
      setSelf({ name: "Alex Rivera", role: "student" })
    }

    const s = getStoredMeeting(sessionId)
    setSession(s)
  }, [sessionId])


  // Initialize Local Media Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null
    const initMedia = async () => {
      const { stream, error } = await requestMediaStream(micOn, cameraOn)
      if (stream) {
        activeStream = stream
        setMediaStream(stream)
        setMediaError(null)
      } else if (error) {
        setMediaError(error)
      }
    }
    initMedia()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [micOn, cameraOn])

  // Attach Stream to Video Elements
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
    if (stageVideoRef.current && mediaStream) {
      stageVideoRef.current.srcObject = mediaStream
    }
  }, [mediaStream, joined])

  // Confusion Signal Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleJoinMeeting = () => {
    setJoined(true)
    toast.success(`Joined virtual classroom session!`)
  }

  const handleToggleMic = () => {
    setMicOn(!micOn)
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = !micOn))
    }
  }

  const handleToggleCamera = () => {
    setCameraOn(!cameraOn)
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = !cameraOn))
    }
  }

  const handleConfusionSignal = () => {
    if (cooldown > 0 || !session) return

    setCooldown(6)
    const updatedSignals = session.confusionSignalsCount + 1
    const updatedSession: LiveMeetingSession = {
      ...session,
      confusionSignalsCount: updatedSignals,
      lastSpikeTopic: "DFS Call Stack Execution"
    }

    setSession(updatedSession)
    saveStoredMeeting(updatedSession)

    saveMasteryEvidence("student-demo", session.classId, "tree-traversal", {
      type: "Confusion",
      title: "Live Virtual Classroom Confusion Signal",
      score: 4,
      maxScore: 10,
      percentage: 40,
      notes: `Reported confusion during live explanation of ${session.topic}`
    })

    toast.success("Confusion signal sent anonymously to professor.", { icon: "🤫" })
  }

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !session) return
    const newMsg = {
      id: `m-${Date.now()}`,
      senderId: self?.role === 'teacher' ? 'teacher-demo' : 'student-demo',
      senderName: self?.name || "Participant",
      senderRole: self?.role || "student",
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = {
      ...session,
      chatMessages: [...session.chatMessages, newMsg]
    }

    setSession(updated)
    saveStoredMeeting(updated)
    setChatInput("")
  }

  const handleLeaveMeeting = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop())
    }
    toast.info("Left live classroom meeting.")
    router.push(self?.role === 'teacher' ? '/teacher' : '/student')
  }

  const handleEndClassForEveryone = () => {
    if (!session) return
    const endedSession: LiveMeetingSession = {
      ...session,
      status: 'Ended'
    }
    saveStoredMeeting(endedSession)
    toast.success("Ended live meeting for all students. Session summary saved.")
    router.push('/teacher')
  }

  if (!session) return null

  // -----------------------------------------------------------
  // 1. PRE-JOIN SCREEN UI
  // -----------------------------------------------------------
  if (!joined) {
    return (
      <div className="min-h-screen bg-[#292724] text-white flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-xl bg-[#1E1C1A] border-[#3E3A35] text-white rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#3E3A35] pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#E76F51] bg-[#E76F51]/20 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30 uppercase tracking-wider">
                Virtual Classroom Pre-Join
              </span>
              <h2 className="text-xl font-serif font-black text-white mt-1">{session.className}</h2>
              <p className="text-xs text-[#A19A91] font-semibold">{session.topic} • Instructor: {session.teacherName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[#A19A91] hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Exit
            </Button>
          </div>

          {/* Camera Preview Tile */}
          <div className="relative aspect-video bg-[#292724] rounded-2xl overflow-hidden border border-[#3E3A35] flex items-center justify-center">
            {cameraOn && !mediaError ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#E76F51] text-white font-serif font-black text-2xl rounded-full flex items-center justify-center mx-auto shadow-md">
                  {self?.name?.charAt(0) || "A"}
                </div>
                <p className="text-xs text-[#A19A91] font-semibold">{cameraOn ? "Camera Initializing..." : "Camera Turned Off"}</p>
              </div>
            )}

            {/* Media Permission Warning Banner */}
            {mediaError && (
              <div className="absolute bottom-3 left-3 right-3 bg-amber-900/90 text-amber-100 text-[11px] p-2 rounded-xl border border-amber-500/50 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{mediaError} Joining in audio/muted mode.</span>
              </div>
            )}

            {/* Media Toggles overlay */}
            <div className="absolute bottom-4 flex items-center justify-center space-x-3 left-0 right-0">
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-full shadow-md transition-all cursor-pointer ${
                  micOn ? "bg-[#3E3A35] text-white hover:bg-[#4E4943]" : "bg-red-600 text-white"
                }`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={handleToggleCamera}
                className={`p-3 rounded-full shadow-md transition-all cursor-pointer ${
                  cameraOn ? "bg-[#3E3A35] text-white hover:bg-[#4E4943]" : "bg-red-600 text-white"
                }`}
              >
                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs text-[#A19A91]">Joining as:</p>
              <p className="text-sm font-bold text-white">{self?.name} ({self?.role === 'teacher' ? 'Educator Host' : 'Student'})</p>
            </div>

            <Button
              onClick={handleJoinMeeting}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold py-3 px-8 text-sm rounded-xl shadow-lg cursor-pointer"
            >
              Join Virtual Class Meeting
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // -----------------------------------------------------------
  // 2. IN-MEETING ROOM STAGE & CONTROLS UI
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#181716] text-white flex flex-col justify-between overflow-hidden relative">
      {/* Top Meeting Header */}
      <header className="px-4 py-3 bg-[#1E1C1A] border-b border-[#3E3A35] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <div>
            <h1 className="text-sm sm:text-base font-serif font-black text-white">{session.className}</h1>
            <p className="text-[10px] text-[#A19A91] font-semibold">{session.topic} • Started {session.startedAt}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Teacher Class Pulse Indicator */}
          {self?.role === 'teacher' ? (
            <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Confusion Pulse: {session.confusionSignalsCount} Signals ({session.lastSpikeTopic})</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Meeting Connected</span>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeaveMeeting}
            className="text-xs font-bold rounded-xl cursor-pointer"
          >
            <PhoneOff className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </header>

      {/* Main Video Stage & Side Panel */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3 relative">
        {/* Floating Live Reactions Layer */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {activeReactions.map((r, idx) => (
            <div
              key={r.id}
              className="absolute bottom-20 flex items-center space-x-2 bg-[#1E1C1A]/95 text-white px-3 py-1.5 rounded-full border border-[#E9B949]/50 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300"
              style={{
                left: `${(idx * 25 + 20) % 70}%`,
                animationDuration: '2.5s'
              }}
            >
              <span className="text-2xl animate-bounce">{r.emoji}</span>
              <span className="text-xs font-bold text-[#E9B949]">{r.senderName}</span>
            </div>
          ))}
        </div>

        {/* Responsive Video Stage Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 overflow-y-auto">

          {/* Local User Tile */}
          <div className="relative bg-[#242220] border-2 border-[#E76F51]/60 rounded-2xl overflow-hidden flex items-center justify-center group shadow-md min-h-[220px]">
            {cameraOn && !mediaError ? (
              <video ref={stageVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#E76F51] text-white font-serif font-black text-2xl rounded-full flex items-center justify-center mx-auto shadow-md">
                  {self?.name?.charAt(0) || "U"}
                </div>
                <p className="text-xs text-[#A19A91] font-semibold">{self?.name} (You)</p>
              </div>
            )}

            {/* Tile Label */}
            <div className="absolute bottom-3 left-3 bg-[#1E1C1A]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-2 border border-[#3E3A35]">
              <span>{self?.name} (You)</span>
              {micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
            </div>
          </div>

          {/* Instructor Tile */}
          {session.participants.filter((p) => p.id !== (self?.role === 'teacher' ? 'teacher-demo' : 'student-demo')).map((p) => (
            <div key={p.id} className="relative bg-[#242220] border border-[#3E3A35] rounded-2xl overflow-hidden flex items-center justify-center group shadow-md min-h-[220px]">
              <div className="text-center space-y-2">
                <div className={`w-16 h-16 text-white font-serif font-black text-2xl rounded-full flex items-center justify-center mx-auto shadow-md ${
                  p.role === 'teacher' ? 'bg-[#8B7EC8]' : 'bg-[#75B798]'
                }`}>
                  {p.name.charAt(0)}
                </div>
                <p className="text-xs text-[#A19A91] font-semibold">{p.name}</p>
              </div>

              {/* Tile Label */}
              <div className="absolute bottom-3 left-3 bg-[#1E1C1A]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-2 border border-[#3E3A35]">
                <span>{p.name} ({p.role === 'teacher' ? 'Host' : 'Participant'})</span>
                {p.micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
              </div>
            </div>
          ))}
        </div>

        {/* Side Panels (Chat, Participants, Notes) */}
        {activePanel !== 'none' && (
          <div className="w-80 sm:w-96 bg-[#1E1C1A] border border-[#3E3A35] rounded-2xl flex flex-col overflow-hidden shadow-2xl shrink-0">
            <div className="p-3 border-b border-[#3E3A35] flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                {activePanel === 'chat' && 'In-Meeting Live Chat'}
                {activePanel === 'participants' && `Class Roster (${session.participants.length})`}
                {activePanel === 'notes' && 'Live AI Lecture Notes'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel('none')} className="text-[#A19A91] hover:text-white h-7 w-7">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* CHAT PANEL */}
            {activePanel === 'chat' && (
              <div className="flex-1 flex flex-col justify-between p-3 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {session.chatMessages.map((m) => (
                    <div key={m.id} className="p-2.5 bg-[#242220] border border-[#3E3A35] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className={m.senderRole === 'teacher' ? 'text-[#8B7EC8]' : 'text-[#E76F51]'}>
                          {m.senderName} ({m.senderRole === 'teacher' ? 'Instructor' : 'Student'})
                        </span>
                        <span className="text-[10px] text-[#A19A91]">{m.timestamp}</span>
                      </div>
                      <p className="text-white font-medium">{m.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#3E3A35]">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Send a temporary message..."
                    className="bg-[#242220] border-[#3E3A35] text-xs font-medium text-white rounded-xl"
                  />
                  <Button onClick={handleSendChatMessage} className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-xl cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* PARTICIPANTS PANEL */}
            {activePanel === 'participants' && (
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {session.participants.map((p) => (
                  <div key={p.id} className="p-2.5 bg-[#242220] border border-[#3E3A35] rounded-xl flex items-center justify-between text-xs font-bold">
                    <span className="text-white">{p.name} ({p.role})</span>
                    <div className="flex items-center space-x-1.5 text-[#A19A91]">
                      {p.micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                      {p.cameraOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIVE NOTES PANEL */}
            {activePanel === 'notes' && (
              <div className="p-3 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="p-3 bg-[#242220] border border-[#3E3A35] rounded-xl space-y-2">
                  <h4 className="font-bold text-[#E76F51] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#E9B949]" /> Real-Time Lecture Notes Summary
                  </h4>
                  <p className="text-[#A19A91] font-medium leading-relaxed">{session.publishedNotes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <footer className="px-4 py-3 bg-[#1E1C1A] border-t border-[#3E3A35] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              micOn ? "bg-[#242220] text-white hover:bg-[#3E3A35]" : "bg-red-600 text-white"
            }`}
          >
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{micOn ? "Mute" : "Unmute"}</span>
          </button>

          <button
            onClick={handleToggleCamera}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              cameraOn ? "bg-[#242220] text-white hover:bg-[#3E3A35]" : "bg-red-600 text-white"
            }`}
          >
            {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{cameraOn ? "Stop Video" : "Start Video"}</span>
          </button>

          {/* Live Meeting Reactions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowReactionsMenu(!showReactionsMenu)}
              className="p-2.5 bg-[#242220] hover:bg-[#3E3A35] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-[#3E3A35]"
            >
              <Smile className="w-4 h-4 text-[#E9B949]" />
              <span className="hidden sm:inline">Reactions</span>
            </button>

            {showReactionsMenu && (
              <div className="absolute bottom-12 left-0 bg-[#1E1C1A] border border-[#3E3A35] rounded-xl p-2 shadow-2xl flex items-center space-x-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={() => handleSendReaction("👍")}
                  className="text-xl p-1.5 hover:bg-[#242220] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                  title="Thumbs Up"
                >
                  👍
                </button>
                <button
                  onClick={() => handleSendReaction("❤️")}
                  className="text-xl p-1.5 hover:bg-[#242220] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                  title="Heart"
                >
                  ❤️
                </button>
                <button
                  onClick={() => handleSendReaction("👏")}
                  className="text-xl p-1.5 hover:bg-[#242220] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                  title="Clap"
                >
                  👏
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Center Actions: Anonymous Confusion Signal */}
        <div className="flex items-center space-x-2">
          {self?.role === 'student' && (
            <Button
              onClick={handleConfusionSignal}
              disabled={cooldown > 0}
              className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-4 h-4 mr-1.5 text-amber-300 animate-pulse" />
              {cooldown > 0 ? `Cooldown (${cooldown}s)` : `🤔 I'm Confused`}
            </Button>
          )}

          {self?.role === 'teacher' && (
            <Button
              onClick={handleEndClassForEveryone}
              variant="destructive"
              className="font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer"
            >
              End Class for Everyone
            </Button>
          )}
        </div>

        {/* Side Panel Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActivePanel(activePanel === 'chat' ? 'none' : 'chat')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activePanel === 'chat' ? "bg-[#E76F51] text-white" : "bg-[#242220] text-white hover:bg-[#3E3A35]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'participants' ? 'none' : 'participants')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activePanel === 'participants' ? "bg-[#8B7EC8] text-white" : "bg-[#242220] text-white hover:bg-[#3E3A35]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">People ({session.participants.length})</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'notes' ? 'none' : 'notes')}
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activePanel === 'notes' ? "bg-[#75B798] text-white" : "bg-[#242220] text-white hover:bg-[#3E3A35]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
