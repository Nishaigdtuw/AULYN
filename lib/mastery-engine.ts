// AULYN Centralized Mastery Calculation Engine & Learning Intelligence System

export type EvidenceSourceType = 'QUIZ' | 'ASSIGNMENT' | 'VIVA' | 'CODE_REASONING' | 'TEACHER_EVALUATION'
export type EvidenceConfidence = 'Low' | 'Medium' | 'High'
export type MasteryStatus = 'Mastered' | 'Strong' | 'Developing' | 'Needs Attention' | 'Not Enough Evidence'

export interface LearningEvidenceRecord {
  evidenceId: string
  studentId: string
  classId: string
  conceptId: string
  conceptName: string
  sourceType: EvidenceSourceType
  sourceRecordId?: string
  sourceTitle: string
  score: number
  maxScore: number
  percentage: number
  confidence: EvidenceConfidence
  weight: number
  summary?: string
  weakness?: string
  recommendation?: string
  timestamp: string
}

export interface ConceptMasterySummary {
  studentId: string
  classId: string
  conceptId: string
  conceptName: string
  category: string
  masteryScore: number | null
  status: MasteryStatus
  confidence: EvidenceConfidence
  evidenceCount: number
  primaryWeakness?: string
  recommendedAction?: string
  evidenceList: LearningEvidenceRecord[]
}

export interface StudentLeaderboardEntry {
  rank: number
  studentId: string
  studentName: string
  email?: string
  performanceScore: number
  quizScore: number | null
  assignmentScore: number | null
  vivaScore: number | null
  improvementScore: number
  consistencyScore: number
  isCurrentStudent?: boolean
  breakdown: {
    quizComponent: number
    assignmentComponent: number
    vivaComponent: number
    improvementComponent: number
    consistencyComponent: number
  }
}

export interface RisingLearnerEntry {
  studentId: string
  studentName: string
  conceptName: string
  scoreImprovement: number
  previousScore: number
  currentScore: number
}

export const EVIDENCE_STORAGE_KEY = "aulyn_learning_evidence_v2"
export const MASTERY_STORAGE_KEY = "aulyn_concept_mastery_v2"

// Predefined Syllabus Concept Knowledge Map for Classrooms
export const CLASSROOM_CONCEPT_MAP: Record<string, { id: string; name: string; category: string; order: number }[]> = {
  "dsa-2026": [
    { id: "arrays", name: "Arrays & Pointers", category: "Linear Data Structures", order: 1 },
    { id: "linked-lists", name: "Linked Lists & Node Pointers", category: "Linear Data Structures", order: 2 },
    { id: "trees-bst", name: "Binary Search Trees", category: "Non-Linear Structures", order: 3 },
    { id: "tree-bfs", name: "Breadth-First Search (BFS)", category: "Tree & Graph Traversal", order: 4 },
    { id: "tree-dfs", name: "Depth-First Search (DFS)", category: "Tree & Graph Traversal", order: 5 },
    { id: "recursive-stack", name: "DFS Recursive Call Stack", category: "Recursion & Call Stack", order: 6 },
    { id: "graphs-cycle", name: "Graph Traversal & Cycle Detection", category: "Graph Algorithms", order: 7 }
  ],
  "class-1": [
    { id: "arrays", name: "Arrays & Pointers", category: "Linear Data Structures", order: 1 },
    { id: "linked-lists", name: "Linked Lists & Node Pointers", category: "Linear Data Structures", order: 2 },
    { id: "trees-bst", name: "Binary Search Trees", category: "Non-Linear Structures", order: 3 },
    { id: "tree-bfs", name: "Breadth-First Search (BFS)", category: "Tree & Graph Traversal", order: 4 },
    { id: "tree-dfs", name: "Depth-First Search (DFS)", category: "Tree & Graph Traversal", order: 5 },
    { id: "recursive-stack", name: "DFS Recursive Call Stack", category: "Recursion & Call Stack", order: 6 },
    { id: "graphs-cycle", name: "Graph Traversal & Cycle Detection", category: "Graph Algorithms", order: 7 }
  ]
}

// 1. DETERMINISTIC MASTERY CALCULATION
export function calculateConceptMastery(
  studentId: string,
  classId: string,
  conceptId: string,
  conceptName: string,
  category: string,
  evidenceList: LearningEvidenceRecord[]
): ConceptMasterySummary {
  const filtered = evidenceList.filter(
    (e) => e.studentId === studentId && e.classId === classId && (e.conceptId === conceptId || e.conceptName === conceptName)
  )

  if (filtered.length === 0) {
    return {
      studentId,
      classId,
      conceptId,
      conceptName,
      category,
      masteryScore: null,
      status: 'Not Enough Evidence',
      confidence: 'Low',
      evidenceCount: 0,
      primaryWeakness: 'No assessment evidence collected yet for this concept.',
      recommendedAction: `Complete a quiz, assignment, or oral viva on ${conceptName}`,
      evidenceList: []
    }
  }

  // Calculate Weighted Average Percentage
  const totalWeight = filtered.reduce((sum, item) => sum + item.weight, 0)
  const weightedSum = filtered.reduce((sum, item) => sum + item.percentage * item.weight, 0)
  const masteryScore = Math.round(weightedSum / (totalWeight || 1))

  // Determine Status
  let status: MasteryStatus = 'Developing'
  if (masteryScore >= 85) status = 'Mastered'
  else if (masteryScore >= 70) status = 'Strong'
  else if (masteryScore >= 50) status = 'Developing'
  else status = 'Needs Attention'

  // Determine Evidence Confidence
  const distinctSourceTypes = new Set(filtered.map((e) => e.sourceType)).size
  let confidence: EvidenceConfidence = 'Low'

  if (filtered.length >= 4 && distinctSourceTypes >= 3) {
    confidence = 'High'
  } else if (filtered.length >= 2 && distinctSourceTypes >= 2) {
    confidence = 'Medium'
  } else if (filtered.length >= 3) {
    confidence = 'Medium'
  } else {
    confidence = 'Low'
  }

  // Find Primary Weakness & Action Recommendation
  const lowestEvidence = [...filtered].sort((a, b) => a.percentage - b.percentage)[0]
  let primaryWeakness = lowestEvidence.weakness
  if (!primaryWeakness) {
    if (lowestEvidence.sourceType === 'VIVA') {
      primaryWeakness = `Demonstrated difficulty explaining ${conceptName} verbally under oral examination.`
    } else if (lowestEvidence.sourceType === 'QUIZ') {
      primaryWeakness = `Incorrect responses on diagnostic questions for ${conceptName}.`
    } else if (lowestEvidence.sourceType === 'ASSIGNMENT') {
      primaryWeakness = `Written implementation for ${conceptName} required further reasoning precision.`
    } else {
      primaryWeakness = `Needs deeper conceptual reinforcement for ${conceptName}.`
    }
  }

  let recommendedAction = lowestEvidence.recommendation
  if (!recommendedAction) {
    if (conceptId.includes('stack') || conceptId.includes('dfs')) {
      recommendedAction = "Open DFS Call Stack Visualizer"
    } else if (status === 'Needs Attention') {
      recommendedAction = `Retry Spoken Viva for ${conceptName}`
    } else {
      recommendedAction = `Take Practice Quiz on ${conceptName}`
    }
  }

  return {
    studentId,
    classId,
    conceptId,
    conceptName,
    category,
    masteryScore,
    status,
    confidence,
    evidenceCount: filtered.length,
    primaryWeakness,
    recommendedAction,
    evidenceList: filtered
  }
}

// 2. GET ALL CONCEPT MASTERIES FOR A STUDENT IN A CLASSROOM
export function getStudentConceptMasteries(
  studentId: string = "student-demo",
  classId: string = "class-1"
): ConceptMasterySummary[] {
  const allEvidence = getStoredLearningEvidence(studentId, classId)
  const concepts = CLASSROOM_CONCEPT_MAP[classId] || CLASSROOM_CONCEPT_MAP["class-1"]

  return concepts.map((c) => calculateConceptMastery(studentId, classId, c.id, c.name, c.category, allEvidence))
}

// 3. CENTRALIZED EVIDENCE LOCAL PERSISTENCE HELPERS
export function getStoredLearningEvidence(studentId?: string, classId?: string): LearningEvidenceRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EVIDENCE_STORAGE_KEY)
    if (!raw) return getInitialDemoEvidence(studentId || "student-demo", classId || "class-1")
    const list: LearningEvidenceRecord[] = JSON.parse(raw)
    if (studentId && classId) {
      const filtered = list.filter((e) => e.studentId === studentId && e.classId === classId)
      return filtered.length > 0 ? list : [...list, ...getInitialDemoEvidence(studentId, classId)]
    }
    return list
  } catch {
    return getInitialDemoEvidence(studentId || "student-demo", classId || "class-1")
  }
}

export function recordLearningEvidence(evidenceInput: Omit<LearningEvidenceRecord, "evidenceId" | "timestamp">): LearningEvidenceRecord {
  const newRecord: LearningEvidenceRecord = {
    ...evidenceInput,
    evidenceId: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  }

  if (typeof window !== "undefined") {
    try {
      const existing = getStoredLearningEvidence()
      const updated = [...existing, newRecord]
      localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent("aulyn-evidence-recorded", { detail: newRecord }))
    } catch (e) {
      console.warn("Unable to persist evidence to localStorage:", e)
    }
  }

  return newRecord
}

// 4. TRANSPARENT LEADERBOARD LEARNING PERFORMANCE SCORE CALCULATION
export function calculateLearningPerformanceScore(
  studentId: string,
  classId: string,
  evidenceList: LearningEvidenceRecord[]
): StudentLeaderboardEntry {
  const studentEvidence = evidenceList.filter((e) => e.studentId === studentId && e.classId === classId)

  const quizzes = studentEvidence.filter((e) => e.sourceType === 'QUIZ')
  const assignments = studentEvidence.filter((e) => e.sourceType === 'ASSIGNMENT')
  const vivas = studentEvidence.filter((e) => e.sourceType === 'VIVA')

  const quizAvg = quizzes.length > 0 ? quizzes.reduce((sum, e) => sum + e.percentage, 0) / quizzes.length : null
  const assignmentAvg = assignments.length > 0 ? assignments.reduce((sum, e) => sum + e.percentage, 0) / assignments.length : null
  const vivaAvg = vivas.length > 0 ? vivas.reduce((sum, e) => sum + e.percentage, 0) / vivas.length : null

  // Calculate Improvement Score based on chronological trend
  let improvementScore = 0
  if (studentEvidence.length >= 2) {
    const sorted = [...studentEvidence].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2))
    const secondHalf = sorted.slice(Math.ceil(sorted.length / 2))

    const avg1 = firstHalf.reduce((sum, e) => sum + e.percentage, 0) / firstHalf.length
    const avg2 = secondHalf.reduce((sum, e) => sum + e.percentage, 0) / secondHalf.length

    improvementScore = Math.max(-10, Math.min(25, Math.round(avg2 - avg1)))
  }

  // Calculate Practice Consistency (evidence frequency)
  const consistencyScore = Math.min(100, studentEvidence.length * 20)

  // Transparent Normalized Weights
  // Base weights: Quiz (30%), Assignment (25%), Viva (25%), Improvement (15%), Consistency (5%)
  let totalEligibleWeight = 0
  let weightedScoreSum = 0

  if (quizAvg !== null) {
    totalEligibleWeight += 0.30
    weightedScoreSum += quizAvg * 0.30
  }
  if (assignmentAvg !== null) {
    totalEligibleWeight += 0.25
    weightedScoreSum += assignmentAvg * 0.25
  }
  if (vivaAvg !== null) {
    totalEligibleWeight += 0.25
    weightedScoreSum += vivaAvg * 0.25
  }

  // Always include improvement & consistency
  const normImprovement = Math.max(0, Math.min(100, 70 + improvementScore))
  totalEligibleWeight += 0.15
  weightedScoreSum += normImprovement * 0.15

  totalEligibleWeight += 0.05
  weightedScoreSum += consistencyScore * 0.05

  const performanceScore = totalEligibleWeight > 0 ? Math.round((weightedScoreSum / totalEligibleWeight) * 10) / 10 : 0

  return {
    rank: 0,
    studentId,
    studentName: getStudentDisplayName(studentId),
    performanceScore,
    quizScore: quizAvg !== null ? Math.round(quizAvg * 10) / 10 : null,
    assignmentScore: assignmentAvg !== null ? Math.round(assignmentAvg * 10) / 10 : null,
    vivaScore: vivaAvg !== null ? Math.round(vivaAvg * 10) / 10 : null,
    improvementScore,
    consistencyScore,
    breakdown: {
      quizComponent: quizAvg !== null ? Math.round(quizAvg) : 0,
      assignmentComponent: assignmentAvg !== null ? Math.round(assignmentAvg) : 0,
      vivaComponent: vivaAvg !== null ? Math.round(vivaAvg) : 0,
      improvementComponent: Math.round(normImprovement),
      consistencyComponent: Math.round(consistencyScore)
    }
  }
}

// Helper to resolve display names
function getStudentDisplayName(studentId: string): string {
  const map: Record<string, string> = {
    "student-demo": "Alex Rivera",
    "stud-1": "Alex Rivera",
    "stud-2": "Marcus Chen",
    "stud-3": "Sophia Patel",
    "stud-4": "Liam Vance",
    "stud-5": "Elena Rostova",
    "stud-6": "Noah Al-Mansoor",
    "stud-7": "Priya Sharma"
  }
  return map[studentId] || `Student (${studentId.substring(0, 6)})`
}

// Initial seed evidence generator for realistic classroom state
function getInitialDemoEvidence(studentId: string, classId: string): LearningEvidenceRecord[] {
  if (studentId !== "student-demo" && studentId !== "stud-1") return []

  return [
    {
      evidenceId: "ev-demo-1",
      studentId,
      classId,
      conceptId: "arrays",
      conceptName: "Arrays & Pointers",
      sourceType: "QUIZ",
      sourceTitle: "Arrays & Pointers Diagnostic Quiz",
      score: 9.5,
      maxScore: 10,
      percentage: 95,
      confidence: "High",
      weight: 1.0,
      summary: "Mastered 2D array indexing and pointer arithmetic",
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString()
    },
    {
      evidenceId: "ev-demo-2",
      studentId,
      classId,
      conceptId: "linked-lists",
      conceptName: "Linked Lists & Node Pointers",
      sourceType: "ASSIGNMENT",
      sourceTitle: "Singly Linked List Implementation",
      score: 44,
      maxScore: 50,
      percentage: 88,
      confidence: "Medium",
      weight: 1.2,
      summary: "Solid node insertion and deletion logic",
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      evidenceId: "ev-demo-3",
      studentId,
      classId,
      conceptId: "trees-bst",
      conceptName: "Binary Search Trees",
      sourceType: "QUIZ",
      sourceTitle: "BST Operations Check",
      score: 8,
      maxScore: 10,
      percentage: 80,
      confidence: "Medium",
      weight: 1.0,
      summary: "Good understanding of BST lookup & insertion",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      evidenceId: "ev-demo-4",
      studentId,
      classId,
      conceptId: "tree-dfs",
      conceptName: "Depth-First Search (DFS)",
      sourceType: "VIVA",
      sourceTitle: "Trees Spoken Oral Defense",
      score: 6.5,
      maxScore: 10,
      percentage: 65,
      confidence: "High",
      weight: 1.5,
      weakness: "Demonstrated difficulty explaining recursive stack unwinding during DFS traversal.",
      recommendation: "Open DFS Call Stack Visualizer",
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      evidenceId: "ev-demo-5",
      studentId,
      classId,
      conceptId: "recursive-stack",
      conceptName: "DFS Recursive Call Stack",
      sourceType: "VIVA",
      sourceTitle: "Trees Spoken Oral Defense",
      score: 4.5,
      maxScore: 10,
      percentage: 45,
      confidence: "High",
      weight: 1.5,
      weakness: "Confused function call stack frames with iterative queue structures.",
      recommendation: "Open DFS Call Stack Visualizer",
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ]
}

// Backward compatibility helper for legacy components
export function saveMasteryEvidence(
  studentId: string,
  classId: string,
  conceptId: string,
  evidenceData: {
    type: string
    title: string
    score: number
    maxScore: number
    percentage: number
    notes?: string
  }
) {
  const sourceType = (
    evidenceData.type.toUpperCase().includes("VIVA") ? "VIVA" :
    evidenceData.type.toUpperCase().includes("QUIZ") ? "QUIZ" : "ASSIGNMENT"
  ) as EvidenceSourceType

  return recordLearningEvidence({
    studentId,
    classId,
    conceptId,
    conceptName: evidenceData.title,
    sourceType,
    sourceTitle: evidenceData.title,
    score: evidenceData.score,
    maxScore: evidenceData.maxScore,
    percentage: evidenceData.percentage,
    confidence: "Medium",
    weight: 1.0,
    summary: evidenceData.notes
  })
}

export function getStudentMastery(studentId: string, classId: string) {
  const defaultConceptsList = [
    { id: "tree-traversal", name: "Tree Traversal", category: "Data Structures & Algorithms" },
    { id: "recursive-stack", name: "DFS Recursive Call Stack", category: "Data Structures & Algorithms" },
    { id: "time-complexity", name: "Big-O Time Complexity", category: "Algorithm Analysis" },
    { id: "graph-traversal", name: "Graph BFS/DFS Traversal", category: "Advanced Data Structures" }
  ]

  const evidenceList = getStoredLearningEvidence(studentId, classId)
  const summaries = defaultConceptsList.map((c) => {
    const cEv = evidenceList.filter((e) => e.conceptId === c.id || e.conceptName === c.name)
    return calculateConceptMastery(studentId, classId, c.id, c.name, c.category, cEv)
  })

  return summaries.map((s: ConceptMasterySummary) => ({
    studentId,
    classId,
    conceptId: s.conceptId,
    conceptName: s.conceptName,
    score: s.masteryScore || 70,
    state: (s.status === 'Mastered' || s.status === 'Strong' ? 'Strong' : s.status === 'Developing' ? 'Learning' : 'Weak') as 'Strong' | 'Learning' | 'Weak' | 'Not Assessed',
    evidenceList: s.evidenceList.map((ev: LearningEvidenceRecord) => {
      const typeMapped = (
        ev.sourceType === "VIVA" ? "Viva" :
        ev.sourceType === "ASSIGNMENT" ? "Assignment" : "Quiz"
      ) as "Quiz" | "Assignment" | "Viva" | "Visualizer" | "Confusion"

      return {
        id: ev.evidenceId,
        type: typeMapped,
        title: ev.sourceTitle,
        score: ev.score,
        maxScore: ev.maxScore,
        percentage: ev.percentage,
        notes: ev.summary || ev.weakness || ev.recommendation || `Score: ${ev.score}/${ev.maxScore}`,
        timestamp: ev.timestamp
      }
    }),
    lastUpdated: new Date().toISOString()
  }))
}

