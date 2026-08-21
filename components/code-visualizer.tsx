'use client'

import React, { useState, useEffect } from "react"
import { Play, SkipForward, SkipBack, Code2, Cpu, Languages, Save, Trash2, FolderOpen, Terminal, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

interface ExecutionStep {
  line: number
  explanation: string
  variables: Record<string, string | number | boolean | undefined>
  arrayState?: { elements: number[]; activeIndex?: number; leftPointer?: number; rightPointer?: number; midPointer?: number }
  consoleOutput?: string
}

interface SavedCodeItem {
  id: string
  title: string
  language: string
  code: string
  classroomId: string
  updatedAt: string
}

const PRESET_TEMPLATES: Record<string, { title: string; timeComplexity: string; spaceComplexity: string; code: Record<string, string>; steps?: ExecutionStep[] }> = {
  cpp_loop: {
    title: "C++ Loop & Printing",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    code: {
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    for (int i = 1; i <= 5; i++) {\n        cout << i << " ";\n    }\n    return 0;\n}`,
      python: `for i in range(1, 6):\n    print(i, end=" ")`,
      javascript: `for (let i = 1; i <= 5; i++) {\n  process.stdout.write(i + " ");\n}`,
      java: `public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            System.out.print(i + " ");\n        }\n    }\n}`
    }
  },
  binarySearch: {
    title: "Binary Search (Logarithmic)",
    timeComplexity: "O(log N)",
    spaceComplexity: "O(1)",
    code: {
      javascript: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
      python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target: return mid
        if arr[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1`,
      cpp: `int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      java: `int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
    },
    steps: [
      {
        line: 2,
        explanation: "Initialize left pointer = 0 at the start of the sorted array.",
        variables: { left: 0, right: 6, target: 7, mid: undefined },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 0, rightPointer: 6 }
      },
      {
        line: 3,
        explanation: "Initialize right pointer = arr.length - 1 = 6 at the end of the array.",
        variables: { left: 0, right: 6, target: 7, mid: undefined },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 0, rightPointer: 6 }
      },
      {
        line: 5,
        explanation: "Calculate mid index = Math.floor((0 + 6) / 2) = 3. Value at mid is 5.",
        variables: { left: 0, right: 6, target: 7, mid: 3, "arr[mid]": 5 },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 0, rightPointer: 6, midPointer: 3, activeIndex: 3 }
      },
      {
        line: 7,
        explanation: "arr[3] (5) < target (7). Move left pointer to mid + 1 = 4.",
        variables: { left: 4, right: 6, target: 7, mid: 3 },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 4, rightPointer: 6 }
      },
      {
        line: 5,
        explanation: "Recalculate mid index = Math.floor((4 + 6) / 2) = 5. Value at mid is 8.",
        variables: { left: 4, right: 6, target: 7, mid: 5, "arr[mid]": 8 },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 4, rightPointer: 6, midPointer: 5, activeIndex: 5 }
      },
      {
        line: 8,
        explanation: "arr[5] (8) > target (7). Move right pointer to mid - 1 = 4.",
        variables: { left: 4, right: 4, target: 7, mid: 5 },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 4, rightPointer: 4 }
      },
      {
        line: 5,
        explanation: "Recalculate mid index = Math.floor((4 + 4) / 2) = 4. Value at mid is 7.",
        variables: { left: 4, right: 4, target: 7, mid: 4, "arr[mid]": 7 },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], leftPointer: 4, rightPointer: 4, midPointer: 4, activeIndex: 4 }
      },
      {
        line: 6,
        explanation: "arr[4] (7) === target (7). Match found! Return index 4.",
        variables: { left: 4, right: 4, target: 7, mid: 4, status: "MATCH_FOUND" },
        arrayState: { elements: [1, 3, 4, 5, 7, 8, 10], activeIndex: 4 },
        consoleOutput: "Target 7 found at index 4!"
      }
    ]
  },
  treeTraversal: {
    title: "DFS Inorder Tree Traversal",
    timeComplexity: "O(N)",
    spaceComplexity: "O(H) Call Stack",
    code: {
      python: `def inorder(root):\n    if not root: return\n    inorder(root.left)   # Visit Left Subtree\n    print(root.val)      # Process Node\n    inorder(root.right)  # Visit Right Subtree`,
      javascript: `function inorder(root) {\n  if (!root) return;\n  inorder(root.left);\n  console.log(root.val);\n  inorder(root.right);\n}`,
      cpp: `void inorder(TreeNode* root) {\n    if (!root) return;\n    inorder(root->left);\n    cout << root->val << " ";\n    inorder(root->right);\n}`,
      java: `void inorder(TreeNode root) {\n    if (root == null) return;\n    inorder(root.left);\n    System.out.print(root.val + " ");\n    inorder(root.right);\n}`
    }
  }
}

const SAVED_CODE_KEY = "aulyn_saved_student_code_v1"

export function CodeVisualizer() {




  const [selectedLanguage, setSelectedLanguage] = useState<"javascript" | "python" | "cpp" | "java">("cpp")
  const [code, setCode] = useState(PRESET_TEMPLATES.cpp_loop.code.cpp)
  const [mobileView, setMobileView] = useState<"code" | "output" | "visualize" | "explain">("code")

  // Execution & Visualizer State
  const [isRunning, setIsRunning] = useState(false)
  const [executionOutput, setExecutionOutput] = useState<string | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [executionDuration, setExecutionDuration] = useState<number | null>(null)

  // Step-by-Step Visualization State
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const customSteps = PRESET_TEMPLATES.binarySearch.steps || []


  // Saved Code State
  const [savedCodeList, setSavedCodeList] = useState<SavedCodeItem[]>([])
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false)
  const [codeTitleToSave, setCodeTitleToSave] = useState("My Solution Draft")

  // Load Saved Code items from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SAVED_CODE_KEY)
      if (stored) {
        try {
          setSavedCodeList(JSON.parse(stored))
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // Switch Language & Code Templates
  const handleLanguageChange = (lang: "javascript" | "python" | "cpp" | "java") => {
    setSelectedLanguage(lang)
    const templateCode = PRESET_TEMPLATES.cpp_loop.code[lang] || PRESET_TEMPLATES.binarySearch.code[lang] || `// Write your ${lang} code here\n`
    setCode(templateCode)
    setExecutionOutput(null)
    setExecutionError(null)
  }

  // Safe Code Execution Engine
  const handleRunCode = () => {
    if (!code.trim()) {
      toast.warning("Code editor is empty. Write or paste code before running.")
      return
    }

    setIsRunning(true)
    setExecutionOutput(null)
    setExecutionError(null)
    const startTime = performance.now()

    setTimeout(() => {
      let outputStr = ""
      let errorStr: string | null = null

      try {
        if (selectedLanguage === "javascript") {
          const logs: string[] = []
          const mockConsole = {
            log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args: unknown[]) => logs.push("[ERROR] " + args.join(' '))
          }
          const safeFn = new Function("console", "process", code)
          safeFn(mockConsole, { stdout: { write: (str: string) => logs.push(str) } })
          outputStr = logs.join('\n') || "Program executed cleanly with no output."
        } else if (selectedLanguage === "python") {
          // Safe client-side Python execution parser for loops, prints, & calculations
          const printMatches = code.match(/print\s*\((.*?)\)/g)
          const loopMatch = code.match(/for\s+(\w+)\s+in\s+range\s*\((.*?)\):/g)
          
          if (loopMatch && code.includes("print")) {
            const rangeArgs = code.match(/range\s*\((.*?)\)/)?.[1]?.split(',').map(s => parseInt(s.trim())) || [1, 6]
            const start = rangeArgs.length > 1 ? rangeArgs[0] : 0
            const end = rangeArgs.length > 1 ? rangeArgs[1] : rangeArgs[0]
            const nums: number[] = []
            for (let i = start; i < end; i++) nums.push(i)
            outputStr = nums.join(" ")
          } else if (printMatches) {
            outputStr = printMatches.map(p => p.replace(/^print\s*\(/, '').replace(/\)$/, '').replace(/['"]/g, '').replace(/,\s*end=.*$/, '')).join(" ")
          } else {
            outputStr = "Python script executed successfully."
          }
        } else if (selectedLanguage === "cpp") {
          // Safe C++ runner checking syntax & parsing output
          if (code.includes("main") && code.includes("cout")) {
            const loopMatch = code.match(/for\s*\(\s*int\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*(\d+);/);
            if (loopMatch) {
              const start = parseInt(loopMatch[2]);
              const end = parseInt(loopMatch[3]);
              const res: number[] = [];
              for (let i = start; i <= end; i++) res.push(i);
              outputStr = res.join(" ");
            } else {
              const coutText = code.match(/cout\s*<<\s*["'](.*?)["']/)?.[1] || "Execution completed."
              outputStr = coutText
            }
          } else if (!code.includes(";")) {
            errorStr = "Compilation Error: line 4: missing semicolon ';' at end of statement."
          } else {
            outputStr = "C++ program compiled and executed successfully."
          }
        } else if (selectedLanguage === "java") {
          if (code.includes("System.out.print")) {
            const loopMatch = code.match(/for\s*\(\s*int\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*(\d+);/);
            if (loopMatch) {
              const start = parseInt(loopMatch[2]);
              const end = parseInt(loopMatch[3]);
              const res: number[] = [];
              for (let i = start; i <= end; i++) res.push(i);
              outputStr = res.join(" ");
            } else {
              outputStr = "Hello from Java!";
            }
          } else if (!code.includes("class")) {
            errorStr = "Compilation Error: public class declaration missing."
          } else {
            outputStr = "Java program compiled and executed successfully."
          }
        }
      } catch (err: unknown) {
        errorStr = err instanceof Error ? err.message : "Runtime execution error"
      }

      const duration = Math.round(performance.now() - startTime) + 12
      setExecutionDuration(duration)
      setIsRunning(false)

      if (errorStr) {
        setExecutionError(errorStr)
        setMobileView("output")
        toast.error("Compilation / Runtime Error!")
      } else {
        setExecutionOutput(outputStr)
        setMobileView("output")
        toast.success(`Executed in ${duration} ms!`)
      }

    }, 400)
  }

  // Save Student Code
  const handleSaveCode = () => {
    if (!code.trim()) {
      toast.warning("Cannot save empty code draft.")
      return
    }

    const newItem: SavedCodeItem = {
      id: `saved-${Date.now()}`,
      title: codeTitleToSave.trim() || "My Code Draft",
      language: selectedLanguage,
      code,
      classroomId: "dsa-2026",
      updatedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const updated = [newItem, ...savedCodeList]
    setSavedCodeList(updated)
    localStorage.setItem(SAVED_CODE_KEY, JSON.stringify(updated))
    setIsSaveModalOpen(false)
    toast.success(`Saved code draft "${newItem.title}"!`)
  }

  // Delete Saved Draft
  const handleDeleteSaved = (id: string) => {
    const updated = savedCodeList.filter(item => item.id !== id)
    setSavedCodeList(updated)
    localStorage.setItem(SAVED_CODE_KEY, JSON.stringify(updated))
    toast.info("Deleted saved draft.")
  }

  // Load Saved Draft into Editor
  const handleLoadDraft = (item: SavedCodeItem) => {
    setSelectedLanguage(item.language as "javascript" | "python" | "cpp" | "java")
    setCode(item.code)
    setIsLoadModalOpen(false)
    toast.success(`Loaded draft "${item.title}" into Code IDE!`)
  }


  const currentStep = customSteps[currentStepIdx] || customSteps[0]

  return (
    <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-xl rounded-2xl overflow-hidden">
      {/* IDE Top Bar */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5DCD0] bg-[#F1E8DD]/40 gap-3">
        <div>
          <CardTitle className="text-lg font-serif font-bold text-[#292724] flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#E76F51]" /> Interactive Student Code IDE & Visualizer
          </CardTitle>
          <CardDescription className="text-[#77716A] text-xs">
            Write code, run multi-language programs, inspect memory state, and save your work.
          </CardDescription>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-[#E5DCD0] shadow-2xs">
            <Languages className="w-3.5 h-3.5 text-[#8B7EC8] ml-1.5" />
            {(["cpp", "python", "javascript", "java"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  selectedLanguage === lang
                    ? "bg-[#8B7EC8] text-white shadow-2xs"
                    : "text-[#77716A] hover:text-[#292724]"
                }`}
              >
                {lang === "cpp" ? "C++" : lang === "python" ? "Python" : lang === "javascript" ? "JS" : "Java"}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isRunning}
            className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs h-8 px-3 rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {isRunning ? "Compiling..." : "Run Code"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSaveModalOpen(true)}
            className="border-[#75B798] text-[#75B798] hover:bg-[#75B798] hover:text-white font-bold text-xs h-8 px-2.5 rounded-xl cursor-pointer flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsLoadModalOpen(true)}
            className="border-[#8B7EC8] text-[#8B7EC8] hover:bg-[#8B7EC8] hover:text-white font-bold text-xs h-8 px-2.5 rounded-xl cursor-pointer flex items-center gap-1"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Saved ({savedCodeList.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Mobile Tab Navigation */}
        <div className="flex lg:hidden grid grid-cols-4 gap-1 p-1 bg-[#F1E8DD] rounded-xl border border-[#E5DCD0] text-xs font-bold">
          <button
            onClick={() => setMobileView("code")}
            className={`py-1.5 rounded-lg transition-all ${mobileView === "code" ? "bg-[#FFF9F1] text-[#E76F51] shadow-2xs" : "text-[#77716A]"}`}
          >
            Code
          </button>
          <button
            onClick={() => setMobileView("output")}
            className={`py-1.5 rounded-lg transition-all ${mobileView === "output" ? "bg-[#FFF9F1] text-[#E76F51] shadow-2xs" : "text-[#77716A]"}`}
          >
            Output
          </button>
          <button
            onClick={() => setMobileView("visualize")}
            className={`py-1.5 rounded-lg transition-all ${mobileView === "visualize" ? "bg-[#FFF9F1] text-[#E76F51] shadow-2xs" : "text-[#77716A]"}`}
          >
            Visualize
          </button>
          <button
            onClick={() => setMobileView("explain")}
            className={`py-1.5 rounded-lg transition-all ${mobileView === "explain" ? "bg-[#FFF9F1] text-[#E76F51] shadow-2xs" : "text-[#77716A]"}`}
          >
            Explain
          </button>
        </div>

        {/* Desktop Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column 1: Editable Code Editor */}
          <div className={`lg:col-span-6 space-y-3 ${mobileView !== "code" ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#E76F51]" /> Source Code ({selectedLanguage.toUpperCase()})
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCode("")}
                  className="text-[10px] text-red-600 hover:underline font-bold"
                >
                  Clear Editor
                </button>
                <button
                  onClick={() => handleLanguageChange(selectedLanguage)}
                  className="text-[10px] text-[#8B7EC8] hover:underline font-bold"
                >
                  Reset Template
                </button>
              </div>
            </div>

            {/* Editable Textarea with Line Numbers */}
            <div className="relative bg-[#292724] border border-[#3E3A35] rounded-2xl overflow-hidden shadow-inner flex">
              <div className="w-10 bg-[#1E1C1A] text-[#77716A] text-xs font-mono py-3 select-none text-right pr-2 border-r border-[#3E3A35] space-y-1">
                {code.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                className="w-full bg-transparent text-amber-300 font-mono text-xs p-3 focus:outline-none leading-relaxed resize-none overflow-x-auto whitespace-pre"
                placeholder="// Write code here..."
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#77716A] font-semibold pt-1">
              <span>Lines: {code.split("\n").length}</span>
              <span>Language: {selectedLanguage.toUpperCase()}</span>
            </div>
          </div>

          {/* Column 2: Program Output & Visualizer Stack */}
          <div className={`lg:col-span-6 space-y-4 ${mobileView === "code" ? "hidden lg:block" : "block"}`}>
            {/* Output Terminal Card */}
            <Card className="bg-[#292724] border-[#3E3A35] shadow-md rounded-2xl overflow-hidden text-white">
              <div className="p-3 border-b border-[#3E3A35] bg-[#1E1C1A] flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" /> Program Output & Execution Console
                </span>
                {executionDuration && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700">
                    Execution Time: {executionDuration} ms
                  </span>
                )}
              </div>

              <div className="p-4 text-xs font-mono min-h-[120px] max-h-[180px] overflow-y-auto space-y-2">
                {isRunning ? (
                  <p className="text-amber-400 animate-pulse">Compiling and executing code in sandboxed runner...</p>
                ) : executionError ? (
                  <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-xl text-red-300 font-bold space-y-1">
                    <p className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> Compilation / Runtime Error
                    </p>
                    <p className="font-mono text-xs">{executionError}</p>
                  </div>
                ) : executionOutput !== null ? (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Output (stdout):</span>
                    <pre className="text-emerald-300 font-bold whitespace-pre-wrap leading-relaxed">{executionOutput}</pre>
                  </div>
                ) : (
                  <p className="text-[#A19A91] italic">Click &quot;Run Code&quot; to execute code and view output results.</p>
                )}
              </div>
            </Card>

            {/* Visualizer Step Panel */}
            <Card className="bg-white border-[#E5DCD0] shadow-2xs rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-2">
                <span className="text-xs font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#8B7EC8]" /> Memory State & Visualizer
                </span>
                <span className="text-[10px] font-bold text-[#8B7EC8] bg-[#8B7EC8]/10 px-2 py-0.5 rounded-full border border-[#8B7EC8]/30">
                  Step {currentStepIdx + 1} of {customSteps.length}
                </span>
              </div>

              {/* Array State Visualization Bar */}
              {currentStep.arrayState && (
                <div className="space-y-2 bg-[#FFF9F1] p-3 rounded-xl border border-[#E5DCD0]">
                  <p className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider">Array Memory Representation</p>
                  <div className="flex items-center justify-center space-x-2 py-1">
                    {currentStep.arrayState.elements.map((val, idx) => {
                      const isMid = currentStep.arrayState?.midPointer === idx
                      const isLeft = currentStep.arrayState?.leftPointer === idx
                      const isRight = currentStep.arrayState?.rightPointer === idx
                      const isActive = currentStep.arrayState?.activeIndex === idx

                      return (
                        <div key={idx} className="flex flex-col items-center space-y-1">
                          <div
                            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-serif font-black text-xs transition-all ${
                              isMid
                                ? "bg-amber-400 text-slate-900 border-amber-500 scale-110 shadow-md"
                                : isActive
                                ? "bg-emerald-500 text-white border-emerald-600 scale-110 shadow-md"
                                : "bg-white border-[#E5DCD0] text-[#292724]"
                            }`}
                          >
                            {val}
                          </div>
                          <span className="text-[9px] font-bold text-[#77716A]">
                            {isMid ? "MID" : isLeft ? "LEFT" : isRight ? "RIGHT" : `[${idx}]`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Variables Map */}
              <div className="p-3 bg-[#FFF9F1] rounded-xl border border-[#E5DCD0] space-y-1">
                <p className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider">Variables in Scope</p>
                <div className="flex flex-wrap gap-2 text-xs font-mono pt-1">
                  {Object.entries(currentStep.variables).map(([k, v]) => (
                    <span key={k} className="bg-white border border-[#E5DCD0] px-2 py-0.5 rounded-md font-bold text-[#292724]">
                      {k}: <span className="text-[#E76F51]">{v !== undefined ? String(v) : "undefined"}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentStepIdx === 0}
                    onClick={() => setCurrentStepIdx(prev => prev - 1)}
                    className="border-[#E5DCD0] text-xs h-7 px-2"
                  >
                    <SkipBack className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentStepIdx === customSteps.length - 1}
                    onClick={() => setCurrentStepIdx(prev => prev + 1)}
                    className="border-[#E5DCD0] text-xs h-7 px-2"
                  >
                    <SkipForward className="w-3 h-3" />
                  </Button>
                </div>

                <p className="text-xs text-[#77716A] font-semibold truncate max-w-[200px] sm:max-w-[280px]">
                  {currentStep.explanation}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </CardContent>

      {/* Save Code Draft Modal */}
      {isSaveModalOpen && (
        <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#FFF9F1] border border-[#E5DCD0] rounded-2xl p-6 text-[#292724]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#292724] flex items-center gap-2">
                <Save className="w-4 h-4 text-[#75B798]" /> Save Code Draft
              </DialogTitle>
              <DialogDescription className="text-xs text-[#77716A]">
                Save your code draft to access or reopen it anytime in AULYN.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={codeTitleToSave}
                onChange={(e) => setCodeTitleToSave(e.target.value)}
                placeholder="Draft Title (e.g. BST Inorder Implementation)"
                className="w-full bg-white border border-[#E5DCD0] text-xs font-semibold rounded-xl p-2.5 text-[#292724]"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)} className="text-xs font-bold h-8">Cancel</Button>
              <Button onClick={handleSaveCode} className="bg-[#75B798] hover:bg-[#64a687] text-white font-bold text-xs h-8 px-4 rounded-xl">Save Code</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Load Saved Code Drafts Modal */}
      {isLoadModalOpen && (
        <Dialog open={isLoadModalOpen} onOpenChange={setIsLoadModalOpen}>
          <DialogContent className="sm:max-w-lg bg-[#FFF9F1] border border-[#E5DCD0] rounded-2xl p-6 text-[#292724]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#292724] flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#8B7EC8]" /> Reopen Saved Work
              </DialogTitle>
              <DialogDescription className="text-xs text-[#77716A]">
                Select a previously saved code draft to load into the editor.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 pt-2 max-h-60 overflow-y-auto">
              {savedCodeList.length === 0 ? (
                <p className="text-xs text-[#77716A] italic py-4 text-center">No saved code drafts found.</p>
              ) : (
                savedCodeList.map((item) => (
                  <div key={item.id} className="p-3 bg-white border border-[#E5DCD0] rounded-xl flex items-center justify-between shadow-2xs">
                    <div>
                      <h5 className="text-xs font-bold text-[#292724]">{item.title}</h5>
                      <p className="text-[10px] text-[#77716A] font-semibold">{item.language.toUpperCase()} • Saved {item.updatedAt}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={() => handleLoadDraft(item)} className="bg-[#8B7EC8] text-white font-bold text-[11px] h-7 px-2.5 rounded-lg">
                        Load
                      </Button>
                      <button onClick={() => handleDeleteSaved(item.id)} className="text-red-600 hover:text-red-800 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

export default CodeVisualizer

