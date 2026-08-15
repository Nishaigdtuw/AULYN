export interface MeetingParticipant {
  id: string
  name: string
  role: 'teacher' | 'student'
  isHost?: boolean
  micOn: boolean
  cameraOn: boolean
  stream?: MediaStream
  avatarUrl?: string
}

export interface MeetingChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'teacher' | 'student'
  text: string
  timestamp: string
}

export interface LiveMeetingSession {
  sessionId: string
  classId: string
  className: string
  topic: string
  teacherName: string
  status: 'PreJoin' | 'Live' | 'Ended'
  startedAt: string
  confusionSignalsCount: number
  lastSpikeTopic?: string
  participants: MeetingParticipant[]
  chatMessages: MeetingChatMessage[]
  publishedNotes?: string
}

const LIVE_MEETINGS_KEY = "aulyn_live_meetings"

export async function requestMediaStream(audio: boolean, video: boolean): Promise<{ stream: MediaStream | null; error: string | null }> {
  if (typeof window === "undefined" || !navigator?.mediaDevices) {
    return { stream: null, error: "Media devices API not supported in this browser." }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
    })
    return { stream, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Camera/Microphone permission denied."
    return { stream: null, error: errorMsg }
  }
}

export function getStoredMeeting(sessionId: string): LiveMeetingSession | null {
  if (typeof window === "undefined") return null
  const str = localStorage.getItem(`${LIVE_MEETINGS_KEY}_${sessionId}`)
  if (str) {
    try {
      return JSON.parse(str)
    } catch {
      // Fallback
    }
  }

  return {
    sessionId,
    classId: "dsa-2026",
    className: "Data Structures & Algorithms",
    topic: "Trees & Tree Traversal",
    teacherName: "Prof. Sarah Jenkins",
    status: "Live",
    startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    confusionSignalsCount: 14,
    lastSpikeTopic: "DFS Call Stack Execution",
    participants: [
      { id: "teacher-demo", name: "Prof. Sarah Jenkins", role: "teacher", isHost: true, micOn: true, cameraOn: true },
      { id: "student-demo", name: "Alex Rivera", role: "student", micOn: true, cameraOn: true },
      { id: "student-2", name: "Bob Smith", role: "student", micOn: false, cameraOn: true }
    ],
    chatMessages: [
      { id: "m1", senderId: "teacher-demo", senderName: "Prof. Sarah Jenkins", senderRole: "teacher", text: "Welcome class! Today we are tracing binary tree inorder recursion.", timestamp: "10:02 AM" },
      { id: "m2", senderId: "student-2", senderName: "Bob Smith", senderRole: "student", text: "Professor, will the call stack depth exceed memory for skewed trees?", timestamp: "10:05 AM" }
    ],
    publishedNotes: "Depth-First Search (DFS) traverses down a tree branch completely using recursion/stack frames before backtracking."
  }
}

export function saveStoredMeeting(session: LiveMeetingSession) {
  if (typeof window === "undefined") return
  localStorage.setItem(`${LIVE_MEETINGS_KEY}_${session.sessionId}`, JSON.stringify(session))
  window.dispatchEvent(new Event("aulyn-meeting-update"))
}
