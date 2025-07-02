'use client';
import React, { useState, useEffect, use } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Loader
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/authContext';
import QuizLeaderboard from '@/components/QuizLeaderboard';
import UserQuizAttempts from '@/components/UserQuizAttempts';
import { TimeFilter } from '@/lib/leaderboard';

import { getQuizById } from '@/lib/db_quiz';
import { Quiz } from '@/data/quiz';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function QuizLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const quizId = unwrappedParams.id;

    const [quizTitle, setQuizTitle] = useState('Quiz Leaderboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.ALL_TIME);
    const { user } = useAuth();
    const router = useRouter();

    // Update document title when quizTitle changes
    useEffect(() => {
        document.title = `${quizTitle} - My Performance - AzoozGAT Platform`;
    }, [quizTitle]);

    useEffect(() => {
        if (quizId) {
            fetchQuizDetails();
        }
    }, [quizId]);

    const fetchQuizDetails = async () => {
        try {
            setLoading(true);
            const quizData: Quiz | null = await getQuizById(quizId);
            if (!quizData) {
                setError('Quiz not found');
                return;
            }
            setQuizTitle(quizData.title || 'Quiz Leaderboard');

        } catch (err: any) {
            console.error('Error fetching quiz details:', err);

            let errorMessage = 'Failed to load quiz details';
            if (err.message?.includes('permission') || err.code === 'permission-denied') {
                errorMessage = 'You do not have permission to view this quiz';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.push('/dashboard/me/leaderboard');
    };

    if (loading) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/me">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/me/leaderboard">
                                    Leaderboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{quizId}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto p-6 space-y-6">
                    <div className="flex items-center justify-center min-h-[300px]">
                        <div className="flex flex-col items-center gap-2">
                            <Loader className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading quiz leaderboard...</p>
                        </div>
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
                                <BreadcrumbLink href="/dashboard/me">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/me/leaderboard">
                                    Leaderboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{quizId}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {error}
                            {error.includes('permission') &&
                                " - Please contact your administrator if you believe you should have access to this quiz."}
                        </AlertDescription>
                    </Alert>
                    <Button variant="outline" onClick={handleBack} className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Leaderboard
                    </Button>
                </div>
            </SidebarInset>
        );
    }

    if (!user) {
        return (
            <SidebarInset>
                <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/me">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard/me/leaderboard">
                                    Leaderboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{quizId}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto p-6">
                    <Alert variant="destructive">
                        <AlertDescription>
                            You must be logged in to view this leaderboard.
                        </AlertDescription>
                    </Alert>
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
                            <BreadcrumbLink href="/dashboard/me">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard/me/leaderboard">
                                Leaderboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{quizId}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{quizTitle}</h1>
                        <p className="text-muted-foreground mt-1">
                            Your performance in this quiz compared to others
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="leaderboard" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="leaderboard">Quiz Leaderboard</TabsTrigger>
                        <TabsTrigger value="myattempts">My Attempts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="leaderboard">
                        <QuizLeaderboard
                            quizId={quizId}
                            quizTitle={quizTitle}
                            showUserHighlight={true}
                            timeFilter={timeFilter}
                        />
                    </TabsContent>

                    <TabsContent value="myattempts">
                        <UserQuizAttempts
                            quizId={quizId}
                            userId={user.uid}
                            quizTitle={`${quizTitle} - Your Attempts`}
                            showRefreshButton={true}
                            timeFilter={timeFilter}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </SidebarInset>
    );
}
