export interface HelpActionButton {
  label: string
  actionTarget: string // e.g. "tab:overview", "tab:materials", "tab:visualizer", "tab:settings", "modal:quiz", "modal:adaptive_quiz", "modal:ai_viva", "modal:live_session", "modal:asgn_submission", "modal:doubt_threads", "modal:peer_study", "modal:student_groups", "modal:pricing", "tab:analytics", "tab:students", "tab:notes"
}

export interface ProductHelpEntry {
  id: string
  title: string
  role: 'student' | 'teacher' | 'both'
  category: 'Classroom' | 'Assessments' | 'AI Tools' | 'Analytics' | 'Collaboration' | 'Account'
  keywords: string[]
  shortDescription: string
  steps: string[]
  contextSpecificSteps?: Record<string, string[]>
  actionButtons: HelpActionButton[]
  relatedFeatures?: string[]
}

export const PRODUCT_KNOWLEDGE_BASE: ProductHelpEntry[] = [
  // ==========================================
  // STUDENT WORKFLOWS
  // ==========================================
  {
    id: 'student_join_classroom',
    title: 'Join or Switch Classrooms',
    role: 'student',
    category: 'Classroom',
    keywords: ['join class', 'switch class', 'select classroom', 'enrolled classes', 'change course', 'classroom'],
    shortDescription: 'Switch your active classroom view to access course-specific lecture notes, assignments, and quizzes.',
    steps: [
      'Look at the top right header pill or open **Enrolled Classrooms** in the left sidebar.',
      'Click on any course code (e.g. **CS201**, **MATH101**, **PHYS301**).',
      'Your active workspace will instantly switch to show materials for that classroom.'
    ],
    contextSpecificSteps: {
      sidebar: ['Click on any classroom code directly in your sidebar under **Enrolled Classrooms**.'],
      header: ['Use the top horizontal class selector pills to switch courses with 1 click.']
    },
    actionButtons: [
      { label: 'View Dashboard', actionTarget: 'tab:overview' }
    ]
  },
  {
    id: 'student_submit_assignment',
    title: 'Submit an Assignment',
    role: 'student',
    category: 'Assessments',
    keywords: ['submit assignment', 'upload assignment', 'hand in homework', 'assignment submission', 'submit code', 'assignment'],
    shortDescription: 'Submit code solutions or written answers for active course assignments.',
    steps: [
      'Open **Overview** or check **Active Assignments** on your dashboard.',
      'Select the assignment you want to complete (e.g. **BST Implementation & Rotations Lab**).',
      'Paste your code or response into the submission box and click **Submit Assignment Solution**.'
    ],
    contextSpecificSteps: {
      modal_asgn: ['Add your response or attachment below, then select **Submit Assignment Solution**.'],
      overview: ['Find your target assignment under **Active Assignments** and click **Open Submission & Discussion Thread**.']
    },
    actionButtons: [
      { label: 'Open Assignments', actionTarget: 'tab:overview' }
    ]
  },
  {
    id: 'student_download_notes',
    title: 'View & Download Lecture Notes',
    role: 'student',
    category: 'Classroom',
    keywords: ['download notes', 'view materials', 'pdf notes', 'lecture slides', 'course materials', 'notes'],
    shortDescription: 'Access official lecture notes and downloadable PDFs for your active classroom.',
    steps: [
      'Navigate to **Materials & Notes** tab on your main workspace.',
      'Select the chapter or live note from the dropdown menu.',
      'Click **View** to inspect online or click **Download** to save the actual PDF file.'
    ],
    contextSpecificSteps: {
      tab_materials: ['Select your desired chapter from the dropdown, then click **View** or **Download** next to the file.']
    },
    actionButtons: [
      { label: 'Open Materials & Notes', actionTarget: 'tab:materials' }
    ]
  },
  {
    id: 'student_start_quiz',
    title: 'Take Chapter MCQ Quiz',
    role: 'student',
    category: 'Assessments',
    keywords: ['start quiz', 'take quiz', 'mcq quiz', 'chapter quiz', 'practice questions', 'quiz'],
    shortDescription: 'Practice multiple-choice questions for the active chapter with instant scoring.',
    steps: [
      'Open **Practice Assessment → Chapter Quiz MCQs** in the left sidebar.',
      'Answer each multiple-choice question.',
      'Click **Submit Quiz** to view your score and explanations.'
    ],
    actionButtons: [
      { label: 'Start Chapter Quiz', actionTarget: 'modal:quiz' }
    ]
  },
  {
    id: 'student_adaptive_quiz',
    title: 'Take Adaptive Quiz',
    role: 'student',
    category: 'Assessments',
    keywords: ['adaptive quiz', 'dynamic quiz', 'dynamic difficulty', 'adaptive test', 'mastery quiz'],
    shortDescription: 'Dynamic quizzes that adjust question difficulty in real-time based on your answers.',
    steps: [
      'Click **Take Adaptive Quiz** card on your dashboard or sidebar.',
      'Answer questions; the engine automatically branches to easier or harder questions.',
      'Finish the quiz to update your **Knowledge Graph** mastery score.'
    ],
    actionButtons: [
      { label: 'Take Adaptive Quiz', actionTarget: 'modal:adaptive_quiz' }
    ]
  },
  {
    id: 'student_flashcards',
    title: 'Use 3D Flip Flashcards',
    role: 'student',
    category: 'Assessments',
    keywords: ['flashcards', 'flip cards', 'study cards', 'revision cards', 'memory cards'],
    shortDescription: 'Review active chapter formulas and definitions using interactive 3D cards.',
    steps: [
      'Select **Practice Assessment → 3D Flip Flashcards** from the sidebar.',
      'Click on any card to flip between Question and Answer.',
      'Use **Next** and **Previous** to cycle through the deck.'
    ],
    actionButtons: [
      { label: 'Open 3D Flashcards', actionTarget: 'modal:flashcards' }
    ]
  },
  {
    id: 'student_mock_test',
    title: 'Take Timed Mock Examination',
    role: 'student',
    category: 'Assessments',
    keywords: ['mock test', 'mock exam', 'timed exam', 'full exam', 'timed test'],
    shortDescription: 'Simulate exam conditions with a timed test covering all classroom chapters.',
    steps: [
      'Open **Practice Assessment → Timed Mock Examination** from the sidebar.',
      'Click **Start Timed Test** to initiate the countdown timer.',
      'Complete all questions before time expires and submit for detailed analysis.'
    ],
    actionButtons: [
      { label: 'Open Mock Examination', actionTarget: 'modal:mock_test' }
    ]
  },
  {
    id: 'student_code_visualizer',
    title: 'Use Code Trace IDE & Visualizer',
    role: 'student',
    category: 'AI Tools',
    keywords: ['code visualizer', 'code trace', 'ide', 'algorithm visualizer', 'debug code', 'run code', 'visualizer', 'coding'],
    shortDescription: 'Trace line-by-line code execution, call stacks, variable states, and binary tree nodes.',
    steps: [
      'Switch to **Code IDE** tab on the top menu.',
      'Select an algorithm template (e.g. **DFS Tree Traversal** or **BST Insertion**).',
      'Click **Run & Trace Execution** or use **Step Forward** to watch call stack frames step line-by-line.'
    ],
    contextSpecificSteps: {
      tab_visualizer: ['Select a sample template or paste code above, then click **Run & Trace Execution** to watch line-by-line variable state changes.']
    },
    actionButtons: [
      { label: 'Open Code IDE', actionTarget: 'tab:visualizer' }
    ]
  },
  {
    id: 'student_upload_image_ai',
    title: 'Upload Image or Screenshot to AI Tutor',
    role: 'student',
    category: 'AI Tools',
    keywords: ['upload image', 'attach screenshot', 'handwritten notes', 'diagram upload', 'ai tutor image', 'photo question'],
    shortDescription: 'Attach screenshots or handwritten problem photos for multimodal AI Tutor analysis.',
    steps: [
      'Open **AI Tutor** from your sidebar or header.',
      'Click the **Image Icon** next to the chat input bar.',
      'Select your image file (PNG/JPG < 5MB).',
      'Type your question and click **Send** for instant visual analysis.'
    ],
    contextSpecificSteps: {
      modal_ai_tutor: ['Click the **Image Icon** (📷) left of the input bar below, attach your screenshot/photo, and hit Send.']
    },
    actionButtons: [
      { label: 'Open AI Tutor', actionTarget: 'modal:ai_tutor' }
    ]
  },
  {
    id: 'student_knowledge_graph',
    title: 'Check Progress & Knowledge Graph',
    role: 'student',
    category: 'Analytics',
    keywords: ['knowledge graph', 'check progress', 'mastery percentage', 'weak topics', 'mastery score', 'learning progress', 'mastery'],
    shortDescription: 'View real-time concept mastery (Strong/Learning/Weak) calculated from empirical evidence.',
    steps: [
      'Scroll to **Personalized Knowledge Graph** on your Overview dashboard.',
      'Nodes are colored: **Green (Strong)**, **Yellow (Learning)**, **Red (Weak)**.',
      'Click any node to see your full evidence trail and click **Open AI Tutor** or **Take Adaptive Quiz** to improve.'
    ],
    actionButtons: [
      { label: 'View Knowledge Graph', actionTarget: 'tab:overview' }
    ]
  },
  {
    id: 'student_view_feedback',
    title: 'View Teacher Feedback & Discussion',
    role: 'student',
    category: 'Assessments',
    keywords: ['teacher feedback', 'view grade', 'assignment comments', 'instructor review', 'discussion thread'],
    shortDescription: 'Read teacher review notes and participate in threaded assignment discussions.',
    steps: [
      'Open **Active Assignments** on your dashboard.',
      'Click **Open Submission & Discussion Thread** on your assignment.',
      'Scroll down to view instructor comments and post follow-up questions.'
    ],
    actionButtons: [
      { label: 'Open Assignments', actionTarget: 'tab:overview' }
    ]
  },
  {
    id: 'student_ask_doubt',
    title: 'Ask a Doubt & Earn Bounties',
    role: 'student',
    category: 'Collaboration',
    keywords: ['ask doubt', 'doubt thread', 'bounty', 'knowledge points', 'ask question', 'doubt'],
    shortDescription: 'Post academic doubts to the classroom thread and earn +10 Knowledge Points for helpful peer answers.',
    steps: [
      'Click **Contextual Doubt Threads** in the sidebar under Intelligent Ecosystem.',
      'Type your question in the input box and click **Post Academic Doubt**.',
      'Peers or instructors will respond; mark helpful answers to award reputation points!'
    ],
    actionButtons: [
      { label: 'Open Doubt Threads', actionTarget: 'modal:doubt_threads' }
    ]
  },
  {
    id: 'student_peer_study_room',
    title: 'Join Peer Study Lounge & Track Streaks',
    role: 'student',
    category: 'Collaboration',
    keywords: ['study room', 'peer lounge', 'study streak', 'focus session', 'study together', 'focus mode'],
    shortDescription: 'Collaborate with online classmates in real time and maintain your daily learning streak.',
    steps: [
      'Click **Peer Study Room & Streaks** in the left sidebar.',
      'View online classmates and current Focus Mode status.',
      'Chat, share study tips, and build your consecutive daily streak!'
    ],
    actionButtons: [
      { label: 'Open Peer Study Lounge', actionTarget: 'modal:peer_study' }
    ]
  },
  {
    id: 'student_ai_viva',
    title: 'Take AI Oral Viva Defense',
    role: 'student',
    category: 'Assessments',
    keywords: ['ai viva', 'viva defense', 'oral viva', 'viva exam', 'viva examination', 'oral test'],
    shortDescription: 'Defend your assignment logic in a 3-question conceptual oral Q&A with the AI Examiner.',
    steps: [
      'Click **AI Oral Viva Defense** card on your dashboard or submission thread.',
      'Respond to conceptual follow-up prompts about your submitted code.',
      'Receive an instant understanding score and memory risk assessment.'
    ],
    actionButtons: [
      { label: 'Start AI Viva Defense', actionTarget: 'modal:ai_viva' }
    ]
  },
  {
    id: 'student_join_live_session',
    title: 'Join Live Session & View Notes So Far',
    role: 'student',
    category: 'Classroom',
    keywords: ['join live session', 'live lecture', 'notes so far', 'live class', 'real-time notes'],
    shortDescription: 'Participate in active live lectures and view real-time Notes So Far.',
    steps: [
      'Click **🔴 Join Live Classroom Session** in the sidebar or top banner.',
      'Open the **Notes So Far** panel to view real-time structured notes updated as the professor teaches.',
      'Participate in in-meeting live chat and reactions.'
    ],
    actionButtons: [
      { label: 'Join Live Session', actionTarget: 'modal:live_session' }
    ]
  },

  // ==========================================
  // TEACHER WORKFLOWS
  // ==========================================
  {
    id: 'teacher_manage_classrooms',
    title: 'Create & Switch Classrooms',
    role: 'teacher',
    category: 'Classroom',
    keywords: ['create classroom', 'switch class teacher', 'managed classrooms', 'add course', 'teacher classroom'],
    shortDescription: 'Switch active classroom focus or manage course codes.',
    steps: [
      'Open **Managed Classrooms** in the left sidebar or top class selector pills.',
      'Click any classroom (e.g. **CS201: Data Structures**).',
      'The Command Center updates to display metrics, materials, and rosters for that class.'
    ],
    actionButtons: [
      { label: 'View Command Center', actionTarget: 'tab:overview' }
    ]
  },
  {
    id: 'teacher_create_assignment',
    title: 'Create an Assignment (AI Assisted)',
    role: 'teacher',
    category: 'Assessments',
    keywords: ['create assignment', 'generate ai assignment', 'add homework', 'new assignment', 'publish lab'],
    shortDescription: 'Create custom assignments manually or generate structured coding labs using AI.',
    steps: [
      'Click **+ Create Assignment (AI Assisted)** in the left sidebar.',
      'Fill in Title, Instructions, Total Marks, and Due Date.',
      'Optionally toggle **Require AI Viva Defense** or click **Generate with AI**.',
      'Click **Publish Assignment** to post to student dashboards instantly.'
    ],
    actionButtons: [
      { label: 'Create Assignment', actionTarget: 'modal:create_assignment' }
    ]
  },
  {
    id: 'teacher_start_live_lecture',
    title: 'Start Live Session & Lecture Notes',
    role: 'teacher',
    category: 'Classroom',
    keywords: ['start live lecture', 'live session teacher', 'live notes', 'publish lecture summary', 'live class'],
    shortDescription: 'Host live lectures, manage real-time Live Notes, and publish final lecture summaries after class.',
    steps: [
      'Click **🔴 Start Live Classroom Session** in the left sidebar.',
      'Monitor real-time **Notes So Far** and use pause/refresh controls if needed.',
      'Click **End Class for Everyone** to generate, review, and publish the Final Lecture Summary.'
    ],
    actionButtons: [
      { label: 'Start Live Session', actionTarget: 'modal:live_session' }
    ]
  },
  {
    id: 'teacher_notes_so_far_explain',
    title: 'How Real-Time Live Notes & Summaries Work',
    role: 'teacher',
    category: 'Classroom',
    keywords: ['live notes', 'notes so far', 'lecture summary', 'end class summary', 'publish notes'],
    shortDescription: 'Explains how live lecture notes update during class and how final lecture summaries are generated.',
    steps: [
      'As you teach, AULYN continuously builds structured **Notes So Far** for your students.',
      'You can pause or refresh live notes from your meeting control bar at any time.',
      'When you click **End Class for Everyone**, AULYN generates a complete structured summary for your review before publishing.'
    ],
    actionButtons: [
      { label: 'Open Live Session Controls', actionTarget: 'modal:live_session' }
    ]
  },

  {
    id: 'teacher_check_submissions',
    title: 'Review Student Submissions & Grade',
    role: 'teacher',
    category: 'Assessments',
    keywords: ['check submissions', 'student roster', 'grade assignment', 'view code submission', 'submissions'],
    shortDescription: 'Inspect student code submissions, review viva transcripts, and post feedback comments.',
    steps: [
      'Switch to **Roster & Submissions** tab or check **Live Student Submissions** on Overview.',
      'Click **Inspect Submission & Thread** next to any student.',
      'Review their code, check AI Viva defense scores, and post threaded comments.'
    ],
    actionButtons: [
      { label: 'View Student Submissions', actionTarget: 'tab:students' }
    ]
  },
  {
    id: 'teacher_publish_announcement',
    title: 'Broadcast Announcement & Audit Acknowledgements',
    role: 'teacher',
    category: 'Classroom',
    keywords: ['create announcement', 'broadcast announcement', 'announcement', 'student acknowledgement', 'post announcement'],
    shortDescription: 'Post class announcements and see which students have acknowledged them.',
    steps: [
      'Open **Command Overview** on your Teacher workspace.',
      'Fill in **Announcement Title** and **Message Content** under Broadcast Class Announcement.',
      'Click **Publish Announcement**.',
      'View the real-time student acknowledgement ratio below the form.'
    ],
    actionButtons: [
      { label: 'Open Command Overview', actionTarget: 'tab:overview' }
    ]
  },
  {
    id: 'teacher_notes_ai',
    title: 'Convert Notes with AI',
    role: 'teacher',
    category: 'AI Tools',
    keywords: ['notes ai converter', 'convert notes', 'generate quiz from notes', 'ai notes', 'pdf to quiz'],
    shortDescription: 'Upload raw PDFs or text notes to automatically generate summaries, flashcards, and quizzes.',
    steps: [
      'Click **Notes AI Converter** tab on the top menu.',
      'Upload a lecture PDF or paste raw text notes.',
      'Select output mode (**Generate Quiz**, **Create Flashcards**, **Key Summary**).',
      'Click **Process with AI** and publish to your classroom.'
    ],
    actionButtons: [
      { label: 'Open Notes AI', actionTarget: 'tab:notes' }
    ]
  },
  {
    id: 'teacher_evidence_analytics',
    title: 'Evidence Analytics & Class Mastery',
    role: 'teacher',
    category: 'Analytics',
    keywords: ['evidence analytics', 'class mastery', 'student performance', 'mastery audit', 'net improvement'],
    shortDescription: 'Audit class baseline vs. post-intervention mastery with full empirical evidence logs.',
    steps: [
      'Switch to **Evidence Analytics** tab.',
      'Inspect class net improvement (+23% baseline to post-intervention).',
      'Click any concept (e.g. **Tree Traversal**) to view individual student evidence logs.'
    ],
    actionButtons: [
      { label: 'Open Evidence Analytics', actionTarget: 'tab:analytics' }
    ]
  },
  {
    id: 'teacher_student_groups',
    title: 'Create Student Group Workspaces',
    role: 'teacher',
    category: 'Collaboration',
    keywords: ['student groups', 'group workspace', 'create groups', 'team project', 'group assignment'],
    shortDescription: 'Form student project groups for collaborative assignments.',
    steps: [
      'Click **Group Assignment Workspaces** in the left sidebar.',
      'Enter Group Name and Assignment Topic.',
      'Click **Create Group Workspace** to allocate students.'
    ],
    actionButtons: [
      { label: 'Open Group Workspaces', actionTarget: 'modal:student_groups' }
    ]
  },

  // ==========================================
  // COMMON / BOTH ROLES
  // ==========================================
  {
    id: 'common_upgrade_pro',
    title: 'Upgrade to Pro Account',
    role: 'both',
    category: 'Account',
    keywords: ['upgrade to pro', 'pro subscription', 'pricing', 'pro student', 'pro educator', 'upgrade'],
    shortDescription: 'Unlock unlimited AI Tutor interactions, advanced visualizer traces, and priority models.',
    steps: [
      'Click **Upgrade to Pro** in the header bar.',
      'Compare Pro Student ($9/mo) or Pro Educator ($29/mo) plans.',
      'Click **Upgrade Now** to activate your premium license.'
    ],
    actionButtons: [
      { label: 'View Pro Plans', actionTarget: 'modal:pricing' }
    ]
  },
  {
    id: 'common_settings_profile',
    title: 'Change Profile & Preferences',
    role: 'both',
    category: 'Account',
    keywords: ['change profile', 'settings', 'account preferences', 'change email', 'change name', 'profile'],
    shortDescription: 'Update your display name, academic specialization, and notification preferences.',
    steps: [
      'Navigate to **Settings & Profile** in the left sidebar or top tab bar.',
      'Update your Name, Email, or Academic Major.',
      'Click **Save Preferences** to apply changes.'
    ],
    actionButtons: [
      { label: 'Open Settings', actionTarget: 'tab:settings' }
    ]
  }
]
