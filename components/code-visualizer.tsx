'use client'
import React, { useState } from "react"
import { Play, SkipForward, RotateCcw, Terminal, Code2, Cpu, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface ExecutionStep {
  line: number
  explanation: string
  variables: Record<string, string | number | boolean | undefined>
  consoleOutput?: string
}

const PRESET_EXAMPLES = {
  binarySearch: {
    title: "Binary Search (O(log N))",
    language: "javascript",
    code: `function binarySearch(arr, target) {
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
    steps: [
      { line: 2, explanation: "Initialize left boundary pointer = 0", variables: { left: 0, right: 6, target: 7, mid: undefined } },
      { line: 3, explanation: "Initialize right boundary pointer = arr.length - 1 = 6", variables: { left: 0, right: 6, target: 7, mid: undefined } },
      { line: 5, explanation: "Calculate mid index = Math.floor((0 + 6) / 2) = 3", variables: { left: 0, right: 6, target: 7, mid: 3, "arr[mid]": 5 } },
      { line: 7, explanation: "arr[3] (5) < target (7). Move left pointer to mid + 1 = 4", variables: { left: 4, right: 6, target: 7, mid: 3 } },
      { line: 5, explanation: "Recalculate mid index = Math.floor((4 + 6) / 2) = 5", variables: { left: 4, right: 6, target: 7, mid: 5, "arr[mid]": 7 } },
      { line: 6, explanation: "arr[5] (7) === target (7). Match found! Return index 5.", variables: { left: 4, right: 6, target: 7, mid: 5, status: "MATCH_FOUND" }, consoleOutput: "Target 7 found at index 5!" }
    ]
  },
  twoSum: {
    title: "Two Sum Hash Map (O(N))",
    language: "python",
    code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
    steps: [
      { line: 2, explanation: "Initialize hash map 'seen' = {}", variables: { seen: "{}", target: 9 } },
      { line: 3, explanation: "Loop i=0, num=2. Calculate diff = 9 - 2 = 7", variables: { i: 0, num: 2, diff: 7, seen: "{}" } },
      { line: 6, explanation: "7 not in seen. Store seen[2] = 0", variables: { i: 0, num: 2, seen: "{2: 0}" } },
      { line: 3, explanation: "Loop i=1, num=7. Calculate diff = 9 - 7 = 2", variables: { i: 1, num: 7, diff: 2, seen: "{2: 0}" } },
      { line: 5, explanation: "Diff 2 is found in seen! Return indices [0, 1]", variables: { i: 1, num: 7, diff: 2, result: "[0, 1]" }, consoleOutput: "Indices found: [0, 1]" }
    ]
  }
}

export default function CodeVisualizer() {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESET_EXAMPLES>("binarySearch")
  const [code, setCode] = useState(PRESET_EXAMPLES.binarySearch.code)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])

  const currentPreset = PRESET_EXAMPLES[selectedPreset]
  const currentStep: ExecutionStep = currentPreset.steps[currentStepIdx] || currentPreset.steps[0]

  const handleSelectPreset = (key: keyof typeof PRESET_EXAMPLES) => {
    setSelectedPreset(key)
    setCode(PRESET_EXAMPLES[key].code)
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

  const handleReset = () => {
    setCurrentStepIdx(0)
    setIsPlaying(false)
    setConsoleLogs([])
    toast.info("Visualizer reset.")
  }

  const handleRunAll = () => {
    setCurrentStepIdx(0)
    setConsoleLogs([])
    setIsPlaying(true)
    let idx = 0
    const interval = setInterval(() => {
      if (idx + 1 < currentPreset.steps.length) {
        idx++
        setCurrentStepIdx(idx)
        if (currentPreset.steps[idx].consoleOutput) {
          setConsoleLogs((prev) => [...prev, currentPreset.steps[idx].consoleOutput!])
        }
      } else {
        clearInterval(interval)
        setIsPlaying(false)
        toast.success("Code trace visualization complete!")
      }
    }, 900)
  }

  return (
    <Card className="glass-panel border-slate-800/80 shadow-2xl rounded-3xl overflow-hidden glow-indigo">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <CardTitle className="text-xl font-bold gradient-text flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" /> Interactive Code Trace Visualizer
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1">
            Step line-by-line through algorithms and inspect real-time variable memory state
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPreset === "binarySearch" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("binarySearch")}
            className={`text-xs font-bold ${selectedPreset === "binarySearch" ? "bg-indigo-600 text-white border-indigo-400 glow-indigo" : "border-slate-800 text-slate-300"}`}
          >
            Binary Search
          </Button>
          <Button
            variant={selectedPreset === "twoSum" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("twoSum")}
            className={`text-xs font-bold ${selectedPreset === "twoSum" ? "bg-purple-600 text-white border-purple-400 glow-purple" : "border-slate-800 text-slate-300"}`}
          >
            Two Sum
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
          <div className="flex items-center space-x-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold glow-indigo text-xs" disabled={isPlaying} onClick={handleRunAll}>
              <Play className="w-4 h-4 mr-1.5" /> Auto Trace
            </Button>
            <Button size="sm" variant="outline" className="text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/50 text-xs font-semibold" onClick={handleNextStep}>
              <SkipForward className="w-4 h-4 mr-1.5 text-indigo-400" /> Step Forward
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white text-xs" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </Button>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/40 font-mono font-bold">
              Line {currentStep.line}
            </span>
            <span className="text-slate-400 font-medium">
              Step {currentStepIdx + 1} of {currentPreset.steps.length}
            </span>
          </div>
        </div>

        {/* Dual Panel: Code View + Memory State */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Code Viewer Panel */}
          <div className="lg:col-span-7 bg-slate-950/90 text-slate-100 rounded-2xl p-4 font-mono text-sm border border-slate-800 shadow-2xl overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-2 font-semibold text-indigo-300">
                <Code2 className="w-4 h-4 text-indigo-400" /> {currentPreset.title}
              </span>
              <span className="uppercase text-[10px] bg-slate-900 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {currentPreset.language}
              </span>
            </div>

            <pre className="leading-relaxed">
              {code.split("\n").map((lineText, idx) => {
                const lineNum = idx + 1
                const isCurrentLine = lineNum === currentStep.line
                return (
                  <div
                    key={idx}
                    className={`flex items-center px-3 py-1 rounded-lg transition-all ${
                      isCurrentLine
                        ? "bg-indigo-600/30 border-l-4 border-indigo-400 text-white font-bold shadow-md"
                        : "hover:bg-slate-900/50 text-slate-300"
                    }`}
                  >
                    <span className="w-8 text-right text-slate-600 select-none mr-4 text-xs font-mono">{lineNum}</span>
                    <span>{lineText}</span>
                  </div>
                )
              })}
            </pre>
          </div>

          {/* Memory State & Explanation Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step Explanation Card */}
            <div className="p-4 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl shadow-md space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Trace Analysis
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">{currentStep.explanation}</p>
            </div>

            {/* Variable Memory State */}
            <Card className="glass-card border-slate-800">
              <CardHeader className="p-4 pb-2 border-b border-slate-800/80">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Variable & Stack Frame Inspection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-2 font-mono text-xs">
                {Object.entries(currentStep.variables).map(([varName, val]) => (
                  <div key={varName} className="flex justify-between items-center p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-indigo-400">{varName}</span>
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400 font-semibold">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Output Console Tab */}
            <Card className="bg-slate-950 border-slate-800 text-slate-100 rounded-2xl shadow-xl">
              <CardHeader className="p-3 pb-1 border-b border-slate-800">
                <CardTitle className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> Output Console
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 font-mono text-xs text-emerald-400 min-h-[60px]">
                {consoleLogs.length === 0 ? (
                  <span className="text-slate-600 italic">&gt; Visualizer console ready. Click Auto Trace...</span>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-slate-500">&gt;</span> {log}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
