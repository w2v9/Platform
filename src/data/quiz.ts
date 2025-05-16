export type Quiz = {
    id: string
    title: string
    description: string
    timeLimit: number
    quizType: "normal" | "no-review"
    questions: Question[]
    createdAt: string
    updatedAt?: string
}

export type Question = {
    id: string
    question: string
    explanation: string
    questionImage?: string
    questionAudio?: string
    questionVideo?: string
    questionType?: string
    options: Option[]
    answer: Option
}

export type Option = {
    id: string
    option: string
    isCorrect: boolean
}

