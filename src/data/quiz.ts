export type Quiz = {
    id: string
    title: string
    description: string
    timeLimit: number
    quizType: "normal" | "no-review"
    questions: Question[]
    createdAt: string
    updatedAt?: string
    randomizeQuestions: boolean
    randomizeOptions: boolean
    published: boolean
}

export type Question = {
    id: string
    question: string
    explanation: string
    questionImage?: string
    questionAudio?: string
    questionVideo?: string
    questionType?: string
    optionSets: OptionSet[]
    activeSetIndex: number
    selectedSetIndex?: number
}

export type Option = {
    id: string
    option: string
    isCorrect: boolean
}

export type OptionSet = {
    id: string
    options: Option[]
    answer: string[]
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Randomizes the order of options in a question
 * @param question The question to randomize
 * @returns A new question object with randomized options
 */
export function randomizeOptions(question: Question): Question {
    const randomizedOptionSets = question.optionSets.map(optionSet => ({
        ...optionSet,
        options: shuffleArray(optionSet.options)
    }));

    return {
        ...question,
        optionSets: randomizedOptionSets
    };
}

/**
 * Randomizes the order of questions in a quiz and optionally randomizes options within each question
 * @param quiz The quiz to randomize
 * @param randomizeOptionsToo Whether to also randomize the order of options within each question
 * @returns A new quiz object with randomized questions
 */
export function randomizeQuiz(quiz: Quiz, randomizeOptionsToo: boolean = true): Quiz {
    let randomizedQuestions = shuffleArray(quiz.questions);

    if (randomizeOptionsToo) {
        randomizedQuestions = randomizedQuestions.map(q => randomizeOptions(q));
    }

    return {
        ...quiz,
        questions: randomizedQuestions
    };
}