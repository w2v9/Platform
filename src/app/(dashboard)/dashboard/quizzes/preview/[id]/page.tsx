'use client';
import { getQuizById } from "@/lib/db_quiz";
import { Loader, Check } from "lucide-react";
import Image from "next/image";
import { Quiz, Option } from "@/data/quiz";
import { Button } from "@/components/ui/button"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Progress } from "@/components/ui/progress"
import { Clock, FlagIcon, MoveLeft, MoveRight } from "lucide-react";
import { useState, useEffect, useCallback, use } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { useMediaQuery } from "@/components/hooks/useMediaQuary";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function QustionCard2({ index, setCurentIndex, markedForReview, answers, isHardMode }: {
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
                        {!answers || answers.length === 0 && <span className="text-gray-400">Not answered</span>}</p>
                </div>
            </div>
        </Button>
    )
}

interface FormQuestionData {
    index: number;
    answers: string[];
    markedForReview: boolean;
}

type FormData = FormQuestionData[]

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const quizId = unwrappedParams.id;
    const [quizData, setQuizData] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [formData, setFormData] = useState<FormData>([]);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const quiz = await getQuizById(quizId);
                if (quiz) {
                    setQuizData(quiz);
                    setFormData(quiz.questions.map((_, index) => ({
                        index,
                        answers: [],
                        markedForReview: false,
                    })));
                    setTimeRemaining((quiz.timeLimit || 30) * 60);
                } else {
                    toast.error("Quiz not found");
                }
            } catch (error) {
                toast.error("Error fetching quiz");
                console.error(error);
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

    useEffect(() => {
        if (!quizData) return;

        if (timeRemaining <= 0) {
            setIsTimerExpired(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, quizData]);

    useEffect(() => {
        if (timeRemaining <= 0 && !isTimerExpired && quizData) {
            setIsTimerExpired(true);
            toast.error("Time is up! Submitting your quiz...");
        }
    }, [timeRemaining, isTimerExpired, quizData]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleOptionToggle = useCallback((optionId: string) => {
        if (!quizData) return;

        const currentQuestion = quizData.questions[currentQuestionIndex];
        const selectedSetIndex = currentQuestion?.selectedSetIndex !== undefined
            ? currentQuestion.selectedSetIndex
            : currentQuestion?.activeSetIndex || 0;

        const currentOptionSet = currentQuestion?.optionSets[selectedSetIndex];
        const isMultipleChoice = currentOptionSet?.answer.length > 1;

        if (isMultipleChoice) {
            setFormData(prev => prev.map(item => {
                if (item.index === currentQuestionIndex) {
                    const current = [...item.answers];
                    const optionIndex = current.indexOf(optionId);

                    if (optionIndex === -1) {
                        current.push(optionId);
                    } else {
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
    }, [currentQuestionIndex, quizData]);

    const handleMarkForReview = useCallback(() => {
        setFormData(prev => prev.map(item =>
            item.index === currentQuestionIndex
                ? { ...item, markedForReview: !item.markedForReview }
                : item
        ));
    }, [currentQuestionIndex]);

    if (!quizData) {
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

    const currentFormData = formData[currentQuestionIndex] || { index: currentQuestionIndex, answers: [], markedForReview: false };
    const currentQuestion = quizData.questions[currentQuestionIndex];

    const selectedSetIndex = currentQuestion?.selectedSetIndex !== undefined
        ? currentQuestion.selectedSetIndex
        : currentQuestion?.activeSetIndex || 0;

    const currentOptionSet = currentQuestion?.optionSets && currentQuestion.optionSets[selectedSetIndex];

    const isMultipleChoice = currentOptionSet?.answer && currentOptionSet.answer.length > 1;

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
        <div
            className="flex flex-col gap-4 h-full items-center justify-center"
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
        >
            <div id="header" className="flex-shrink-0 p-4 bg-white shadow-sm w-full">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center justify-start">
                        <Image src={'/images/logo.png'} alt={'logo'} width={50} height={50} className={'mr-2'} />
                        <h1 className="md:text-2xl lg:text-2xl font-bold">{quizData.title}</h1>
                    </div>

                    <div className="flex flex-row items-center justify-end gap-4">
                        <div>
                            {currentQuestionIndex < quizData.questions.length && currentQuestion && (
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
                            )}
                        </div>
                        <div className="flex flex-col items-center justify-end gap-1">
                            <div className="text-red-400 flex flex-row items-center gap-2">
                                <Clock size={16} />
                                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                            </div>
                            {currentQuestionIndex < quizData.questions.length && (
                                <p>Q: {currentQuestionIndex + 1} of {quizData.questions.length}</p>
                            )}
                        </div>
                    </div>
                </div>
                <Progress
                    value={quizData.timeLimit > 0 ? (timeRemaining / (quizData.timeLimit * 60)) * 100 : 0}
                    className={`h-2 mt-2 transition-all ${timeRemaining < 60 ? "bg-red-600" :
                        timeRemaining < 300 ? "bg-orange-500" :
                            "bg-blue-500"
                        }`}
                />
            </div>

            {currentQuestionIndex < quizData.questions.length && currentQuestion && (
                <div id="Question" className="flex-grow overflow-hidden w-full">
                    <ResizablePanelGroup
                        direction={isDesktop ? "horizontal" : "vertical"}
                        className="h-full rounded-lg border"
                    >
                        <ResizablePanel defaultSize={50}>
                            <div className="flex h-full items-center justify-center p-6">
                                <ScrollArea className="h-full w-full">
                                    <h2 className="font-bold">Question:</h2>
                                    <p className="text-gray-700">{currentQuestion.question}</p>
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
                                            <h2 className="text-xl font-bold">Options</h2>
                                        </div>
                                    </ResizablePanel>
                                    <ResizableHandle withHandle />

                                    <ResizablePanel defaultSize={85}>
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
            )}

            {currentQuestionIndex === quizData.questions.length && (
                <div className="w-full p-4 overflow-auto">
                    <div>
                        <h2 className="text-xl font-bold">Quiz Summary</h2>
                        <p>Review your answers before submitting.</p>
                    </div>
                    <div id="all-questions" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-4 overflow-auto">
                        {formData.map((question, index) => (
                            <QustionCard2
                                key={index}
                                index={index}
                                setCurentIndex={setCurrentQuestionIndex}
                                markedForReview={question.markedForReview}
                                answers={question.answers}
                                isHardMode={quizData.quizType === "no-review"}
                            />
                        ))}
                    </div>
                    <div className="flex flex-row items-center justify-between mt-4">
                        <Button variant="outline" onClick={() => setCurrentQuestionIndex(0)}>Review Questions</Button>
                        <Button variant="default" disabled={true}>Submit Quiz</Button>
                    </div>
                </div>
            )}

            <div id="footer" className="flex-shrink-0 p-4 bg-white shadow-sm border-t w-full">
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