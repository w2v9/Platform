'use client';
import React, { useEffect, useState, use } from "react";
import { getQuizById } from "@/lib/db_quiz";
import { Quiz } from "@/data/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Users, Trophy, X } from "lucide-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export default function QuizStartPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const quizId = unwrappedParams.id;
    const [quizData, setQuizData] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 768px)");

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

                setQuizData(quiz);
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
    }, [quizId]);

    const handleStartQuiz = () => {
        router.push(`/quiz/${quizId}`);
    };

    const handleClose = () => {
        router.push('/dashboard/me/quizzes');
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-500" />
                    <div className="text-lg">
                        Loading quiz details...
                    </div>
                </div>
            </div>
        );
    }

    if (error || !quizData) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="text-red-500 text-2xl mb-4">
                        Error
                    </div>
                    <div className="text-lg">
                        {error || "Quiz not found"}
                    </div>
                    <Button onClick={handleClose} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            {/* Mobile Close Button */}
            {isMobile && (
                <div className="fixed top-4 right-4 z-50">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleClose}
                        className="bg-white/80 backdrop-blur-sm"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="max-w-4xl mx-auto pt-8">
                <Card className="shadow-lg">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <Image
                                src="/images/logo.png"
                                alt="Logo"
                                width={60}
                                height={60}
                                className="rounded-full"
                            />
                        </div>
                        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800">
                            {quizData.title}
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600">
                            Get ready to test your knowledge!
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Quiz Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                                <div className="text-sm font-medium text-gray-600">Duration</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {quizData.timeLimit || 30} min
                                </div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <FileText className="h-6 w-6 mx-auto mb-2 text-green-600" />
                                <div className="text-sm font-medium text-gray-600">Questions</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {quizData.questions?.length || 0}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                                <div className="text-sm font-medium text-gray-600">Type</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {quizData.quizType === "no-review" ? "No Review" : "Review Allowed"}
                                </div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <Trophy className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                                <div className="text-sm font-medium text-gray-600">Status</div>
                                <div className="text-lg font-bold text-gray-800">
                                    {quizData.published ? "Published" : "Draft"}
                                </div>
                            </div>
                        </div>

                        {/* Quiz Description */}
                        {quizData.description && (
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    About This Quiz
                                </h3>
                                <ScrollArea className="h-32 md:h-auto">
                                    <div className="text-gray-700 leading-relaxed">
                                        {quizData.description}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {/* Quiz Features */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Quiz Features
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {quizData.randomizeQuestions && (
                                    <Badge variant="secondary">Randomized Questions</Badge>
                                )}
                                {quizData.randomizeOptions && (
                                    <Badge variant="secondary">Randomized Options</Badge>
                                )}
                                {quizData.quizType !== "no-review" && (
                                    <Badge variant="secondary">Review Allowed</Badge>
                                )}
                                <Badge variant="outline">Timer</Badge>
                                <Badge variant="outline">Progress Tracking</Badge>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                Instructions
                            </h3>
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Read each question carefully before answering
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    You can mark questions for review if needed
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    The timer will automatically submit when time runs out
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Make sure you have a stable internet connection
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStartQuiz}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                Start Quiz
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
