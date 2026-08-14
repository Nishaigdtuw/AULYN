'use client'
import React, { useState } from "react"
import { Sparkles, FileText, RefreshCw, BookOpen, ListChecks, HelpCircle, Layers, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const SAMPLE_NOTES = `Data Structures & Algorithms - Trees & Graphs Summary
A Tree is a non-linear data structure that simulates a hierarchical tree structure with a set of linked nodes.
Key Concepts:
1. Binary Search Tree (BST): A binary tree in which all nodes in the left subtree have values less than the node, and all nodes in the right subtree have values greater.
2. In-order Traversal (Left, Root, Right) of a BST yields elements in sorted ascending order.
3. Graph Traversals: BFS (Breadth First Search) uses a Queue data structure (level-order), while DFS (Depth First Search) uses a Stack data structure (recursion).
4. Time Complexities: Searching in a balanced BST takes O(log N) average time, while unbalanced BST search degrades to O(N).`

export default function NotesAiConverter() {
  const [inputText, setInputText] = useState(SAMPLE_NOTES)
  const [activeMode, setActiveMode] = useState<"summary" | "quiz" | "flashcards">("summary")
  const [isProcessing, setIsProcessing] = useState(false)

  // Generated Summary State
  const [bulletSummary, setBulletSummary] = useState<string[]>([])
  
  // Generated Quiz State
  const [quizQuestions, setQuizQuestions] = useState<Array<{ question: string; options: string[]; answer: number }>>([])
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // Generated Flashcards State
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([])
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const handleConvertNotes = () => {
    if (!inputText.trim() || inputText.length < 15) {
      toast.warning("Please enter at least 15 characters of notes text.")
      return
    }

    setIsProcessing(true)
    toast.info(`AI is analyzing notes and generating ${activeMode}...`)

    setTimeout(() => {
      if (activeMode === "summary") {
        setBulletSummary([
          "• Trees are non-linear hierarchical data structures composed of linked nodes.",
          "• Binary Search Trees (BST) enforce left < root < right property.",
          "• In-order Traversal of a BST produces elements in strictly sorted order.",
          "• BFS traversal relies on Queues; DFS traversal relies on Stacks or Recursion.",
          "• Balanced BST search runs in O(log N) average time vs O(N) worst-case."
        ])
      } else if (activeMode === "quiz") {
        setQuizQuestions([
          {
            question: "Which traversal of a Binary Search Tree produces sorted ascending order?",
            options: ["Pre-order Traversal", "In-order Traversal", "Post-order Traversal", "Level-order Traversal"],
            answer: 1
          },
          {
            question: "What data structure is typically used for Breadth First Search (BFS)?",
            options: ["Stack", "Queue", "Priority Queue", "Hash Table"],
            answer: 1
          },
          {
            question: "What is the average time complexity of searching in a balanced BST?",
            options: ["O(1)", "O(N)", "O(log N)", "O(N²)"],
            answer: 2
          }
        ])
        setUserAnswers({})
        setQuizScore(null)
      } else if (activeMode === "flashcards") {
        setFlashcards([
          { front: "What is a Binary Search Tree (BST)?", back: "A binary tree where left nodes < root and right nodes > root." },
          { front: "What data structure is used by BFS?", back: "Queue (First-In, First-Out)" },
          { front: "What data structure is used by DFS?", back: "Stack (Last-In, First-Out) or Recursion" },
          { front: "What is the search time complexity of a balanced BST?", back: "O(log N) average time complexity" }
        ])
        setCurrentCardIdx(0)
        setShowAnswer(false)
      }

      setIsProcessing(false)
      toast.success(`Generated ${activeMode.toUpperCase()} successfully!`)
    }, 700)
  }

  const handleScoreQuiz = () => {
    let score = 0
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) score++
    })
    setQuizScore(score)
    toast.success(`Quiz completed! You scored ${score} / ${quizQuestions.length}`)
  }

  return (
    <Card className="studio-panel border-purple-200/80 shadow-xl rounded-3xl overflow-hidden bg-white/90">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-xl font-black gradient-text-indigo flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" /> AI Notes Converter: Notes → Quiz / Flashcards / Summary
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs mt-1">
            Transform raw lecture notes or textbook passages into interactive study tools with 1-click
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Notes Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notesInput" className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" /> Source Lecture Notes
              </Label>
              <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-800 font-bold" onClick={() => setInputText(SAMPLE_NOTES)}>
                Load Sample Notes
              </Button>
            </div>

            <textarea
              id="notesInput"
              rows={10}
              className="w-full p-4 text-sm font-sans rounded-2xl border border-slate-200 bg-[#fbf9f5] text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-inner"
              placeholder="Paste your lecture notes, textbook excerpt, or topic summary here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Target Output Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={activeMode === "summary" ? "secondary" : "outline"}
                  className={`text-xs font-bold rounded-xl ${activeMode === "summary" ? "bg-indigo-600 text-white shadow-sm" : "border-slate-200 text-slate-700"}`}
                  onClick={() => setActiveMode("summary")}
                >
                  <ListChecks className="w-3.5 h-3.5 mr-1" /> Summary
                </Button>

                <Button
                  type="button"
                  variant={activeMode === "quiz" ? "secondary" : "outline"}
                  className={`text-xs font-bold rounded-xl ${activeMode === "quiz" ? "bg-purple-600 text-white shadow-sm" : "border-slate-200 text-slate-700"}`}
                  onClick={() => setActiveMode("quiz")}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" /> Quiz
                </Button>

                <Button
                  type="button"
                  variant={activeMode === "flashcards" ? "secondary" : "outline"}
                  className={`text-xs font-bold rounded-xl ${activeMode === "flashcards" ? "bg-emerald-600 text-white shadow-sm" : "border-slate-200 text-slate-700"}`}
                  onClick={() => setActiveMode("flashcards")}
                >
                  <Layers className="w-3.5 h-3.5 mr-1" /> Flashcards
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg"
              disabled={isProcessing}
              onClick={handleConvertNotes}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Convert Notes to {activeMode.toUpperCase()}
                </>
              )}
            </Button>
          </div>

          {/* Generated Result Column */}
          <div className="lg:col-span-7 studio-card rounded-2xl p-6 flex flex-col justify-between border border-slate-200 bg-white">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" /> Generated AI Output ({activeMode.toUpperCase()})
                </h4>
              </div>

              {/* Mode 1: Summary Output */}
              {activeMode === "summary" && (
                <div className="space-y-3">
                  {bulletSummary.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                      Click &quot;Convert Notes&quot; to generate concise AI bullet points.
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2.5 text-sm text-slate-800 leading-relaxed shadow-sm">
                      {bulletSummary.map((bullet, idx) => (
                        <p key={idx} className="font-medium">{bullet}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Quiz Output */}
              {activeMode === "quiz" && (
                <div className="space-y-4">
                  {quizQuestions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                      Click &quot;Convert Notes&quot; to auto-generate a quiz from your notes.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
                          <p className="font-bold text-slate-900 text-sm">{qIdx + 1}. {q.question}</p>
                          <RadioGroup
                            value={userAnswers[qIdx] !== undefined ? userAnswers[qIdx].toString() : ""}
                            onValueChange={(v) => setUserAnswers({ ...userAnswers, [qIdx]: parseInt(v) })}
                          >
                            <div className="space-y-2 pt-1">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center space-x-2 p-2.5 rounded-xl hover:bg-white border border-slate-200/60 text-xs">
                                  <RadioGroupItem value={oIdx.toString()} id={`q${qIdx}-opt${oIdx}`} />
                                  <Label htmlFor={`q${qIdx}-opt${oIdx}`} className="cursor-pointer text-slate-700 w-full font-medium">{opt}</Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>
                      ))}

                      <div className="flex justify-between items-center pt-2">
                        {quizScore !== null && (
                          <span className="font-bold text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-full">
                            Score: {quizScore} / {quizQuestions.length}
                          </span>
                        )}
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold ml-auto text-xs" onClick={handleScoreQuiz}>
                          Check Score
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Flashcards Output */}
              {activeMode === "flashcards" && (
                <div className="space-y-4">
                  {flashcards.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 italic text-sm">
                      Click &quot;Convert Notes&quot; to build interactive flashcards.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 font-bold text-center">
                        Card {currentCardIdx + 1} of {flashcards.length}
                      </p>

                      <div
                        className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 hover:border-purple-400 rounded-3xl shadow-md min-h-[160px] flex flex-col justify-center items-center text-center cursor-pointer transition-all"
                        onClick={() => setShowAnswer(!showAnswer)}
                      >
                        <span className="text-[11px] uppercase font-black text-purple-600 mb-2 tracking-wider">
                          {showAnswer ? "Answer (Click to flip)" : "Question (Click to flip)"}
                        </span>
                        <p className="font-bold text-slate-900 text-base">
                          {showAnswer ? flashcards[currentCardIdx].back : flashcards[currentCardIdx].front}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentCardIdx === 0}
                          className="border-slate-200 text-slate-700 text-xs"
                          onClick={() => { setCurrentCardIdx((prev) => prev - 1); setShowAnswer(false) }}
                        >
                          Previous
                        </Button>

                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          onClick={() => {
                            if (currentCardIdx + 1 < flashcards.length) {
                              setCurrentCardIdx((prev) => prev + 1)
                              setShowAnswer(false)
                            } else {
                              toast.success("Completed flashcard deck!")
                            }
                          }}
                        >
                          {currentCardIdx + 1 === flashcards.length ? "Finish Review" : "Next Card"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
