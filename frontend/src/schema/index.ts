import { z } from "zod"

// Question schema
export const questionSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  answers: z.record(z.string(), z.boolean()).refine(
    (answers) => Object.keys(answers).length >= 2,
    "At least 2 answers are required"
  ).refine(
    (answers) => Object.values(answers).filter(Boolean).length === 1,
    "Exactly one answer must be correct"
  )
})

export type Question = z.infer<typeof questionSchema>

// Question with ID for fetched data
export type QuestionWithId = Question & {
  id: string
}

// Answer type for UI
export type Answer = {
  id: string
  text: string
  isCorrect: boolean
}