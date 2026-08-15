'use client'

import React, { useState } from "react"
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Code2, Cpu, Sliders, Clock, HardDrive, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface ExecutionStep {
  line: number
  explanation: string
  variables: Record<string, string | number | boolean | undefined>
  arrayState?: { elements: number[]; activeIndex?: number; leftPointer?: number; rightPointer?: number; midPointer?: number }
  consoleOutput?: string
}

const PRESET_EXAMPLES = {
  binarySearch: {
    title: "Binary Search (Logarithmic)",
    timeComplexity: "O(log N)",
    spaceComplexity: "O(1)",
    defaultLanguage: "javascript",
    languages: {
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
    defaultLanguage: "python",
    languages: {
      python: `def inorder(root):
    if not root: return
    inorder(root.left)   # Visit Left Subtree
    print(root.val)      # Process Node
    inorder(root.right)  # Visit Right Subtree`,
      javascript: `function inorder(root) {
  if (!root) return;
  inorder(root.left);
  console.log(root.val);
  inorder(root.right);
}`,
      cpp: `void inorder(TreeNode* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->val << " ";
    inorder(root->right);
}`
    },
    steps: [
      {
        line: 2,
        explanation: "Check base case: root node exists (Root=10).",
        variables: { "root.val": 10, stackDepth: 1 }
      },
      {
        line: 3,
        explanation: "Recursive call on left subtree: inorder(root.left -> 5). Pushes call frame onto stack.",
        variables: { "root.left.val": 5, stackDepth: 2 }
      },
      {
        line: 4,
        explanation: "Visit Node 5. Process current node value: print(5).",
        variables: { processed: 5, stackDepth: 2 },
        consoleOutput: "Visited Node: 5"
      },
      {
        line: 5,
        explanation: "Backtrack to Root 10. Process current node value: print(10).",
        variables: { processed: 10, stackDepth: 1 },
        consoleOutput: "Visited Node: 10"
      },
      {
        line: 5,
        explanation: "Recursive call on right subtree: inorder(root.right -> 15). Process Node 15.",
        variables: { "root.right.val": 15, stackDepth: 2 },
        consoleOutput: "Visited Node: 15"
      }
    ]
  },
  twoSum: {
    title: "Two Sum Hash Map",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    defaultLanguage: "python",
    languages: {
      python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen: return [seen[diff], i]
        seen[num] = i
    return []`,
      javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (seen.has(diff)) return [seen.get(diff), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (seen.count(diff)) return {seen[diff], i};
        seen[nums[i]] = i;
    }
    return {};
}`
    },
    steps: [
      {
        line: 2,
        explanation: "Initialize empty hash map 'seen' = {} to store value-to-index mappings.",
        variables: { seen: "{}", target: 9 },
        arrayState: { elements: [2, 7, 11, 15], activeIndex: 0 }
      },
      {
        line: 3,
        explanation: "Iterate i=0, num=2. Calculate diff = target - num = 9 - 2 = 7.",
        variables: { i: 0, num: 2, diff: 7, seen: "{}" },
        arrayState: { elements: [2, 7, 11, 15], activeIndex: 0 }
      },
      {
        line: 6,
        explanation: "7 is not in seen hash map. Store seen[2] = 0.",
        variables: { i: 0, num: 2, seen: "{2: 0}" },
        arrayState: { elements: [2, 7, 11, 15], activeIndex: 0 }
      },
      {
        line: 3,
        explanation: "Iterate i=1, num=7. Calculate diff = 9 - 7 = 2.",
        variables: { i: 1, num: 7, diff: 2, seen: "{2: 0}" },
        arrayState: { elements: [2, 7, 11, 15], activeIndex: 1 }
      },
      {
        line: 5,
        explanation: "Diff 2 is found in seen at index 0! Return indices [0, 1].",
        variables: { i: 1, num: 7, diff: 2, result: "[0, 1]" },
        arrayState: { elements: [2, 7, 11, 15], activeIndex: 1 },
        consoleOutput: "Indices found: [0, 1]"
      }
    ]
  }
}

interface CodeVisualizerProps {
  sourceNoteText?: string
  sourceFileName?: string
  activeClassName?: string
}

export default function CodeVisualizer({ activeClassName = "Data Structures & Algorithms" }: CodeVisualizerProps) {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESET_EXAMPLES>("binarySearch")
  const [selectedLang, setSelectedLang] = useState<'javascript' | 'python' | 'cpp'>('python')
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedMs, setSpeedMs] = useState(900)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<"code" | "visualize" | "explain">("code")

  const currentPreset = PRESET_EXAMPLES[selectedPreset]
  const activeCode = currentPreset.languages[selectedLang] || currentPreset.languages.python
  const currentStep: ExecutionStep = currentPreset.steps[currentStepIdx] || currentPreset.steps[0]

  const handleSelectPreset = (key: keyof typeof PRESET_EXAMPLES) => {
    setSelectedPreset(key)
    setSelectedLang(PRESET_EXAMPLES[key].defaultLanguage as 'javascript' | 'python' | 'cpp')
    setCurrentStepIdx(0)
    setIsPlaying(false)
    setConsoleLogs([])
  }

  const handleNextStep = () => {
    if (currentStepIdx + 1 < currentPreset.steps.length) {
      const nextIdx = currentStepIdx + 1
      setCurrentStepIdx(nextIdx)
      const nextStep = currentPreset.steps[nextIdx]
      if (nextStep.consoleOutput) {
        setConsoleLogs((prev) => [...prev, nextStep.consoleOutput!])
      }
    } else {
      setIsPlaying(false)
      toast.success("Execution trace completed!")
    }
  }

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1)
    }
  }

  const handleReset = () => {
    setCurrentStepIdx(0)
    setIsPlaying(false)
    setConsoleLogs([])
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      const interval = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev + 1 < currentPreset.steps.length) {
            return prev + 1
          } else {
            clearInterval(interval)
            setIsPlaying(false)
            toast.success("Code trace visualization complete!")
            return prev
          }
        })
      }, speedMs)
    }
  }

  return (
    <Card className="bg-[#FFF9F1]/95 backdrop-blur-md border-[#E5DCD0] shadow-xl rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E5DCD0] bg-[#F1E8DD]/40 gap-4">
        <div>
          <CardTitle className="text-lg sm:text-xl font-serif font-bold text-[#292724] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#E76F51]" /> Code Trace IDE & Execution Visualizer
          </CardTitle>
          <CardDescription className="text-[#77716A] text-xs mt-0.5">
            Synchronized Code Editor, Real-Time Memory State & AI Execution Explanation ({activeClassName})
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          {/* Preset Selector */}
          <Button
            variant={selectedPreset === "binarySearch" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("binarySearch")}
            className={`text-xs font-bold rounded-xl ${selectedPreset === "binarySearch" ? "bg-[#E76F51] text-white shadow-2xs" : "border-[#E5DCD0] text-[#292724]"}`}
          >
            Binary Search
          </Button>
          <Button
            variant={selectedPreset === "treeTraversal" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("treeTraversal")}
            className={`text-xs font-bold rounded-xl ${selectedPreset === "treeTraversal" ? "bg-[#E76F51] text-white shadow-2xs" : "border-[#E5DCD0] text-[#292724]"}`}
          >
            DFS Inorder
          </Button>
          <Button
            variant={selectedPreset === "twoSum" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("twoSum")}
            className={`text-xs font-bold rounded-xl ${selectedPreset === "twoSum" ? "bg-[#8B7EC8] text-white shadow-2xs" : "border-[#E5DCD0] text-[#292724]"}`}
          >
            Two Sum
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* TIME / SPACE COMPLEXITY & LANGUAGE BADGES ROW */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E5DCD0] rounded-xl shadow-2xs">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Time: <strong className="font-mono text-[#E76F51]">{currentPreset.timeComplexity}</strong></span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-[#8B7EC8]" />
              <span>Space: <strong className="font-mono text-[#8B7EC8]">{currentPreset.spaceComplexity}</strong></span>
            </div>
          </div>

          {/* Language Switcher Toggle */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-[#77716A] flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-[#75B798]" /> Syntax:
            </span>
            <button
              onClick={() => setSelectedLang('python')}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
                selectedLang === 'python' ? 'bg-[#8B7EC8] text-white shadow-2xs' : 'bg-[#F1E8DD] text-[#292724]'
              }`}
            >
              Python 3.10
            </button>
            <button
              onClick={() => setSelectedLang('javascript')}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
                selectedLang === 'javascript' ? 'bg-[#E76F51] text-white shadow-2xs' : 'bg-[#F1E8DD] text-[#292724]'
              }`}
            >
              JavaScript
            </button>
            <button
              onClick={() => setSelectedLang('cpp')}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
                selectedLang === 'cpp' ? 'bg-[#75B798] text-white shadow-2xs' : 'bg-[#F1E8DD] text-[#292724]'
              }`}
            >
              C++20
            </button>
          </div>
        </div>

        {/* Playback Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#F1E8DD] border border-[#E5DCD0] rounded-xl shadow-2xs">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="border-[#E5DCD0] text-[#292724] bg-[#FFF9F1] text-xs font-bold rounded-lg cursor-pointer" disabled={currentStepIdx === 0} onClick={handlePrevStep}>
              <SkipBack className="w-4 h-4 mr-1 text-[#292724]" /> Prev
            </Button>
            <Button size="sm" className="bg-[#E76F51] hover:bg-[#d55e42] text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer" onClick={handleTogglePlay}>
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? "Pause" : "Play Trace"}
            </Button>
            <Button size="sm" variant="outline" className="border-[#E5DCD0] text-[#292724] bg-[#FFF9F1] text-xs font-bold rounded-lg cursor-pointer" disabled={currentStepIdx + 1 >= currentPreset.steps.length} onClick={handleNextStep}>
              Next <SkipForward className="w-4 h-4 ml-1 text-[#292724]" />
            </Button>
            <Button size="sm" variant="ghost" className="text-[#77716A] hover:text-[#292724] text-xs cursor-pointer" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-[#77716A]" />
              <span className="text-[#77716A] font-semibold hidden sm:inline">Speed:</span>
              <button
                onClick={() => setSpeedMs(speedMs === 900 ? 400 : 900)}
                className="px-2 py-0.5 rounded-md bg-[#FFF9F1] border border-[#E5DCD0] font-mono text-[11px] font-bold text-[#292724] cursor-pointer"
              >
                {speedMs === 900 ? "1x" : "2x"}
              </button>
            </div>

            <span className="bg-[#E76F51] text-white px-2.5 py-0.5 rounded-full font-mono font-bold text-xs">
              Line {currentStep.line}
            </span>
            <span className="text-[#77716A] font-medium text-xs">
              Step {currentStepIdx + 1}/{currentPreset.steps.length}
            </span>
          </div>
        </div>

        {/* Mobile Tab Selector (< lg screens) */}
        <div className="flex lg:hidden bg-[#F1E8DD] p-1 rounded-xl border border-[#E5DCD0]">
          <button
            onClick={() => setMobileTab("code")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "code" ? "bg-[#FFF9F1] text-[#E76F51] shadow-2xs" : "text-[#77716A]"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setMobileTab("visualize")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "visualize" ? "bg-[#FFF9F1] text-[#8B7EC8] shadow-2xs" : "text-[#77716A]"
            }`}
          >
            Visualize
          </button>
          <button
            onClick={() => setMobileTab("explain")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === "explain" ? "bg-[#FFF9F1] text-[#75B798] shadow-2xs" : "text-[#77716A]"
            }`}
          >
            Explain
          </button>
        </div>

        {/* Workspace Architecture (Adaptive Grid: Desktop 3-Area, Mobile Tabbed) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* AREA 1: Code Editor Workspace */}
          <div className={`${mobileTab === "code" ? "block" : "hidden lg:block"} lg:col-span-5 bg-[#FBF7F0] text-[#292724] rounded-xl p-4 font-mono text-xs border border-[#E5DCD0] shadow-2xs overflow-x-auto`}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5DCD0] text-xs text-[#77716A]">
              <span className="flex items-center gap-1.5 font-bold text-[#292724]">
                <Code2 className="w-4 h-4 text-[#E76F51]" /> {currentPreset.title}
              </span>
              <span className="uppercase text-[10px] bg-[#E76F51]/10 text-[#E76F51] border border-[#E76F51]/30 px-2 py-0.5 rounded-full font-bold">
                {selectedLang}
              </span>
            </div>

            <pre className="leading-relaxed">
              {activeCode.split("\n").map((lineText, idx) => {
                const lineNum = idx + 1
                const isCurrentLine = lineNum === currentStep.line
                return (
                  <div
                    key={idx}
                    className={`flex items-center px-2 py-0.5 rounded-md transition-all ${
                      isCurrentLine
                        ? "bg-[#E76F51]/15 border-l-4 border-[#E76F51] text-[#292724] font-bold shadow-2xs"
                        : "hover:bg-[#F1E8DD]/40 text-[#77716A]"
                    }`}
                  >
                    <span className="w-6 text-right text-[#77716A] select-none mr-3 text-[11px] font-mono">{lineNum}</span>
                    <span>{lineText}</span>
                  </div>
                )
              })}
            </pre>
          </div>

          {/* AREA 2: Program Execution Visualization */}
          <div className={`${mobileTab === "visualize" ? "block" : "hidden lg:block"} lg:col-span-4 space-y-4`}>
            {/* Array / Pointer Graphic Visualizer */}
            {currentStep.arrayState && (
              <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-xl">
                <CardHeader className="p-3 pb-2 border-b border-[#E5DCD0]">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77716A]">
                    Array & Pointer State Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex items-center justify-center gap-2 flex-wrap">
                  {currentStep.arrayState.elements.map((val, idx) => {
                    const isMid = idx === currentStep.arrayState?.midPointer
                    const isLeft = idx === currentStep.arrayState?.leftPointer
                    const isRight = idx === currentStep.arrayState?.rightPointer
                    const isActive = idx === currentStep.arrayState?.activeIndex

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-2xs transition-all duration-300 ${
                            isActive
                              ? "bg-[#E76F51] text-white ring-4 ring-[#E76F51]/30 scale-110"
                              : isMid
                              ? "bg-[#8B7EC8] text-white ring-2 ring-[#8B7EC8]/40"
                              : isLeft || isRight
                              ? "bg-[#75B798] text-white"
                              : "bg-white text-[#292724] border border-[#E5DCD0]"
                          }`}
                        >
                          {val}
                        </div>
                        <div className="flex gap-0.5 text-[9px] font-mono font-bold">
                          {isLeft && <span className="text-[#75B798]">L</span>}
                          {isMid && <span className="text-[#8B7EC8]">M</span>}
                          {isRight && <span className="text-[#75B798]">R</span>}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Variable Table State */}
            <Card className="bg-[#FFF9F1] border-[#E5DCD0] shadow-2xs rounded-xl">
              <CardHeader className="p-3 pb-2 border-b border-[#E5DCD0]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77716A]">
                  Memory Call Frame & Variable Inspection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(currentStep.variables).map(([key, value]) => (
                    <div key={key} className="p-2 bg-white rounded-lg border border-[#E5DCD0] flex justify-between items-center">
                      <span className="text-[#77716A] font-bold">{key}:</span>
                      <span className="text-[#E76F51] font-bold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Console Output Log */}
            {consoleLogs.length > 0 && (
              <Card className="bg-[#292724] text-emerald-400 p-3 rounded-xl font-mono text-xs shadow-2xs">
                <div className="text-[10px] text-[#A19A91] pb-1 border-b border-[#3E3A35] uppercase font-bold mb-2">
                  Console Output
                </div>
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-500">&gt;</span> {log}
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* AREA 3: Step-by-Step AI Explanation */}
          <div className={`${mobileTab === "explain" ? "block" : "hidden lg:block"} lg:col-span-3 space-y-4`}>
            <Card className="bg-[#FFF9F1] border-2 border-[#E76F51]/30 shadow-2xs rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-serif font-bold text-[#292724] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#E76F51]" /> AI Execution Explanation
              </h4>
              <p className="text-xs text-[#292724] leading-relaxed font-medium bg-white p-3 rounded-xl border border-[#E5DCD0]">
                {currentStep.explanation}
              </p>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
