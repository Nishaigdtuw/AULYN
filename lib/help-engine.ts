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
  // 2. ONBOARDING & GENERAL PLATFORM QUERIES ("How do I use AULYN?", "How does AULYN work?")
  // ----------------------------------------------------
  if (
    lowerQuery === 'how do i use aulyn' ||
    lowerQuery === 'how do i use aulyn?' ||
    lowerQuery.includes('how do i use aulyn') ||
    lowerQuery.includes('how does aulyn work') ||
    lowerQuery.includes('what can i do here') ||
    lowerQuery.includes('show me how to use') ||
    lowerQuery.includes('what features are available') ||
    lowerQuery.includes('where should i start') ||
    lowerQuery.includes('how can aulyn help') ||
    lowerQuery.includes('overview of features')
  ) {
    if (userRole === 'student') {
      return {
        isHelpQuery: true,
        responseText: `### Here's a simple way to get started with AULYN:\n\n1. **Choose a class** — Open one of your enrolled classrooms.\n2. **Study your material** — Access lecture notes and course resources.\n3. **Use AI Tutor** — Ask questions or get difficult concepts explained.\n4. **Practice** — Take quizzes, review flashcards or attempt mock tests.\n5. **Visualize code** — Use Code Visualizer for supported programming topics.\n6. **Complete assignments** — View and submit your classroom work.\n7. **Track progress** — Check mastery, weak concepts and recommendations.\n8. **Collaborate** — Use doubts, groups and study features where available.`,
        actionButtons: [
          { label: 'View Dashboard', actionTarget: 'tab:overview' },
          { label: 'Open Materials', actionTarget: 'tab:materials' },
          { label: 'Open Code IDE', actionTarget: 'tab:visualizer' }
        ]
      }
    } else {
      return {
        isHelpQuery: true,
        responseText: `### Here's a simple way to get started as an Educator on AULYN:\n\n1. **Manage Classrooms** — Create or select a managed classroom.\n2. **Share Lecture Materials** — Upload notes PDFs for student access.\n3. **Host Live Sessions** — Start interactive live classes with confusion heatmaps.\n4. **Create & Upload Assignments** — Publish coursework and assignment files.\n5. **Review & Grade Submissions** — Inspect student code, assign marks, and generate AI evaluation reports.\n6. **Track Class Analytics** — Audit class performance and topic mastery.\n7. **Post Announcements** — Alert students on schedule changes and exams.`,
        actionButtons: [
          { label: 'Command Overview', actionTarget: 'tab:overview' },
          { label: 'Analytics', actionTarget: 'tab:analytics' },
          { label: 'Start Live Session', actionTarget: 'modal:live_session' }
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
  // Only trigger fallback if explicitly asking about a specific unsupported feature
  if ((lowerQuery.startsWith('how to') || lowerQuery.startsWith('how do i') || lowerQuery.startsWith('how can i')) && (lowerQuery.includes('pizza') || lowerQuery.includes('buy') || lowerQuery.includes('stock') || lowerQuery.includes('order') || lowerQuery.includes('game'))) {
    const suggestions: HelpActionButton[] = userRole === 'student'
      ? [
          { label: 'View Dashboard', actionTarget: 'tab:overview' },
          { label: 'Open Materials', actionTarget: 'tab:materials' },
          { label: 'Open Code IDE', actionTarget: 'tab:visualizer' }
        ]
      : [
          { label: 'Command Overview', actionTarget: 'tab:overview' },
          { label: 'Analytics', actionTarget: 'tab:analytics' },
          { label: 'Start Live Session', actionTarget: 'modal:live_session' }
        ]

    return {
      isHelpQuery: true,
      responseText: `I couldn't find that feature in your current AULYN workspace. I can help you with classes, assignments, quizzes, notes, AI Tutor, Code Visualizer, progress, settings and other available learning tools.`,
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
