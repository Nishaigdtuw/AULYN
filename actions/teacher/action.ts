'use server'

import { prisma } from "@/lib/prisma"

export async function addClass(teacherId: string, className: string) {
  try {
    if (!process.env.DATABASE_URL) return null
    return await prisma.classroom.create({
      data: { className, ownerId: teacherId }
    })
  } catch (err: unknown) {
    console.error("addClass error:", err)
    return null
  }
}

export async function getClasses(ownerId: string) {
  try {
    if (!process.env.DATABASE_URL) return []
    return await prisma.classroom.findMany({ where: { ownerId } })
  } catch (err: unknown) {
    console.error("getClasses error:", err)
    return []
  }
}

export async function getChapters(classId: string) {
  try {
    if (!process.env.DATABASE_URL) return []
    return await prisma.chapter.findMany({ where: { classId } })
  } catch (err: unknown) {
    console.error("getChapters error:", err)
    return []
  }
}

export async function addChapter(chapterName: string, classId: string, teacherId: string) {
  try {
    if (!process.env.DATABASE_URL) return null
    return await prisma.chapter.create({
      data: { chapterName, classId, teacherId }
    })
  } catch (err: unknown) {
    console.error("addChapter error:", err)
    return null
  }
}

export async function addContentToChapter(chapterId: string, filename: string, filetype: string, fileurl: string, classId: string) {
  try {
    if (!process.env.DATABASE_URL) return null
    return await prisma.content.create({
      data: { chapterId, fileName: filename, fileType: filetype, fileUrl: fileurl, classId }
    })
  } catch (err: unknown) {
    console.error("addContentToChapter error:", err)
    return null
  }
}

export async function getContent(classId: string) {
  try {
    if (!process.env.DATABASE_URL) return []
    return await prisma.content.findMany({ where: { classId } })
  } catch (err: unknown) {
    console.error("getContent error:", err)
    return []
  }
}