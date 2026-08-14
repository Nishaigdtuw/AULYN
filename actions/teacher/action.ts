'use server'

import { PrismaClient } from "@prisma/client"



const prisma = new PrismaClient();


export async function addClass(teacherId: string, className: string){
    const classroom =  await prisma.classroom.create({
        data: {
            className,
            ownerId: teacherId
        }
    })
    return classroom;
}

export async function getClasses(ownerId: string){
    const classes = await prisma.classroom.findMany({
        where:{
            ownerId
        }
    })
    
    return classes;
}

export async function getChapters(classId: string){
    const chapters = await prisma.chapter.findMany({
        where:{
            classId
        }
    })
    
    return chapters;
}

export async function addChapter(chapterName: string, classId: string, teacherId: string) {
  const chapter = await prisma.chapter.create({
    data: {
        chapterName: chapterName,
        classId: classId,
        teacherId: teacherId
    }
  })
  return chapter;
}


export async function addContentToChapter(chapterId: string, filename: string, filetype: string, fileurl: string, classId: string){
    const content = await prisma.content.create({
        data: {
            chapterId,
            fileName: filename,
            fileType: filetype,
            fileUrl: fileurl,
            classId
        }
    })
    return content;
}


export async function getContent(classId: string){
    const content = await prisma.content.findMany({
        where:{
            classId
        }
    })
    return content;
}