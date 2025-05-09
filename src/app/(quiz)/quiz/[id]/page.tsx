import QuizUI from "@/components/Quiz";

import { Quiz } from "@/data/quiz";


export const quizData: Quiz = {
    id: "1",
    title: "Sample Quiz",
    description: "This is a sample quiz.",
    timeLimit: 1.5,
    createdAt: "2023-10-01",
    questions: [
        {
            id: "1",
            question: "What is the capital of France?",
            questionType: "multiple-choice",
            options: [
                { id: "1", option: "Berlin", isCorrect: false },
                { id: "2", option: "Madrid", isCorrect: false },
                { id: "3", option: "Paris", isCorrect: true },
                { id: "4", option: "Rome", isCorrect: false },
            ],
            answer: [{ id: "2", option: "Madrid", isCorrect: false }],
        },
        {
            id: "2",
            question: "What is 2 + 2?",
            questionType: "single-choice",
            options: [
                { id: "1", option: "3", isCorrect: false },
                { id: "2", option: "4", isCorrect: true },
                { id: "3", option: "5", isCorrect: false },
            ],
            answer: [{ id: "1", option: "3", isCorrect: false }],
        },
        {
            id: "3",
            question: "What is the largest planet in our solar system?",
            questionType: "multiple-choice",
            options: [
                { id: "1", option: "Earth", isCorrect: false },
                { id: "2", option: "Mars", isCorrect: false },
                { id: "3", option: "Jupiter", isCorrect: true },
                { id: "4", option: "Saturn", isCorrect: false },
            ],
            answer: [{ id: "3", option: "Jupiter", isCorrect: true }],
        },
        {
            id: "4",
            question: "What is the chemical symbol for gold?",
            questionType: "multiple-choice",
            options: [
                { id: "1", option: "Au", isCorrect: true },
                { id: "2", option: "Ag", isCorrect: false },
                { id: "3", option: "Fe", isCorrect: false },
                { id: "4", option: "Pb", isCorrect: false },
            ],
            answer: [{ id: "1", option: "Au", isCorrect: true }],
        },
    ],

};


export default function QuizPage({ params }: { params: { id: string } }) {

    return (
        <div className="flex flex-col gap-4">
            <QuizUI quizData={quizData} />
        </div>
    );
}
