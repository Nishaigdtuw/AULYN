// AULYN Central Reactive Data Store & Synchronization Engine

export interface ClassroomData {
  classId: string
  className: string
  code: string
  subject: string
  instructor: string
  instructorEmail: string
  description: string
  bannerColor: string
  chapters: ChapterData[]
  quizzes: QuizData[]
  flashcards: FlashcardData[]
  assignments: AssignmentData[]
  announcements: AnnouncementData[]
  materials: MaterialData[]
  students: StudentPerformanceData[]
}

export interface ChapterData {
  chapterId: string
  chapterName: string
  description: string
  sourceNoteFile: string
  sourceNoteContent: string
  materials: MaterialData[]
}

export interface MaterialData {
  fileId: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: string
  size: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty?: 'Basic' | 'Medium' | 'Advanced'
}

export interface QuizData {
  quizId: string
  chapterId: string
  title: string
  topic: string
  timeMinutes: number
  totalMarks: number
  questions: QuizQuestion[]
}

export interface FlashcardData {
  id: string
  chapterId: string
  front: string
  back: string
  category: string
}

export interface AssignmentData {
  id: string
  classId: string
  chapterId: string
  title: string
  type: 'Descriptive' | 'MCQ' | 'Coding' | 'Short Answer' | 'Mixed'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  dueDate: string
  totalMarks: number
  instructions: string
  published: boolean
  submissionsCount: number
  vivaRequired?: boolean
}

export interface SubmissionData {
  submissionId: string
  assignmentId: string
  assignmentTitle: string
  studentId: string
  studentName: string
  classId: string
  submittedAt: string
  content: string
  fileUrl?: string
  status: 'Submitted' | 'Graded'
  marks?: number
  feedback?: string
  comments?: AssignmentComment[]
}

export interface AssignmentComment {
  id: string
  assignmentId: string
  submissionId: string
  authorId: string
  authorName: string
  authorRole: 'student' | 'teacher'
  content: string
  timestamp: string
}

export interface QuizAttemptData {
  attemptId: string
  quizId: string
  quizTitle: string
  studentId: string
  studentName: string
  classId: string
  score: number
  totalMarks: number
  percentage: number
  completedAt: string
  weakTopics: string[]
  misconceptions?: string[]
}

export interface AnnouncementData {
  id: string
  classId: string
  author: string
  title: string
  content: string
  date: string
  important: boolean
  acknowledgements?: AnnouncementAck[]
}

export interface AnnouncementAck {
  announcementId: string
  studentId: string
  studentName: string
  acknowledgedAt: string
}

export interface StudentPerformanceData {
  id: string
  name: string
  email: string
  status: string
  score: number
  completion: number
  lastActive: string
  weakTopics: string[]
}

export interface NotificationItem {
  id: string
  recipientRole: 'student' | 'teacher'
  title: string
  message: string
  timestamp: string
  read: boolean
  link?: string
}

export interface SubscriptionData {
  plan: 'free' | 'pro' | 'institution'
  status: 'active' | 'inactive'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  amount?: number
  startedAt?: string
  expiresAt?: string
}

// Advanced Intelligent Ecosystem Extensions

export interface LiveSessionData {
  sessionId: string
  classId: string
  className: string
  topic: string
  status: 'Live' | 'Paused' | 'Ended'
  startedAt: string
  confusionSignalsCount: number
  heatmapTimeline: ConfusionTimelinePoint[]
  transcriptSummary: string
  publishedNotes?: LiveLectureNote
}

export interface ConfusionTimelinePoint {
  timeLabel: string
  topic: string
  confusionCount: number
  level: 'Low' | 'Moderate' | 'High Spike'
}

export interface LiveLectureNote {
  noteId: string
  sessionId: string
  classId: string
  title: string
  concepts: string[]
  definitions: { term: string; definition: string }[]
  codeExamples: string
  mistakeWarnings: string[]
  summary: string
  publishedAt: string
}

export interface KnowledgeConcept {
  id: string
  classId: string
  name: string
  category: string
  parentId?: string
  prerequisites: string[]
}

export interface MasteryEvidence {
  id: string
  type: 'Quiz' | 'Assignment' | 'Viva' | 'Visualizer' | 'Confusion'
  title: string
  score: number
  maxScore: number
  percentage: number
  timestamp: string
  notes: string
}

export interface StudentMastery {
  studentId: string
  classId: string
  conceptId: string
  conceptName: string
  score: number // 0 - 100
  state: 'Strong' | 'Learning' | 'Weak' | 'Not Assessed'
  evidenceList: MasteryEvidence[]
  lastUpdated: string
}

export interface VivaSessionData {
  vivaId: string
  assignmentId: string
  assignmentTitle: string
  studentId: string
  studentName: string
  classId: string
  questions: { question: string; studentAnswer: string; feedback: string; score: number }[]
  vivaScore: number // 0 - 10
  understandingScore: number // 0 - 10
  memorizationRisk: 'Low' | 'Moderate' | 'High'
  weakConcept: string
  completedAt: string
}

export interface DoubtThread {
  id: string
  classId: string
  className: string
  contextType: 'Classroom' | 'Chapter' | 'Assignment' | 'Visualizer' | 'General'
  contextTitle: string
  studentId: string
  studentName: string
  question: string
  replies: DoubtReply[]
  status: 'Open' | 'Answered' | 'Resolved'
  createdAt: string
  bountyPoints: number
}

export interface DoubtReply {
  id: string
  threadId: string
  authorId: string
  authorName: string
  authorRole: 'student' | 'teacher'
  content: string
  timestamp: string
  isHelpful?: boolean
}

export interface StudyGroup {
  groupId: string
  classId: string
  name: string
  members: { id: string; name: string; email: string }[]
  assignmentId?: string
  assignmentTitle?: string
  workspaceNotes: string
  submissionContent?: string
  submittedAt?: string
}

export interface StudyStreakData {
  studentId: string
  streakDays: number
  lastActiveDate: string
  reputationPoints: number
  weeklyChallenges: WeeklyChallenge[]
}

export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  targetCount: number
  currentCount: number
  completed: boolean
  pointsReward: number
}

// Initial Classroom Database
export const INITIAL_CLASSROOMS: ClassroomData[] = [
  {
    classId: "dsa-2026",
    className: "Data Structures & Algorithms",
    code: "CS201",
    subject: "Computer Science",
    instructor: "Prof. Sarah Jenkins",
    instructorEmail: "sarah.jenkins@aulyn.edu",
    description: "Advanced study of binary search trees, recursion, call stacks, graph algorithms, and dynamic programming.",
    bannerColor: "#E76F51",
    chapters: [
      {
        chapterId: "chap-dsa-1",
        chapterName: "Chapter 1: Binary Search Trees",
        description: "Node insertion, deletion, AVL self-balancing, and tree traversal algorithms.",
        sourceNoteFile: "Trees_Lecture_Notes.pdf",
        sourceNoteContent: `Binary Search Tree (BST) Properties & Operations:

1. Definition: A binary tree where for every node X:
   - All keys in X's left subtree are strictly smaller than X.key.
   - All keys in X's right subtree are strictly greater than X.key.

2. Time Complexities:
   - Search: Average O(log N), Worst O(N) in skewed trees.
   - Insertion: Average O(log N), Worst O(N).
   - Deletion: Average O(log N), Worst O(N).

3. In-Order Traversal (LDR):
   - Visits Left Subtree -> Root Node -> Right Subtree.
   - Produces elements in strictly sorted ascending order.

4. Self-Balancing Trees (AVL / Red-Black):
   - Maintains height H = O(log N) through tree rotations (LL, RR, LR, RL).`,
        materials: [
          { fileId: "m-dsa-1", fileName: "Trees_Lecture_Notes.pdf", fileType: "application/pdf", fileUrl: "/materials/Trees_Lecture_Notes.pdf", uploadedAt: "2026-08-10", size: "1.2 MB" },
          { fileId: "m-dsa-2", fileName: "Graph_Algorithms.pdf", fileType: "application/pdf", fileUrl: "/materials/Graph_Algorithms.pdf", uploadedAt: "2026-08-12", size: "1.8 MB" }
        ]
      },
      {
        chapterId: "chap-dsa-2",
        chapterName: "Chapter 2: Recursion & Backtracking",
        description: "Call stack frames, base cases, recursion trees, N-Queens problem, and memoization.",
        sourceNoteFile: "Recursion_CallStack_Guide.pdf",
        sourceNoteContent: `Recursion & Call Stack Execution Guide:

1. Core Components:
   - Base Case: Termination condition preventing infinite stack overflow.
   - Recursive Step: Problem reduction toward base case.

2. Call Stack Mechanics:
   - Each function invocation pushes a new Stack Frame containing local variables and return address.
   - Stack Overflow occurs when call stack limit exceeds system memory.

3. Backtracking Pattern:
   - Choose candidate -> Explore recursively -> Unchoose candidate if invalid.`,
        materials: [
          { fileId: "m-dsa-3", fileName: "Recursion_CallStack_Guide.pdf", fileType: "application/pdf", fileUrl: "/materials/Recursion_CallStack_Guide.pdf", uploadedAt: "2026-08-14", size: "1.4 MB" }
        ]
      }
    ],
    quizzes: [
      {
        quizId: "quiz-dsa-1",
        chapterId: "chap-dsa-1",
        title: "BST Properties & Traversals Quiz",
        topic: "Binary Search Trees",
        timeMinutes: 10,
        totalMarks: 30,
        questions: [
          {
            id: "q1",
            question: "Which traversal of a Binary Search Tree produces elements in sorted ascending order?",
            options: ["Pre-Order Traversal", "In-Order Traversal", "Post-Order Traversal", "Level-Order Traversal"],
            correctAnswer: 1,
            explanation: "In-Order traversal (Left -> Node -> Right) visits nodes in strictly ascending order for any valid BST.",
            difficulty: "Medium"
          },
          {
            id: "q2",
            question: "What is the worst-case time complexity of searching in a standard unbalanced BST?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
            correctAnswer: 2,
            explanation: "In a degenerate or skewed BST (resembling a linked list), searching takes O(N) operations.",
            difficulty: "Basic"
          },
          {
            id: "q3",
            question: "How does an AVL Tree guarantee O(log N) search operations?",
            options: ["By sorting elements randomly", "By maintaining height balance via tree rotations", "By limiting node children to 1", "By using hash keys"],
            correctAnswer: 1,
            explanation: "AVL trees enforce that height differences between left and right subtrees do not exceed 1 through rotations.",
            difficulty: "Advanced"
          }
        ]
      }
    ],
    flashcards: [
      { id: "fc-1", chapterId: "chap-dsa-1", front: "What is the key property of a Binary Search Tree?", back: "Left subtree keys < Node key < Right subtree keys.", category: "BST Fundamentals" },
      { id: "fc-2", chapterId: "chap-dsa-1", front: "Which rotation fixes a Left-Left heavy AVL tree?", back: "Single Right Rotation around the unbalanced node.", category: "Tree Rotations" },
      { id: "fc-3", chapterId: "chap-dsa-2", front: "What causes a StackOverflowError in recursion?", back: "Missing or unreachable base case, filling up call stack memory.", category: "Recursion" }
    ],
    assignments: [
      { id: "asgn-dsa-1", classId: "dsa-2026", chapterId: "chap-dsa-1", title: "BST Implementation & Rotations Lab", type: "Coding", difficulty: "Intermediate", dueDate: "2026-08-25", totalMarks: 50, instructions: "Implement insert(), delete(), and balance() for an AVL tree in Python/C++.", published: true, submissionsCount: 12, vivaRequired: true }
    ],
    announcements: [
      { id: "ann-dsa-1", classId: "dsa-2026", author: "Prof. Sarah Jenkins", title: "Midterm Exam Date Announced", content: "The Midterm Exam covering Trees & Recursion will take place on August 28th.", date: "2026-08-14", important: true, acknowledgements: [{ announcementId: "ann-dsa-1", studentId: "s-1", studentName: "Alex Rivera", acknowledgedAt: "2026-08-14 10:30 AM" }] }
    ],
    materials: [
      { fileId: "m-dsa-1", fileName: "Trees_Lecture_Notes.pdf", fileType: "application/pdf", fileUrl: "/materials/Trees_Lecture_Notes.pdf", uploadedAt: "2026-08-10", size: "1.2 MB" },
      { fileId: "m-dsa-2", fileName: "Graph_Algorithms.pdf", fileType: "application/pdf", fileUrl: "/materials/Graph_Algorithms.pdf", uploadedAt: "2026-08-12", size: "1.8 MB" }
    ],
    students: [
      { id: "s-1", name: "Alex Rivera", email: "alex.rivera@aulyn.edu", status: "Enrolled", score: 94, completion: 90, lastActive: "10 mins ago", weakTopics: ["Graph Traversals"] },
      { id: "s-2", name: "Bob Smith", email: "bob@aulyn.edu", status: "Enrolled", score: 58, completion: 45, lastActive: "2 hours ago", weakTopics: ["Recursion Call Stack", "AVL Rotations"] }
    ]
  },
  {
    classId: "math-101",
    className: "Calculus & Analytical Geometry",
    code: "MATH101",
    subject: "Mathematics",
    instructor: "Dr. Robert Vance",
    instructorEmail: "robert.vance@aulyn.edu",
    description: "Limits, continuity, differentiation rules, integration techniques, and application to physical models.",
    bannerColor: "#8B7EC8",
    chapters: [
      {
        chapterId: "chap-math-1",
        chapterName: "Chapter 1: Limits & Continuity",
        description: "Formal definition of limits, one-sided limits, continuity, and L'Hôpital's Rule.",
        sourceNoteFile: "Limits_Practice_Problems.pdf",
        sourceNoteContent: `Calculus Fundamentals -- Limits & Continuity:

1. Limit Definition:
   - lim (x -> c) f(x) = L means as x approaches c, f(x) approaches L.

2. L'Hôpital's Rule:
   - Used for indeterminate forms 0/0 or ∞/∞.
   - lim (x -> c) f(x)/g(x) = lim (x -> c) f'(x)/g'(x).

3. Standard Derivative Rules:
   - Power Rule: d/dx (x^n) = n * x^(n-1)
   - Product Rule: (u*v)' = u'*v + u*v'
   - Chain Rule: d/dx [f(g(x))] = f'(g(x)) * g'(x)`,
        materials: [
          { fileId: "m-math-1", fileName: "Calculus_CheatSheet.pdf", fileType: "application/pdf", fileUrl: "/materials/Calculus_CheatSheet.pdf", uploadedAt: "2026-08-08", size: "1.1 MB" },
          { fileId: "m-math-2", fileName: "Limits_Practice_Problems.pdf", fileType: "application/pdf", fileUrl: "/materials/Limits_Practice_Problems.pdf", uploadedAt: "2026-08-11", size: "1.5 MB" }
        ]
      }
    ],
    quizzes: [
      {
        quizId: "quiz-math-1",
        chapterId: "chap-math-1",
        title: "Limits & L'Hôpital's Rule Quiz",
        topic: "Limits & Derivatives",
        timeMinutes: 10,
        totalMarks: 20,
        questions: [
          {
            id: "mq1",
            question: "When is L'Hôpital's Rule applicable for evaluating limits?",
            options: ["For any limit", "Only for indeterminate forms 0/0 or ∞/∞", "Only when f(x) is linear", "When x approaches 0 only"],
            correctAnswer: 1,
            explanation: "L'Hôpital's Rule requires the quotient limit to evaluate to an indeterminate form 0/0 or ∞/∞.",
            difficulty: "Medium"
          },
          {
            id: "mq2",
            question: "What is the derivative of f(x) = x^3 * sin(x)?",
            options: ["3x^2 * cos(x)", "3x^2 * sin(x) + x^3 * cos(x)", "x^3 * cos(x)", "3x^2 - cos(x)"],
            correctAnswer: 1,
            explanation: "Using the Product Rule (u*v)' = u'*v + u*v': (x^3)'*sin(x) + x^3*(sin x)' = 3x^2 sin(x) + x^3 cos(x).",
            difficulty: "Medium"
          }
        ]
      }
    ],
    flashcards: [
      { id: "fcm-1", chapterId: "chap-math-1", front: "State the Product Rule for differentiation.", back: "(u * v)' = u' * v + u * v'", category: "Derivatives" },
      { id: "fcm-2", chapterId: "chap-math-1", front: "What is the derivative of e^(2x)?", back: "2 * e^(2x) (by Chain Rule)", category: "Exponentials" }
    ],
    assignments: [
      { id: "asgn-math-1", classId: "math-101", chapterId: "chap-math-1", title: "Problem Set 2: Derivatives & Chain Rule", type: "Descriptive", difficulty: "Intermediate", dueDate: "2026-08-26", totalMarks: 40, instructions: "Solve questions 1-10 with detailed step-by-step mathematical proofs.", published: true, submissionsCount: 15, vivaRequired: false }
    ],
    announcements: [
      { id: "ann-math-1", classId: "math-101", author: "Dr. Robert Vance", title: "Office Hours Shifted to Thursday", content: "Calculus problem session will run from 4 PM to 6 PM this Thursday in Room 302.", date: "2026-08-13", important: false }
    ],
    materials: [
      { fileId: "m-math-1", fileName: "Calculus_CheatSheet.pdf", fileType: "application/pdf", fileUrl: "/materials/Calculus_CheatSheet.pdf", uploadedAt: "2026-08-08", size: "1.1 MB" },
      { fileId: "m-math-2", fileName: "Limits_Practice_Problems.pdf", fileType: "application/pdf", fileUrl: "/materials/Limits_Practice_Problems.pdf", uploadedAt: "2026-08-11", size: "1.5 MB" }
    ],
    students: [
      { id: "s-1", name: "Alex Rivera", email: "alex.rivera@aulyn.edu", status: "Enrolled", score: 91, completion: 88, lastActive: "15 mins ago", weakTopics: ["Integration by Parts"] }
    ]
  },
  {
    classId: "phys-301",
    className: "Classical & Quantum Physics",
    code: "PHYS301",
    subject: "Physics",
    instructor: "Dr. Elena Rostova",
    instructorEmail: "elena.rostova@aulyn.edu",
    description: "Newtonian mechanics, momentum conservation, wave equations, optics, and introduction to thermodynamics.",
    bannerColor: "#75B798",
    chapters: [
      {
        chapterId: "chap-phys-1",
        chapterName: "Chapter 1: Kinematics & Mechanics",
        description: "Equations of motion, projectile trajectories, Newton's Laws, and energy conservation.",
        sourceNoteFile: "Kinematics_Formulas.pdf",
        sourceNoteContent: `Classical Mechanics -- Kinematics & Laws of Motion:

1. Kinematic Equations (Constant Acceleration a):
   - v = v0 + a*t
   - x = x0 + v0*t + 0.5*a*t^2
   - v^2 = v0^2 + 2*a*(x - x0)

2. Newton's Second Law:
   - F_net = m * a
   - Force equals mass times acceleration (N = kg * m/s^2).

3. Conservation of Momentum:
   - Total momentum before collision = Total momentum after collision in isolated systems.
   - P_total = m1*v1 + m2*v2 = constant.`,
        materials: [
          { fileId: "m-phys-1", fileName: "Mechanics_Lab_Guide.pdf", fileType: "application/pdf", fileUrl: "/materials/Mechanics_Lab_Guide.pdf", uploadedAt: "2026-08-09", size: "1.3 MB" },
          { fileId: "m-phys-2", fileName: "Kinematics_Formulas.pdf", fileType: "application/pdf", fileUrl: "/materials/Kinematics_Formulas.pdf", uploadedAt: "2026-08-12", size: "0.9 MB" }
        ]
      }
    ],
    quizzes: [
      {
        quizId: "quiz-phys-1",
        chapterId: "chap-phys-1",
        title: "Kinematics & Newton's Laws Quiz",
        topic: "Classical Mechanics",
        timeMinutes: 10,
        totalMarks: 25,
        questions: [
          {
            id: "pq1",
            question: "A ball is thrown vertically upward with initial velocity 20 m/s. What is its velocity at maximum height?",
            options: ["20 m/s", "9.8 m/s", "0 m/s", "-9.8 m/s"],
            correctAnswer: 2,
            explanation: "At the peak of vertical trajectory, instantaneous vertical velocity drops to 0 m/s before changing direction.",
            difficulty: "Basic"
          }
        ]
      }
    ],
    flashcards: [
      { id: "fcp-1", chapterId: "chap-phys-1", front: "State Newton's Second Law of Motion.", back: "F_net = m * a", category: "Mechanics" }
    ],
    assignments: [
      { id: "asgn-phys-1", classId: "phys-301", chapterId: "chap-phys-1", title: "Lab Report: Momentum & Energy Conservation", type: "Mixed", difficulty: "Intermediate", dueDate: "2026-08-27", totalMarks: 50, instructions: "Submit recorded measurements and error calculations from Lab 3.", published: true, submissionsCount: 8, vivaRequired: false }
    ],
    announcements: [
      { id: "ann-phys-1", classId: "phys-301", author: "Dr. Elena Rostova", title: "Lab Safety Manual Uploaded", content: "Please review the lab safety guide before next Monday's experimental session.", date: "2026-08-11", important: true }
    ],
    materials: [
      { fileId: "m-phys-1", fileName: "Mechanics_Lab_Guide.pdf", fileType: "application/pdf", fileUrl: "/materials/Mechanics_Lab_Guide.pdf", uploadedAt: "2026-08-09", size: "1.3 MB" },
      { fileId: "m-phys-2", fileName: "Kinematics_Formulas.pdf", fileType: "application/pdf", fileUrl: "/materials/Kinematics_Formulas.pdf", uploadedAt: "2026-08-12", size: "0.9 MB" }
    ],
    students: [
      { id: "s-1", name: "Alex Rivera", email: "alex.rivera@aulyn.edu", status: "Enrolled", score: 88, completion: 80, lastActive: "1 hour ago", weakTopics: ["Projectile Air Drag"] }
    ]
  },
  {
    classId: "hist-202",
    className: "Modern World History",
    code: "HIST202",
    subject: "History",
    instructor: "Prof. Arthur Pendelton",
    instructorEmail: "arthur.pendelton@aulyn.edu",
    description: "The Industrial Revolution, rise of global trade, 20th-century geopolitical conflicts, and the Cold War era.",
    bannerColor: "#E9B949",
    chapters: [
      {
        chapterId: "chap-hist-1",
        chapterName: "Chapter 1: The Industrial Revolution",
        description: "Steam power, factory production, urbanization, and socio-economic shifts in 18th/19th century Europe.",
        sourceNoteFile: "Industrial_Revolution_Essays.pdf",
        sourceNoteContent: `Modern World History -- The Industrial Revolution:

1. Drivers of Industrialization:
   - Technological Innovations: James Watt's Steam Engine, Spinning Jenny.
   - Natural Resources: Abundant coal and iron ore deposits in Great Britain.

2. Socio-Economic Impact:
   - Urbanization: Rapid migration from rural agricultural villages to industrial cities.
   - Emergence of Industrial Working Class and Labor Union movements.`,
        materials: [
          { fileId: "m-hist-1", fileName: "Industrial_Revolution_Essays.pdf", fileType: "application/pdf", fileUrl: "/materials/Industrial_Revolution_Essays.pdf", uploadedAt: "2026-08-07", size: "1.6 MB" },
          { fileId: "m-hist-2", fileName: "Cold_War_Timeline.pdf", fileType: "application/pdf", fileUrl: "/materials/Cold_War_Timeline.pdf", uploadedAt: "2026-08-10", size: "1.2 MB" }
        ]
      }
    ],
    quizzes: [
      {
        quizId: "quiz-hist-1",
        chapterId: "chap-hist-1",
        title: "Industrial Revolution Origins Quiz",
        topic: "18th-Century History",
        timeMinutes: 10,
        totalMarks: 20,
        questions: [
          {
            id: "hq1",
            question: "Which invention served as the primary energy catalyst for the Industrial Revolution?",
            options: ["Printing Press", "James Watt's Steam Engine", "Telegraph", "Cotton Gin"],
            correctAnswer: 1,
            explanation: "James Watt's efficiency improvements to the steam engine powered factories, mines, and locomotives.",
            difficulty: "Medium"
          }
        ]
      }
    ],
    flashcards: [
      { id: "fch-1", chapterId: "chap-hist-1", front: "Where did the First Industrial Revolution originate?", back: "Great Britain in the mid-18th century.", category: "Industrial Era" }
    ],
    assignments: [
      { id: "asgn-hist-1", classId: "hist-202", chapterId: "chap-hist-1", title: "Essay: Economic Drivers of Urbanization", type: "Descriptive", difficulty: "Intermediate", dueDate: "2026-08-30", totalMarks: 40, instructions: "Write a 1000-word essay evaluating the impact of steam power on population movement.", published: true, submissionsCount: 6, vivaRequired: false }
    ],
    announcements: [
      { id: "ann-hist-1", classId: "hist-202", author: "Prof. Arthur Pendelton", title: "Primary Document Sources Available", content: "Scanned archival letters from 19th-century factory workers are now accessible in materials.", date: "2026-08-09", important: false }
    ],
    materials: [
      { fileId: "m-hist-1", fileName: "Industrial_Revolution_Essays.pdf", fileType: "application/pdf", fileUrl: "/materials/Industrial_Revolution_Essays.pdf", uploadedAt: "2026-08-07", size: "1.6 MB" },
      { fileId: "m-hist-2", fileName: "Cold_War_Timeline.pdf", fileType: "application/pdf", fileUrl: "/materials/Cold_War_Timeline.pdf", uploadedAt: "2026-08-10", size: "1.2 MB" }
    ],
    students: [
      { id: "s-1", name: "Alex Rivera", email: "alex.rivera@aulyn.edu", status: "Enrolled", score: 95, completion: 92, lastActive: "30 mins ago", weakTopics: [] }
    ]
  }
]

// Data Store Keys
const DATA_STORE_KEY = "aulyn_central_store_v1"
const SUB_STORE_KEY = "aulyn_subscription_v1"
const LIVE_SESSION_KEY = "aulyn_live_session_v1"
const DOUBTS_KEY = "aulyn_doubt_threads_v1"
const VIVA_KEY = "aulyn_viva_sessions_v1"
const GROUPS_KEY = "aulyn_study_groups_v1"

export function getStoredClassrooms(): ClassroomData[] {
  if (typeof window === "undefined") return INITIAL_CLASSROOMS
  const data = localStorage.getItem(DATA_STORE_KEY)
  if (!data) {
    localStorage.setItem(DATA_STORE_KEY, JSON.stringify(INITIAL_CLASSROOMS))
    return INITIAL_CLASSROOMS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_CLASSROOMS
  }
}

export function saveStoredClassrooms(classrooms: ClassroomData[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(DATA_STORE_KEY, JSON.stringify(classrooms))
  window.dispatchEvent(new Event("aulyn-data-update"))
}

export function getClassroomById(classId: string): ClassroomData | undefined {
  const classrooms = getStoredClassrooms()
  return classrooms.find((c) => c.classId === classId) || classrooms[0]
}

export function saveQuizAttempt(attempt: QuizAttemptData) {
  if (typeof window === "undefined") return
  const classrooms = getStoredClassrooms()
  const classroom = classrooms.find((c) => c.classId === attempt.classId)
  if (classroom) {
    const student = classroom.students.find((s) => s.email === attempt.studentName || s.id === attempt.studentId || s.name === attempt.studentName)
    if (student) {
      student.score = Math.round((student.score + attempt.percentage) / 2)
      student.lastActive = "Just now"
      if (attempt.percentage < 70 && attempt.weakTopics.length > 0) {
        student.weakTopics = Array.from(new Set([...student.weakTopics, ...attempt.weakTopics]))
      }
    }
    saveStoredClassrooms(classrooms)
  }
  const attemptsKey = "aulyn_quiz_attempts_v1"
  const existingStr = localStorage.getItem(attemptsKey)
  const attempts: QuizAttemptData[] = existingStr ? JSON.parse(existingStr) : []
  attempts.push(attempt)
  localStorage.setItem(attemptsKey, JSON.stringify(attempts))
}

export function saveSubmission(submission: SubmissionData) {
  if (typeof window === "undefined") return
  const submissionsKey = "aulyn_submissions_v1"
  const existingStr = localStorage.getItem(submissionsKey)
  const list: SubmissionData[] = existingStr ? JSON.parse(existingStr) : []
  const idx = list.findIndex((s) => s.submissionId === submission.submissionId)
  if (idx >= 0) {
    list[idx] = submission
  } else {
    list.push(submission)
  }
  localStorage.setItem(submissionsKey, JSON.stringify(list))

  const classrooms = getStoredClassrooms()
  const cls = classrooms.find((c) => c.classId === submission.classId)
  if (cls) {
    const asgn = cls.assignments.find((a) => a.id === submission.assignmentId)
    if (asgn && idx < 0) {
      asgn.submissionsCount += 1
      saveStoredClassrooms(classrooms)
    }
  }
  window.dispatchEvent(new Event("aulyn-data-update"))
}

export function getSubmissions(classId?: string): SubmissionData[] {
  if (typeof window === "undefined") return []
  const submissionsKey = "aulyn_submissions_v1"
  const existingStr = localStorage.getItem(submissionsKey)
  const list: SubmissionData[] = existingStr ? JSON.parse(existingStr) : []
  if (classId) {
    return list.filter((s) => s.classId === classId)
  }
  return list
}

export function getStoredSubscription(): SubscriptionData {
  if (typeof window === "undefined") return { plan: "free", status: "inactive" }
  const data = localStorage.getItem(SUB_STORE_KEY)
  if (!data) return { plan: "free", status: "inactive" }
  try {
    return JSON.parse(data)
  } catch {
    return { plan: "free", status: "inactive" }
  }
}

export function saveSubscription(sub: SubscriptionData) {
  if (typeof window === "undefined") return
  localStorage.setItem(SUB_STORE_KEY, JSON.stringify(sub))
  window.dispatchEvent(new Event("aulyn-subscription-update"))
}

// Live Session Helpers
export function getLiveSession(classId: string): LiveSessionData | null {
  if (typeof window === "undefined") return null
  const str = localStorage.getItem(`${LIVE_SESSION_KEY}_${classId}`)
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

export function saveLiveSession(session: LiveSessionData) {
  if (typeof window === "undefined") return
  localStorage.setItem(`${LIVE_SESSION_KEY}_${session.classId}`, JSON.stringify(session))
  window.dispatchEvent(new Event("aulyn-live-session-update"))
}

// Doubt Thread Helpers
export function getDoubtThreads(classId?: string): DoubtThread[] {
  if (typeof window === "undefined") return []
  const str = localStorage.getItem(DOUBTS_KEY)
  const list: DoubtThread[] = str ? JSON.parse(str) : []
  if (classId) return list.filter((d) => d.classId === classId)
  return list
}

export function saveDoubtThread(thread: DoubtThread) {
  if (typeof window === "undefined") return
  const list = getDoubtThreads()
  const idx = list.findIndex((t) => t.id === thread.id)
  if (idx >= 0) {
    list[idx] = thread
  } else {
    list.unshift(thread)
  }
  localStorage.setItem(DOUBTS_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("aulyn-data-update"))
}

// AI Viva Helpers
export function getVivaSessions(studentId?: string): VivaSessionData[] {
  if (typeof window === "undefined") return []
  const str = localStorage.getItem(VIVA_KEY)
  const list: VivaSessionData[] = str ? JSON.parse(str) : []
  if (studentId) return list.filter((v) => v.studentId === studentId)
  return list
}

export function saveVivaSession(viva: VivaSessionData) {
  if (typeof window === "undefined") return
  const list = getVivaSessions()
  list.unshift(viva)
  localStorage.setItem(VIVA_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("aulyn-data-update"))
}

// Study Group Helpers
export function getStudyGroups(classId?: string): StudyGroup[] {
  if (typeof window === "undefined") return []
  const str = localStorage.getItem(GROUPS_KEY)
  const list: StudyGroup[] = str ? JSON.parse(str) : []
  if (classId) return list.filter((g) => g.classId === classId)
  return list
}

export function saveStudyGroup(group: StudyGroup) {
  if (typeof window === "undefined") return
  const list = getStudyGroups()
  const idx = list.findIndex((g) => g.groupId === group.groupId)
  if (idx >= 0) {
    list[idx] = group
  } else {
    list.push(group)
  }
  localStorage.setItem(GROUPS_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("aulyn-data-update"))
}
