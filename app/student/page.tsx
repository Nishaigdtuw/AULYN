'use client'
import React, { useState } from "react"
import { Book, BookOpen, Download, LogIn, MessageSquare, PenTool, Send, Star, Upload, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import Markdown from 'react-markdown'
import { toast } from "sonner"


export default function StudentPortal() {
  const [activeClass, setActiveClass] = useState(null)
  const [showAiChat, setShowAiChat] = useState(false)
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")

  interface AiMessage {
    type: 'ai' | 'user'
    content: string
  }
  
  const enrolledClasses = [
    { id: 1, name: "Mathematics 101", icon: <PenTool className="w-6 h-6" /> },
    { id: 2, name: "History 202", icon: <Book className="w-6 h-6" /> },
    { id: 3, name: "Physics 301", icon: <BookOpen className="w-6 h-6" /> },
  ]

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      
        setAiMessages([...aiMessages, { type: 'user', content: inputMessage }])
        setInputMessage("")
        toast.warning("Please wait while we fetch the response")

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage, currentClass: "blockchain", currentChapter: "ether" }),
      });
      toast.success("Successfully fetched the response")
      const data = await response.json();
      console.log(data);
      if (data.message) {
          setAiMessages([...aiMessages, { type: 'ai', content: data.message }])
      }
      setInputMessage("")
    }
  }



  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-600">Edubridge</h1>
        </div>
        <Button variant="ghost" size="icon">
          <LogIn className="w-6 h-6" />
          <span className="sr-only">Login</span>
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-white p-4 overflow-y-auto">
          <Button className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700 text-white">Join Classes</Button>
          <h2 className="font-semibold mb-2 text-gray-700">Enrolled Classes</h2>
          <ul className="space-y-2">
            {enrolledClasses.map((cls) => (
              <li key={cls.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${activeClass === cls.id ? "bg-indigo-100 text-indigo-600" : ""}`}
                  // onClick={() => setActiveClass(cls.id)}
                >
                  {cls.icon}
                  <span className="ml-2">{cls.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="assessments" className="w-full h-ful">
            <TabsList className="grid w-full grid-cols-4 rounded-xl bg-indigo-100 p-1">
              <TabsTrigger value="assessments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">Assessments</TabsTrigger>
              <TabsTrigger value="qna" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">QNA</TabsTrigger>
              <TabsTrigger value="prep" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">Prep</TabsTrigger>
              <TabsTrigger value="saved" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600">Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="assessments">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-600">Pending Assignments</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Mathematics Assignment 3</li>
                    <li>History Essay: Industrial Revolution</li>
                    <li>Physics Lab Report: Projectile Motion</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="qna" className=" h-full max-h-[80vh] overflow-y-auto ">
              <Card className=" h-full">
                <CardContent className="pt-6 ">
                  {!showAiChat ? (
                    <>
                      <h3 className="text-lg font-semibold mb-2 text-indigo-600">Recent Discussions</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <MessageSquare className="w-5 h-5 mr-2 mt-1 text-indigo-600" />
                          <div>
                            <p className="font-medium">Calculus Integration Techniques</p>
                            <p className="text-sm text-gray-600">Last activity: 2 hours ago</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <MessageSquare className="w-5 h-5 mr-2 mt-1 text-indigo-600" />
                          <div>
                            <p className="font-medium">World War II Timeline</p>
                            <p className="text-sm text-gray-600">Last activity: 1 day ago</p>
                          </div>
                        </li>
                      </ul>
                      <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowAiChat(true)}>
                        Ask AI Assistant
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center ">
                        <h3 className="text-lg font-semibold text-indigo-600">AI Assistant</h3>
                        <Button variant="outline" onClick={() => setShowAiChat(false)}>
                          Back to Discussions
                        </Button>
                      </div>
                      <ScrollArea className=" min-h-[450px] border rounded-md p-4 ">
                        {aiMessages && aiMessages.map((msg, index) => (
                          <div key={index} className={`mb-4 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block p-2 rounded-lg ${msg.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                              <Markdown>
                              {msg.content}
                              </Markdown>
                            </span>
                          </div>
                        ))}
                      </ScrollArea>
                      <div className="flex space-x-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Type your question here..."
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="prep">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-indigo-600">
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      MCQs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Practice multiple-choice questions to test your knowledge.</p>
                   
                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Start MCQ Quiz</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-indigo-600">
                      <Circle className="w-6 h-6 mr-2" />
                      One-Word Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Enhance your quick recall with one-word answer questions.</p>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center">
              
                      </li>
                    </ul>
                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Practice One-Word Questions</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-indigo-600">
                      <AlertCircle className="w-6 h-6 mr-2" />
                      Mock Tests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Simulate real exam conditions with timed mock tests.</p>
                    <ul className="space-y-2">
                  
                    </ul>
                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Take a Mock Test</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="saved">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-600">Saved Content</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      <span>Calculus Cheat Sheet</span>
                    </li>
                    <li className="flex items-center">
                      <Download className="w-5 h-5 mr-2 text-indigo-600" />
                      <span>History Timeline Template</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      <span>Physics Formula Reference</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}