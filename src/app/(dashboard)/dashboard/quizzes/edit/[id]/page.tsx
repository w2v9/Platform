"use client";

import type { Quiz, Question, Option } from "@/data/quiz";
import { getQuizById, updateQuiz } from "@/lib/db_quiz";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ChevronsUpDown, Loader, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recordLog } from "@/lib/db_logs";
import { useAuth } from "@/lib/context/authContext";

// Define the Option schema
const optionSchema = z.object({
    id: z.string().optional(),
    option: z.string().min(1, { message: "Option text is required" }),
    isCorrect: z.boolean(),
});

// Define the Question schema
const questionSchema = z.object({
    id: z.string().optional(),
    question: z.string().min(1, { message: "Question is required" }),
    explanation: z.string().min(1, { message: "Explanation is required" }),
    questionImage: z.string().optional(),
    questionAudio: z.string().optional(),
    questionVideo: z.string().optional(),
    questionType: z.string().optional().default("single-choice"),
    options: z.array(optionSchema).min(2, { message: "At least 2 options are required" }),
    answer: optionSchema,
});

// Define the Quiz schema
const quizSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    timeLimit: z.number().int().positive({ message: "Time limit must be a positive number" }),
    quizType: z.enum(["normal", "no-review"]).optional(),
    questions: z.array(questionSchema).min(1, { message: "At least one question is required" }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const quizId = unwrappedParams.id;
    const [activeTab, setActiveTab] = useState("general");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [originalQuiz, setOriginalQuiz] = useState<Quiz | null>(null);
    const [openQuestions, setOpenQuestions] = useState<Record<number, boolean>>({});
    const { user } = useAuth();

    const quizForm = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema) as Resolver<QuizFormValues>,
        defaultValues: {
            title: "",
            description: "",
            timeLimit: 30,
            quizType: "normal",
            questions: [
                {
                    question: "",
                    explanation: "",
                    questionImage: "",
                    questionAudio: "",
                    questionVideo: "",
                    questionType: "single-choice",
                    options: [
                        { option: "", isCorrect: false },
                        { option: "", isCorrect: false }
                    ],
                    answer: { option: "", isCorrect: false },
                },
            ],
        },
    });

    const { control, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = quizForm;

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } =
        useFieldArray({
            control,
            name: "questions",
        });

    const toggleQuestion = (index: number) => {
        setOpenQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    function getChangedFields(original: Quiz | null, updated: Quiz): string[] {
        const changedFields: string[] = [];

        if (!original) return changedFields;

        for (const key in updated) {
            if (original[key as keyof Quiz] !== updated[key as keyof Quiz]) {
                changedFields.push(key);
            }
        }

        return changedFields;
    }

    useEffect(() => {
        async function fetchQuiz() {
            setIsLoading(true);

            try {
                const quiz: Quiz | null = await getQuizById(quizId);

                if (!quiz) {
                    setError("Quiz not found. It may have been deleted or you don't have permission to view it.");
                    toast.error("Quiz not found");
                    return;
                }

                const typedQuiz = quiz as Quiz;
                setOriginalQuiz(typedQuiz);

                reset({
                    id: quizId,
                    title: quiz.title,
                    description: quiz.description,
                    timeLimit: quiz.timeLimit,
                    quizType: quiz.quizType || "normal",
                    questions: quiz.questions,
                    createdAt: quiz.createdAt,
                })

                setOpenQuestions({ 0: true });

            } catch (error) {
                console.error("Error fetching quiz:", error);
                setError("Failed to load quiz. Please try again.");
                toast.error("Failed to load quiz");
            } finally {
                setIsLoading(false);
            }
        }

        fetchQuiz();
    }, [quizId, reset]);

    const onSubmit = async (data: QuizFormValues) => {
        const loadingToast = toast.loading("Updating quiz...");

        try {
            const updatedQuiz: Quiz = {
                ...data,
                id: data.id || quizId,
                updatedAt: new Date().toISOString(),
                createdAt: data.createdAt || originalQuiz?.createdAt || new Date().toISOString(),
                quizType: data.quizType || "normal",
                questions: data.questions.map((question) => ({
                    ...question,
                    id: question.id || uuidv4(),
                    options: question.options.map((option) => ({
                        ...option,
                        id: option.id || uuidv4(),
                    })),
                    answer: {
                        ...question.answer,
                        id: question.answer.id || uuidv4(),
                    },
                })),
            };

            await updateQuiz(updatedQuiz);

            if (user?.uid) {
                await recordLog({
                    id: uuidv4(),
                    userId: user.uid,
                    action: "QUIZ_UPDATE",
                    timestamp: new Date().toISOString(),
                    details: JSON.stringify({
                        quizId: updatedQuiz.id,
                        quizTitle: updatedQuiz.title,
                        changedFields: getChangedFields(originalQuiz, updatedQuiz)
                    })
                });
            }

            toast.success("Quiz updated successfully!", {
                id: loadingToast,
            });
            setOriginalQuiz(updatedQuiz);


        } catch (error) {
            console.error("Error updating quiz:", error);
            try {
                const errorMessage = error instanceof Error
                    ? error.message
                    : typeof error === 'string'
                        ? error
                        : 'Unknown error occurred';

                await recordLog({
                    id: uuidv4(),
                    userId: user?.uid || "",
                    action: "QUIZ_UPDATE_ERROR",
                    timestamp: new Date().toISOString(),
                    details: JSON.stringify({
                        quizId: data.id,
                        error: errorMessage,
                    })
                });
            } catch (logError) {
                console.error("Error logging update error:", logError);
            }

            toast.error("Failed to update quiz", {
                id: loadingToast,
            });
        } finally {
            router.push("/dashboard/quizzes");
        }
    };

    const handleDiscard = () => {
        if (originalQuiz) {
            const confirmToast = toast.info("Discard changes?", {
                action: {
                    label: "Discard",
                    onClick: () => {
                        reset({
                            id: originalQuiz.id,
                            title: originalQuiz.title,
                            description: originalQuiz.description,
                            timeLimit: originalQuiz.timeLimit,
                            quizType: originalQuiz.quizType || "normal",
                            questions: originalQuiz.questions,
                            createdAt: originalQuiz.createdAt,
                        });
                        toast.success("Changes discarded");
                    }
                },
                cancel: {
                    label: "Keep editing",
                    onClick: () => {
                        toast.info("Continuing to edit");
                    }
                }
            });
        }
    };

    if (isLoading) {
        return (
            <SidebarInset>
                <div className="h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading quiz...</p>
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
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/admin">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/quizzes">
                                    Quizzes
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Edit</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto p-4">
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => router.push("/dashboard/quizzes")}>
                        Return to Quiz List
                    </Button>
                </div>
            </SidebarInset>
        );
    }

    return (
        <SidebarInset>
            <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard/admin">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard/quizzes">
                                Quizzes
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit Quiz</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Edit Quiz</h1>
                    {isDirty && (
                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                            You have unsaved changes
                        </div>
                    )}
                </div>

                <Form {...quizForm}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-6">
                                <TabsTrigger value="general">General Info</TabsTrigger>
                                <TabsTrigger value="questions">Questions ({questionFields.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quiz Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Title</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter quiz title" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter quiz description"
                                                            className="min-h-[100px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={control}
                                            name="timeLimit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Time Limit (minutes)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Set the time limit in minutes for completing this quiz
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="quizType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quiz Type</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Quiz type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="normal">Normal Quiz</SelectItem>
                                                            <SelectItem value="no-review">No Review Quiz</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        &quot;No Review&quot; prevents users from reviewing their answers during the quiz
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="button"
                                            onClick={() => setActiveTab("questions")}
                                        >
                                            Next: Edit Questions
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            <TabsContent value="questions" className="space-y-6">
                                {questionFields.map((questionField, questionIndex) => (
                                    <Card key={questionField.id} className="relative">
                                        <Collapsible
                                            open={openQuestions[questionIndex]}
                                            onOpenChange={() => toggleQuestion(questionIndex)}
                                        >
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle>
                                                    Question {questionIndex + 1}
                                                    {quizForm.watch(`questions.${questionIndex}.question`) && (
                                                        <span className="text-sm font-normal text-muted-foreground ml-2">
                                                            {quizForm.watch(`questions.${questionIndex}.question`).substring(0, 40)}
                                                            {quizForm.watch(`questions.${questionIndex}.question`).length > 40 ? '...' : ''}
                                                        </span>
                                                    )}
                                                </CardTitle>
                                                <div className="flex items-center space-x-2">
                                                    {questionFields.length > 1 && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            type="button"
                                                            onClick={() => {
                                                                toast.info("Question removed", {
                                                                    description: "You can undo this by discarding changes"
                                                                });
                                                                removeQuestion(questionIndex);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="ml-2"
                                                        >
                                                            <ChevronsUpDown className="h-4 w-4" />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                </div>
                                            </CardHeader>

                                            <CollapsibleContent>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={control}
                                                        name={`questions.${questionIndex}.question`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Question</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Enter question text"
                                                                        className="min-h-[60px]"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={control}
                                                        name={`questions.${questionIndex}.explanation`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Explanation</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Enter explanation for the correct answer"
                                                                        className="min-h-[60px]"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={control}
                                                        name={`questions.${questionIndex}.questionImage`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Image URL (Optional)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Enter image URL" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="space-y-2">
                                                        <FormLabel>Options</FormLabel>
                                                        {quizForm.watch(`questions.${questionIndex}.options`)?.map((_, optionIndex) => (
                                                            <div key={optionIndex} className="flex gap-4 items-start">
                                                                <FormField
                                                                    control={control}
                                                                    name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-4">
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value}
                                                                                    onCheckedChange={(checked) => {
                                                                                        field.onChange(checked);
                                                                                        // For single-choice, uncheck other options
                                                                                        if (quizForm.watch(`questions.${questionIndex}.questionType`) === 'single-choice' && checked) {
                                                                                            quizForm.watch(`questions.${questionIndex}.options`).forEach((_, idx) => {
                                                                                                if (idx !== optionIndex) {
                                                                                                    quizForm.setValue(`questions.${questionIndex}.options.${idx}.isCorrect`, false);
                                                                                                } else {
                                                                                                    // Set the correct answer
                                                                                                    const option = quizForm.watch(`questions.${questionIndex}.options.${optionIndex}`);
                                                                                                    quizForm.setValue(`questions.${questionIndex}.answer`, option);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel>Correct</FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <div className="flex-1">
                                                                    <FormField
                                                                        control={control}
                                                                        name={`questions.${questionIndex}.options.${optionIndex}.option`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormControl>
                                                                                    <Input placeholder={`Option ${optionIndex + 1}`} {...field} />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                {quizForm.watch(`questions.${questionIndex}.options`).length > 2 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const currentOptions = quizForm.getValues(`questions.${questionIndex}.options`);
                                                                            quizForm.setValue(
                                                                                `questions.${questionIndex}.options`,
                                                                                currentOptions.filter((_, idx) => idx !== optionIndex)
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-2"
                                                            onClick={() => {
                                                                const currentOptions = quizForm.getValues(`questions.${questionIndex}.options`);
                                                                quizForm.setValue(
                                                                    `questions.${questionIndex}.options`,
                                                                    [...currentOptions, { option: "", isCorrect: false }]
                                                                );
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Option
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </Card>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        appendQuestion({
                                            question: "",
                                            explanation: "",
                                            questionImage: "",
                                            questionAudio: "",
                                            questionVideo: "",
                                            questionType: "single-choice",
                                            options: [
                                                { option: "", isCorrect: false },
                                                { option: "", isCorrect: false }
                                            ],
                                            answer: { option: "", isCorrect: false },
                                        });

                                        // Auto-open the new question
                                        const newIndex = questionFields.length;
                                        setOpenQuestions(prev => ({
                                            ...prev,
                                            [newIndex]: true
                                        }));

                                        toast.info("New question added", {
                                            description: "Don't forget to fill in all required fields"
                                        });
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Question
                                </Button>

                                <div className="flex gap-4 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab("general")}
                                    >
                                        Back to General Info
                                    </Button>

                                    {isDirty && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleDiscard}
                                        >
                                            Discard Changes
                                        </Button>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !isDirty}
                                    >
                                        {isSubmitting ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </Form>
            </div>
        </SidebarInset>
    );
}