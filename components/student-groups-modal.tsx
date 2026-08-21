'use client'

import React, { useState, useEffect, useCallback } from "react"
import { Users, Plus, Award, Trash2, Send, MessageSquare, ShieldCheck, FileText, CheckCircle2, UserPlus, ArrowLeft, LogOut } from "lucide-react"


import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"


import { StudyGroup, GroupMember, getStudyGroups, saveStudyGroup, deleteStudyGroup, joinStudyGroup, leaveStudyGroup, GroupChatMessage } from "@/lib/data-store"



interface StudentGroupsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  className?: string
  userRole: 'student' | 'teacher'
  studentName?: string
  studentId?: string
  studentEmail?: string
}

export function StudentGroupsModal({
  open,
  onOpenChange,
  classId = "dsa-2026",
  className = "Data Structures & Algorithms",
  userRole,
  studentName = "Alex Rivera",
  studentId = "student-demo",
  studentEmail = "alex.rivera@aulyn.edu"
}: StudentGroupsModalProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null)
  
  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState("")
  const [newTopic, setNewTopic] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newMaxMembers, setNewMaxMembers] = useState(5)

  // Add Member State
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [showAddMember, setShowAddMember] = useState(false)

  // Group Chat & Notes State
  const [chatInput, setChatInput] = useState("")
  const [workspaceNotes, setWorkspaceNotes] = useState("")

  // Delete Group Confirmation Modal State
  const [groupToDelete, setGroupToDelete] = useState<StudyGroup | null>(null)

  const reloadGroups = useCallback(() => {
    // Strictly filter groups by classId so math groups don't appear in CS201
    const data = getStudyGroups(classId)
    if (data.length === 0) {
      const defaultG: StudyGroup = {
        groupId: `grp-${classId}-1`,
        classId,
        name: "Tree Traversal Team",
        assignmentTitle: "BST Implementation & Rotations Lab",
        description: "Collaborate on Assignment 3 and discuss DFS/BFS questions.",
        maxMembers: 5,
        creatorId: "s-1",
        members: [
          { id: "s-1", name: studentName, email: studentEmail, role: "creator" },
          { id: "s-2", name: "Bob Smith", email: "bob.smith@aulyn.edu", role: "member" },
          { id: "s-3", name: "Prof. Sarah Jenkins", email: "sarah.jenkins@aulyn.edu", role: "member" }
        ],
        workspaceNotes: "Shared team notes: Verify left and right rotation pointers before balancing nodes.",
        messages: [
          {
            id: "msg-1",
            groupId: `grp-${classId}-1`,
            senderId: "s-2",
            senderName: "Bob Smith",
            senderRole: "student",
            content: "I'm getting the wrong inorder traversal output. Can someone check this logic?",
            timestamp: "10:15 AM"
          },
          {
            id: "msg-2",
            groupId: `grp-${classId}-1`,
            senderId: "s-1",
            senderName: studentName,
            senderRole: "student",
            content: "Your recursive call should happen before printing root:\n```cpp\nvoid inorder(Node* root) {\n    if (!root) return;\n    inorder(root->left);\n    cout << root->data << \" \";\n    inorder(root->right);\n}\n```",
            timestamp: "10:18 AM"
          }
        ],
        createdAt: "2026-08-15"
      }
      saveStudyGroup(defaultG)
      setGroups([defaultG])
    } else {
      setGroups(data)
    }
  }, [classId, studentName, studentEmail])

  // Real-time synchronization across browser windows/tabs using BroadcastChannel & Storage Event
  useEffect(() => {
    if (!open) return
    reloadGroups()

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("aulyn_groups_channel")
      channel.onmessage = (event) => {
        if (event.data?.classId === classId) {
          reloadGroups()
        }
      }
    } catch {
      // Fallback to storage event listener
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "aulyn_study_groups_v1") {
        reloadGroups()
      }
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener("storage", handleStorage)
    }
  }, [open, classId, reloadGroups])

  useEffect(() => {
    if (activeGroup) {
      const refreshed = groups.find(g => g.groupId === activeGroup.groupId)
      if (refreshed && refreshed !== activeGroup) {
        setActiveGroup(refreshed)
        setWorkspaceNotes(refreshed.workspaceNotes || "")
      }
    }
  }, [groups, activeGroup])



  const notifyRealtimeChange = () => {
    try {
      const channel = new BroadcastChannel("aulyn_groups_channel")
      channel.postMessage({ classId, timestamp: Date.now() })
      channel.close()
    } catch {
      // ignore fallback
    }
  }

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newTopic.trim()) {
      toast.warning("Please provide a group name and topic")
      return
    }

    const grp: StudyGroup = {
      groupId: `grp-${classId}-${Date.now()}`,
      classId,
      name: newGroupName.trim(),
      assignmentTitle: newTopic.trim(),
      description: newDescription.trim() || `Collaborate on ${newTopic.trim()}`,
      maxMembers: newMaxMembers || 5,
      creatorId: studentId,
      members: [
        { id: studentId, name: studentName, email: studentEmail, role: "creator" }
      ],
      workspaceNotes: `Workspace created for ${newTopic.trim()}`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          groupId: `grp-${classId}-${Date.now()}`,
          senderId: "system",
          senderName: "AULYN System",
          senderRole: "teacher",
          content: `Group workspace "${newGroupName.trim()}" initialized for ${className}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      createdAt: new Date().toLocaleDateString()
    }

    saveStudyGroup(grp)
    notifyRealtimeChange()
    reloadGroups()
    setNewGroupName("")
    setNewTopic("")
    setNewDescription("")
    setActiveGroup(grp)
    toast.success(`Group workspace "${grp.name}" created inside ${className}!`)
  }

  const handleJoinGroupClick = (g: StudyGroup) => {
    if (g.members.length >= (g.maxMembers || 5)) {
      toast.warning("Group has reached maximum member capacity.")
      return
    }

    joinStudyGroup(g.groupId, { id: studentId, name: studentName, email: studentEmail })
    notifyRealtimeChange()
    reloadGroups()
    const updated = getStudyGroups(classId).find(grp => grp.groupId === g.groupId) || g
    setActiveGroup(updated)
    toast.success(`Joined "${g.name}"!`)
  }

  const handleLeaveGroupClick = (g: StudyGroup) => {
    leaveStudyGroup(g.groupId, studentId)
    notifyRealtimeChange()
    reloadGroups()
    if (activeGroup?.groupId === g.groupId) {
      setActiveGroup(null)
    }
    toast.info(`Left group "${g.name}".`)
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeGroup) return

    const newMsg: GroupChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: activeGroup.groupId,
      senderId: userRole === 'teacher' ? 'teacher-demo' : studentId,
      senderName: userRole === 'teacher' ? 'Prof. Sarah Jenkins' : studentName,
      senderRole: userRole,
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedGroup: StudyGroup = {
      ...activeGroup,
      messages: [...(activeGroup.messages || []), newMsg]
    }

    saveStudyGroup(updatedGroup)
    notifyRealtimeChange()
    setActiveGroup(updatedGroup)
    setGroups(getStudyGroups(classId))
    setChatInput("")
  }

  const handleSaveNotes = () => {
    if (!activeGroup) return

    const updatedGroup: StudyGroup = {
      ...activeGroup,
      workspaceNotes
    }

    saveStudyGroup(updatedGroup)
    notifyRealtimeChange()
    setActiveGroup(updatedGroup)
    setGroups(getStudyGroups(classId))
    toast.success("Workspace team notes saved!")
  }

  const handleAddMemberSubmit = () => {
    if (!newMemberName.trim() || !activeGroup) {
      toast.warning("Please enter member name")
      return
    }

    const newMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, ".")}@aulyn.edu`,
      role: 'member' as const
    }

    const updatedGroup: StudyGroup = {
      ...activeGroup,
      members: [...activeGroup.members, newMember]
    }

    saveStudyGroup(updatedGroup)
    notifyRealtimeChange()
    setActiveGroup(updatedGroup)
    setGroups(getStudyGroups(classId))
    setNewMemberName("")
    setNewMemberEmail("")
    setShowAddMember(false)
    toast.success(`Added ${newMember.name} to ${activeGroup.name}!`)
  }

  const handleConfirmDeleteGroup = () => {
    if (!groupToDelete) return

    deleteStudyGroup(groupToDelete.groupId)
    notifyRealtimeChange()
    reloadGroups()
    if (activeGroup?.groupId === groupToDelete.groupId) {
      setActiveGroup(null)
    }
    toast.success(`Group "${groupToDelete.name}" deleted successfully!`)
    setGroupToDelete(null)
  }

  // Format message content with inline code block styling
  const renderMessageContent = (content: string) => {
    if (content.includes("```")) {
      const parts = content.split(/(```[\s\S]*?```)/g)
      return (
        <div className="space-y-1.5 mt-1">
          {parts.map((part, idx) => {
            if (part.startsWith("```") && part.endsWith("```")) {
              const codeBody = part.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "")
              return (
                <pre key={idx} className="bg-[#292724] text-amber-300 p-2.5 rounded-lg text-xs font-mono overflow-x-auto border border-[#E5DCD0]/30 shadow-inner">
                  <code>{codeBody}</code>
                </pre>
              )
            }
            return <p key={idx} className="text-xs text-[#292724] leading-relaxed">{part}</p>
          })}
        </div>
      )
    }
    return <p className="text-xs text-[#292724] leading-relaxed">{content}</p>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#8B7EC8]" /> Classroom Group Workspaces
            </span>
            <span className="text-xs font-bold text-[#E76F51] bg-[#E76F51]/10 px-2.5 py-0.5 rounded-full border border-[#E76F51]/30">
              {className}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <DialogTitle className="text-xl font-serif font-black text-[#292724]">
              {activeGroup ? activeGroup.name : `${className} — Group Workspaces`}
            </DialogTitle>

            {activeGroup && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveGroup(null)}
                className="text-xs border-[#E5DCD0] text-[#77716A] hover:bg-[#F1E8DD] font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Classroom Groups
              </Button>
            )}
          </div>

          <DialogDescription className="text-xs text-[#77716A]">
            {activeGroup ? activeGroup.description || `Project Focus: ${activeGroup.assignmentTitle}` : `Collaborate with classmates enrolled in ${className}.`}
          </DialogDescription>
        </DialogHeader>

        {!activeGroup ? (
          /* CLASSROOM GROUPS LIST VIEW */
          <div className="space-y-4 pt-3">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Active Workspace Teams in {className}</h4>
              {groups.length === 0 ? (
                <p className="text-xs text-[#77716A] italic">No group workspaces created for {className} yet.</p>
              ) : (
                groups.map((g: StudyGroup) => {
                  const isMember = g.members.some((m: GroupMember) => m.id === studentId || m.email === studentEmail)
                  const isCreatorOrTeacher = userRole === 'teacher' || g.creatorId === studentId || g.members.some((m: GroupMember) => m.id === studentId && m.role === 'creator')



                  return (
                    <Card key={g.groupId} className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-base font-serif font-bold text-[#292724]">{g.name}</h5>
                            <span className="text-[10px] font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2 py-0.5 rounded-full border border-[#8B7EC8]/30">
                              {g.members.length} / {g.maxMembers || 5} Members
                            </span>
                          </div>
                          <p className="text-xs text-[#77716A] font-semibold">{g.assignmentTitle}</p>
                          {g.description && <p className="text-[11px] text-[#77716A] italic">{g.description}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                          {isMember ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setActiveGroup(g)}
                                className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs h-7 px-3 rounded-lg cursor-pointer"
                              >
                                Open Workspace
                              </Button>

                              {!isCreatorOrTeacher && userRole === 'student' && (
                                <button
                                  onClick={() => handleLeaveGroupClick(g)}
                                  title="Leave Group"
                                  className="p-1.5 text-[#77716A] hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                                >
                                  <LogOut className="w-3.5 h-3.5" /> Leave
                                </button>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleJoinGroupClick(g)}
                              className="bg-[#75B798] hover:bg-[#64a687] text-white font-bold text-xs h-7 px-3 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Join Group
                            </Button>
                          )}

                          {isCreatorOrTeacher && (
                            <button
                              onClick={() => setGroupToDelete(g)}
                              title="Delete Group"
                              className="p-1.5 text-[#77716A] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E5DCD0]/60">
                        <span className="text-[10px] font-bold text-[#77716A] mr-1">Members ({g.members.length}):</span>
                        {g.members.map((m: GroupMember) => (
                          <span key={m.id} className="text-[10px] font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 border border-[#8B7EC8]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {m.role === 'creator' && <ShieldCheck className="w-3 h-3 text-[#8B7EC8]" />}
                            {m.name} {m.role === 'creator' ? "(Creator)" : "(Member)"}
                          </span>
                        ))}
                      </div>


                    </Card>
                  )
                })
              )}
            </div>

            {/* Create Group Form */}
            <div className="p-4 bg-white border border-[#E5DCD0] rounded-2xl space-y-3 shadow-2xs">
              <h4 className="text-xs font-serif font-bold text-[#292724] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#E76F51]" /> Create New Group in {className}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name (e.g. Tree Traversal Team)"
                  className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                />
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Assignment / Topic Title"
                  className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Short Description (e.g. Discuss DFS/BFS assignment)"
                  className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl sm:col-span-2"
                />
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={newMaxMembers}
                  onChange={(e) => setNewMaxMembers(parseInt(e.target.value) || 5)}
                  placeholder="Max Members"
                  className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                />
              </div>

              <Button
                onClick={handleCreateGroup}
                className="w-full bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs py-2 rounded-xl shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Group Workspace
              </Button>
            </div>
          </div>
        ) : (
          /* ACTIVE GROUP WORKSPACE VIEW */
          <div className="space-y-5 pt-3">
            {/* Top Workspace Bar */}
            <div className="p-3.5 bg-white border border-[#E5DCD0] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#77716A] tracking-wider">Classroom: {className}</span>
                <h4 className="text-sm font-bold text-[#292724]">{activeGroup.name} — {activeGroup.assignmentTitle}</h4>
                {activeGroup.description && <p className="text-xs text-[#77716A]">{activeGroup.description}</p>}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-xs border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8] hover:text-white font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Member
                </Button>

                {(userRole === 'teacher' || activeGroup.creatorId === studentId || activeGroup.members.some((m: GroupMember) => m.id === studentId && m.role === 'creator')) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setGroupToDelete(activeGroup)}
                    className="text-xs border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Group
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLeaveGroupClick(activeGroup)}
                    className="text-xs border-amber-300 text-amber-700 hover:bg-amber-600 hover:text-white font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Leave Group
                  </Button>
                )}
              </div>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <Card className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-2">
                <p className="text-xs font-bold text-[#292724]">Add Member to {activeGroup.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Member Name (e.g. Kabir Das)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-lg"
                  />
                  <Input
                    placeholder="Member Email (e.g. kabir.das@aulyn.edu)"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-lg"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddMember(false)} className="text-xs font-bold h-7">Cancel</Button>
                  <Button size="sm" onClick={handleAddMemberSubmit} className="bg-[#8B7EC8] hover:bg-[#796bb5] text-white font-bold text-xs h-7 rounded-lg">Add Member</Button>
                </div>
              </Card>
            )}

            {/* Members Roster Card */}
            <Card className="p-3.5 bg-white border border-[#E5DCD0] rounded-2xl space-y-2 shadow-2xs">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8B7EC8]" /> Members ({activeGroup.members.length} / {activeGroup.maxMembers || 5})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeGroup.members.map((m: GroupMember) => (
                  <div key={m.id} className="p-2 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs font-semibold flex items-center justify-between">
                    <div>
                      <p className="text-[#292724] font-bold">{m.name}</p>
                      <p className="text-[10px] text-[#77716A]">{m.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.role === 'creator' ? 'bg-[#8B7EC8]/20 text-[#8B7EC8] border border-[#8B7EC8]/40' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {m.role === 'creator' ? 'Creator' : 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>


            {/* Split View: Group Discussion Chat & Shared Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Group Discussion Chat */}
              <div className="lg:col-span-7 bg-white border border-[#E5DCD0] rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#E5DCD0]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#E76F51]" /> Assignment Discussion Thread
                  </h4>

                  <div className="space-y-2.5 mt-3 max-h-64 overflow-y-auto pr-1">
                    {(!activeGroup.messages || activeGroup.messages.length === 0) ? (
                      <p className="text-xs text-[#77716A] italic text-center py-6">No discussion messages yet. Start the conversation!</p>
                    ) : (
                      activeGroup.messages.map((msg: GroupChatMessage) => (

                        <div key={msg.id} className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          msg.senderRole === 'teacher' ? 'bg-[#8B7EC8]/10 border-[#8B7EC8]/30' : 'bg-[#FFF9F1] border-[#E5DCD0]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#292724]">{msg.senderName} ({msg.senderRole})</span>
                            <span className="text-[10px] text-[#77716A] font-semibold">{msg.timestamp}</span>
                          </div>
                          {renderMessageContent(msg.content)}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#E5DCD0]">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Discuss logic, ask questions, or send code..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold h-9 px-3 rounded-xl cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-[#77716A]">Tip: Use ```cpp or ```py for code blocks</p>
                </div>
              </div>

              {/* Shared Workspace Notes */}
              <div className="lg:col-span-5 bg-white border border-[#E5DCD0] rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#E5DCD0]">
                    <FileText className="w-3.5 h-3.5 text-[#75B798]" /> Shared Team Notes & Code Draft
                  </h4>

                  <textarea
                    rows={9}
                    value={workspaceNotes}
                    onChange={(e) => setWorkspaceNotes(e.target.value)}
                    placeholder="Collaborative team notes, algorithm logic, or draft solutions..."
                    className="w-full mt-3 p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs font-mono text-[#292724] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="w-full bg-[#75B798] hover:bg-[#64a687] text-white font-bold text-xs py-2 rounded-xl cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save Team Notes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {groupToDelete && (
          <Dialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
            <DialogContent className="sm:max-w-md bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" /> Confirm Delete Group
                </DialogTitle>
                <DialogDescription className="text-xs text-[#77716A] pt-2">
                  Delete this group? This will remove the workspace and group conversation for all members.
                </DialogDescription>
              </DialogHeader>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setGroupToDelete(null)}
                  className="border-[#E5DCD0] text-[#77716A] text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDeleteGroup}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xs"
                >
                  Delete Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
