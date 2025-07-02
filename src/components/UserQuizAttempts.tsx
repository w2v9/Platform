'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Clock,
    RotateCcw,
    Calendar,
    Star,
    Trophy,
    Info,
    ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { QuizLeaderboardEntry, getUserQuizAttempts, TimeFilter } from '@/lib/leaderboard';

interface UserQuizAttemptsProps {
    quizId: string;
    userId: string;
    quizTitle?: string;
    className?: string;
    showRefreshButton?: boolean;
    timeFilter?: TimeFilter;
}

export default function UserQuizAttempts({
    quizId,
    userId,
    quizTitle = 'Your Quiz Attempts',
    className = '',
    showRefreshButton = true,
    timeFilter = TimeFilter.ALL_TIME
}: UserQuizAttemptsProps) {
    const [attempts, setAttempts] = useState<QuizLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'score'>('newest');

    useEffect(() => {
        fetchAttempts();
    }, [quizId, userId, timeFilter]);

    const fetchAttempts = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getUserQuizAttempts(quizId, userId, timeFilter);
            setAttempts(data);
        } catch (err: any) {
            console.error(`Error fetching attempts for user ${userId} on quiz ${quizId}:`, err);
            let errorMessage = 'Failed to load quiz attempts';

            if (err.message?.includes('permission') || err.code === 'permission-denied') {
                errorMessage = 'You do not have permission to view these quiz attempts';
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (minutes: number) => {
        if (minutes < 1) {
            const seconds = Math.round(minutes * 60);
            return `${seconds}s`;
        }
        const wholeMinutes = Math.floor(minutes);
        const seconds = Math.round((minutes - wholeMinutes) * 60);
        if (seconds === 0) {
            return `${wholeMinutes}m`;
        }
        return `${wholeMinutes}m ${seconds}s`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    };

    const handleRefresh = () => {
        fetchAttempts();
        toast.info('Refreshing your attempts...');
    };

    const sortAttempts = (attempts: QuizLeaderboardEntry[]) => {
        const sortedAttempts = [...attempts];

        switch (sortOrder) {
            case 'newest':
                return sortedAttempts.sort((a, b) =>
                    new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()
                );
            case 'oldest':
                return sortedAttempts.sort((a, b) =>
                    new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime()
                );
            case 'score':
                return sortedAttempts.sort((a, b) => {
                    if (a.percentageScore !== b.percentageScore) {
                        return b.percentageScore - a.percentageScore;
                    }
                    return a.timeTaken - b.timeTaken;
                });
            default:
                return sortedAttempts;
        }
    };

    const cycleSort = () => {
        const sortOrders: ('newest' | 'oldest' | 'score')[] = ['newest', 'oldest', 'score'];
        const currentIndex = sortOrders.indexOf(sortOrder);
        const nextIndex = (currentIndex + 1) % sortOrders.length;
        setSortOrder(sortOrders[nextIndex]);
    };

    const getSortLabel = () => {
        switch (sortOrder) {
            case 'newest': return 'Newest First';
            case 'oldest': return 'Oldest First';
            case 'score': return 'Best Score First';
        }
    };

    if (loading) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className}`}>
                <Alert variant="destructive">
                    <AlertDescription>
                        {error}
                        {error.includes('permission') &&
                            " - Please contact your administrator if you believe you should have access to this data."}
                    </AlertDescription>
                </Alert>
                <div className="mt-4 text-center py-6 text-muted-foreground">
                    <RotateCcw className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Unable to load attempts</p>
                    {showRefreshButton && (
                        <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const sortedAttempts = sortAttempts(attempts);
    const hasBestAttempt = sortedAttempts.some(attempt => attempt.isBestAttempt);

    return (
        <div className={`space-y-4 ${className}`}>
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg">{quizTitle}</CardTitle>
                            <CardDescription>
                                You&apos;ve taken this quiz {attempts.length} time{attempts.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {showRefreshButton && (
                                <Button variant="outline" size="sm" onClick={handleRefresh}>
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Refresh
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={cycleSort}>
                                <ArrowUpDown className="h-4 w-4 mr-1" />
                                {getSortLabel()}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {sortedAttempts.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <RotateCcw className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No attempts yet</p>
                            <p className="text-sm mt-1">Complete the quiz to see your results here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {hasBestAttempt && (
                                <div className="rounded-lg bg-primary/5 p-3 text-sm flex items-center gap-2 mb-4">
                                    <Info className="h-4 w-4 text-primary" />
                                    <p>Your best attempt (highest score, fastest time) is used for leaderboard ranking</p>
                                </div>
                            )}

                            {sortedAttempts.map((attempt, index) => (
                                <div
                                    key={index}
                                    className={`p-3 border rounded-lg ${attempt.isBestAttempt ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={attempt.isBestAttempt ? "default" : "outline"}>
                                                    Attempt #{attempt.attemptNumber}
                                                </Badge>
                                                {attempt.isBestAttempt && (
                                                    <div className="flex items-center text-xs text-yellow-500">
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Best Attempt
                                                    </div>
                                                )}
                                                {attempt.rank > 0 && (
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Trophy className="h-3 w-3 mr-1" />
                                                        Rank #{attempt.rank}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(attempt.timeTaken)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(attempt.dateTaken)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">{attempt.percentageScore}%</div>
                                            <div className="text-xs text-muted-foreground">
                                                {attempt.score} points
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
