'use client';
import React, { useState, useEffect, use } from 'react';
import QuizLeaderboard from '@/components/QuizLeaderboard';
import UserQuizAttempts from '@/components/UserQuizAttempts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/context/authContext';
import { getQuizById } from '@/lib/db_quiz';
import { Quiz } from '@/data/quiz';

interface PageProps {
    params: {
        id: string;
    };
}

export default function QuizLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: quizId } = use(params);
    const [quizTitle, setQuizTitle] = useState('Quiz Leaderboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Update document title when quizTitle changes
    useEffect(() => {
        document.title = `Leaderboard for ${quizTitle} - AzoozGAT Platform`;
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
                errorMessage = 'You do not have permission to view this quiz leaderboard';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertDescription>
                        {error}
                        {error.includes('permission') &&
                            " - Please contact your administrator if you believe you should have access to this quiz leaderboard."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{quizTitle} - Leaderboard</h1>
                <p className="text-muted-foreground mt-1">
                    See how you rank compared to other quiz takers
                </p>
            </div>

            {user ? (
                <Tabs defaultValue="leaderboard" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="leaderboard">Global Leaderboard</TabsTrigger>
                        <TabsTrigger value="myattempts">My Attempts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="leaderboard">
                        <QuizLeaderboard quizId={quizId} quizTitle={quizTitle} />
                    </TabsContent>

                    <TabsContent value="myattempts">
                        <UserQuizAttempts
                            quizId={quizId}
                            userId={user.uid}
                            quizTitle={`${quizTitle} - Your Attempts`}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                <QuizLeaderboard quizId={quizId} quizTitle={quizTitle} showUserHighlight={false} />
            )}
        </div>
    );
}
