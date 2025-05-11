"use client";

import type { Quiz, Question, Option } from "@/data/quiz";
import { createQuiz } from "@/lib/db";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
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
import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"



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
    questions: z.array(questionSchema).min(1, { message: "At least one question is required" }),
    createdAt: z.string().optional(),
});

// Create a type that's inferred from the Zod schema
type QuizFormValues = z.infer<typeof quizSchema>;

export default function CreateQuizPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("general");

    const quizForm = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema) as unknown as Resolver<QuizFormValues>,
        defaultValues: {
            title: "",
            description: "",
            timeLimit: 30, // Default 30 minutes
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

    const { control, handleSubmit, formState: { errors, isSubmitting } } = quizForm;

    // Use field array for managing questions
    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } =
        useFieldArray({
            control,
            name: "questions",
        });

    // Handle form submission
    const onSubmit = async (data: QuizFormValues) => {
        try {
            // Generate IDs for quiz and questions if they don't exist
            const quizWithIds: Quiz = {
                ...data,
                id: data.id || uuidv4(),
                createdAt: data.createdAt || new Date().toISOString(),
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

            // Save quiz to database
            await createQuiz(quizWithIds);
            toast.success("Quiz created successfully!");
            router.push("/dashboard/quizzes");
        } catch (error) {
            console.error("Error creating quiz:", error);
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
                            <BreadcrumbLink href="/dashboard/home">
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
                                                        name={`questions.${questionIndex}.questionType`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Question Type</FormLabel>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    defaultValue={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select question type" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="single-choice">Single Choice</SelectItem>
                                                                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
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
                        </Tabs>
                    </form>
                </Form>
            </div>
        </SidebarInset>
    );
}