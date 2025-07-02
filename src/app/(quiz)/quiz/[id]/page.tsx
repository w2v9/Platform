'use client';
import QuizUI from "@/components/Quiz";
import { Quiz, Question, OptionSet } from "@/data/quiz";
import { useEffect, useState, use } from "react";
import { getQuizById } from "@/lib/db_quiz";
import { toast } from "sonner";
import { Loader } from "lucide-react";

function convertLegacyQuizFormat(quiz: any): Quiz {
    if (!quiz) return quiz;

    const questions = quiz.questions.map((question: any) => {
        if (question.options && !question.optionSets) {
            const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
            const correctIds = correctOptions.map((opt: any) => opt.id);

            const optionSet = {
                id: crypto.randomUUID(),
                options: question.options,
                answer: correctIds
            };

            return {
                ...question,
                optionSets: [optionSet],
                activeSetIndex: 0,
                options: undefined,
                answer: undefined
            };
        }

        return {
            ...question,
            optionSets: question.optionSets || [],
            activeSetIndex: question.activeSetIndex || 0
        };
    });

    return {
        ...quiz,
        questions,
        randomizeQuestions: quiz.randomizeQuestions || false,
        randomizeOptions: quiz.randomizeOptions || false
    };
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const quizId = unwrappedParams.id;
    const [quizData, setQuizData] = useState<Quiz>();
    const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set page title
        document.title = "Quiz - AzoozGAT Platform";
    }, []);

    function prepareQuizForTaking(quiz: Quiz): Quiz {
        if (!quiz) return quiz;

        let preparedQuestions = [...quiz.questions];

        if (quiz.randomizeQuestions) {
            preparedQuestions = shuffleArray(preparedQuestions);
        }

        preparedQuestions = preparedQuestions.map(question => {
            if (question.optionSets && question.optionSets.length > 1) {
                const randomIndex = Math.floor(Math.random() * question.optionSets.length);
                return {
                    ...question,
                    selectedSetIndex: randomIndex
                };
            }
            return {
                ...question,
                selectedSetIndex: question.activeSetIndex || 0
            };
        });

        if (quiz.randomizeOptions) {
            preparedQuestions = preparedQuestions.map(question => {
                const optionSets = question.optionSets.map((set, index) => {
                    if (index === question.selectedSetIndex || index === question.activeSetIndex) {
                        return {
                            ...set,
                            options: shuffleArray(set.options)
                        };
                    }
                    return set;
                });

                return {
                    ...question,
                    optionSets
                };
            });
        }

        return {
            ...quiz,
            questions: preparedQuestions
        };
    }

    function shuffleArray<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setIsLoading(true);
                const quiz = await getQuizById(quizId);

                if (quiz) {
                    const convertedQuiz = convertLegacyQuizFormat(quiz);

                    const preparedQuiz = prepareQuizForTaking(convertedQuiz);

                    setQuizData(preparedQuiz);
                } else {
                    setError("Quiz not found");
                    toast.error("Quiz not found");
                }
            } catch (error) {
                console.error("Error fetching quiz:", error);
                setError("Error loading quiz");
                toast.error("Error fetching quiz");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuiz();

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            toast.error("Right-clicking is disabled during the quiz");
            return false;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p')) ||
                e.key === 'F12' ||
                (e.altKey && e.key === 'Tab')
            ) {
                e.preventDefault();
                toast.error("Keyboard shortcuts are disabled during the quiz");
                return false;
            }
        };

        const handleSelectStart = (e: Event) => {
            e.preventDefault();
            return false;
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('selectstart', handleSelectStart);
        };
    }, [quizId]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-500" />
                    <div className="text-lg">
                        Loading your quiz...
                        <br />
                        Please be prepared, your quiz will start soon!
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="text-red-500 text-2xl mb-4">
                        Error
                    </div>
                    <div className="text-lg">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="text-red-500 text-2xl mb-4">
                        Quiz Not Found
                    </div>
                    <div className="text-lg">
                        The requested quiz could not be loaded.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col gap-4 h-full items-center justify-center"
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
        >
            <QuizUI quizData={quizData} />
        </div>
    );
}