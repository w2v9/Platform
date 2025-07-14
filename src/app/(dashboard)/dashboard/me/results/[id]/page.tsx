"use client";

import { getReportById } from "@/lib/utils/db_reports";
import { getQuizById } from "@/lib/db_quiz";
import { useEffect, useState } from "react";
import { use } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    BarChart3,
    Award,
    ChevronRight,
    ChevronDown,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const reportId = unwrappedParams.id;
    const [reportData, setReportData] = useState<any>(null);
    const [quizData, setQuizData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Prevent right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Prevent keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+U for source)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) { // ctrl for windows, meta for mac
                switch (e.key) {
                    case 'c': // Copy
                    case 'x': // Cut
                    case 'u': // View Source
                    case 's': // Save
                        e.preventDefault();
                        break;
                }
            }
        };
        
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup: remove event listeners when the component unmounts
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    useEffect(() => {
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const report = await getReportById(reportId);

                if (report) {
                    setReportData(report);
                    try {
                        const quiz = await getQuizById(report.quizId);
                        if (quiz) {
                            setQuizData(quiz);
                            // Set page title after fetching quiz data
                            document.title = `Quiz Report for ${quiz.title} - AzoozGAT Platform`;
                        } else {
                            setError("Quiz not found");
                        }
                    } catch (err) {
                        console.error(err);
                        setError("Failed to fetch quiz");
                    }
                } else {
                    setError("Report not found");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch report");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    const isOptionSelected = (questionId: string, optionSetId: string, optionId: string) => {
        if (!reportData || !reportData.selectedOptions) return false;

        const selectedOption = reportData.selectedOptions.find(
            (so: any) => so.questionId === questionId && so.optionSetId === optionSetId
        );

        return selectedOption && selectedOption.selectedOptionId.includes(optionId);
    };

    const isCorrectOption = (question: any, optionSetId: string, optionId: string) => {
        if (!question || !question.optionSets) return false;

        const optionSet = question.optionSets.find((os: any) => os.id === optionSetId);
        return optionSet && optionSet.answer.includes(optionId);
    };

    // Get the option set used for a question in the quiz
    const getQuestionOptionSet = (questionId: string, optionSetId: string) => {
        if (!quizData || !quizData.questions) return null;

        const question = quizData.questions.find((q: any) => q.id === questionId);
        if (!question) return null;

        return question.optionSets.find((os: any) => os.id === optionSetId) || null;
    };

    // Format time string from minutes to "X hr Y min"
    const formatTime = (minutes: number) => {
        if (minutes < 1) return "Less than a minute";
        if (minutes < 60) return `${Math.floor(minutes)} min`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.floor(minutes % 60);
        return `${hours} hr ${remainingMinutes > 0 ? `${remainingMinutes} min` : ''}`;
    };

    if (isLoading) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading detailed results view...</p>
                    </div>
                </div>
            </SidebarInset>
        );
    }

    if (error) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-destructive">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{error}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" onClick={() => window.history.back()}>
                                Go Back
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </SidebarInset>
        );
    }

    if (!reportData || !quizData) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>No Data Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>The report or quiz data could not be found.</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" onClick={() => window.history.back()}>
                                Go Back
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </SidebarInset>
        );
    }
    return (
        <SidebarInset className="no-copy">
            <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Results</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="container max-w-5xl mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-4 sm:space-y-8 no-copy">
                {/* Report Summary Card */}
                <Card className="no-copy">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl">{reportData.quizTitle}</CardTitle>
                                <CardDescription className="text-sm">
                                    Completed on {new Date(reportData.dateTaken).toLocaleDateString()} by {reportData.userName}
                                </CardDescription>
                            </div>
                            <Badge
                                variant={reportData.percentageScore >= 70 ? "default" : "destructive"}
                                className="text-base sm:text-lg h-7 sm:h-8 px-2 sm:px-3"
                            >
                                Score: {reportData.percentageScore.toFixed(0)}%
                            </Badge>
                        </div>                </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                            <div className="flex flex-col items-center justify-center bg-muted p-3 sm:p-4 rounded-lg">
                                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                                <div className="text-center">
                                    <p className="text-muted-foreground text-xs sm:text-sm">Score</p>
                                    <p className="text-base sm:text-xl font-bold">
                                        {reportData.score} / {reportData.maxScore}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-muted p-3 sm:p-4 rounded-lg">
                                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1 sm:mb-2" />
                                <div className="text-center">
                                    <p className="text-muted-foreground text-xs sm:text-sm">Time Taken</p>
                                    <p className="text-base sm:text-xl font-bold">
                                        {formatTime(reportData.timeTaken)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg">
                                <Award className="h-8 w-8 text-primary mb-2" />
                                <div className="text-center">
                                    <p className="text-muted-foreground text-sm">Performance</p>
                                    <p className="text-xl font-bold">
                                        {reportData.percentageScore >= 90 ? 'Excellent' :
                                            reportData.percentageScore >= 70 ? 'Good' :
                                                reportData.percentageScore >= 50 ? 'Average' : 'Needs Improvement'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between mb-2">
                                <p>Overall Progress</p>
                                <p>{reportData.percentageScore.toFixed(0)}%</p>
                            </div>
                            <Progress value={reportData.percentageScore} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Question Review Section */}
                <div className="space-y-4 no-copy">
                    <h2 className="text-xl font-bold">Question Review</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {reportData.selectedOptions?.map((selectedOption: any, index: number) => {
                            const question = quizData.questions.find((q: any) => q.id === selectedOption.questionId);
                            const optionSet = getQuestionOptionSet(selectedOption.questionId, selectedOption.optionSetId);

                            if (!question || !optionSet) return null;

                            const isCorrect = selectedOption.selectedOptionId.length === optionSet.answer.length &&
                                selectedOption.selectedOptionId.every((id: string) => optionSet.answer.includes(id)) &&
                                optionSet.answer.every((id: string) => selectedOption.selectedOptionId.includes(id));

                            return (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="hover:bg-accent hover:no-underline px-4 rounded-md">
                                        <div className="flex items-center gap-3 text-left">
                                            {isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <span>Question {index + 1}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="border rounded-md p-4 mt-2">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-medium">{question.question}</h3>
                                                {question.explanation && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        {question.explanation}
                                                    </p>
                                                )}
                                            </div>

                                            <Separator />

                                            <div className="space-y-2">
                                                <p className="font-medium">Options:</p>
                                                {optionSet.options.map((option: any) => {
                                                    const isSelected = isOptionSelected(question.id, optionSet.id, option.id);
                                                    const isCorrectAns = isCorrectOption(question, optionSet.id, option.id);

                                                    let bgColor = "bg-background";
                                                    if (isSelected && isCorrectAns) bgColor = "bg-green-100";
                                                    else if (isSelected && !isCorrectAns) bgColor = "bg-red-100";
                                                    else if (isCorrectAns) bgColor = "bg-green-50";

                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className={`p-3 border rounded-md flex items-start ${bgColor}`}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    {isSelected && isCorrectAns && (
                                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                                    )}
                                                                    {isSelected && !isCorrectAns && (
                                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                                    )}
                                                                    {!isSelected && isCorrectAns && (
                                                                        <AlertCircle className="h-5 w-5 text-green-600" />
                                                                    )}
                                                                    <span className={`
                                  ${isSelected && isCorrectAns ? 'font-medium text-green-800' : ''}
                                  ${isSelected && !isCorrectAns ? 'font-medium text-red-800' : ''}
                                  ${!isSelected && isCorrectAns ? 'font-medium text-green-800' : ''}
                                `}>
                                                                        {option.option}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Feedback section 
                                        <div className="mt-4 p-4 bg-muted rounded-md">
                                            <p className="font-medium flex items-center gap-2">
                                                {isCorrect ? (
                                                    <>
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        <span>Correct Answer</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                        <span>Incorrect Answer</span>
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-sm mt-2">
                                                {isCorrect
                                                    ? "Well done! You selected the correct answer."
                                                    : "You selected the wrong answer. The correct answer is highlighted in green."}
                                            </p>
                                        </div>
                                                */}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-8">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Back to Results
                    </Button>
                    <Button onClick={() => window.location.href = `/quiz/${reportData.quizId}`}>
                        Try Again
                    </Button>
                </div>
            </div>
        </SidebarInset>
    );
}