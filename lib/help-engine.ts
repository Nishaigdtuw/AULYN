import { PRODUCT_KNOWLEDGE_BASE, ProductHelpEntry, HelpActionButton } from './help-knowledge-base'

export interface HelpProcessResult {
  isHelpQuery: boolean
  matchedEntry?: ProductHelpEntry
  responseText: string
  actionButtons: HelpActionButton[]
  category?: string
}

export interface CurrentUserContext {
  activeMainTab?: string
  activeModal?: string
  activeClassId?: string
  activeClassName?: string
  activeChapterName?: string
}

export function processAulynQuery(
  query: string,
  userRole: 'student' | 'teacher',
  context?: CurrentUserContext
): HelpProcessResult {
  const lowerQuery = query.toLowerCase().trim()

  // ----------------------------------------------------
  // 1. CONTEXT-AWARE DIRECT HELP ("How do I use this?", "How do I submit this?")
  // ----------------------------------------------------
  if (context) {
    if (context.activeModal === 'asgn_submission' && (lowerQuery.includes('submit this') || lowerQuery.includes('how to submit') || lowerQuery.includes('how do i submit'))) {
      return {
        isHelpQuery: true,
        responseText: `### 📝 Submitting Current Assignment\n\nAdd your code response or attachment in the box below, then select **Submit Assignment Solution**.\n\n*If this lab requires an AI Viva defense, you can also start it directly from this window after submitting.*`,
        actionButtons: [{ label: 'Submit Assignment', actionTarget: 'modal:asgn_submission' }]
      }
    }

    if (context.activeMainTab === 'visualizer' && (lowerQuery.includes('use this') || lowerQuery.includes('how to use') || lowerQuery.includes('how this works') || lowerQuery.includes('controls'))) {
      return {
        isHelpQuery: true,
        responseText: `### 💻 Code Visualizer & IDE Controls\n\n1. Select an algorithm template above (e.g. **DFS Tree Traversal**).\n2. Click **Run & Trace Execution** to watch line pointers update in real-time.\n3. Use **Step Forward** and **Step Back** to inspect call stack frames and array states.`,
        actionButtons: [{ label: 'Open Code IDE', actionTarget: 'tab:visualizer' }]
      }
    }

    if (context.activeModal === 'live_session' && (lowerQuery.includes('signal') || lowerQuery.includes('confused') || lowerQuery.includes('how does this work'))) {
      if (userRole === 'student') {
        return {
          isHelpQuery: true,
          responseText: `### 🔴 Live Session Controls\n\nWhenever Professor Jenkins is explaining a concept, tap **🤔 I'm Confused** to anonymously signal confusion. Your signal is aggregated into the class heatmap with 100% privacy.`,
          actionButtons: [{ label: 'Join Live Session', actionTarget: 'modal:live_session' }]
        }
      } else {
        return {
          isHelpQuery: true,
          responseText: `### 🔴 Live Session Teacher Controls\n\n- Monitor the **Real-Time Confusion Heatmap** to spot learning bottlenecks.\n- Click **Generate AI Notes** during lecture to draft summary slides.\n- Click **Publish Notes to Students** to push PDF materials to all enrolled student dashboards.`,
          actionButtons: [{ label: 'Open Live Session Controls', actionTarget: 'modal:live_session' }]
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. FEATURE DISCOVERY QUERIES ("What can I do here?", "What features does AULYN have?")
  // ----------------------------------------------------
  if (
    lowerQuery.includes('what can i do') ||
    lowerQuery.includes('what features') ||
    lowerQuery.includes('how can aulyn help') ||
    lowerQuery.includes('what tools') ||
    lowerQuery.includes('overview of features')
  ) {
    if (userRole === 'student') {
      return {
        isHelpQuery: true,
        responseText: `### 🚀 Student Workspace Features & Tools\n\nHere is what you can do on **AULYN**:\n\n1. **Classrooms & Materials**: View lecture notes and download PDF study guides.\n2. **AI Tutor**: Ask academic questions or upload screenshots of handwritten problems.\n3. **Code Trace IDE**: Visualize step-by-step call stacks and data structures.\n4. **Assessments**: Take Adaptive Quizzes, MCQ tests, 3D Flashcards, and AI Oral Viva Defenses.\n5. **Progress**: Track concept mastery on your **Knowledge Graph**.\n6. **Collaboration**: Ask doubts in Doubt Threads (+10 Bounties) and join Peer Study Rooms.`,
        actionButtons: [
          { label: 'View Dashboard', actionTarget: 'tab:overview' },
          { label: 'Open Materials', actionTarget: 'tab:materials' },
          { label: 'Open Code IDE', actionTarget: 'tab:visualizer' }
        ]
      }
    } else {
      return {
        isHelpQuery: true,
        responseText: `### 🎓 Educator Command Center Features\n\nHere is what teachers can do on **AULYN**:\n\n1. **Live Classroom Sessions**: Host lectures and monitor real-time student confusion heatmaps.\n2. **AI Assignment Creation**: Generate structured coding assignments and set AI Viva requirements.\n3. **Notes AI Converter**: Upload PDFs to automatically generate quizzes, summaries, and flashcards.\n4. **Student Roster & Submissions**: Review live code submissions, grade work, and leave feedback.\n5. **Evidence Analytics**: Track class net improvement (+23%) and audit individual concept evidence logs.\n6. **Class Announcements**: Broadcast alerts and track real-time student acknowledgement ratios.`,
        actionButtons: [
          { label: 'Command Overview', actionTarget: 'tab:overview' },
          { label: 'Evidence Analytics', actionTarget: 'tab:analytics' },
          { label: 'Notes AI Converter', actionTarget: 'tab:notes' }
        ]
      }
    }
  }

  // ----------------------------------------------------
  // 3. GUIDED LEARNING WORKFLOWS ("I don't understand Tree Traversal", "Weak topic")
  // ----------------------------------------------------
  if (
    lowerQuery.includes('don\'t understand') ||
    lowerQuery.includes('dont understand') ||
    lowerQuery.includes('confused about') ||
    lowerQuery.includes('struggling with') ||
    lowerQuery.includes('how to prepare') ||
    lowerQuery.includes('exam preparation')
  ) {
    const topic = context?.activeChapterName || 'Tree Traversal'
    return {
      isHelpQuery: true,
      responseText: `### 🧭 Recommended Guided Learning Path for ${topic}\n\nHere is a step-by-step path to master **${topic}**:\n\n1. **Review Notes**: Read the active lecture summary in **Materials & Notes**.\n2. **AI Tutor Explanation**: Ask me for a visual breakdown or step-by-step analogy.\n3. **Code Execution**: Run and trace line execution in **Code Trace IDE**.\n4. **Adaptive Practice**: Test yourself with an **Adaptive Quiz** to boost your Knowledge Graph mastery score!`,
      actionButtons: [
        { label: 'Open Notes', actionTarget: 'tab:materials' },
        { label: 'Open Code IDE', actionTarget: 'tab:visualizer' },
        { label: 'Start Quiz', actionTarget: 'modal:adaptive_quiz' }
      ]
    }
  }

  // ----------------------------------------------------
  // 4. "SHOW ME" & DIRECT NAVIGATION COMMANDS
  // ----------------------------------------------------
  if (lowerQuery.startsWith('show me') || lowerQuery.startsWith('take me to') || lowerQuery.includes('where is') || lowerQuery.includes('where are')) {
    if (lowerQuery.includes('assignment')) {
      return {
        isHelpQuery: true,
        responseText: `### 📌 Assignments Location\n\nYour active assignments are located under **Overview → Active Assignments** on your dashboard.`,
        actionButtons: [{ label: 'Open Assignments', actionTarget: 'tab:overview' }]
      }
    }
    if (lowerQuery.includes('note') || lowerQuery.includes('material')) {
      return {
        isHelpQuery: true,
        responseText: `### 📌 Lecture Notes Location\n\nCourse materials and PDFs are located under **Materials & Notes**.`,
        actionButtons: [{ label: 'Open Materials', actionTarget: 'tab:materials' }]
      }
    }
    if (lowerQuery.includes('quiz')) {
      return {
        isHelpQuery: true,
        responseText: `### 📌 Quizzes Location\n\nYou can start chapter quizzes or adaptive tests from **Practice Assessment** in your sidebar.`,
        actionButtons: [
          { label: 'Start Chapter Quiz', actionTarget: 'modal:quiz' },
          { label: 'Take Adaptive Quiz', actionTarget: 'modal:adaptive_quiz' }
        ]
      }
    }
    if (lowerQuery.includes('settings') || lowerQuery.includes('profile')) {
      return {
        isHelpQuery: true,
        responseText: `### 📌 Profile & Settings Location\n\nYour profile details and preferences are located under **Settings & Profile**.`,
        actionButtons: [{ label: 'Open Settings', actionTarget: 'tab:settings' }]
      }
    }
    if (lowerQuery.includes('result') || lowerQuery.includes('progress') || lowerQuery.includes('score') || lowerQuery.includes('weak')) {
      return {
        isHelpQuery: true,
        responseText: `### 📌 Knowledge Graph & Performance\n\nYour concept scores and evidence logs are displayed on your **Personalized Knowledge Graph**.`,
        actionButtons: [{ label: 'View Knowledge Graph', actionTarget: 'tab:overview' }]
      }
    }
  }

  // ----------------------------------------------------
  // 5. MATCH KNOWLEDGE BASE ENTRIES BY KEYWORDS
  // ----------------------------------------------------
  let bestMatch: ProductHelpEntry | null = null
  let maxScore = 0

  for (const entry of PRODUCT_KNOWLEDGE_BASE) {
    if (entry.role !== 'both' && entry.role !== userRole) continue

    let score = 0
    for (const kw of entry.keywords) {
      if (lowerQuery.includes(kw)) {
        score += kw.length
      }
    }

    if (score > maxScore) {
      maxScore = score
      bestMatch = entry
    }
  }

  if (bestMatch && maxScore > 3) {
    const formattedSteps = bestMatch.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')
    return {
      isHelpQuery: true,
      matchedEntry: bestMatch,
      responseText: `### 💡 ${bestMatch.title}\n\n**${bestMatch.shortDescription}**\n\n${formattedSteps}`,
      actionButtons: bestMatch.actionButtons,
      category: bestMatch.category
    }
  }

  // ----------------------------------------------------
  // 6. UNKNOWN / UNCERTAIN QUERY HANDLER (NO HALLUCINATION)
  // ----------------------------------------------------
  // Check if query is explicitly asking how to do something product-related
  if (lowerQuery.startsWith('how to') || lowerQuery.startsWith('how do i') || lowerQuery.startsWith('how can i') || lowerQuery.includes('aulyn')) {
    const suggestions: HelpActionButton[] = userRole === 'student'
      ? [
          { label: 'View Dashboard', actionTarget: 'tab:overview' },
          { label: 'Open Materials', actionTarget: 'tab:materials' },
          { label: 'Open Code IDE', actionTarget: 'tab:visualizer' }
        ]
      : [
          { label: 'Command Overview', actionTarget: 'tab:overview' },
          { label: 'Evidence Analytics', actionTarget: 'tab:analytics' },
          { label: 'Start Live Session', actionTarget: 'modal:live_session' }
        ]

    return {
      isHelpQuery: true,
      responseText: `I couldn't find that exact feature in your current AULYN workspace. I can help you with classes, assignments, quizzes, notes, AI Tutor, Code Visualizer, progress, settings and other available tools.`,
      actionButtons: suggestions
    }
  }

  // Not a product help query -> pass through to general AI Academic Tutor logic
  return {
    isHelpQuery: false,
    responseText: '',
    actionButtons: []
  }
}
