'use client'

import React, { useState, useEffect, useCallback } from "react"
import { Users, Plus, Award, Trash2, Send, MessageSquare, ShieldCheck, FileText, CheckCircle2, UserPlus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { StudyGroup, getStudyGroups, saveStudyGroup, deleteStudyGroup, GroupChatMessage } from "@/lib/data-store"

interface StudentGroupsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  className?: string
  userRole: 'student' | 'teacher'
  studentName?: string
}

export function StudentGroupsModal({
  open,
  onOpenChange,
  classId = "dsa-2026",
  className = "Data Structures & Algorithms",
  userRole,
  studentName = "Alex Rivera"
}: StudentGroupsModalProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null)
  
  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState("")
  const [newTopic, setNewTopic] = useState("")

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
    const data = getStudyGroups(classId)
    if (data.length === 0) {
      const defaultG: StudyGroup = {
        groupId: "grp-1",
        classId,
        name: "Team Alpha — Binary Trees",
        assignmentTitle: "BST Implementation & Rotations Lab",
        members: [
          { id: "s-1", name: studentName, email: "alex.rivera@aulyn.edu", role: "creator" },
          { id: "s-2", name: "Bob Smith", email: "bob.smith@aulyn.edu", role: "member" },
          { id: "s-3", name: "Prof. Sarah Jenkins", email: "sarah.jenkins@aulyn.edu", role: "member" }
        ],
        workspaceNotes: "Shared team notes for BST Rotations Lab: Make sure to check rotation height factors before balancing nodes.",
        messages: [
          {
            id: "msg-1",
            groupId: "grp-1",
            senderId: "s-2",
            senderName: "Bob Smith",
            senderRole: "student",
            content: "Hey team! I completed the left rotation helper function.",
            timestamp: "10:15 AM"
          },
          {
            id: "msg-2",
            groupId: "grp-1",
            senderId: "s-1",
            senderName: studentName,
            senderRole: "student",
            content: "Awesome Bob! I'll test it against the BST balance test suite.",
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
  }, [classId, studentName])

  useEffect(() => {
    if (open) {
      reloadGroups()
    }
  }, [open, reloadGroups])


  useEffect(() => {
    if (activeGroup) {
      setWorkspaceNotes(activeGroup.workspaceNotes || "")
    }
  }, [activeGroup])

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newTopic.trim()) {
      toast.warning("Please provide a group name and topic")
      return
    }

    const grp: StudyGroup = {
      groupId: `grp-${Date.now()}`,
      classId,
      name: newGroupName.trim(),
      assignmentTitle: newTopic.trim(),
      creatorId: "student-demo",
      members: [
        { id: "student-demo", name: studentName, email: "alex.rivera@aulyn.edu", role: "creator" }
      ],
      workspaceNotes: `Workspace created for ${newTopic.trim()}`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          groupId: `grp-${Date.now()}`,
          senderId: "system",
          senderName: "AULYN System",
          senderRole: "teacher",
          content: `Group workspace "${newGroupName.trim()}" initialized for ${newTopic.trim()}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      createdAt: new Date().toLocaleDateString()
    }

    saveStudyGroup(grp)
    reloadGroups()
    setNewGroupName("")
    setNewTopic("")
    setActiveGroup(grp)
    toast.success(`Group workspace "${grp.name}" created!`)
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeGroup) return

    const newMsg: GroupChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: activeGroup.groupId,
      senderId: userRole === 'teacher' ? 'teacher-demo' : 'student-demo',
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
    setActiveGroup(updatedGroup)
    setGroups(getStudyGroups(classId))
    toast.success("Workspace team notes updated!")
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
    reloadGroups()
    if (activeGroup?.groupId === groupToDelete.groupId) {
      setActiveGroup(null)
    }
    toast.success(`Group "${groupToDelete.name}" deleted successfully!`)
    setGroupToDelete(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#8B7EC8]" /> Group Collaboration Engine
            </span>
            <span className="text-xs font-bold text-[#77716A]">{className}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <DialogTitle className="text-xl font-serif font-black text-[#292724]">
              {activeGroup ? activeGroup.name : "Student Group Assignment Workspaces"}
            </DialogTitle>

            {activeGroup && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveGroup(null)}
                className="text-xs border-[#E5DCD0] text-[#77716A] hover:bg-[#F1E8DD] font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to All Groups
              </Button>
            )}
          </div>

          <DialogDescription className="text-xs text-[#77716A]">
            {activeGroup ? `Project Focus: ${activeGroup.assignmentTitle}` : "Collaborate on group projects, share code drafts, and submit team solutions."}
          </DialogDescription>
        </DialogHeader>

        {!activeGroup ? (
          /* ALL GROUPS LIST VIEW */
          <div className="space-y-4 pt-3">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Active Group Workspaces</h4>
              {groups.length === 0 ? (
                <p className="text-xs text-[#77716A] italic">No active group workspaces created yet.</p>
              ) : (
                groups.map((g) => (
                  <Card key={g.groupId} className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h5 className="text-base font-serif font-bold text-[#292724]">{g.name}</h5>
                        <p className="text-xs text-[#77716A] font-semibold">Project Focus: {g.assignmentTitle}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          {g.submissionContent ? "Submitted" : "In Progress"}
                        </span>

                        <Button
                          size="sm"
                          onClick={() => setActiveGroup(g)}
                          className="bg-[#8B7EC8] hover:bg-[#7a6db7] text-white font-bold text-xs h-7 px-3 rounded-lg cursor-pointer"
                        >
                          Open Workspace
                        </Button>

                        <button
                          onClick={() => setGroupToDelete(g)}
                          title="Delete Group"
                          className="p-1.5 text-[#77716A] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E5DCD0]/60">
                      <span className="text-[10px] font-bold text-[#77716A] mr-1">Members ({g.members.length}):</span>
                      {g.members.map((m) => (
                        <span key={m.id} className="text-[10px] font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 border border-[#8B7EC8]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {m.role === 'creator' && <ShieldCheck className="w-3 h-3 text-[#8B7EC8]" />}
                          {m.name} {m.role === 'creator' ? "(Creator)" : "(Member)"}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Create Group Form */}
            <div className="p-4 bg-white border border-[#E5DCD0] rounded-2xl space-y-3 shadow-2xs">
              <h4 className="text-xs font-serif font-bold text-[#292724] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#E76F51]" /> Create New Student Group
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name (e.g. Team Gamma)"
                  className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                />
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Topic / Assignment Title"
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
            <div className="p-3.5 bg-white border border-[#E5DCD0] rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#77716A] tracking-wider">Assignment Deadline: Aug 30, 2026</span>
                <p className="text-xs font-bold text-[#292724]">{activeGroup.assignmentTitle}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-xs border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8] hover:text-white font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Member
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGroupToDelete(activeGroup)}
                  className="text-xs border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-bold h-7 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Group
                </Button>
              </div>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <Card className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl space-y-2">
                <p className="text-xs font-bold text-[#292724]">Add Member to {activeGroup.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Member Name (e.g. Maya Lin)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-white border-[#E5DCD0] text-xs font-semibold rounded-lg"
                  />
                  <Input
                    placeholder="Member Email (e.g. maya.lin@aulyn.edu)"
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
                <Users className="w-3.5 h-3.5 text-[#8B7EC8]" /> Group Members & Roles ({activeGroup.members.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeGroup.members.map((m) => (
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
                    <MessageSquare className="w-3.5 h-3.5 text-[#E76F51]" /> Group Discussion Thread
                  </h4>

                  <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
                    {(!activeGroup.messages || activeGroup.messages.length === 0) ? (
                      <p className="text-xs text-[#77716A] italic text-center py-6">No discussion messages yet. Start the conversation!</p>
                    ) : (
                      activeGroup.messages.map((msg) => (
                        <div key={msg.id} className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          msg.senderRole === 'teacher' ? 'bg-[#8B7EC8]/10 border-[#8B7EC8]/30' : 'bg-[#FFF9F1] border-[#E5DCD0]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#292724]">{msg.senderName} ({msg.senderRole})</span>
                            <span className="text-[10px] text-[#77716A] font-semibold">{msg.timestamp}</span>
                          </div>
                          <p className="text-xs text-[#292724]">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-[#E5DCD0]">
                  <Input
                    placeholder="Type discussion message to group..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-[#FFF9F1] border-[#E5DCD0] text-xs font-medium rounded-xl"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold h-9 px-3 rounded-xl cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Shared Workspace Notes */}
              <div className="lg:col-span-5 bg-white border border-[#E5DCD0] rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#E5DCD0]">
                    <FileText className="w-3.5 h-3.5 text-[#75B798]" /> Shared Team Notes & Solution Draft
                  </h4>

                  <textarea
                    rows={8}
                    value={workspaceNotes}
                    onChange={(e) => setWorkspaceNotes(e.target.value)}
                    placeholder="Collaborative notes, code draft logic, or team ideas..."
                    className="w-full mt-3 p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-xs font-mono text-[#292724] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="w-full bg-[#75B798] hover:bg-[#64a687] text-white font-bold text-xs py-2 rounded-xl cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save Shared Notes
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
                  Are you sure you want to delete <strong className="text-[#292724]">{groupToDelete.name}</strong>? All workspace data and discussion messages will be permanently removed.
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
