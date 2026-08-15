// AULYN Centralized Mastery Calculation Engine & Evidence Tracker

import { StudentMastery, MasteryEvidence, KnowledgeConcept } from "./data-store"

const MASTERY_STORE_KEY = "aulyn_student_mastery_v1"

// Predefined Curriculum Knowledge Graphs
export const CURRICULUM_KNOWLEDGE_MAP: Record<string, KnowledgeConcept[]> = {
  "dsa-2026": [
    { id: "arrays", classId: "dsa-2026", name: "Arrays & Pointers", category: "Data Structures", prerequisites: [] },
    { id: "linked-lists", classId: "dsa-2026", name: "Linked Lists", category: "Data Structures", prerequisites: ["arrays"] },
    { id: "trees-basics", classId: "dsa-2026", name: "Binary Trees & Nodes", category: "Trees", prerequisites: ["linked-lists"] },
    { id: "bst-ops", classId: "dsa-2026", name: "BST Insertion & Rotations", category: "Trees", prerequisites: ["trees-basics"] },
    { id: "tree-traversal", classId: "dsa-2026", name: "Tree Traversal (DFS & BFS)", category: "Trees", prerequisites: ["trees-basics", "bst-ops"] },
    { id: "heaps", classId: "dsa-2026", name: "Priority Queues & Heaps", category: "Advanced Trees", prerequisites: ["tree-traversal"] }
  ],
  "math-101": [
    { id: "limits-basics", classId: "math-101", name: "Limits & Continuity", category: "Calculus", prerequisites: [] },
    { id: "lhospitals", classId: "math-101", name: "L'Hôpital's Rule", category: "Calculus", prerequisites: ["limits-basics"] },
    { id: "derivatives", classId: "math-101", name: "Differentiation Rules", category: "Calculus", prerequisites: ["limits-basics"] },
    { id: "chain-rule", classId: "math-101", name: "Chain Rule & Implicit Diff", category: "Calculus", prerequisites: ["derivatives"] }
  ],
  "phys-301": [
    { id: "kinematics", classId: "phys-301", name: "Kinematics & Motion", category: "Mechanics", prerequisites: [] },
    { id: "newtons-laws", classId: "phys-301", name: "Newton's Laws of Motion", category: "Mechanics", prerequisites: ["kinematics"] },
    { id: "momentum", classId: "phys-301", name: "Momentum Conservation", category: "Mechanics", prerequisites: ["newtons-laws"] }
  ],
  "hist-202": [
    { id: "ind-rev-origins", classId: "hist-202", name: "Industrial Revolution Origins", category: "Modern Era", prerequisites: [] },
    { id: "urbanization", classId: "hist-202", name: "Urbanization & Labor", category: "Modern Era", prerequisites: ["ind-rev-origins"] }
  ]
}

// Initial Default Mastery Records for Alex Rivera
const INITIAL_STUDENT_MASTERY: StudentMastery[] = [
  {
    studentId: "student-demo",
    classId: "dsa-2026",
    conceptId: "arrays",
    conceptName: "Arrays & Pointers",
    score: 95,
    state: "Strong",
    evidenceList: [
      { id: "e1", type: "Quiz", title: "Arrays Diagnostic Quiz", score: 10, maxScore: 10, percentage: 100, timestamp: "2026-08-05", notes: "Flawless execution on 2D array indexing" }
    ],
    lastUpdated: "2026-08-05"
  },
  {
    studentId: "student-demo",
    classId: "dsa-2026",
    conceptId: "linked-lists",
    conceptName: "Linked Lists",
    score: 88,
    state: "Strong",
    evidenceList: [
      { id: "e2", type: "Assignment", title: "Singly Linked List Impl", score: 44, maxScore: 50, percentage: 88, timestamp: "2026-08-08", notes: "Correct node manipulation" }
    ],
    lastUpdated: "2026-08-08"
  },
  {
    studentId: "student-demo",
    classId: "dsa-2026",
    conceptId: "trees-basics",
    conceptName: "Binary Trees & Nodes",
    score: 82,
    state: "Strong",
    evidenceList: [
      { id: "e3", type: "Quiz", title: "Tree Terminology Quiz", score: 8, maxScore: 10, percentage: 80, timestamp: "2026-08-10", notes: "Understands root, height, and child pointers" }
    ],
    lastUpdated: "2026-08-10"
  },
  {
    studentId: "student-demo",
    classId: "dsa-2026",
    conceptId: "bst-ops",
    conceptName: "BST Insertion & Rotations",
    score: 74,
    state: "Learning",
    evidenceList: [
      { id: "e4", type: "Quiz", title: "BST Rotations", score: 7, maxScore: 10, percentage: 70, timestamp: "2026-08-12", notes: "Needs minor review on RL double rotations" }
    ],
    lastUpdated: "2026-08-12"
  },
  {
    studentId: "student-demo",
    classId: "dsa-2026",
    conceptId: "tree-traversal",
    conceptName: "Tree Traversal (DFS & BFS)",
    score: 46,
    state: "Weak",
    evidenceList: [
      { id: "e5", type: "Confusion", title: "Live Lecture Confusion Signal", score: 4, maxScore: 10, percentage: 40, timestamp: "2026-08-14", notes: "Reported confusion during live DFS call stack lecture" },
      { id: "e6", type: "Quiz", title: "Initial Traversal Check", score: 4, maxScore: 10, percentage: 40, timestamp: "2026-08-14", notes: "Struggled with stack frames in recursive DFS" }
    ],
    lastUpdated: "2026-08-14"
  },
  {
    studentId: "student-demo",
    classId: "dsa-2026",
    conceptId: "heaps",
    conceptName: "Priority Queues & Heaps",
    score: 0,
    state: "Not Assessed",
    evidenceList: [],
    lastUpdated: "2026-08-15"
  }
]

export function getStudentMastery(studentId: string = "student-demo", classId: string = "dsa-2026"): StudentMastery[] {
  if (typeof window === "undefined") return INITIAL_STUDENT_MASTERY
  const str = localStorage.getItem(`${MASTERY_STORE_KEY}_${studentId}_${classId}`)
  if (!str) {
    if (classId === "dsa-2026") {
      localStorage.setItem(`${MASTERY_STORE_KEY}_${studentId}_${classId}`, JSON.stringify(INITIAL_STUDENT_MASTERY))
      return INITIAL_STUDENT_MASTERY
    }
    // Initialize defaults for other courses
    const concepts = CURRICULUM_KNOWLEDGE_MAP[classId] || []
    const defaults: StudentMastery[] = concepts.map((c) => ({
      studentId,
      classId,
      conceptId: c.id,
      conceptName: c.name,
      score: 75,
      state: "Learning",
      evidenceList: [
        { id: `def-${c.id}`, type: "Quiz", title: `${c.name} Initial Check`, score: 15, maxScore: 20, percentage: 75, timestamp: new Date().toLocaleDateString(), notes: "Initial diagnostic" }
      ],
      lastUpdated: new Date().toLocaleDateString()
    }))
    localStorage.setItem(`${MASTERY_STORE_KEY}_${studentId}_${classId}`, JSON.stringify(defaults))
    return defaults
  }
  try {
    return JSON.parse(str)
  } catch {
    return INITIAL_STUDENT_MASTERY
  }
}

export function saveMasteryEvidence(
  studentId: string,
  classId: string,
  conceptId: string,
  newEvidence: Omit<MasteryEvidence, "id" | "timestamp">
) {
  if (typeof window === "undefined") return
  const list = getStudentMastery(studentId, classId)
  let target = list.find((m) => m.conceptId === conceptId)

  if (!target) {
    const conceptObj = CURRICULUM_KNOWLEDGE_MAP[classId]?.find((c) => c.id === conceptId)
    target = {
      studentId,
      classId,
      conceptId,
      conceptName: conceptObj?.name || conceptId,
      score: 50,
      state: "Learning",
      evidenceList: [],
      lastUpdated: new Date().toLocaleDateString()
    }
    list.push(target)
  }

  const evidenceItem: MasteryEvidence = {
    ...newEvidence,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  target.evidenceList.push(evidenceItem)

  // Recalculate score based on weighted evidence trail
  const totalPercentageSum = target.evidenceList.reduce((acc, ev) => acc + ev.percentage, 0)
  const newScore = Math.round(totalPercentageSum / target.evidenceList.length)
  target.score = newScore

  if (newScore >= 80) target.state = "Strong"
  else if (newScore >= 60) target.state = "Learning"
  else target.state = "Weak"

  target.lastUpdated = new Date().toLocaleDateString()

  localStorage.setItem(`${MASTERY_STORE_KEY}_${studentId}_${classId}`, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent("aulyn-mastery-update", { detail: { classId, conceptId, newScore } }))
}
