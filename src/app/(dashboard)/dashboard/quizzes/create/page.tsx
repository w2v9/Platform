"use client";

import type { Quiz, Question, Option } from "@/data/quiz";
import { createQuiz } from "@/lib/db_quiz";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { useState, useRef } from "react";
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
import { ChevronsUpDown, Plus, Trash2, Upload, AlertCircle, FileJson } from "lucide-react";
import { toast } from "sonner";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { recordLog } from "@/lib/db_logs";
import { useAuth } from "@/lib/context/authContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const optionSchema = z.object({
    id: z.string().optional(),
    option: z.string().min(1, { message: "Option text is required" }),
    isCorrect: z.boolean(),
});

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

const quizSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    timeLimit: z.number().int().positive({ message: "Time limit must be a positive number" }),
    quizType: z.enum(["normal", "no-review"]).optional(),
    questions: z.array(questionSchema).min(1, { message: "At least one question is required" }),
    createdAt: z.string().optional(),
});

type QuizFormValues = z.infer<typeof quizSchema>;


const sampleJsonFormat = {
    "questions": [
        {
            "question": "What is the capital of France?",
            "explanation": "Paris is the capital city of France",
            "options": [
                { "option": "London", "isCorrect": false },
                { "option": "Paris", "isCorrect": true },
                { "option": "Berlin", "isCorrect": false },
                { "option": "Madrid", "isCorrect": false }
            ]
        },
        {
            "question": "Who painted the Mona Lisa?",
            "explanation": "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519",
            "options": [
                { "option": "Vincent van Gogh", "isCorrect": false },
                { "option": "Pablo Picasso", "isCorrect": false },
                { "option": "Leonardo da Vinci", "isCorrect": true },
                { "option": "Michelangelo", "isCorrect": false }
            ]
        }
    ]
};

export default function CreateQuizPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("general");
    const [jsonData, setJsonData] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const quizForm = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema) as unknown as Resolver<QuizFormValues>,
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
            createdAt: new Date().toISOString(),
        },
    });

    const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, getValues, reset } = quizForm;

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion, replace: replaceQuestions } =
        useFieldArray({
            control,
            name: "questions",
        });

    const processJsonData = (jsonString: string) => {
        try {
            setJsonError(null);
            const data = JSON.parse(jsonString);

            if (!data.questions || !Array.isArray(data.questions)) {
                setJsonError("JSON must contain a 'questions' array");
                return;
            }

            const processedQuestions = data.questions.map((q: Question) => {
                if (!q.question) {
                    throw new Error("Each question must have a 'question' field");
                }
                if (!q.explanation) {
                    throw new Error("Each question must have an 'explanation' field");
                }
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    throw new Error("Each question must have at least 2 options");
                }

                const hasCorrectOption = q.options.some((opt: Option) => opt.isCorrect === true);
                if (!hasCorrectOption) {
                    throw new Error(`Question "${q.question.substring(0, 20)}..." must have at least one correct option`);
                }

                const correctOption = q.options.find((opt: Option) => opt.isCorrect === true);

                return {
                    id: q.id || uuidv4(),
                    question: q.question,
                    explanation: q.explanation,
                    questionImage: q.questionImage || "",
                    questionAudio: q.questionAudio || "",
                    questionVideo: q.questionVideo || "",
                    questionType: q.questionType || "single-choice",
                    options: q.options.map((opt: Option) => ({
                        id: opt.id || uuidv4(),
                        option: opt.option,
                        isCorrect: opt.isCorrect
                    })),
                    answer: {
                        id: correctOption?.id || uuidv4(),
                        option: correctOption?.option,
                        isCorrect: true
                    }
                };
            });

            replaceQuestions(processedQuestions);

            toast.success(`Successfully imported ${processedQuestions.length} questions`);
            setActiveTab("questions");
        } catch (error) {
            console.error("Error processing JSON data:", error);
            setJsonError(error instanceof Error ? error.message : "Invalid JSON format");
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/json") {
            setJsonError("Please upload a JSON file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setJsonData(content);
            processJsonData(content);
        };
        reader.onerror = () => {
            setJsonError("Error reading the file");
        };
        reader.readAsText(file);
    };

    const onSubmit = async (data: QuizFormValues) => {
        try {
            const quizWithIds: Quiz = {
                ...data,
                id: data.id || uuidv4(),
                createdAt: data.createdAt || new Date().toISOString(),
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

            const docref = await createQuiz(quizWithIds);

            await recordLog({
                id: uuidv4(),
                userId: user?.uid || "",
                action: "QUIZ_CREATED",
                timestamp: new Date().toISOString(),
                details: JSON.stringify({
                    quizId: docref.id,
                })
            });

            toast.success("Quiz created successfully!");
            router.push("/dashboard/quizzes");
        } catch (error) {
            console.error("Error creating quiz:", error);

            const errorMessage = error instanceof Error
                ? error.message
                : typeof error === 'string'
                    ? error
                    : 'Unknown error occurred';

            await recordLog({
                id: uuidv4(),
                userId: user?.uid || "",
                action: "QUIZ_CREATION_FAILED",
                timestamp: new Date().toISOString(),
                details: JSON.stringify({
                    error: errorMessage,
                })
            });
            toast.error("Failed to create quiz. Please try again.");
        }
    };

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
                            <BreadcrumbPage>Create</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>

                <Form {...quizForm}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-6">
                                <TabsTrigger value="general">General Info</TabsTrigger>
                                <TabsTrigger value="questions">Questions</TabsTrigger>
                                <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
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
                                            name={`quizType`}
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
                                                            <SelectItem value="no-review">Special Quiz</SelectItem>
                                                        </SelectContent>
                                                    </Select>
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
                                            Next: Add Questions
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>

                            <TabsContent value="questions" className="space-y-6">
                                {questionFields.map((questionField, questionIndex) => (
                                    <Card key={questionField.id} className="relative">
                                        <Collapsible>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle>Question {questionIndex + 1}</CardTitle>
                                                <div className="flex items-center space-x-2">
                                                    {questionFields.length > 1 && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            type="button"
                                                            onClick={() => removeQuestion(questionIndex)}
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
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Quiz"}
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Bulk Upload Tab */}
                            <TabsContent value="bulk-upload" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bulk Upload Questions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload JSON File
                                                </Button>
                                                <input
                                                    type="file"
                                                    accept=".json"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                />

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        // Copy sample JSON to clipboard
                                                        navigator.clipboard.writeText(JSON.stringify(sampleJsonFormat, null, 2))
                                                            .then(() => toast.success("Sample JSON copied to clipboard"))
                                                            .catch(() => toast.error("Failed to copy to clipboard"));
                                                    }}
                                                >
                                                    <FileJson className="h-4 w-4 mr-2" />
                                                    Copy Sample Format
                                                </Button>
                                            </div>

                                            <p className="text-sm text-muted-foreground">
                                                Upload a JSON file or paste your JSON data below
                                            </p>
                                        </div>

                                        {jsonError && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Error</AlertTitle>
                                                <AlertDescription>{jsonError}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="space-y-2">
                                            <FormLabel>JSON Data</FormLabel>
                                            <Textarea
                                                placeholder="Paste your JSON data here..."
                                                className="min-h-[300px] font-mono text-sm"
                                                value={jsonData}
                                                onChange={(e) => setJsonData(e.target.value)}
                                            />
                                            <FormDescription>
                                                Your JSON should contain a &apos;questions&apos; array with each question having fields for &apos;question&apos;, &apos;explanation&apos;, and &apos;options&apos;.
                                            </FormDescription>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab("general")}
                                        >
                                            Back to General Info
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (jsonData.trim()) {
                                                    processJsonData(jsonData);
                                                } else {
                                                    setJsonError("Please enter JSON data");
                                                }
                                            }}
                                            disabled={!jsonData.trim()}
                                        >
                                            Process JSON Data
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </form>
                </Form>
            </div>
        </SidebarInset>
    );
}