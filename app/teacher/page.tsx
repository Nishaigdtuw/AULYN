'use client'
import React, { useEffect, useState } from "react"
import { Book, BookOpen, FileText, LogIn, Mic, PenTool, Plus, Upload, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { chapter, classroom, content, user } from "@prisma/client"
import { toast } from "sonner"
import { addChapter, addClass, addContentToChapter, getChapters, getClasses, getContent } from "@/actions/teacher/action"
import { useRouter } from "next/navigation"
import { getPresignedUrl } from "@/actions/teacher/s3"

export default function TeacherPortal() {
  const router =  useRouter();
  const [activeClass, setActiveClass] = useState<classroom>()
  const [newClass, setNewClass] = useState("");
  const [newChapter, setNewChapter] = useState("")
  const [self, setSelf] = useState<user>();
  const [yourClasses, setYourClasses] = useState<classroom[]>();
  const [chapters, setChapters] = useState<chapter[]>()
  const [file, setFile] = useState<File | null>()
  const [selectedChapter, setSelectedChapter] = useState<chapter>()
  const [chapterContent, setChapterContent] = useState<content[]>();



  async function fetchClasses(){
    if (self && self.userId){
      const resClasses = await getClasses(self?.userId);
      if (resClasses.length === 0 ){
        toast.warning("0 Classes")
      }else{
        setYourClasses(resClasses)
        toast.success("Classes Fetched")
      }
    }
  }


  useEffect(()=>{
    const user = localStorage.getItem("user");
    if (!user || user === null){
      router.replace('/')
      return;
    }
    setSelf(JSON.parse(user));
  },[])

  useEffect(()=>{
    fetchClasses()
  }, [self])



  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const students = [
    { id: 1, name: "Alice Johnson", status: "Enrolled" },
    { id: 2, name: "Bob Smith", status: "Pending" },
    { id: 3, name: "Charlie Brown", status: "Enrolled" },
  ]


  const handleCreateClassroom = async () => {
    if(newClass.length < 4){
      toast.warning("Classname is too short")
      return;
    }
    if(self && self.userId){
      toast.success("Creating...")
      setNewClass("")
      const res = await addClass(self?.userId, newClass);
      if(yourClasses)
      setYourClasses([...yourClasses, res]);
      fetchClasses()
      toast.success("Created")
    }else{
      toast.warning("User doesn't exist")
    }

  }

  async function fetchChapters(){
    if(!activeClass){
      return;
    }
    const data = await getChapters(activeClass.classId);
    setChapters(data);
    
  }


  useEffect(()=>{
    if(file)
    toast.success("Got Your File: " + file?.name)
  }
  ,[file])

  async function handleFileUpload(){
    if(!file) return;
    if(!activeClass) return;
    if(!self) return;
    if(!selectedChapter) return;
    toast.success("Uploading File...")
    const presigned = await getPresignedUrl(file?.name, activeClass?.classId, activeClass?.classId)
    if(presigned.error){
      toast.error(presigned.error)
      return;
    }
    if(!presigned.signedUrl){
      toast.error("No Signed URL")
      return;
    }
    const res = await fetch(presigned.signedUrl, {
      method: 'PUT',
      body: file
    })
    setFile(null)
    if(res.ok){
      const content = await addContentToChapter(selectedChapter?.chapterId, file?.name, file?.type, presigned.signedUrl, activeClass?.classId)
      if(content){
        toast.success("File Uploaded")
        fetchContentByClass()
      }else{
        toast.error("Error Uploading File")
      }
    }

  }


  async function fetchContentByClass(){
    toast.success("Fetching Content...")
    if(!activeClass) return;
    const cc = await getContent(activeClass.classId)
    if(cc){
      setChapterContent(cc)
      console.log(cc)
      toast.success("Content Fetched")
    }else{
      toast.error("Error Fetching")
  }
}

  const handleCreateChapter = async () => {
    if(newChapter.length < 5){
      toast.warning("Chapter Name is too short")
      return;
    }
    if(!activeClass) return;
    if(!self) return;
    toast.success("Creating Chapter...")
    const chps = await addChapter(newChapter, activeClass?.classId, self?.userId)
    fetchChapters();
    toast.success("Chapters Fetched")
    setNewChapter("")
  }


  useEffect(()=>{
    fetchContentByClass();
    fetchChapters();
    
  }, [activeClass])

 

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">Edubridge</h1>
        <Button variant="ghost" size="icon">
          <LogIn className="w-6 h-6" />
          <span className="sr-only">Login</span>
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r p-4 overflow-y-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full mb-4">Create Class</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Class</DialogTitle>
              </DialogHeader>
              <Label htmlFor="className">Class Name</Label>
              <Input id="className" onChange={(e)=>setNewClass(e.target.value)} placeholder="Enter class name" />
              <DialogClose asChild>
                <Button type="submit" onClick={()=>handleCreateClassroom()}>Create</Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
          <h2 className="font-semibold mb-2">Your Classes</h2>
          <ul className="space-y-2">
            {yourClasses && yourClasses.map((cls) => (
              <li key={cls.classId}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${activeClass === cls? "bg-accent" : ""}`}
                  onClick={() => setActiveClass(cls)}
                >
                  <span className="ml-2">{cls.className}</span>
                </Button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="assignments" className="w-full">
            <TabsList>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
            <TabsContent value="assignments">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Assignment Tools</h3>
                  <div className=" flex gap-20">
                    <Button className="w-full justify-start">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Test
                    </Button>
                    <Button className="w-full justify-start">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Quiz
                    </Button>
                    <Button className="w-full justify-start">
                      <FileText className="w-5 h-5 mr-2" />
                      Share Information
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="students">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Student Management</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.status}</TableCell>
                          <TableCell>
                            {student.status === "Pending" ? (
                              <>
                                <Button size="sm" className="mr-2">Accept</Button>
                                <Button size="sm" variant="destructive">Reject</Button>
                              </>
                            ) : (
                              <Button size="sm" variant="destructive">Remove</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="chapters">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Chapters</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="mb-4">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Chapter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Chapter</DialogTitle>
                      </DialogHeader>
                      <Label htmlFor="chapterName">Chapter Name</Label>
                      <Input id="chapterName" placeholder="Enter chapter name" value={newChapter} onChange={(e)=>setNewChapter(e.target.value)} />
                      <DialogClose asChild>
                      <Button 
                      onClick={() => handleCreateChapter()}
                      >Create</Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                  {chapters && chapters.filter((c,i,v)=>c.classId === activeClass?.classId).map((chapter) => (
                    <div key={chapter.chapterName} className="mb-4 p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{chapter.chapterName}</h4>
                      
                      <label 
                        className="p-4  border-dashed rounded-lg mb-2 w-full border-black" 
                        htmlFor={`fileUpload-${chapter.chapterId}`} 
                      >
                      
                        <p className="text-center text-muted-foreground">Drag and drop PDF or PPT files here</p>
                      </label>
                      <input 
                        id={`fileUpload-${chapter.chapterId}`} 
                        type="file" 
                        accept=".pdf,.ppt,.pptx" 
                        className=" p-4 border-2 border-dashed rounded-lg mb-2 hidden"
                        onChange={(e) =>{
                          if(e.target.files && e.target.files.length > 0){
                          setFile(e.target.files[0])
                          setSelectedChapter(chapter)
                        };

                        }
                        }
                    />
                      <div className="flex justify-between items-center">
                        <Button 
                        onClick={() => handleFileUpload()}
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          {file? `Upload ${file.name}`:"Select a File"}
                        </Button>
                        
                        <Button
                        //  onClick={() => handleVoiceCapture(chapter.id)}
                        >
                          <Mic className="w-5 h-5 mr-2" />
                          {isRecording ? "Stop Recording" : "Start Voice Capture"}
                        </Button>
                      </div>
                      {chapterContent && selectedChapter && chapterContent.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-semibold">Uploaded Content:</h5>
                          <ul>
                            {chapterContent.filter((c,i,v)=>c.chapterId === selectedChapter.chapterId).map((item, index) => (
                              <li key={index}>{index+1} - {item.fileName}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="content">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Content Management</h3>
                  <p>Manage your course content here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}