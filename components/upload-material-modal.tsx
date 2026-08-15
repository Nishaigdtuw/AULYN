'use client'

import React, { useState } from "react"
import { Upload, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ClassroomData, uploadClassroomMaterial } from "@/lib/data-store"

interface UploadMaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeClassroom: ClassroomData
}

export function UploadMaterialModal({
  open,
  onOpenChange,
  activeClassroom
}: UploadMaterialModalProps) {
  const [chapterName, setChapterName] = useState("")
  const [noteTitle, setNoteTitle] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf") && !file.name.endsWith(".doc") && !file.name.endsWith(".docx")) {
        toast.warning("Please upload a PDF or Word Document file")
        return
      }
      setPdfFile(file)
      if (!noteTitle) {
        setNoteTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleUploadSubmit = () => {
    if (!chapterName.trim() || !pdfFile) {
      toast.warning("Please specify a chapter name and select a PDF file")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading(`Uploading "${pdfFile.name}" to ${activeClassroom.className}...`)

    setTimeout(() => {
      const sizeMB = `${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB`
      const fileNameToUse = pdfFile.name

      uploadClassroomMaterial(
        activeClassroom.classId,
        chapterName.trim(),
        fileNameToUse,
        `/materials/${fileNameToUse}`,
        sizeMB,
        `Official lecture notes for ${chapterName.trim()} in ${activeClassroom.className}. Published by instructor.`
      )

      setIsUploading(false)
      toast.success(`Published "${fileNameToUse}" to ${activeClassroom.className}!`, { id: toastId })
      setPdfFile(null)
      setChapterName("")
      setNoteTitle("")
      onOpenChange(false)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#FFF9F1] border border-[#E5DCD0] shadow-2xl rounded-2xl p-6 text-[#292724]">
        <DialogHeader className="pb-3 border-b border-[#E5DCD0]">
          <DialogTitle className="text-lg font-serif font-bold text-[#292724] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#E76F51]" /> Upload Lecture Notes PDF
          </DialogTitle>
          <DialogDescription className="text-xs text-[#77716A]">
            Upload course materials and PDF slides for {activeClassroom?.className}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#292724]">Target Chapter / Topic</Label>
            <Input
              placeholder="e.g. Graphs & Shortest Path"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#292724]">Document Display Title</Label>
            <Input
              placeholder="e.g. Graphs_Lecture_Notes.pdf"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="bg-white border-[#E5DCD0] text-xs font-medium rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#292724]">Select PDF File</Label>
            <div className="p-4 border-2 border-dashed border-[#E5DCD0] rounded-xl bg-white text-center space-y-2 hover:border-[#E76F51] transition-colors cursor-pointer" onClick={() => document.getElementById("pdfFileInput")?.click()}>
              <input
                id="pdfFileInput"
                type="file"
                accept="application/pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              <FileText className="w-8 h-8 text-[#E76F51] mx-auto" />
              {pdfFile ? (
                <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)
                </div>
              ) : (
                <p className="text-xs text-[#77716A] font-semibold">
                  Click to select PDF or drag & drop document
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleUploadSubmit}
            disabled={isUploading || !pdfFile}
            className="w-full bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs cursor-pointer"
          >
            {isUploading ? "Uploading Material..." : "Upload & Publish PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
