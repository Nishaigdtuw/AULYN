'use server'

import { prisma } from "@/lib/prisma"

export interface ServerQuizQuestion {
  questionId?: string
  type: 'MCQ' | 'TrueFalse' | 'ShortAnswer' | 'Coding'
  questionText: string
  options?: string[]
  correctAnswer: string | number
  explanation?: string
  marks: number
  order?: number
}

export interface ServerQuizData {
  quizId?: string
  classId: string
  createdBy: string
  title: string
  topic: string
  description?: string
  instructions?: string
  durationMinutes: number
  passingMarks?: number
  mode: 'OPEN_NOW' | 'SCHEDULED'
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  published: boolean
  releaseResultsMode: 'IMMEDIATELY' | 'MANUALLY'
  questions: ServerQuizQuestion[]
}

// 1. CREATE OR UPDATE QUIZ
export async function createOrUpdateQuizServer(teacherId: string, classId: string, data: ServerQuizData) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }
    
    // Check classroom ownership
    const classroom = await prisma.classroom.findFirst({
      where: { classId, ownerId: teacherId }
    })
    if (!classroom) {
      return { success: false, error: "Unauthorized: You are not the instructor of this classroom." }
    }

    if (!data.title || data.title.trim().length === 0) {
      return { success: false, error: "Quiz title is required." }
    }

    if (!data.durationMinutes || data.durationMinutes <= 0) {
      return { success: false, error: "Duration must be greater than 0 minutes." }
    }

    if (!data.questions || data.questions.length === 0) {
      return { success: false, error: "Quiz must have at least one question." }
    }

    const totalMarks = data.questions.reduce((acc, q) => acc + (q.marks || 5), 0)

    let quizObj
    if (data.quizId) {
      // Check if attempts exist before structural editing
      const existingAttemptsCount = await prisma.quiz_attempt.count({
        where: { quizId: data.quizId }
      })
      if (existingAttemptsCount > 0) {
        // Lock structural edit if attempts exist
        quizObj = await prisma.quiz.update({
          where: { quizId: data.quizId },
          data: {
            title: data.title,
            topic: data.topic,
            description: data.description,
            instructions: data.instructions,
            published: data.published,
            releaseResultsMode: data.releaseResultsMode,
            mode: data.mode,
            startDate: data.startDate,
            startTime: data.startTime,
            endDate: data.endDate,
            endTime: data.endTime
          }
        })
        return { success: true, quiz: quizObj, lockedEdit: true }
      }

      // Re-create questions
      await prisma.quiz_question.deleteMany({ where: { quizId: data.quizId } })

      quizObj = await prisma.quiz.update({
        where: { quizId: data.quizId },
        data: {
          title: data.title,
          topic: data.topic,
          description: data.description,
          instructions: data.instructions,
          durationMinutes: Number(data.durationMinutes) || 30,
          totalMarks,
          passingMarks: Number(data.passingMarks) || 10,
          mode: data.mode,
          startDate: data.startDate,
          startTime: data.startTime,
          endDate: data.endDate,
          endTime: data.endTime,
          published: data.published,
          releaseResultsMode: data.releaseResultsMode
        }
      })
    } else {
      quizObj = await prisma.quiz.create({
        data: {
          classId,
          createdBy: teacherId,
          title: data.title,
          topic: data.topic,
          description: data.description,
          instructions: data.instructions,
          durationMinutes: Number(data.durationMinutes) || 30,
          totalMarks,
          passingMarks: Number(data.passingMarks) || 10,
          mode: data.mode,
          startDate: data.startDate,
          startTime: data.startTime,
          endDate: data.endDate,
          endTime: data.endTime,
          published: data.published,
          releaseResultsMode: data.releaseResultsMode
        }
      })
    }

    // Insert Questions
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i]
      await prisma.quiz_question.create({
        data: {
          quizId: quizObj.quizId,
          type: q.type || 'MCQ',
          questionText: q.questionText,
          options: q.options ? JSON.stringify(q.options) : null,
          correctAnswer: String(q.correctAnswer),
          explanation: q.explanation || null,
          marks: Number(q.marks) || 5,
          order: i
        }
      })
    }

    return { success: true, quiz: quizObj }
  } catch (err: unknown) {
    console.error("createOrUpdateQuizServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to save quiz" }
  }
}

// 2. DELETE QUIZ SERVER
export async function deleteQuizServer(teacherId: string, classId: string, quizId: string) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    const classroom = await prisma.classroom.findFirst({
      where: { classId, ownerId: teacherId }
    })
    if (!classroom) {
      return { success: false, error: "Unauthorized: You are not the instructor." }
    }

    const attemptsCount = await prisma.quiz_attempt.count({ where: { quizId } })
    if (attemptsCount > 0) {
      // Soft close instead of destructive hard delete
      await prisma.quiz.update({
        where: { quizId },
        data: { published: false, mode: 'SCHEDULED', endDate: '2000-01-01', endTime: '00:00' }
      })
      return { success: true, message: "Quiz contains student attempts. It has been unpublished and closed." }
    }

    await prisma.quiz.delete({ where: { quizId } })
    return { success: true }
  } catch (err: unknown) {
    console.error("deleteQuizServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete quiz" }
  }
}

// 3. DUPLICATE QUIZ SERVER
export async function duplicateQuizServer(teacherId: string, classId: string, quizId: string) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    const orig = await prisma.quiz.findUnique({
      where: { quizId },
      include: { questions: { orderBy: { order: 'asc' } } }
    })
    if (!orig) return { success: false, error: "Quiz not found" }

    const dupQuiz = await prisma.quiz.create({
      data: {
        classId,
        createdBy: teacherId,
        title: `${orig.title} (Copy)`,
        topic: orig.topic,
        description: orig.description,
        instructions: orig.instructions,
        durationMinutes: orig.durationMinutes,
        totalMarks: orig.totalMarks,
        passingMarks: orig.passingMarks,
        mode: 'OPEN_NOW',
        published: false,
        releaseResultsMode: orig.releaseResultsMode
      }
    })

    for (let i = 0; i < orig.questions.length; i++) {
      const q = orig.questions[i]
      await prisma.quiz_question.create({
        data: {
          quizId: dupQuiz.quizId,
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          marks: q.marks,
          order: i
        }
      })
    }

    return { success: true, quiz: dupQuiz }
  } catch (err: unknown) {
    console.error("duplicateQuizServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to duplicate quiz" }
  }
}

// 4. GET QUIZZES FOR CLASSROOM SERVER (Strict Enrollment/Ownership Check)
export async function getQuizzesForClassroomServer(userId: string, classId: string, role: 'student' | 'teacher') {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured", quizzes: [] }

    if (role === 'student') {
      // Verify student enrollment
      const enrolledRec = await prisma.enrolled.findFirst({
        where: { studId: userId, classId }
      })
      if (!enrolledRec) {
        return { success: false, error: "Unauthorized: You are not enrolled in this classroom.", quizzes: [] }
      }

      // Return published quizzes only
      const quizzes = await prisma.quiz.findMany({
        where: { classId, published: true },
        include: { questions: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, quizzes }
    } else {
      // Teacher ownership check
      const classroom = await prisma.classroom.findFirst({
        where: { classId, ownerId: userId }
      })
      if (!classroom) {
        return { success: false, error: "Unauthorized: You do not own this classroom.", quizzes: [] }
      }

      const quizzes = await prisma.quiz.findMany({
        where: { classId },
        include: { questions: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, quizzes }
    }
  } catch (err: unknown) {
    console.error("getQuizzesForClassroomServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Database error", quizzes: [] }
  }
}

// 5. START QUIZ ATTEMPT SERVER (Concurrently Safe, Authoritative Server Timer & Hidden Answer Keys)
export async function startQuizAttemptServer(studentId: string, classId: string, quizId: string) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    // Enrollment verification
    const enrollment = await prisma.enrolled.findFirst({
      where: { studId: studentId, classId }
    })
    if (!enrollment) {
      return { success: false, error: "Unauthorized: You are not enrolled in this classroom." }
    }

    const quizObj = await prisma.quiz.findUnique({
      where: { quizId },
      include: { questions: { orderBy: { order: 'asc' } } }
    })
    if (!quizObj || !quizObj.published) {
      return { success: false, error: "Quiz is currently unavailable." }
    }

    const now = new Date()

    // Global schedule window verification
    if (quizObj.mode === "SCHEDULED") {
      if (quizObj.startDate && quizObj.startTime) {
        const startDt = new Date(`${quizObj.startDate}T${quizObj.startTime}`)
        if (now < startDt) {
          return { success: false, error: `Quiz has not started yet. Opens at ${quizObj.startDate} ${quizObj.startTime}.` }
        }
      }
      if (quizObj.endDate && quizObj.endTime) {
        const endDt = new Date(`${quizObj.endDate}T${quizObj.endTime}`)
        if (now > endDt) {
          return { success: false, error: `Quiz is closed to new attempts.` }
        }
      }
    }

    // Check for existing attempt
    let attempt = await prisma.quiz_attempt.findFirst({
      where: { quizId, studentId, classId },
      include: { answers: true }
    })

    if (attempt) {
      // If expired server-side but not marked submitted
      if (attempt.status === "IN_PROGRESS" && now >= attempt.expiresAt) {
        attempt = await prisma.quiz_attempt.update({
          where: { attemptId: attempt.attemptId },
          data: { status: "AUTO_SUBMITTED", submittedAt: attempt.expiresAt },
          include: { answers: true }
        })
      }
    } else {
      // Calculate effectiveExpiresAt = min(now + durationMinutes * 60000, globalQuizCloseTime)
      const durationMs = (quizObj.durationMinutes || 30) * 60 * 1000
      let expiresMs = now.getTime() + durationMs

      if (quizObj.mode === "SCHEDULED" && quizObj.endDate && quizObj.endTime) {
        const globalCloseMs = new Date(`${quizObj.endDate}T${quizObj.endTime}`).getTime()
        if (globalCloseMs < expiresMs) {
          expiresMs = globalCloseMs
        }
      }

      const expiresAt = new Date(expiresMs)

      attempt = await prisma.quiz_attempt.create({
        data: {
          quizId,
          studentId,
          classId,
          startedAt: now,
          expiresAt,
          status: "IN_PROGRESS",
          totalMarks: quizObj.totalMarks
        },
        include: { answers: true }
      })
    }

    // Strip out correctAnswer and answerKey before sending to student client!
    const sanitizedQuestions = quizObj.questions.map((q) => {
      let parsedOptions: string[] = []
      if (q.options) {
        try { parsedOptions = JSON.parse(q.options) } catch { parsedOptions = [] }
      }
      return {
        questionId: q.questionId,
        quizId: q.quizId,
        type: q.type,
        questionText: q.questionText,
        options: parsedOptions,
        marks: q.marks,
        order: q.order
      }
    })

    return {
      success: true,
      quiz: {
        quizId: quizObj.quizId,
        title: quizObj.title,
        topic: quizObj.topic,
        description: quizObj.description,
        instructions: quizObj.instructions,
        durationMinutes: quizObj.durationMinutes,
        totalMarks: quizObj.totalMarks,
        passingMarks: quizObj.passingMarks,
        releaseResultsMode: quizObj.releaseResultsMode,
        questions: sanitizedQuestions
      },
      attempt
    }
  } catch (err: unknown) {
    console.error("startQuizAttemptServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to start quiz attempt" }
  }
}

// 6. SAVE QUESTION ANSWER SERVER (Strict Server Expiry Enforcement & Debounced Autosave)
export async function saveQuestionAnswerServer(
  studentId: string,
  attemptId: string,
  questionId: string,
  studentAnswer: string,
  markedForReview: boolean = false,
  visited: boolean = true
) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    const attempt = await prisma.quiz_attempt.findUnique({
      where: { attemptId }
    })
    if (!attempt || attempt.studentId !== studentId) {
      return { success: false, error: "Unauthorized attempt access." }
    }

    if (attempt.status !== "IN_PROGRESS") {
      return { success: false, error: "Quiz is already finalized and cannot be modified." }
    }

    const now = new Date()
    if (now >= attempt.expiresAt) {
      // Server-side auto-finalize on late save call
      await prisma.quiz_attempt.update({
        where: { attemptId },
        data: { status: "AUTO_SUBMITTED", submittedAt: attempt.expiresAt }
      })
      return { success: false, error: "Quiz duration has expired. Attempt auto-submitted.", expired: true }
    }

    // Upsert answer
    const existing = await prisma.quiz_answer.findFirst({
      where: { attemptId, questionId }
    })

    if (existing) {
      await prisma.quiz_answer.update({
        where: { answerId: existing.answerId },
        data: {
          studentAnswer,
          markedForReview,
          visited,
          savedAt: now
        }
      })
    } else {
      await prisma.quiz_answer.create({
        data: {
          attemptId,
          questionId,
          studentAnswer,
          markedForReview,
          visited,
          savedAt: now
        }
      })
    }

    return { success: true }
  } catch (err: unknown) {
    console.error("saveQuestionAnswerServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to save answer" }
  }
}

// 7. SUBMIT QUIZ ATTEMPT SERVER (Objective Auto-Grading & Subjective Flagging)
export async function submitQuizAttemptServer(studentId: string, attemptId: string, isAutoSubmit: boolean = false) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    const attempt = await prisma.quiz_attempt.findUnique({
      where: { attemptId },
      include: {
        answers: true,
        quiz: { include: { questions: true } }
      }
    })
    if (!attempt || attempt.studentId !== studentId) {
      return { success: false, error: "Unauthorized attempt." }
    }

    if (attempt.status !== "IN_PROGRESS") {
      return { success: true, attempt, alreadySubmitted: true }
    }

    const now = new Date()
    let objectiveScore = 0
    let hasSubjective = false

    for (const q of attempt.quiz.questions) {
      const ans = attempt.answers.find((a) => a.questionId === q.questionId)
      const uAnsStr = ans?.studentAnswer !== undefined && ans.studentAnswer !== null ? String(ans.studentAnswer).trim() : ""

      if (q.type === "MCQ" || q.type === "TrueFalse") {
        if (uAnsStr.length > 0 && uAnsStr === String(q.correctAnswer).trim()) {
          objectiveScore += q.marks || 5
          if (ans) {
            await prisma.quiz_answer.update({
              where: { answerId: ans.answerId },
              data: { marksAwarded: q.marks || 5, reviewStatus: 'GRADED' }
            })
          }
        } else if (ans) {
          await prisma.quiz_answer.update({
            where: { answerId: ans.answerId },
            data: { marksAwarded: 0, reviewStatus: 'GRADED' }
          })
        }
      } else if (q.type === "ShortAnswer") {
        hasSubjective = true
        if (ans) {
          await prisma.quiz_answer.update({
            where: { answerId: ans.answerId },
            data: { reviewStatus: 'NEEDS_REVIEW' }
          })
        }
      }
    }

    const percentage = Math.round((objectiveScore / (attempt.totalMarks || 1)) * 100)
    const finalStatus = isAutoSubmit
      ? (hasSubjective ? "NEEDS_REVIEW" : "AUTO_SUBMITTED")
      : (hasSubjective ? "NEEDS_REVIEW" : "GRADED")

    const updatedAttempt = await prisma.quiz_attempt.update({
      where: { attemptId },
      data: {
        submittedAt: now,
        status: finalStatus,
        score: objectiveScore,
        percentage,
        resultPublishedAt: attempt.quiz.releaseResultsMode === "IMMEDIATELY" && !hasSubjective ? now : null
      },
      include: { answers: true }
    })

    // Record learning evidence in DB
    try {
      await prisma.learning_evidence.create({
        data: {
          studentId,
          classId: attempt.classId,
          conceptName: attempt.quiz.topic || attempt.quiz.title,
          sourceType: "QUIZ",
          sourceRecordId: attemptId,
          sourceTitle: attempt.quiz.title,
          score: objectiveScore,
          maxScore: attempt.totalMarks || 10,
          percentage,
          confidence: "Medium",
          weight: 1.0,
          summary: `Completed quiz ${attempt.quiz.title} with score ${objectiveScore}/${attempt.totalMarks} (${percentage}%)`
        }
      })
    } catch (eErr) {
      console.warn("Skipped quiz evidence DB creation:", eErr)
    }

    return { success: true, attempt: updatedAttempt }
  } catch (err: unknown) {
    console.error("submitQuizAttemptServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to submit attempt" }
  }
}

// 8. GET TEACHER QUIZ ATTEMPTS SERVER
export async function getTeacherQuizAttemptsServer(teacherId: string, classId: string, quizId: string) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured", attempts: [] }

    const classroom = await prisma.classroom.findFirst({
      where: { classId, ownerId: teacherId },
      include: { enrolled: { include: { user: true } } }
    })
    if (!classroom) {
      return { success: false, error: "Unauthorized: You are not the instructor.", attempts: [] }
    }

    const attempts = await prisma.quiz_attempt.findMany({
      where: { quizId, classId },
      include: {
        user: true,
        answers: { include: { question: true } }
      },
      orderBy: { startedAt: 'desc' }
    })

    return { success: true, attempts, enrolledStudents: classroom.enrolled.map((e) => e.user) }
  } catch (err: unknown) {
    console.error("getTeacherQuizAttemptsServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Database error", attempts: [] }
  }
}

// 9. GRADE SUBJECTIVE ANSWER SERVER
export async function gradeSubjectiveAnswerServer(
  teacherId: string,
  attemptId: string,
  questionId: string,
  marksAwarded: number,
  feedback?: string
) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    const attempt = await prisma.quiz_attempt.findUnique({
      where: { attemptId },
      include: {
        answers: true,
        classroom: true
      }
    })
    if (!attempt || attempt.classroom.ownerId !== teacherId) {
      return { success: false, error: "Unauthorized teacher access." }
    }

    const ans = attempt.answers.find((a) => a.questionId === questionId)
    if (ans) {
      await prisma.quiz_answer.update({
        where: { answerId: ans.answerId },
        data: {
          marksAwarded: Number(marksAwarded) || 0,
          feedback,
          reviewStatus: 'GRADED'
        }
      })
    }

    // Recalculate total score
    const updatedAnswers = await prisma.quiz_answer.findMany({
      where: { attemptId }
    })

    const totalScore = updatedAnswers.reduce((acc, a) => acc + (a.marksAwarded || 0), 0)
    const percentage = Math.round((totalScore / (attempt.totalMarks || 1)) * 100)
    const allGraded = updatedAnswers.every((a) => a.reviewStatus === 'GRADED')

    const updated = await prisma.quiz_attempt.update({
      where: { attemptId },
      data: {
        score: totalScore,
        percentage,
        status: allGraded ? "GRADED" : "NEEDS_REVIEW"
      }
    })

    return { success: true, attempt: updated }
  } catch (err: unknown) {
    console.error("gradeSubjectiveAnswerServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to grade answer" }
  }
}

// 10. PUBLISH QUIZ RESULTS SERVER
export async function publishQuizResultsServer(teacherId: string, quizId: string) {
  try {
    if (!process.env.DATABASE_URL) return { success: false, error: "Database not configured" }

    const quizObj = await prisma.quiz.findUnique({
      where: { quizId },
      include: { classroom: true }
    })
    if (!quizObj || quizObj.classroom.ownerId !== teacherId) {
      return { success: false, error: "Unauthorized teacher access." }
    }

    await prisma.quiz_attempt.updateMany({
      where: { quizId },
      data: { resultPublishedAt: new Date() }
    })

    return { success: true }
  } catch (err: unknown) {
    console.error("publishQuizResultsServer error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to publish results" }
  }
}
