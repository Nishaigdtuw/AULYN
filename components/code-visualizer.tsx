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
  },
  bfsGraph: {
    title: "Graph BFS Traversal (O(V + E))",
    language: "javascript",
    code: `function bfs(graph, startNode) {
  let queue = [startNode];
  let visited = new Set([startNode]);
  while (queue.length > 0) {
    let node = queue.shift();
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,
    steps: [
      { line: 2, explanation: "Initialize Queue with startNode = 'A'", variables: { queue: "['A']", visited: "{'A'}" } },
      { line: 5, explanation: "Dequeue Node 'A'. Inspect neighbors ['B', 'C']", variables: { node: "'A'", queue: "[]", neighbors: "['B', 'C']" } },
      { line: 8, explanation: "Visit 'B' and 'C'. Push to Queue", variables: { queue: "['B', 'C']", visited: "{'A', 'B', 'C'}" }, consoleOutput: "Visited BFS Node: A -> B -> C" }
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
    <Card className="studio-panel border-indigo-200/80 shadow-xl rounded-3xl overflow-hidden bg-white/90">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-xl font-black gradient-text-indigo flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600" /> Engineering Code Trace IDE & Memory Visualizer
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs mt-1">
            Trace Data Structures & Algorithms line-by-line for B.Tech CS & Placement Prep
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPreset === "binarySearch" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("binarySearch")}
            className={`text-xs font-bold rounded-xl ${selectedPreset === "binarySearch" ? "bg-indigo-600 text-white shadow-md" : "border-slate-200 text-slate-700"}`}
          >
            Binary Search
          </Button>
          <Button
            variant={selectedPreset === "twoSum" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("twoSum")}
            className={`text-xs font-bold rounded-xl ${selectedPreset === "twoSum" ? "bg-purple-600 text-white shadow-md" : "border-slate-200 text-slate-700"}`}
          >
            Two Sum
          </Button>
          <Button
            variant={selectedPreset === "bfsGraph" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectPreset("bfsGraph")}
            className={`text-xs font-bold rounded-xl ${selectedPreset === "bfsGraph" ? "bg-cyan-600 text-white shadow-md" : "border-slate-200 text-slate-700"}`}
          >
            Graph BFS
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Step Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-blue-50/80 border border-indigo-100 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md text-xs rounded-xl" disabled={isPlaying} onClick={handleRunAll}>
              <Play className="w-4 h-4 mr-1.5" /> Auto Trace
            </Button>
            <Button size="sm" variant="outline" className="text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-bold rounded-xl" onClick={handleNextStep}>
              <SkipForward className="w-4 h-4 mr-1.5 text-indigo-600" /> Step Forward
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900 text-xs" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </Button>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-mono font-bold shadow-sm">
              Line {currentStep.line}
            </span>
            <span className="text-slate-600 font-semibold">
              Step {currentStepIdx + 1} of {currentPreset.steps.length}
            </span>
          </div>
        </div>

        {/* Dual Panel: Code View + Memory Inspection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Light Studio Code Viewer */}
          <div className="lg:col-span-7 bg-[#fdfbf7] text-slate-800 rounded-2xl p-4 font-mono text-sm border border-amber-200/80 shadow-md overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60 text-xs text-slate-500">
              <span className="flex items-center gap-2 font-bold text-indigo-700">
                <Code2 className="w-4 h-4 text-indigo-600" /> {currentPreset.title}
              </span>
              <span className="uppercase text-[10px] bg-amber-100/80 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
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
                    className={`flex items-center px-3 py-1 rounded-xl transition-all ${
                      isCurrentLine
                        ? "bg-indigo-100/90 border-l-4 border-indigo-600 text-indigo-950 font-bold shadow-sm"
                        : "hover:bg-amber-100/40 text-slate-700"
                    }`}
                  >
                    <span className="w-8 text-right text-slate-400 select-none mr-4 text-xs font-mono">{lineNum}</span>
                    <span>{lineText}</span>
                  </div>
                )
              })}
            </pre>
          </div>

          {/* Memory State & Step Analysis */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step Explanation Card */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl shadow-sm space-y-1.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Engineering Trace Explanation
              </div>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">{currentStep.explanation}</p>
            </div>

            {/* Variable Memory Inspection */}
            <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Heap & Stack Pointer Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-2 font-mono text-xs">
                {Object.entries(currentStep.variables).map(([varName, val]) => (
                  <div key={varName} className="flex justify-between items-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="font-extrabold text-indigo-600">{varName}</span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-emerald-700 font-bold shadow-2xs">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Terminal Console */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-md">
              <CardHeader className="p-3 pb-1 border-b border-slate-800">
                <CardTitle className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> Output Console
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 font-mono text-xs text-emerald-400 min-h-[60px]">
                {consoleLogs.length === 0 ? (
                  <span className="text-slate-500 italic">&gt; Console ready. Click Auto Trace...</span>
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
