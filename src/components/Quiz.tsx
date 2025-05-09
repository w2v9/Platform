'use client'
import Image from "next/image";
import { Quiz, Question, Option } from "@/data/quiz";
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Progress } from "@/components/ui/progress"
import { Clock, FlagIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { useMediaQuery } from "./hooks/useMediaQuary";

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

const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface FormQuestionData {
    index: number;
    answerIds: string[]; // Changed from answerId to answerIds array
    markedForReview: boolean;
}

type FormData = FormQuestionData[]

export default function QuizUI({ quizData }: { quizData: Quiz }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [formData, setFormData] = useState<FormData>(() => {
        // Initialize form data for all questions
        return quizData.questions.map((_, index) => ({
            index,
            answerIds: [], // Initialize as empty array
            markedForReview: false
        }));
    });

    const [timeRemaining, setTimeRemaining] = useState<number>(quizData.timeLimit * 60 || 1800);
    const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);

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

    // Handle timer expiration
    const handleTimerExpired = useCallback(() => {
        // Auto-submit quiz or show prompt
        alert("Time's up! Your quiz will be submitted automatically.");
        // Here you would add code to submit the quiz
    }, []);

    // Get current question data
    const currentFormData = formData[currentQuestionIndex];
    const currentQuestion = quizData.questions[currentQuestionIndex];

    // Determine if current question is multiple-choice
    const isMultipleChoice = currentQuestion.questionType === 'multiple-choice';

    // Handle single choice answer selection
    const handleSingleChoiceToggle = (optionId: string) => {
        setFormData(prev => prev.map(item => {
            if (item.index === currentQuestionIndex) {
                return {
                    ...item,
                    answerIds: optionId === item.answerIds[0] ? [] : [optionId]
                };
            }
            return item;
        }));
    };

    // Handle multiple choice answer selection
    const handleMultipleChoiceToggle = (optionId: string) => {
        setFormData(prev => prev.map(item => {
            if (item.index === currentQuestionIndex) {
                const isSelected = item.answerIds.includes(optionId);
                return {
                    ...item,
                    // Toggle the option - add if not present, remove if present
                    answerIds: isSelected
                        ? item.answerIds.filter(id => id !== optionId)
                        : [...item.answerIds, optionId]
                };
            }
            return item;
        }));
    };

    // Handle mark for review toggle
    const handleMarkForReview = () => {
        setFormData(prev => prev.map(item =>
            item.index === currentQuestionIndex
                ? { ...item, markedForReview: !item.markedForReview }
                : item
        ));
    };

    // Set height to viewport height on component mount
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="flex flex-col h-screen fixed inset-0 overflow-hidden">
            <div id="header" className="flex-shrink-0 p-4 bg-white shadow-sm">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center justify-start">
                        <Image src={'/images/logo.png'} alt={'logo'} width={50} height={50} className={'mr-2'} />
                        <h1 className="md:text-2xl lg:text-2xl font-bold">{quizData.title}</h1>
                    </div>

                    <div className="flex flex-row items-center justify-end gap-4">
                        <div>
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
                        </div>
                        <div className="flex flex-col items-center justify-end gap-1">
                            <div className="text-red-400 flex flex-row items-center gap-2">
                                <Clock size={16} />
                                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                            </div>
                            <p>Q: {currentQuestionIndex + 1} of {quizData.questions.length}</p>
                        </div>
                    </div>
                </div>
                <Progress
                    value={(timeRemaining / (quizData.timeLimit * 60)) * 100}
                    className={`h-2 mt-2 transition-all ${timeRemaining < 60 ? "bg-red-600" :
                        timeRemaining < 300 ? "bg-orange-500" :
                            "bg-blue-500"
                        }`}
                />            </div>

            <div id="Question" className="flex-grow overflow-hidden">
                <ResizablePanelGroup
                    direction={isDesktop ? "horizontal" : "vertical"}
                    className="h-full rounded-lg border"
                >
                    <ResizablePanel defaultSize={50}>
                        <div className="flex h-full items-center justify-center p-6">
                            <ScrollArea className="h-full w-full">
                                <Badge variant="outline">{currentQuestion.questionType}</Badge>
                                <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
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
                            {isMultipleChoice ? (
                                // Multiple Choice Question UI with similar styling to single choice
                                <div className="space-y-4">
                                    {currentQuestion.options.map((option: Option) => (
                                        <div
                                            key={option.id}
                                            className={`p-3 border rounded-md cursor-pointer transition-colors ${currentFormData.answerIds.includes(option.id)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-white hover:bg-gray-50"
                                                }`}
                                            onClick={() => handleMultipleChoiceToggle(option.id)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-4 h-4 rounded-sm border ${currentFormData.answerIds.includes(option.id)
                                                    ? "border-primary-foreground bg-primary-foreground"
                                                    : "border-gray-300"
                                                    }`}>
                                                    {currentFormData.answerIds.includes(option.id) && (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="w-3 h-3 mx-auto my-[2px] text-blue-500"
                                                        >
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </div>
                                                <span>{option.option}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Single Choice Question UI with toggles - keeping your original code
                                <div className="space-y-4">
                                    {currentQuestion.options.map((option: Option) => (
                                        <div
                                            key={option.id}
                                            className={`p-3 border rounded-md cursor-pointer transition-colors ${currentFormData.answerIds[0] === option.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-white hover:bg-gray-50"
                                                }`}
                                            onClick={() => handleSingleChoiceToggle(option.id)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-4 h-4 rounded-full border ${currentFormData.answerIds[0] === option.id
                                                    ? "border-primary-foreground bg-primary-foreground"
                                                    : "border-gray-300"
                                                    }`}>
                                                    {currentFormData.answerIds[0] === option.id &&
                                                        <div className="w-2 h-2 mx-auto my-[3px] bg-primary rounded-full" />
                                                    }
                                                </div>
                                                <span>{option.option}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            <div id="footer" className="flex-shrink-0 p-4 bg-white shadow-sm border-t">
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        Previous
                    </Button>
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="outline">Questions</Button>
                        </DrawerTrigger>
                        <DrawerContent className="w-full items-center justify-center">
                            <DrawerHeader>
                                <DrawerTitle>All Questions</DrawerTitle>
                                <DrawerDescription>
                                    Here you can see all the questions in the quiz. Click on a question to jump to it.
                                </DrawerDescription>
                                <div className="grid grid-cols-5 gap-2 mt-4 w-full max-w-md mx-auto">
                                    {formData.map((question, index) => (
                                        <QustionCard
                                            key={index}
                                            index={index}
                                            currentIndex={currentQuestionIndex}
                                            setCurentIndex={setCurrentQuestionIndex}
                                            markedForReview={question.markedForReview}
                                            answerSelected={question.answerIds.length > 0}
                                        />
                                    ))}
                                </div>
                            </DrawerHeader>
                            <DrawerFooter className="flex flex-row justify-end space-x-2">
                                <DrawerClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DrawerClose>
                                <Button type="submit">Submit</Button>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                    <Button
                        disabled={currentQuestionIndex === quizData.questions.length - 1}
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}