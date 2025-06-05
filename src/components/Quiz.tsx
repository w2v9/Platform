'use client'
import Image from "next/image";
import { Quiz, Option, OptionSet, Question } from "@/data/quiz";
import { Button } from "@/components/ui/button"
import '../app/quiz-animations.css'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Progress } from "@/components/ui/progress"
import { Clock, FlagIcon, MoveLeft, MoveRight, Check, ListTodo } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useAuth } from "@/lib/context/authContext";
import { createReport, QuizReport } from "@/lib/utils/db_reports";
import { toast } from "sonner";
import { recordLog } from "@/lib/db_logs";
import { v4 } from "uuid";
import { useRouter } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { InfoIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

export function QustionCard({ index, currentIndex, setCurentIndex, markedForReview, answerSelected }: {
    index: number,
    currentIndex: number,
    setCurentIndex: (index: number) => void,
    markedForReview?: boolean,
    answerSelected?: boolean
}) {
    return (
        <Button
            variant={index === currentIndex ? "default" : `outline`}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 ${markedForReview ? "ring-2 ring-yellow-400" : ""} ${answerSelected ? "bg-primary text-white" : ""}`}
            disabled={index === currentIndex}
            onClick={() => setCurentIndex(index)}
        >
            {index + 1}
            {markedForReview && <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></span>}
        </Button>
    );
}
export function QustionCard2({ index, setCurentIndex, markedForReview, answers, isHardMode }: {
    index: number,
    setCurentIndex: (index: number) => void,
    markedForReview?: boolean,
    answers?: string[] | null
    isHardMode?: boolean
}) {
    return (
        <Button
            variant={"outline"}
            className="flex flex-row items-center justify-between w-full px-2 sm:px-4 py-3 sm:py-6 rounded-md text-xs sm:text-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
            onClick={() => setCurentIndex(index)}
            disabled={isHardMode}
            asChild>
            <div>
                <div className="flex flex-row items-center justify-start gap-1 sm:gap-2 p-1 sm:p-2 rounded-md ">
                    <FlagIcon size={12} className={markedForReview ? "text-red-400" : ""} />
                    <p className="truncate">Q{index + 1}</p>
                </div>
                <div>
                    <p>{answers && answers.length > 0 && <span className="text-green-600 text-xs">Answered</span>}
                        {!answers || answers.length === 0 && <span className="text-red-400 text-xs">Not answered</span>}
                    </p>
                </div>
            </div>
        </Button>
    )
}

const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface FormQuestionData {
    index: number;
    answers: string[];
    markedForReview: boolean;
}

type FormData = FormQuestionData[]

export default function QuizUI({ quizData }: { quizData: Quiz }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [formData, setFormData] = useState<FormData>(() => {
        return quizData.questions.map((question, index) => ({
            index,
            answers: [],
            markedForReview: false,
        }));
    });
    const { user } = useAuth();

    const [timeRemaining, setTimeRemaining] = useState<number>(quizData.timeLimit * 60 || 1800);
    const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);
    const router = useRouter();

    const isDesktop = useMediaQuery("(min-width: 768px)"); const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | 'none'>('none');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (timeRemaining <= 0) {
            setIsTimerExpired(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000); return () => clearInterval(timer);
    }, [timeRemaining]);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex >= quizData.questions.length) return;

        setAnimationDirection('next');
        setIsAnimating(true);

        // Delay the actual navigation to allow animation to play
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsAnimating(false);
        }, 400); // Match this with the animation duration
    }, [currentQuestionIndex, quizData.questions.length]);

    const handlePreviousQuestion = useCallback(() => {
        if (currentQuestionIndex === 0 || quizData.quizType === "no-review") return;

        setAnimationDirection('prev');
        setIsAnimating(true);

        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev - 1);
            setIsAnimating(false);
        }, 400);
    }, [currentQuestionIndex, quizData.quizType]);

    const handleGoToReview = () => {
        setAnimationDirection('next');
        setIsAnimating(true);

        setTimeout(() => {
            setCurrentQuestionIndex(quizData.questions.length);
            setIsAnimating(false);
        }, 400);
    };

    // Function to handle direct navigation to a specific question from review page
    const handleGoToQuestion = (index: number) => {
        setAnimationDirection('prev');
        setIsAnimating(true);

        setTimeout(() => {
            setCurrentQuestionIndex(index);
            setIsAnimating(false);
        }, 400);
    };

    const handleOptionToggle = (optionId: string) => {
        if (isMultipleChoice) {
            // For multiple choice questions, toggle selected options
            setFormData(prev => prev.map(item => {
                if (item.index === currentQuestionIndex) {
                    const current = [...item.answers];
                    const optionIndex = current.indexOf(optionId);

                    if (optionIndex === -1) {
                        // Add option if not selected
                        current.push(optionId);
                    } else {
                        // Remove option if already selected
                        current.splice(optionIndex, 1);
                    }

                    return {
                        ...item,
                        answers: current
                    };
                }
                return item;
            }));
        } else {
            setFormData(prev => prev.map(item => {
                if (item.index === currentQuestionIndex) {
                    return {
                        ...item,
                        answers: [optionId]
                    };
                }
                return item;
            }));
        }
    };

    const handleMarkForReview = () => {
        setFormData(prev => prev.map(item =>
            item.index === currentQuestionIndex
                ? { ...item, markedForReview: !item.markedForReview }
                : item
        ));
    };

    const handleSubmit = useCallback(async () => {
        const answeredQuestions = formData.filter(item => item.answers.length > 0);

        const score = answeredQuestions.reduce((acc, item) => {
            const question = quizData.questions[item.index];
            const setIndex = question.selectedSetIndex !== undefined
                ? question.selectedSetIndex
                : question.activeSetIndex || 0;

            const optionSet = question.optionSets[setIndex];
            const correctOptions = optionSet.answer;

            if (correctOptions.length === 1) {
                return acc + (item.answers.length === 1 && correctOptions.includes(item.answers[0]) ? 1 : 0);
            } else {
                const allCorrectSelected = correctOptions.every(id => item.answers.includes(id));
                const noIncorrectSelected = item.answers.every(id => correctOptions.includes(id));
                return acc + (allCorrectSelected && noIncorrectSelected ? 1 : 0);
            }
        }, 0);

        const maxScore = quizData.questions.length;
        const percentageScore = (score / maxScore) * 100;

        const quizReport: QuizReport = {
            id: v4(),
            quizId: quizData.id,
            quizTitle: quizData.title,
            answeredQuestions: quizData.questions.filter((_, index) => formData[index].answers.length > 0),
            selectedOptions: formData.map(item => {
                const question = quizData.questions[item.index];
                const setIndex = question.selectedSetIndex !== undefined
                    ? question.selectedSetIndex
                    : question.activeSetIndex || 0;

                return {
                    questionId: question.id,
                    optionSetId: question.optionSets[setIndex].id,
                    selectedOptionId: item.answers,
                };
            }),
            userName: user?.email || user?.displayName || "",
            timeTaken: ((quizData.timeLimit * 60) - timeRemaining) / 60, // in minutes
            userId: user?.uid || "",
            score,
            maxScore,
            percentageScore,
            dateTaken: new Date().toISOString(),
        };

        try {
            toast.loading("Saving your quiz report...");
            const docref = await createReport(quizReport);
            await recordLog({
                id: v4(),
                userId: user?.uid || "",
                action: "CREATE_REPORT",
                details: JSON.stringify({
                    msg: `User ${user?.displayName} created a quiz report for quiz ${quizData.title}`,
                    quizId: quizData.id,
                    quizTitle: quizData.title,
                    quizReportId: docref.id,
                }),
                timestamp: new Date().toISOString(),
            });
            toast.dismiss();
            toast.success("Quiz report saved successfully!");
            router.push("/dashboard/me/results");
        } catch (error) {
            console.error("Error saving quiz report:", error);
            let errorMessage = "An error occurred while saving the quiz report.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            await recordLog({
                id: v4(),
                userId: user?.uid || "",
                action: "ERROR",
                details: JSON.stringify({
                    msg: errorMessage,
                    quizId: quizData.id,
                    quizTitle: quizData.title,
                }),
                timestamp: new Date().toISOString(),
            });
            toast.error("Error saving quiz report.");
        }

    }, [formData, quizData, user, timeRemaining, router]);

    useEffect(() => {
        if (timeRemaining <= 0 && !isTimerExpired) {
            setIsTimerExpired(true);
            toast.error("Time is up! Submitting your quiz...");
            handleSubmit();
        }
    }, [timeRemaining, isTimerExpired, handleSubmit]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []); useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight' && currentQuestionIndex <= quizData.questions.length) {
                event.preventDefault();
                handleNextQuestion();
            } else if (event.key === 'ArrowLeft' && currentQuestionIndex > 0 && quizData.quizType !== "no-review") {
                event.preventDefault();
                handlePreviousQuestion();
            } else if (event.key === 'Enter' && currentQuestionIndex === quizData.questions.length) {
                event.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQuestionIndex, quizData.questions.length, quizData.quizType, handleNextQuestion, handlePreviousQuestion, handleSubmit]);

    // Update meta data 
    useEffect(() => {
        document.title = `Quiz: ${quizData.title} - AzoozGAT Platform`;
        document.querySelector('meta[name="description"]')?.setAttribute("content", quizData.description || "Take this quiz to test your knowledge.");
    }, [quizData.title, quizData.description]);

    const renderOptions = () => {
        if (!currentOptionSet) return null;

        return currentOptionSet.options.map((option: Option) => (
            <div
                key={option.id}
                className={`my-4 p-3 border rounded-md cursor-pointer transition-all duration-300 ${currentFormData.answers.includes(option.id || "")
                    ? "bg-primary text-primary-foreground scale-[1.01] shadow-md"
                    : "bg-white hover:bg-gray-50 hover:shadow-sm"
                    }`}
                onClick={() => handleOptionToggle(option.id || "")}
            >
                <div className="flex items-center space-x-3">
                    {isMultipleChoice ? (
                        <Checkbox
                            checked={currentFormData.answers.includes(option.id || "")}
                            onCheckedChange={() => handleOptionToggle(option.id || "")}
                            className="h-5 w-5 transition-transform"
                        />
                    ) : (
                        <div className={`w-4 h-4 rounded-full border transition-all duration-300 ${currentFormData.answers.includes(option.id || "")
                            ? "border-primary-foreground bg-primary-foreground"
                            : "border-gray-300"
                            }`}>
                            {currentFormData.answers.includes(option.id || "") &&
                                <div className="w-2 h-2 mx-auto my-[3px] bg-primary rounded-full animate-pulse" />
                            }
                        </div>
                    )}
                    <span>{option.option}</span>
                </div>
            </div>
        ));
    };

    // Get the current question and option set
    const currentQuestion = quizData.questions[currentQuestionIndex] || {};
    const currentFormData = formData[currentQuestionIndex] || { index: currentQuestionIndex, answers: [], markedForReview: false };
    const selectedSetIndex = currentQuestion.selectedSetIndex !== undefined
        ? currentQuestion.selectedSetIndex
        : currentQuestion.activeSetIndex || 0;
    const currentOptionSet = currentQuestion.optionSets && currentQuestion.optionSets[selectedSetIndex];
    const isMultipleChoice = currentOptionSet?.answer && currentOptionSet.answer.length > 1;

    return (
        <div className="flex flex-col h-screen fixed inset-0">
            <div id="header" className="flex-shrink-0 p-4 bg-white shadow-sm">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center justify-start">
                        <Image src={'/images/logo.png'} alt={'logo'} width={50} height={50} className={'mr-2'} />
                        <h1 className="md:text-2xl lg:text-2xl font-bold">{quizData.title}</h1>
                    </div>

                    <div className="flex flex-row items-center justify-end gap-4">
                        <div>
                            {
                                currentQuestionIndex < quizData.questions.length && (
                                    <Toggle
                                        variant={'outline'}
                                        aria-label="Mark for review"
                                        pressed={currentFormData.markedForReview}
                                        onPressedChange={handleMarkForReview}
                                    >
                                        <FlagIcon size={16} className="mr-2" />
                                        <span className="hidden md:block lg:block">
                                            Mark for review
                                        </span>
                                    </Toggle>
                                )
                            }
                        </div>
                        <div className="flex flex-col items-center justify-end gap-1">
                            <div className="text-red-400 flex flex-row items-center gap-2">
                                <Clock size={16} />
                                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                            </div>
                            {
                                currentQuestionIndex < quizData.questions.length && (
                                    <p>Q: {currentQuestionIndex + 1} of {quizData.questions.length}</p>
                                )
                            }
                        </div>
                    </div>
                </div>
                <Progress
                    value={(timeRemaining / (quizData.timeLimit * 60)) * 100}
                    className={`h-2 mt-2 transition-all ${timeRemaining < 60 ? "bg-red-600" :
                        timeRemaining < 300 ? "bg-orange-500" :
                            "bg-blue-500"
                        }`}
                />
            </div>
            {
                currentQuestionIndex < quizData.questions.length && (
                    <div id="Question" className="flex-grow overflow-hidden">
                        <div className={`quiz-page-transition ${isAnimating ? 'pointer-events-none' : ''}`}>
                            <div className={`w-full h-full ${isAnimating ?
                                (animationDirection === 'next' ? 'quiz-animate-next-in' : 'quiz-animate-prev-in') : ''}`}>
                                <ResizablePanelGroup
                                    direction={isDesktop ? "horizontal" : "vertical"}
                                    className="h-full rounded-lg border"
                                >
                                    <ResizablePanel defaultSize={isDesktop ? 40 : 30} minSize={20}>
                                        <div className="flex h-full items-center justify-center p-2 sm:p-4 md:p-6">
                                            <ScrollArea className="h-full w-full">
                                                {isAnimating ? (
                                                    // Skeleton loading for explanation
                                                    <div className="space-y-4">
                                                        <div className="quiz-skeleton quiz-skeleton-title"></div>
                                                        <div className="quiz-skeleton quiz-skeleton-text"></div>
                                                        <div className="quiz-skeleton quiz-skeleton-text"></div>
                                                        <div className="quiz-skeleton quiz-skeleton-text"></div>
                                                        <div className="quiz-skeleton quiz-skeleton-text"></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {isDesktop ? (
                                                            <>
                                                                <h2 className="font-bold text-sm sm:text-base">Explanation:</h2>
                                                                <div className="text-gray-700 text-xs sm:text-sm prose prose-sm max-w-none">
                                                                    <ReactMarkdown
                                                                        rehypePlugins={[rehypeSanitize]}
                                                                        remarkPlugins={[remarkGfm]}
                                                                    >
                                                                        {currentQuestion.explanation || ''}
                                                                    </ReactMarkdown>
                                                                </div>
                                                                {currentQuestion.questionImage && (
                                                                    <div className="mt-2 sm:mt-4">
                                                                        <Image
                                                                            src={currentQuestion.questionImage}
                                                                            alt="Question image"
                                                                            width={400}
                                                                            height={300}
                                                                            className="max-w-full rounded-md"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center justify-center h-full">
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                                                <InfoIcon size={28} className="text-blue-500" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="max-w-md">
                                                                            <DialogHeader>
                                                                                <DialogTitle>Explanation</DialogTitle>
                                                                            </DialogHeader>
                                                                            <div className="text-gray-700 text-xs sm:text-sm prose prose-sm max-w-none">
                                                                                <ReactMarkdown
                                                                                    rehypePlugins={[rehypeSanitize]}
                                                                                    remarkPlugins={[remarkGfm]}
                                                                                >
                                                                                    {currentQuestion.explanation || ''}
                                                                                </ReactMarkdown>
                                                                            </div>
                                                                            {currentQuestion.questionImage && (
                                                                                <div className="mt-2 sm:mt-4">
                                                                                    <Image
                                                                                        src={currentQuestion.questionImage}
                                                                                        alt="Question image"
                                                                                        width={400}
                                                                                        height={300}
                                                                                        className="max-w-full rounded-md"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </ResizablePanel>
                                    <ResizableHandle withHandle />
                                    <ResizablePanel defaultSize={isDesktop ? 60 : 70} minSize={40}>
                                        <div className="h-full overflow-auto p-2 sm:p-4">
                                            <ResizablePanelGroup direction="vertical" className="h-full">
                                                <ResizablePanel defaultSize={15}>
                                                    <div className="py-2 sm:py-4">
                                                        {isAnimating ? (
                                                            // Skeleton loading for question
                                                            <div className="quiz-skeleton quiz-skeleton-title w-3/4"></div>
                                                        ) : (
                                                            <h2 className="text-base sm:text-lg md:text-xl font-bold">{currentQuestion.question}</h2>
                                                        )}
                                                    </div>
                                                </ResizablePanel>
                                                <ResizableHandle withHandle />
                                                <ResizablePanel defaultSize={35}>
                                                    <div className="py-2 sm:py-4">
                                                        {isAnimating ? (
                                                            // Skeleton loading for options
                                                            <div className="space-y-4">
                                                                <div className="quiz-skeleton quiz-skeleton-option"></div>
                                                                <div className="quiz-skeleton quiz-skeleton-option"></div>
                                                                <div className="quiz-skeleton quiz-skeleton-option"></div>
                                                                <div className="quiz-skeleton quiz-skeleton-option"></div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {renderOptions()}
                                                                {isMultipleChoice && (
                                                                    <Alert className="mt-2 sm:mt-4 bg-blue-50 text-xs sm:text-sm">
                                                                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                        <AlertTitle className="text-xs sm:text-sm">Multiple answers required</AlertTitle>
                                                                        <AlertDescription className="text-xs sm:text-sm">
                                                                            This question requires selecting multiple correct answers.
                                                                        </AlertDescription>
                                                                    </Alert>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </ResizablePanel>
                                            </ResizablePanelGroup>
                                        </div>
                                    </ResizablePanel>
                                </ResizablePanelGroup>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                currentQuestionIndex === quizData.questions.length && (
                    <div className={`quiz-page-transition ${isAnimating ? 'pointer-events-none' : ''}`}>
                        <div className={`w-full h-full ${isAnimating ? 'quiz-animate-fade-in' : ''}`}>
                            <ScrollArea className="h-full w-full p-4 overflow-auto">
                                <div>
                                    <h2 className="text-xl font-bold">All Questions</h2>
                                    <p>Click on a question to jump to it.</p>
                                </div>
                                {isAnimating ? (
                                    // Skeleton loading for review page
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                                        {Array(quizData.questions.length).fill(0).map((_, index) => (
                                            <div key={index} className="quiz-skeleton h-16 rounded-md"></div>
                                        ))}
                                    </div>
                                ) : (
                                    <div id="all-questions" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4 overflow-auto">
                                        {formData.map((question, index) => (
                                            <QustionCard2
                                                key={index}
                                                index={index}
                                                setCurentIndex={handleGoToQuestion}
                                                markedForReview={question.markedForReview}
                                                answers={question.answers}
                                                isHardMode={quizData.quizType === "no-review" ? true : false}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-row items-center justify-between mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentQuestionIndex(0)}
                                        className="transition-all duration-300 hover:shadow-md"
                                    >
                                        Start Over
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleSubmit}
                                        disabled={isTimerExpired}
                                        className="transition-all duration-300 hover:shadow-md"
                                    >
                                        Submit Quiz
                                    </Button>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )
            }
            <div id="footer" className="flex-shrink-0 p-4 bg-white shadow-sm border-t">
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0 || quizData.quizType === "no-review"}
                        onClick={handlePreviousQuestion}
                        className="transition-all duration-300 hover:shadow-md transform hover:translate-x-[-2px]"
                    >
                        <MoveLeft size={16} className="mr-2" />
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleGoToReview}
                        className="transition-all duration-300 hover:shadow-md"
                    >
                        <ListTodo size={16} className="mr-2" />
                        Review Questions
                    </Button>

                    <Button
                        disabled={currentQuestionIndex === quizData.questions.length}
                        onClick={handleNextQuestion}
                        className="transition-all duration-300 hover:shadow-md transform hover:translate-x-[2px]"
                    >
                        Next
                        <MoveRight size={16} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}