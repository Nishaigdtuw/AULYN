"use server"

import { prisma } from "@/lib/prisma"
import {
  calculateConceptMastery,
  calculateLearningPerformanceScore,
  getStudentConceptMasteries,
  getStoredLearningEvidence,
  LearningEvidenceRecord,
  ConceptMasterySummary,
  StudentLeaderboardEntry,
  RisingLearnerEntry,
  CLASSROOM_CONCEPT_MAP
} from "@/lib/mastery-engine"

// 1. GET STUDENT UNDERSTANDING GRAPH (SERVER ACTION)
export async function getStudentUnderstandingServer(
  studentId: string,
  classId: string
): Promise<{ success: boolean; summaries: ConceptMasterySummary[]; error?: string }> {
  try {
    let evidenceList: LearningEvidenceRecord[] = []

    if (prisma) {
      try {
        const dbEvidence = await prisma.learning_evidence.findMany({
          where: { studentId, classId },
          orderBy: { timestamp: "desc" }
        })

        if (dbEvidence && dbEvidence.length > 0) {
          evidenceList = dbEvidence.map((e) => ({
            evidenceId: e.evidenceId,
            studentId: e.studentId,
            classId: e.classId,
            conceptId: e.conceptId || "general",
            conceptName: e.conceptName,
            sourceType: e.sourceType as any,
            sourceRecordId: e.sourceRecordId || undefined,
            sourceTitle: e.sourceTitle,
            score: e.score,
            maxScore: e.maxScore,
            percentage: e.percentage,
            confidence: e.confidence as any,
            weight: e.weight,
            weakness: e.weakness || undefined,
            recommendation: e.recommendation || undefined,
            timestamp: e.timestamp.toISOString()
          }))
        }
      } catch (dbErr) {
        console.warn("Prisma learning_evidence query skipped:", dbErr)
      }
    }

    if (evidenceList.length === 0) {
      evidenceList = getStoredLearningEvidence(studentId, classId)
    }

    const concepts = CLASSROOM_CONCEPT_MAP[classId] || CLASSROOM_CONCEPT_MAP["class-1"]
    const summaries = concepts.map((c) =>
      calculateConceptMastery(studentId, classId, c.id, c.name, c.category, evidenceList)
    )

    return { success: true, summaries }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("Error in getStudentUnderstandingServer:", errorMsg)
    return {
      success: false,
      summaries: getStudentConceptMasteries(studentId, classId),
      error: errorMsg
    }
  }
}

// 2. GET TEACHER CLASSROOM UNDERSTANDING OVERVIEW (SERVER ACTION)
export async function getClassroomUnderstandingServer(
  classId: string
): Promise<{
  success: boolean
  conceptStats: {
    conceptId: string
    conceptName: string
    category: string
    totalAssessed: number
    mastered: number
    strong: number
    developing: number
    needsAttention: number
    notAssessed: number
  }[]
  conceptsNeedingAttention: {
    conceptId: string
    conceptName: string
    studentsNeedingAttentionCount: number
    affectedStudents: { id: string; name: string; score: number }[]
    primaryWeaknessSummary: string
    recommendedTeacherAction: string
  }[]
  understandingMismatches: {
    studentId: string
    studentName: string
    writtenScore: number
    vivaScore: number
    difference: number
    insight: string
  }[]
  error?: string
}> {
  try {
    const defaultRoster = [
      { id: "stud-1", name: "Alex Rivera" },
      { id: "stud-2", name: "Marcus Chen" },
      { id: "stud-3", name: "Sophia Patel" },
      { id: "stud-4", name: "Liam Vance" },
      { id: "stud-5", name: "Elena Rostova" },
      { id: "stud-6", name: "Noah Al-Mansoor" }
    ]

    let enrolledStudents = defaultRoster

    if (prisma) {
      try {
        const dbEnrolled = await prisma.enrolled.findMany({
          where: { classId },
          include: { user: true }
        })
        if (dbEnrolled && dbEnrolled.length > 0) {
          enrolledStudents = dbEnrolled.map((e) => ({
            id: e.studId,
            name: e.user?.name || `Student ${e.studId.substring(0, 5)}`
          }))
        }
      } catch (dbErr) {
        console.warn("Prisma enrolled list query skipped:", dbErr)
      }
    }

    const concepts = CLASSROOM_CONCEPT_MAP[classId] || CLASSROOM_CONCEPT_MAP["class-1"]
    const allEvidence = getStoredLearningEvidence()

    const conceptStatsMap: Record<
      string,
      {
        conceptId: string
        conceptName: string
        category: string
        totalAssessed: number
        mastered: number
        strong: number
        developing: number
        needsAttention: number
        notAssessed: number
        affectedStudents: { id: string; name: string; score: number }[]
      }
    > = {}

    concepts.forEach((c) => {
      conceptStatsMap[c.id] = {
        conceptId: c.id,
        conceptName: c.name,
        category: c.category,
        totalAssessed: 0,
        mastered: 0,
        strong: 0,
        developing: 0,
        needsAttention: 0,
        notAssessed: 0,
        affectedStudents: []
      }
    })

    const mismatches: {
      studentId: string
      studentName: string
      writtenScore: number
      vivaScore: number
      difference: number
      insight: string
    }[] = []

    enrolledStudents.forEach((student) => {
      const studentMasteries = concepts.map((c) =>
        calculateConceptMastery(student.id, classId, c.id, c.name, c.category, allEvidence)
      )

      studentMasteries.forEach((m) => {
        const stat = conceptStatsMap[m.conceptId]
        if (!stat) return

        if (m.status === 'Not Enough Evidence') {
          stat.notAssessed += 1
        } else {
          stat.totalAssessed += 1
          if (m.status === 'Mastered') stat.mastered += 1
          else if (m.status === 'Strong') stat.strong += 1
          else if (m.status === 'Developing') stat.developing += 1
          else if (m.status === 'Needs Attention') {
            stat.needsAttention += 1
            stat.affectedStudents.push({ id: student.id, name: student.name, score: m.masteryScore || 45 })
          }
        }
      })

      // Check Understanding Mismatch between written quiz/assignment vs verbal viva
      const sEv = allEvidence.filter((e) => e.studentId === student.id && e.classId === classId)
      const writtenEv = sEv.filter((e) => e.sourceType === 'QUIZ' || e.sourceType === 'ASSIGNMENT')
      const vivaEv = sEv.filter((e) => e.sourceType === 'VIVA')

      if (writtenEv.length > 0 && vivaEv.length > 0) {
        const wAvg = Math.round(writtenEv.reduce((s, e) => s + e.percentage, 0) / writtenEv.length)
        const vAvg = Math.round(vivaEv.reduce((s, e) => s + e.percentage, 0) / vivaEv.length)
        const diff = wAvg - vAvg

        if (diff >= 20) {
          mismatches.push({
            studentId: student.id,
            studentName: student.name,
            writtenScore: wAvg,
            vivaScore: vAvg,
            difference: diff,
            insight: `Written performance (${wAvg}%) is substantially stronger than independently demonstrated verbal conceptual reasoning (${vAvg}%).`
          })
        }
      }
    })

    const conceptStats = Object.values(conceptStatsMap)

    const conceptsNeedingAttention = conceptStats
      .filter((s) => s.needsAttention > 0)
      .map((s) => ({
        conceptId: s.conceptId,
        conceptName: s.conceptName,
        studentsNeedingAttentionCount: s.needsAttention,
        affectedStudents: s.affectedStudents,
        primaryWeaknessSummary: `${s.needsAttention} student(s) require reinforcement on ${s.conceptName}.`,
        recommendedTeacherAction: s.conceptId.includes('stack') || s.conceptId.includes('dfs')
          ? "Open Code Visualizer in Live Session"
          : `Create Revision Quiz on ${s.conceptName}`
      }))

    return {
      success: true,
      conceptStats,
      conceptsNeedingAttention,
      understandingMismatches: mismatches
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("Error in getClassroomUnderstandingServer:", errorMsg)
    return {
      success: false,
      conceptStats: [],
      conceptsNeedingAttention: [],
      understandingMismatches: [],
      error: errorMsg
    }
  }
}

// 3. CREATE ASSIGNMENT VERIFICATION REQUEST (SERVER ACTION)
export async function createAssignmentVerificationServer(
  teacherId: string,
  studentId: string,
  classId: string,
  assignmentId: string,
  submissionId: string,
  writtenScore?: number
) {
  try {
    const requestId = `avr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

    if (prisma) {
      try {
        await prisma.assignment_viva_request.create({
          data: {
            requestId,
            assignmentId,
            submissionId,
            studentId,
            classId,
            teacherId,
            status: "PENDING",
            writtenScore: writtenScore || 85
          }
        })
      } catch (dbErr) {
        console.warn("Prisma assignment_viva_request create skipped:", dbErr)
      }
    }

    return {
      success: true,
      requestId,
      message: "Concept Verification Viva requested. The student will receive a notification to start their verbal verification."
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

// 4. COMPLETE ASSIGNMENT VERIFICATION (SERVER ACTION)
export async function completeAssignmentVerificationServer(
  studentId: string,
  requestId: string,
  vivaSessionId: string,
  vivaScore: number,
  writtenScore: number = 85
) {
  try {
    const diff = Math.abs(writtenScore - vivaScore)
    let consistency = "Consistent"
    if (diff > 25) consistency = "Low Consistency"
    else if (diff > 15) consistency = "Moderate Mismatch"

    const insightSummary = `Written score: ${writtenScore}%, Spoken Viva score: ${vivaScore}%. Consistency rating: ${consistency}.`

    if (prisma) {
      try {
        await prisma.assignment_viva_request.updateMany({
          where: { requestId },
          data: {
            status: "COMPLETED",
            vivaSessionId,
            vivaScore,
            writtenScore,
            consistency,
            insightSummary,
            completedAt: new Date()
          }
        })
      } catch (dbErr) {
        console.warn("Prisma assignment_viva_request update skipped:", dbErr)
      }
    }

    return {
      success: true,
      consistency,
      insightSummary
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

// 5. GET CLASSROOM TOP-5 PERFORMANCE LEADERBOARD (SERVER ACTION)
export async function getClassroomLeaderboardServer(
  classId: string,
  currentStudentId: string = "student-demo"
): Promise<{
  success: boolean
  top5: StudentLeaderboardEntry[]
  risingLearners: RisingLearnerEntry[]
  currentStudentEntry?: StudentLeaderboardEntry
  totalEnrolled: number
  error?: string
}> {
  try {
    const defaultRoster = [
      { id: "stud-1", name: "Alex Rivera" },
      { id: "stud-2", name: "Marcus Chen" },
      { id: "stud-3", name: "Sophia Patel" },
      { id: "stud-4", name: "Liam Vance" },
      { id: "stud-5", name: "Elena Rostova" },
      { id: "stud-6", name: "Noah Al-Mansoor" },
      { id: "stud-7", name: "Priya Sharma" }
    ]

    let enrolledStudents = defaultRoster

    if (prisma) {
      try {
        const dbEnrolled = await prisma.enrolled.findMany({
          where: { classId },
          include: { user: true }
        })
        if (dbEnrolled && dbEnrolled.length > 0) {
          enrolledStudents = dbEnrolled.map((e) => ({
            id: e.studId,
            name: e.user?.name || `Student ${e.studId.substring(0, 5)}`
          }))
        }
      } catch (dbErr) {
        console.warn("Prisma enrolled list query skipped in leaderboard:", dbErr)
      }
    }

    const allEvidence = getStoredLearningEvidence()

    const allEntries: StudentLeaderboardEntry[] = enrolledStudents.map((student) => {
      const entry = calculateLearningPerformanceScore(student.id, classId, allEvidence)
      entry.studentName = student.name
      entry.isCurrentStudent = student.id === currentStudentId || (currentStudentId === "student-demo" && student.id === "stud-1")
      return entry
    })

    // Sort descending by performanceScore
    allEntries.sort((a, b) => b.performanceScore - a.performanceScore)

    // Assign 1-indexed ranks
    allEntries.forEach((entry, idx) => {
      entry.rank = idx + 1
    })

    const top5 = allEntries.slice(0, 5)
    const currentStudentEntry = allEntries.find(
      (e) => e.studentId === currentStudentId || (currentStudentId === "student-demo" && e.studentId === "stud-1")
    )

    // Rising Learners based on improvement score > 0
    const risingLearners: RisingLearnerEntry[] = allEntries
      .filter((e) => e.improvementScore > 0)
      .sort((a, b) => b.improvementScore - a.improvementScore)
      .slice(0, 3)
      .map((e) => ({
        studentId: e.studentId,
        studentName: e.studentName,
        conceptName: "Tree Traversal & Recursion",
        scoreImprovement: e.improvementScore,
        previousScore: Math.round(e.performanceScore - e.improvementScore),
        currentScore: Math.round(e.performanceScore)
      }))

    return {
      success: true,
      top5,
      risingLearners,
      currentStudentEntry,
      totalEnrolled: enrolledStudents.length
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("Error in getClassroomLeaderboardServer:", errorMsg)
    return {
      success: false,
      top5: [],
      risingLearners: [],
      totalEnrolled: 0,
      error: errorMsg
    }
  }
}
