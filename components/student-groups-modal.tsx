'use client'

import React, { useState, useEffect } from "react"
import { Users, Plus, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { StudyGroup, getStudyGroups, saveStudyGroup } from "@/lib/data-store"

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
  studentName = "Alex Rivera"
}: StudentGroupsModalProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [newTopic, setNewTopic] = useState("")

  useEffect(() => {
    if (open) {
      const data = getStudyGroups(classId)
      if (data.length === 0) {
        const defaultG: StudyGroup = {
          groupId: "grp-1",
          classId,
          name: "Team Alpha — Binary Trees",
          assignmentTitle: "BST Implementation & Rotations Lab",
          members: [
            { id: "s-1", name: studentName, email: "alex.rivera@aulyn.edu" },
            { id: "s-2", name: "Bob Smith", email: "bob.smith@aulyn.edu" }
          ],
          workspaceNotes: "Shared team notes for BST Rotations Lab."
        }
        saveStudyGroup(defaultG)
        setGroups([defaultG])
      } else {
        setGroups(data)
      }
    }
  }, [open, classId, studentName])

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
      members: [{ id: "student-demo", name: studentName, email: "alex.rivera@aulyn.edu" }],
      workspaceNotes: `Workspace created for ${newTopic.trim()}`
    }

    saveStudyGroup(grp)
    setGroups(getStudyGroups(classId))
    setNewGroupName("")
    setNewTopic("")
    toast.success(`Group workspace "${grp.name}" created!`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2.5 py-0.5 rounded-full border border-[#8B7EC8]/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#8B7EC8]" /> Group Collaboration Engine
            </span>
            <span className="text-xs font-bold text-[#77716A]">{className}</span>
          </div>
          <DialogTitle className="text-xl font-serif font-black text-[#292724] mt-2">
            Student Group Assignment Workspaces
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Collaborate on group projects, share code drafts, and submit team solutions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#292724] uppercase tracking-wider">Active Group Workspaces</h4>
            {groups.map((g) => (
              <Card key={g.groupId} className="bg-white border border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-serif font-bold text-[#292724]">{g.name}</h5>
                  <span className="text-[10px] font-bold text-[#77716A] bg-[#FFF9F1] px-2 py-0.5 rounded-full border border-[#E5DCD0]">
                    {g.members.length} Members
                  </span>
                </div>
                <p className="text-xs text-[#77716A] font-semibold">Project Focus: {g.assignmentTitle}</p>
                <div className="flex items-center gap-2 pt-1">
                  {g.members.map((m) => (
                    <span key={m.id} className="text-[10px] font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2 py-0.5 rounded-full">
                      {m.name}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="p-4 bg-white border border-[#E5DCD0] rounded-2xl space-y-3 shadow-2xs">
            <h4 className="text-xs font-serif font-bold text-[#292724] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#E76F51]" /> Create New Student Group
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group Name (e.g. Team Beta)"
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
      </DialogContent>
    </Dialog>
  )
}
