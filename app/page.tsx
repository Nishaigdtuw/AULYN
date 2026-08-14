'use client'
import React, { useState } from "react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { loginUser } from "@/actions/auth/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("student")

  async function login(){
    if(password.length <= 5){
      toast.warning("Password length is too short")
      return;
    }
    if(!email.endsWith(".com")){
      toast.warning("Incorrect Email address")
      return;
    }
    setEmail(email.toLowerCase())
    const res = await loginUser(email, password, userType);
    if(res === null){
      console.log("No User Found")
      toast.error("Incorrect Credentials")
      return;
    }else{
      toast.success("Succesfully Logged In")
      localStorage.setItem("user", JSON.stringify(res))
      router.replace(userType)
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <LogIn className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800">Welcome to Edubridge</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email}  onChange={(e)=> setEmail(e.target.value)}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>
          <RadioGroup defaultValue="student" className="flex justify-center space-x-4" onValueChange={setUserType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="student" />
              <Label htmlFor="student">Student</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="teacher" id="teacher" />
              <Label htmlFor="teacher">Teacher</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={()=>login()}>
            Sign In as {userType === "student" ? "Student" : "Teacher"}
          </Button>
        </CardFooter>
        <div className="text-center mt-4 text-sm text-gray-600">
          <a href="#" className="hover:underline">
            Forgot password?
          </a>
        </div>
      </Card>
    </div>
  )
}