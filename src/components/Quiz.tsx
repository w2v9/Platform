'use client'
import Image from "next/image";
import { Quiz, Option, OptionSet, Question } from "@/data/quiz";
import { Button } from "@/components/ui/button"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Progress } from "@/components/ui/progress"
import { Clock, FlagIcon, MoveLeft, MoveRight, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { useMediaQuery } from "./hooks/useMediaQuary";
import { useAuth } from "@/lib/context/authContext";
import { createReport, QuizReport } from "@/lib/utils/db_reports";
import { toast } from "sonner";
import { recordLog } from "@/lib/db_logs";
import { v4 } from "uuid";
import { useRouter } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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
            className={`w-10 h-10 flex items-center justify-center rounded-full ${markedForReview ? "ring-2 ring-yellow-400" : ""} ${answerSelected ? "bg-primary text-white" : ""}`}
            disabled={index === currentIndex}
            onClick={() => setCurentIndex(index)}
        >
            {index + 1}
            {markedForReview && <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></span>}
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
            className="flex flex-row items-center justify-between w-full px-4 py-6 rounded-md"
            onClick={() => setCurentIndex(index)}
            disabled={isHardMode}
            asChild>
            <div>
                <div className="flex flex-row items-center justify-start gap-2 p-2 rounded-md ">
                    <FlagIcon size={16} className={markedForReview ? "text-red-400" : ""} />
                    <p>Question No: {index + 1}</p>
                    <p></p>
                </div>
                <div>
                    <p>{answers && answers.length > 0 && <span className="text-gray-400">Answered</span>}
                        {!answers || answers.length === 0 && <span className="text-red-400">Not answered</span>}
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

    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (timeRemaining <= 0) {
            setIsTimerExpired(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const currentFormData = formData[currentQuestionIndex];
    const currentQuestion = quizData.questions[currentQuestionIndex];

    const selectedSetIndex = currentQuestion?.selectedSetIndex !== undefined
        ? currentQuestion.selectedSetIndex
        : currentQuestion?.activeSetIndex || 0;

    const currentOptionSet = currentQuestion?.optionSets[selectedSetIndex];

    const isMultipleChoice = currentOptionSet?.answer.length > 1;

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
    }, []);

    const renderOptions = () => {
        if (!currentOptionSet) return null;

        return currentOptionSet.options.map((option: Option) => (
            <div
                key={option.id}
                className={`my-4 p-3 border rounded-md cursor-pointer transition-colors ${currentFormData.answers.includes(option.id || "")
                    ? "bg-primary text-primary-foreground"
                    : "bg-white hover:bg-gray-50"
                    }`}
                onClick={() => handleOptionToggle(option.id || "")}
            >
                <div className="flex items-center space-x-3">
                    {isMultipleChoice ? (
                        <Checkbox
                            checked={currentFormData.answers.includes(option.id || "")}
                            onCheckedChange={() => handleOptionToggle(option.id || "")}
                            className="h-5 w-5"
                        />
                    ) : (
                        <div className={`w-4 h-4 rounded-full border ${currentFormData.answers.includes(option.id || "")
                            ? "border-primary-foreground bg-primary-foreground"
                            : "border-gray-300"
                            }`}>
                            {currentFormData.answers.includes(option.id || "") &&
                                <div className="w-2 h-2 mx-auto my-[3px] bg-primary rounded-full" />
                            }
                        </div>
                    )}
                    <span>{option.option}</span>
                </div>
            </div>
        ));
    };

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
                        <ResizablePanelGroup
                            direction={isDesktop ? "horizontal" : "vertical"}
                            className="h-full rounded-lg border"
                        >
                            <ResizablePanel defaultSize={40}>
                                <div className="flex h-full items-center justify-center p-6">
                                    <ScrollArea className="h-full w-full">
                                        <h2 className="font-bold">Explanation:</h2>
                                        <p className="text-gray-700">{currentQuestion.explanation}</p>
                                        {currentQuestion.questionImage && (
                                            <div className="mt-4">
                                                <Image
                                                    src={currentQuestion.questionImage}
                                                    alt="Question image"
                                                    width={400}
                                                    height={300}
                                                    className="max-w-full rounded-md"
                                                />
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50}>
                                <div className="h-full overflow-auto p-4">
                                    <ResizablePanelGroup direction="vertical" className="h-full">
                                        <ResizablePanel defaultSize={15}>
                                            <div className="py-4">
                                                <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
                                            </div>
                                        </ResizablePanel>
                                        <ResizableHandle withHandle />

                                        <ResizablePanel defaultSize={35}>
                                            <div className="py-4">
                                                {renderOptions()}

                                                {isMultipleChoice && (
                                                    <Alert className="mt-4 bg-blue-50">
                                                        <Check className="h-4 w-4" />
                                                        <AlertTitle>Multiple answers required</AlertTitle>
                                                        <AlertDescription>
                                                            This question requires selecting multiple correct answers.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                )
            }
            {
                currentQuestionIndex === quizData.questions.length && (
                    <ScrollArea className="h-full w-full p-4 overflow-auto">
                        <div>
                            <h2 className="text-xl font-bold">All Questions</h2>
                            <p>Click on a question to jump to it.</p>
                        </div>
                        <div id="all-questions" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-4 overflow-auto">
                            {formData.map((question, index) => (
                                <QustionCard2
                                    key={index}
                                    index={index}
                                    setCurentIndex={setCurrentQuestionIndex}
                                    markedForReview={question.markedForReview}
                                    answers={question.answers}
                                    isHardMode={quizData.quizType === "no-review" ? true : false}
                                />
                            ))}
                        </div>
                        <div className="flex flex-row items-center justify-between mt-4">
                            <Button variant="outline" onClick={() => setCurrentQuestionIndex(0)}>Start Over</Button>
                            <Button variant="default" onClick={handleSubmit} disabled={isTimerExpired}>Submit Quiz</Button>
                        </div>
                    </ScrollArea>
                )
            }
            <div id="footer" className="flex-shrink-0 p-4 bg-white shadow-sm border-t">
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0 || quizData.quizType === "no-review"}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        <MoveLeft size={16} className="mr-2" />
                        Previous
                    </Button>
                    <Button
                        disabled={currentQuestionIndex === quizData.questions.length}
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    >
                        Next
                        <MoveRight size={16} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}