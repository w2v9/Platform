'use client';
import React from "react";
import QuizUI from "@/components/Quiz";
import { Quiz, Question, OptionSet } from "@/data/quiz";
import { useEffect, useState, use } from "react";
import { getQuizById } from "@/lib/db_quiz";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizBrowserWarning } from "@/components/BrowserCompatibility";
import { detectBrowser } from "@/lib/utils/browserDetection";

function convertLegacyQuizFormat(quiz: any): Quiz {
    if (!quiz) {
        throw new Error("Quiz data is null or undefined");
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
        throw new Error("Quiz questions array is missing or invalid");
    }

    const questions = quiz.questions.map((question: any, index: number) => {
        if (!question) {
            throw new Error(`Question ${index + 1} is null or undefined`);
        }

        // Handle legacy format with direct options
        if (question.options && !question.optionSets) {
            if (!Array.isArray(question.options)) {
                throw new Error(`Question ${index + 1} has invalid options array`);
            }

            const correctOptions = question.options.filter((opt: any) => opt && opt.isCorrect);
            const correctIds = correctOptions.map((opt: any) => opt.id).filter(Boolean);

            const optionSet = {
                id: (crypto.randomUUID && crypto.randomUUID()) || `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                options: question.options.filter(Boolean), // Remove any null/undefined options
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

        // Handle new format with optionSets
        if (!question.optionSets || !Array.isArray(question.optionSets)) {
            throw new Error(`Question ${index + 1} has invalid optionSets array`);
        }

        return {
            ...question,
            optionSets: question.optionSets.filter(Boolean), // Remove any null/undefined optionSets
            activeSetIndex: question.activeSetIndex || 0
        };
    });

    return {
        ...quiz,
        questions: questions.filter(Boolean), // Remove any null/undefined questions
        randomizeQuestions: Boolean(quiz.randomizeQuestions),
        randomizeOptions: Boolean(quiz.randomizeOptions)
    };
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const quizId = unwrappedParams.id;
    const [quizData, setQuizData] = useState<Quiz>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Global error handler
    useEffect(() => {
        const handleGlobalError = (event: ErrorEvent) => {
            console.error('Global error caught:', event.error);
            setError(`Application error: ${event.error?.message || 'Unknown error occurred'}`);
            toast.error('An unexpected error occurred. Please refresh the page.');
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection:', event.reason);
            setError(`Promise error: ${event.reason?.message || 'Unknown promise error'}`);
            toast.error('An unexpected error occurred. Please refresh the page.');
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    useEffect(() => {
        // Set page title
        document.title = "Quiz - AzoozGAT Platform";
    }, []);

    function prepareQuizForTaking(quiz: Quiz): Quiz {
        if (!quiz) {
            throw new Error("Quiz data is null or undefined");
        }

        if (!quiz.questions || !Array.isArray(quiz.questions)) {
            throw new Error("Quiz questions array is missing or invalid");
        }

        let preparedQuestions = [...quiz.questions].filter(Boolean); // Remove any null questions

        if (quiz.randomizeQuestions) {
            preparedQuestions = shuffleArray(preparedQuestions);
        }

        preparedQuestions = preparedQuestions.map((question, index) => {
            if (!question) {
                throw new Error(`Question ${index + 1} is null or undefined`);
            }

            if (!question.optionSets || !Array.isArray(question.optionSets)) {
                throw new Error(`Question ${index + 1} has invalid optionSets`);
            }

            if (question.optionSets.length === 0) {
                throw new Error(`Question ${index + 1} has no option sets`);
            }

            let selectedSetIndex = question.activeSetIndex || 0;

            if (question.optionSets.length > 1) {
                // Ensure selectedSetIndex is within bounds
                selectedSetIndex = Math.min(selectedSetIndex, question.optionSets.length - 1);
                selectedSetIndex = Math.max(selectedSetIndex, 0);
            }

            return {
                ...question,
                selectedSetIndex
            };
        });

        if (quiz.randomizeOptions) {
            preparedQuestions = preparedQuestions.map(question => {
                if (!question.optionSets) {
                    return question;
                }

                const optionSets = question.optionSets.map((set, index) => {
                    if (!set || !set.options) {
                        return set;
                    }

                    if (index === question.selectedSetIndex || index === question.activeSetIndex) {
                        return {
                            ...set,
                            options: shuffleArray(set.options.filter(Boolean)) // Remove null options
                        };
                    }
                    return set;
                });

                return {
                    ...question,
                    optionSets: optionSets.filter(Boolean) // Remove null optionSets
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
                setError(null);
                
                if (!quizId) {
                    throw new Error("Quiz ID is missing");
                }

                const quiz = await getQuizById(quizId);

                if (!quiz) {
                    throw new Error("Quiz not found");
                }

                // Validate quiz structure
                if (!quiz.questions || !Array.isArray(quiz.questions)) {
                    throw new Error("Invalid quiz structure: questions array is missing");
                }

                if (quiz.questions.length === 0) {
                    throw new Error("Quiz has no questions");
                }

                // Validate each question
                for (let i = 0; i < quiz.questions.length; i++) {
                    const question = quiz.questions[i];
                    if (!question.optionSets || !Array.isArray(question.optionSets)) {
                        throw new Error(`Question ${i + 1} has invalid option sets`);
                    }
                    if (question.optionSets.length === 0) {
                        throw new Error(`Question ${i + 1} has no option sets`);
                    }
                    for (let j = 0; j < question.optionSets.length; j++) {
                        const optionSet = question.optionSets[j];
                        if (!optionSet.options || !Array.isArray(optionSet.options)) {
                            throw new Error(`Question ${i + 1}, Option Set ${j + 1} has invalid options`);
                        }
                        if (optionSet.options.length === 0) {
                            throw new Error(`Question ${i + 1}, Option Set ${j + 1} has no options`);
                        }
                    }
                }

                const convertedQuiz = convertLegacyQuizFormat(quiz);
                const preparedQuiz = prepareQuizForTaking(convertedQuiz);

                setQuizData(preparedQuiz);
            } catch (error) {
                console.error("Error fetching quiz:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                setError(errorMessage);
                toast.error(`Error loading quiz: ${errorMessage}`);
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
            <div className="fixed inset-0 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-6 text-center max-w-md">
                    <div className="text-red-500 text-3xl mb-4">
                        ⚠️ Quiz Error
                    </div>
                    <div className="text-lg text-gray-700 dark:text-gray-300">
                        {error}
                    </div>
                    
                    {/* Browser-specific guidance */}
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            💡 Quick Fix
                        </h3>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• <strong>If using Telegram:</strong> Tap the Safari icon (🌐) to open in Safari</li>
                            <li>• <strong>If using WhatsApp/Facebook:</strong> Open in Safari or Chrome</li>
                            <li>• <strong>Refresh the page</strong> after switching browsers</li>
                        </ul>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button 
                            onClick={() => window.location.reload()} 
                            variant="default"
                            className="px-6"
                        >
                            Refresh Page
                        </Button>
                        <Button 
                            onClick={() => window.history.back()} 
                            variant="outline"
                        >
                            Go Back
                        </Button>
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
        <>
            <QuizBrowserWarning />
            <div
                className="flex flex-col gap-4 h-full items-center justify-center"
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
            >
                <ErrorBoundary fallback={<QuizErrorFallback />}>
                    <QuizUI quizData={quizData} />
                </ErrorBoundary>
            </div>
        </>
    );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Quiz Error Boundary caught an error:', error, errorInfo);
        toast.error('Quiz component error. Please refresh the page.');
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

// Error Fallback Component
function QuizErrorFallback() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900">
            <div className="flex flex-col items-center space-y-6 text-center max-w-md">
                <div className="text-red-500 text-3xl mb-4">
                    🚨 Quiz Component Error
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300">
                    The quiz component encountered an error. This often happens with in-app browsers.
                </div>
                
                {/* Browser-specific guidance */}
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-left">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        🔧 Solution Steps
                    </h3>
                    <ol className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                        <li>1. <strong>Switch to Safari:</strong> Tap the Safari icon (🌐) in your app</li>
                        <li>2. <strong>Copy the link:</strong> Long-press the quiz link and copy</li>
                        <li>3. <strong>Paste in Safari:</strong> Open Safari and paste the link</li>
                        <li>4. <strong>Refresh:</strong> If needed, refresh the page in Safari</li>
                    </ol>
                </div>
                
                <div className="flex gap-3">
                    <Button 
                        onClick={() => window.location.reload()} 
                        variant="default"
                        className="px-6"
                    >
                        Try Refresh
                    </Button>
                    <Button 
                        onClick={() => window.history.back()} 
                        variant="outline"
                    >
                        Go Back
                    </Button>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    If the problem persists, please use Safari or Chrome instead of in-app browsers.
                </div>
            </div>
        </div>
    );
}