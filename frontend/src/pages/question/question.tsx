import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus, Trash2, Save, Edit } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { axiosInstance } from "@/lib/utils"
import { questionSchema, type Question, type QuestionWithId, type Answer } from "@/schema"

function QuestionComponent() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<{
    question_text: string
    answers: Answer[]
  }>({
    question_text: "",
    answers: [
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false }
    ]
  })

  // Fetch questions
  const { data: questions, refetch } = useQuery({
    queryKey: ["questions"],
    queryFn: async (): Promise<QuestionWithId[]> => {
      const response = await axiosInstance.get("/questions")
      return response.data
    }
  })

  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (data: Question) => {
      return await axiosInstance.post("/questions", data)
    },
    onSuccess: () => {
      refetch()
      resetForm()
      setIsCreating(false)
    }
  })

  // Update question mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Question }) => {
      return await axiosInstance.put(`/questions/${id}`, data)
    },
    onSuccess: () => {
      refetch()
      setEditingId(null)
      resetForm()
    }
  })

  // Delete question mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await axiosInstance.delete(`/questions/${id}`)
    },
    onSuccess: () => {
      refetch()
    }
  })

  const resetForm = () => {
    setFormData({
      question_text: "",
      answers: [
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false }
      ]
    })
  }

  const addAnswer = () => {
    const newId = (formData.answers.length + 1).toString()
    setFormData(prev => ({
      ...prev,
      answers: [...prev.answers, { id: newId, text: "", isCorrect: false }]
    }))
  }

  const removeAnswer = (id: string) => {
    if (formData.answers.length <= 2) return
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.filter(answer => answer.id !== id)
    }))
  }

  const updateAnswer = (id: string, field: "text" | "isCorrect", value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === id 
          ? { ...answer, [field]: value }
          : field === "isCorrect" && value
          ? { ...answer, isCorrect: false } // Ensure only one correct answer
          : answer
      )
    }))
  }

  const handleSubmit = () => {
    const answersObject = formData.answers.reduce((acc, answer) => {
      if (answer.text.trim()) {
        acc[answer.text] = answer.isCorrect
      }
      return acc
    }, {} as Record<string, boolean>)

    const questionData = {
      question_text: formData.question_text,
      answers: answersObject
    }

    try {
      questionSchema.parse(questionData)
      if (editingId) {
        updateMutation.mutate({ id: editingId, data: questionData })
      } else {
        createMutation.mutate(questionData)
      }
    } catch (error) {
      console.error("Validation error:", error)
    }
  }

  const startEdit = (question: QuestionWithId) => {
    const answers = Object.entries(question.answers).map(([text, isCorrect], index) => ({
      id: (index + 1).toString(),
      text,
      isCorrect: isCorrect as boolean
    }))
    
    setFormData({
      question_text: question.question_text,
      answers
    })
    setEditingId(question.id)
    setIsCreating(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    resetForm()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Questions Management</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Question
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Question" : "Create New Question"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question Text</label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))
                }
                placeholder="Enter your question here..."
                className="min-h-20"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Answers</label>
                <Button
                  onClick={addAnswer}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Answer
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.answers.map((answer) => (
                  <div key={answer.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={answer.isCorrect}
                      onCheckedChange={(checked) => 
                        updateAnswer(answer.id, "isCorrect", checked as boolean)
                      }
                    />
                    <Input
                      value={answer.text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAnswer(answer.id, "text", e.target.value)}
                      placeholder="Enter answer text..."
                      className="flex-1"
                    />
                    {formData.answers.length > 2 && (
                      <Button
                        onClick={() => removeAnswer(answer.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Check one answer as correct. At least 2 answers required.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? "Update" : "Create"} Question
            </Button>
            <Button onClick={cancelEdit} variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Questions</h2>
        {questions?.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{question.question_text}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => startEdit(question)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => deleteMutation.mutate(question.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Answers:</h4>
                {Object.entries(question.answers).map(([text, isCorrect]) => (
                  <div key={text} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <div className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={isCorrect ? 'font-medium text-green-700' : ''}>{text}</span>
                    {isCorrect && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default QuestionComponent