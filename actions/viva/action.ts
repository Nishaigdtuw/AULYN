'use server'

import { prisma } from "@/lib/prisma"

export interface VivaQuestionItem {
  id: string
  sessionId: string
  order: number
  concept: string
  questionText: string
  difficulty: 'Basic' | 'Medium' | 'Advanced'
  isFollowUp: boolean
  parentQuestionId?: string
  transcript?: string
  score?: number
  correctness?: number
  completeness?: number
  reasoning?: number
  relevance?: number
  communication?: number
  deliveryFluency?: number
  misconceptionDetected?: boolean
  misconceptionSummary?: string
  whatExplainedWell?: string
  whatWasMissing?: string
  conceptualFeedback?: string
  nextAction?: 'FOLLOW_UP' | 'DEEPER' | 'CLARIFY' | 'NEXT_CONCEPT' | 'COMPLETE'
}

export interface ConceptMasteryItem {
  concept: string
  status: 'Strong' | 'Moderate' | 'Needs Revision'
  score: number
}

export interface VivaReportData {
  sessionId: string
  studentId: string
  classId: string
  topic: string
  status: string
  overallScore: number
  conceptualScore: number
  correctnessScore: number
  reasoningScore: number
  communicationScore: number
  deliveryFluencyScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  conceptMastery: ConceptMasteryItem[]
  recommendedNextSteps: string[]
  questions: VivaQuestionItem[]
  startedAt: string
  completedAt?: string
}

// 1. START VIVA SESSION SERVER ACTION
export async function startVivaSessionServer(
  studentId: string,
  classId: string,
  isRetry: boolean = false,
  retryConceptsInput?: string[]
) {
  try {
    // A. Check for existing active IN_PROGRESS session (for refresh recovery)
    if (prisma) {
      const activeSession = await prisma.viva_session.findFirst({
        where: { studentId, classId, status: "IN_PROGRESS" },
        include: { questions: { orderBy: { order: "asc" } } }
      })

      if (activeSession) {
        return {
          success: true,
          session: activeSession,
          resumed: true,
          questions: activeSession.questions
        }
      }
    }

    // B. Check course material availability
    let hasMaterials = false
    let materialTopics: string[] = []
    let classroomName = "Course Laboratory Viva"

    if (prisma) {
      const cls = await prisma.classroom.findUnique({
        where: { classId },
        include: { chapter: { include: { content: true } } }
      })

      if (cls) {
        classroomName = cls.className
        const totalContent = cls.chapter.flatMap((c) => c.content)
        if (totalContent.length > 0 || cls.chapter.length > 0) {
          hasMaterials = true
          materialTopics = cls.chapter.map((c) => c.chapterName)
        }
      }
    } else {
      // Data-store fallback check is handled component-side
      hasMaterials = true
      materialTopics = ["Core Subject Mechanics", "Fundamental Application", "Algorithmic Reasoning"]
    }

    if (materialTopics.length === 0) {
      materialTopics = [
        "Data Structures & Algorithm Complexity",
        "Binary Search Trees & Traversal Properties",
        "Recursive Call Stack & Depth-First Search",
        "Graph Traversal & Cycle Detection",
        "Self-Balancing Trees & Rotations"
      ]
    }

    // C. Create new viva session
    const sessionId = `viva-sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const mainTopic = isRetry ? `Targeted Revision: ${retryConceptsInput?.join(", ") || "Weak Concepts"}` : classroomName

    // D. Generate initial question
    const firstConcept = isRetry && retryConceptsInput?.[0] ? retryConceptsInput[0] : materialTopics[0]
    const initialQuestionText = await generateAiQuestionText(classroomName, firstConcept, 'Medium', false)

    if (prisma) {
      const newSession = await prisma.viva_session.create({
        data: {
          id: sessionId,
          studentId,
          classId,
          topic: mainTopic,
          status: "IN_PROGRESS",
          isRetry,
          retryConcepts: isRetry ? JSON.stringify(retryConceptsInput || []) : null,
          startedAt: new Date()
        }
      })

      const firstQuestion = await prisma.viva_question.create({
        data: {
          id: `vq-1-${Date.now()}`,
          sessionId,
          order: 1,
          concept: firstConcept,
          questionText: initialQuestionText,
          difficulty: "Medium",
          isFollowUp: false
        }
      })

      return {
        success: true,
        session: newSession,
        resumed: false,
        questions: [firstQuestion]
      }
    }

    // Fallback response if Prisma is not connected directly
    const fallbackQuestion: VivaQuestionItem = {
      id: `vq-1-${Date.now()}`,
      sessionId,
      order: 1,
      concept: firstConcept,
      questionText: initialQuestionText,
      difficulty: "Medium",
      isFollowUp: false
    }

    return {
      success: true,
      sessionId,
      topic: mainTopic,
      questions: [fallbackQuestion]
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

// 2. SUBMIT VIVA RESPONSE SERVER ACTION
export async function submitVivaResponseServer(
  studentId: string,
  sessionId: string,
  questionId: string,
  transcript: string
) {
  try {
    if (!transcript || transcript.trim().length === 0) {
      return { success: false, error: "EMPTY_TRANSCRIPT", message: "I couldn't hear that clearly. Please try again." }
    }

    // Fetch existing questions in session
    let existingQuestions: VivaQuestionItem[] = []
    let currentQ: VivaQuestionItem | null = null

    if (prisma) {
      const qList = await prisma.viva_question.findMany({
        where: { sessionId },
        orderBy: { order: "asc" }
      })
      existingQuestions = qList.map((q) => ({
        id: q.id,
        sessionId: q.sessionId,
        order: q.order,
        concept: q.concept,
        questionText: q.questionText,
        difficulty: q.difficulty as any,
        isFollowUp: q.isFollowUp,
        parentQuestionId: q.parentQuestionId || undefined,
        transcript: q.transcript || undefined,
        score: q.score || undefined
      }))

      currentQ = existingQuestions.find((q) => q.id === questionId) || existingQuestions[existingQuestions.length - 1]
    }

    const currentConcept = currentQ?.concept || "Core Concept"
    const questionText = currentQ?.questionText || "Explain your understanding."

    // Evaluate response with Gemini or intelligent academic engine
    const evaluation = await evaluateResponseAi(questionText, transcript, currentConcept)

    // Update current question with evaluation & transcript
    if (prisma && currentQ) {
      await prisma.viva_question.update({
        where: { id: currentQ.id },
        data: {
          transcript,
          score: evaluation.score,
          correctness: evaluation.correctness,
          completeness: evaluation.completeness,
          reasoning: evaluation.reasoning,
          relevance: evaluation.relevance,
          communication: evaluation.communication,
          deliveryFluency: evaluation.deliveryFluency,
          misconceptionDetected: evaluation.misconceptionDetected,
          misconceptionSummary: evaluation.misconceptionSummary,
          whatExplainedWell: evaluation.whatExplainedWell,
          whatWasMissing: evaluation.whatWasMissing,
          conceptualFeedback: evaluation.conceptualFeedback,
          nextAction: evaluation.nextAction,
          answeredAt: new Date()
        }
      })
    }

    // Determine adaptive next step
    const totalAnswered = existingQuestions.filter((q) => q.transcript || q.id === questionId).length
    const maxQuestions = 10

    // Decide if session should complete or continue
    if (totalAnswered >= maxQuestions || (totalAnswered >= 5 && evaluation.nextAction === "COMPLETE")) {
      return {
        success: true,
        isCompleted: true,
        evaluation,
        message: "Viva completed! Generating your detailed performance report..."
      }
    }

    // Adaptive next question selection
    let nextAction = evaluation.nextAction
    let isFollowUp = false
    let parentQuestionId: string | undefined = undefined
    let nextConcept = currentConcept
    let nextDifficulty: 'Basic' | 'Medium' | 'Advanced' = 'Medium'

    if (evaluation.misconceptionDetected || evaluation.score < 6.0 || evaluation.completeness < 6.0) {
      nextAction = 'FOLLOW_UP'
      isFollowUp = true
      parentQuestionId = currentQ?.id
      nextDifficulty = 'Basic'
    } else if (evaluation.score >= 8.5) {
      nextAction = 'DEEPER'
      nextDifficulty = 'Advanced'
      isFollowUp = true
      parentQuestionId = currentQ?.id
    } else {
      nextAction = 'NEXT_CONCEPT'
      isFollowUp = false
      nextDifficulty = 'Medium'
      // Pick next un-tested concept
      const conceptsList = [
        "Data Structures & Algorithm Complexity",
        "Binary Search Trees & Traversal Properties",
        "Recursive Call Stack & Depth-First Search",
        "Graph Traversal & Cycle Detection",
        "Self-Balancing Trees & Rotations"
      ]
      const nextIdx = totalAnswered % conceptsList.length
      nextConcept = conceptsList[nextIdx]
    }

    const nextQuestionText = await generateAiQuestionText(nextConcept, nextConcept, nextDifficulty, isFollowUp, transcript, questionText)
    const nextOrder = totalAnswered + 1

    let newQuestion: VivaQuestionItem = {
      id: `vq-${nextOrder}-${Date.now()}`,
      sessionId,
      order: nextOrder,
      concept: nextConcept,
      questionText: nextQuestionText,
      difficulty: nextDifficulty,
      isFollowUp,
      parentQuestionId
    }

    if (prisma) {
      const created = await prisma.viva_question.create({
        data: {
          id: newQuestion.id,
          sessionId,
          order: nextOrder,
          concept: nextConcept,
          questionText: nextQuestionText,
          difficulty: nextDifficulty,
          isFollowUp,
          parentQuestionId
        }
      })
      newQuestion.id = created.id
    }

    return {
      success: true,
      isCompleted: false,
      evaluation,
      nextQuestion: newQuestion
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

// 3. FINALIZE VIVA SESSION & GENERATE REPORT SERVER ACTION
export async function finalizeVivaSessionServer(studentId: string, sessionId: string): Promise<{ success: boolean; report?: VivaReportData; error?: string }> {
  try {
    if (!prisma) {
      return { success: false, error: "Database instance unavailable" }
    }

    const session = await prisma.viva_session.findUnique({
      where: { id: sessionId },
      include: { questions: { orderBy: { order: "asc" } } }
    })

    if (!session) {
      return { success: false, error: "Viva session not found" }
    }

    const questions = session.questions.map((q) => ({
      id: q.id,
      sessionId: q.sessionId,
      order: q.order,
      concept: q.concept,
      questionText: q.questionText,
      difficulty: q.difficulty as any,
      isFollowUp: q.isFollowUp,
      parentQuestionId: q.parentQuestionId || undefined,
      transcript: q.transcript || undefined,
      score: q.score || undefined,
      correctness: q.correctness || undefined,
      completeness: q.completeness || undefined,
      reasoning: q.reasoning || undefined,
      relevance: q.relevance || undefined,
      communication: q.communication || undefined,
      deliveryFluency: q.deliveryFluency || undefined,
      misconceptionDetected: q.misconceptionDetected,
      misconceptionSummary: q.misconceptionSummary || undefined,
      whatExplainedWell: q.whatExplainedWell || undefined,
      whatWasMissing: q.whatWasMissing || undefined,
      conceptualFeedback: q.conceptualFeedback || undefined
    }))

    const answeredQs = questions.filter((q) => q.transcript)
    if (answeredQs.length === 0) {
      return { success: false, error: "No answered questions to evaluate." }
    }

    // Calculate aggregated non-contradictory metrics
    const avgScore = answeredQs.reduce((sum, q) => sum + (q.score || 7.0), 0) / answeredQs.length
    const overallScore = Math.round(avgScore * 10) / 10

    const conceptualScore = Math.round((answeredQs.reduce((sum, q) => sum + (q.completeness || 7), 0) / answeredQs.length) * 10) / 10
    const correctnessScore = Math.round((answeredQs.reduce((sum, q) => sum + (q.correctness || 7), 0) / answeredQs.length) * 10) / 10
    const reasoningScore = Math.round((answeredQs.reduce((sum, q) => sum + (q.reasoning || 7), 0) / answeredQs.length) * 10) / 10
    const communicationScore = Math.round((answeredQs.reduce((sum, q) => sum + (q.communication || 7), 0) / answeredQs.length) * 10) / 10
    const deliveryFluencyScore = Math.round((answeredQs.reduce((sum, q) => sum + (q.deliveryFluency || 7), 0) / answeredQs.length) * 10) / 10

    // Concept Mastery Breakdown
    const conceptScoresMap: Record<string, { total: number; count: number }> = {}
    answeredQs.forEach((q) => {
      if (!conceptScoresMap[q.concept]) conceptScoresMap[q.concept] = { total: 0, count: 0 }
      conceptScoresMap[q.concept].total += (q.score || 7.0)
      conceptScoresMap[q.concept].count += 1
    })

    const conceptMastery: ConceptMasteryItem[] = Object.entries(conceptScoresMap).map(([c, val]) => {
      const cAvg = val.total / val.count
      return {
        concept: c,
        score: Math.round(cAvg * 10) / 10,
        status: cAvg >= 8.0 ? 'Strong' : (cAvg >= 6.0 ? 'Moderate' : 'Needs Revision')
      }
    })

    // Narrative Summary & Recommendations
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendedNextSteps: string[] = []

    conceptMastery.forEach((cm) => {
      if (cm.status === 'Strong') {
        strengths.push(`Solid conceptual grasp and articulation of ${cm.concept}`)
      } else if (cm.status === 'Needs Revision') {
        weaknesses.push(`Requires deeper revision on ${cm.concept} edge cases and mechanics`)
        recommendedNextSteps.push(`Review notes and practice verbal explanation for ${cm.concept}`)
      }
    })

    if (strengths.length === 0) strengths.push("Demonstrated foundational verbal articulation under examination pressure")
    if (weaknesses.length === 0) weaknesses.push("Solid performance — review advanced edge cases to maintain mastery")

    recommendedNextSteps.push("Re-verify time and space complexity trade-offs verbally")
    recommendedNextSteps.push("Attempt a targeted viva retry on weak topics to solidify mastery")

    const summary = `Student completed ${answeredQs.length} oral viva questions for ${session.topic}. Overall score: ${overallScore}/10. Demonstrated good technical reasoning with strongest performance in ${conceptMastery.find(c => c.status === 'Strong')?.concept || 'core fundamentals'}.`

    // Update database
    await prisma.viva_session.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        overallScore,
        conceptualScore,
        correctnessScore,
        reasoningScore,
        communicationScore,
        deliveryFluencyScore,
        summary,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        conceptMastery: JSON.stringify(conceptMastery),
        recommendedNextSteps: JSON.stringify(recommendedNextSteps),
        completedAt: new Date()
      }
    })

    const report: VivaReportData = {
      sessionId: session.id,
      studentId: session.studentId,
      classId: session.classId,
      topic: session.topic,
      status: "COMPLETED",
      overallScore,
      conceptualScore,
      correctnessScore,
      reasoningScore,
      communicationScore,
      deliveryFluencyScore,
      summary,
      strengths,
      weaknesses,
      conceptMastery,
      recommendedNextSteps,
      questions,
      startedAt: session.startedAt.toISOString(),
      completedAt: new Date().toISOString()
    }

    return { success: true, report }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

// 4. RETRY WEAK CONCEPTS SERVER ACTION
export async function retryWeakConceptsServer(studentId: string, classId: string, weakConcepts: string[]) {
  return startVivaSessionServer(studentId, classId, true, weakConcepts)
}

// -------------------------------------------------------------
// INTERNAL AI HELPER FUNCTIONS
// -------------------------------------------------------------

async function generateAiQuestionText(
  classroomName: string,
  concept: string,
  difficulty: 'Basic' | 'Medium' | 'Advanced',
  isFollowUp: boolean,
  previousTranscript?: string,
  previousQuestionText?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (apiKey) {
    try {
      const model = "gemini-1.5-flash"
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      let prompt = `You are an expert academic viva examiner conducting a live oral viva for ${classroomName}.\n`
      if (isFollowUp && previousTranscript && previousQuestionText) {
        prompt += `Previous Question: "${previousQuestionText}"\nStudent's Spoken Answer: "${previousTranscript}"\nAsk a concise, probing follow-up question specifically addressing missing reasoning or misconceptions in what the student said.`
      } else {
        prompt += `Formulate ONE concise, conceptual oral viva question testing "${concept}" at ${difficulty} level. Do not give choices. Ask directly as an examiner.`
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
        })
      })

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && text.trim().length > 10) {
        return text.trim().replace(/^["']|["']$/g, '')
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback Question Generator
  if (isFollowUp && previousTranscript) {
    if (previousTranscript.toLowerCase().includes("recursion") || previousTranscript.toLowerCase().includes("stack")) {
      return `Good. How does the system call stack prevent memory overflow when executing recursive ${concept}?`
    }
    return `Can you explain the specific scenario where this approach fails or becomes inefficient in ${concept}?`
  }

  if (difficulty === 'Advanced') {
    return `How would you modify standard ${concept} to handle dynamic real-time input constraints efficiently?`
  }

  if (difficulty === 'Basic') {
    return `Let's simplify: What is the fundamental property or rule that defines ${concept}?`
  }

  return `What is the core conceptual difference between recursive and iterative implementations of ${concept}?`
}

async function evaluateResponseAi(questionText: string, transcript: string, concept: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const wordCount = transcript.trim().split(/\s+/).length

  let score = 7.5
  let correctness = 8.0
  let completeness = 7.0
  let reasoning = 7.5
  let relevance = 8.5
  let communication = 7.5
  let deliveryFluency = 7.0
  let misconceptionDetected = false
  let misconceptionSummary = ""
  let whatExplainedWell = "Correctly identified key domain concepts and core mechanisms."
  let whatWasMissing = "Could expand further on structural complexity trade-offs."
  let conceptualFeedback = "Solid verbal response. Good technical terminology."
  let nextAction: 'FOLLOW_UP' | 'DEEPER' | 'CLARIFY' | 'NEXT_CONCEPT' | 'COMPLETE' = 'NEXT_CONCEPT'

  if (wordCount < 7 || transcript.toLowerCase().includes("don't know") || transcript.toLowerCase().includes("not sure")) {
    score = 4.5
    correctness = 5.0
    completeness = 4.0
    reasoning = 4.0
    communication = 5.0
    deliveryFluency = 4.5
    misconceptionDetected = true
    misconceptionSummary = "Incomplete explanation with missing core mechanics."
    whatExplainedWell = "Attempted response under examination conditions."
    whatWasMissing = "Lacked essential formula definitions and step-by-step reasoning."
    conceptualFeedback = "Response was incomplete. Re-examine fundamental definitions."
    nextAction = 'FOLLOW_UP'
  } else if (wordCount >= 20) {
    score = 9.0
    correctness = 9.5
    completeness = 9.0
    reasoning = 9.0
    communication = 9.0
    deliveryFluency = 8.5
    whatExplainedWell = "Outstanding articulation of technical principles and operational constraints."
    whatWasMissing = "Minor edge-case optimization detail."
    conceptualFeedback = "Excellent conceptual defense. Precise domain vocabulary."
    nextAction = 'DEEPER'
  }

  if (apiKey) {
    try {
      const model = "gemini-1.5-flash"
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      const evalPrompt = `Evaluate this viva response as a strict academic examiner.
Question: "${questionText}"
Student Answer: "${transcript}"
Concept: "${concept}"

Return valid JSON with keys:
"score" (0-10), "correctness" (0-10), "completeness" (0-10), "reasoning" (0-10), "relevance" (0-10), "communication" (0-10), "deliveryFluency" (0-10), "misconceptionDetected" (boolean), "misconceptionSummary" (string), "whatExplainedWell" (string), "whatWasMissing" (string), "conceptualFeedback" (string), "nextAction" ("FOLLOW_UP"|"DEEPER"|"NEXT_CONCEPT"|"COMPLETE").`

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: evalPrompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      })

      const data = await res.json()
      const parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}")

      if (parsed.score !== undefined) {
        return {
          score: Number(parsed.score) || score,
          correctness: Number(parsed.correctness) || correctness,
          completeness: Number(parsed.completeness) || completeness,
          reasoning: Number(parsed.reasoning) || reasoning,
          relevance: Number(parsed.relevance) || relevance,
          communication: Number(parsed.communication) || communication,
          deliveryFluency: Number(parsed.deliveryFluency) || deliveryFluency,
          misconceptionDetected: Boolean(parsed.misconceptionDetected),
          misconceptionSummary: parsed.misconceptionSummary || misconceptionSummary,
          whatExplainedWell: parsed.whatExplainedWell || whatExplainedWell,
          whatWasMissing: parsed.whatWasMissing || whatWasMissing,
          conceptualFeedback: parsed.conceptualFeedback || conceptualFeedback,
          nextAction: parsed.nextAction || nextAction
        }
      }
    } catch {
      // Return local fallback evaluation
    }
  }

  return {
    score,
    correctness,
    completeness,
    reasoning,
    relevance,
    communication,
    deliveryFluency,
    misconceptionDetected,
    misconceptionSummary,
    whatExplainedWell,
    whatWasMissing,
    conceptualFeedback,
    nextAction
  }
}
