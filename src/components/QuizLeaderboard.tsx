'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Trophy,
    Medal,
    Award,
    Crown,
    Clock,
    Target,
    Users,
    BarChart3,
    Timer,
    RotateCcw,
    Star
} from 'lucide-react';
import { toast } from 'sonner';
import { QuizLeaderboardEntry, QuizLeaderboardStats, getQuizLeaderboard, getUserQuizAttempts, TimeFilter } from '@/lib/leaderboard';
import { useAuth } from '@/lib/context/authContext';

interface QuizLeaderboardProps {
    quizId: string;
    quizTitle?: string;
    limitEntries?: number;
    className?: string;
    showUserHighlight?: boolean;
    timeFilter?: TimeFilter;
}

export default function QuizLeaderboard({
    quizId,
    quizTitle = 'Quiz Leaderboard',
    limitEntries = 50,
    className = '',
    showUserHighlight = true,
    timeFilter
}: QuizLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
    const [currentUserLeaderboardData, setCurrentUserLeaderboardData] = useState<QuizLeaderboardEntry | null>(null);
    const [stats, setStats] = useState<QuizLeaderboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localTimeFilter, setLocalTimeFilter] = useState<TimeFilter>(timeFilter || TimeFilter.ALL_TIME);
    const { user } = useAuth();

    useEffect(() => {
        if (timeFilter !== undefined) {
            setLocalTimeFilter(timeFilter);
        }
    }, [timeFilter]);

    useEffect(() => {
        fetchLeaderboardData();
    }, [quizId, localTimeFilter]);

    const fetchLeaderboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                setError('You must be logged in to view the leaderboard');
                return;
            }

            const data = await getQuizLeaderboard(quizId, limitEntries, localTimeFilter);
            setLeaderboard(data.leaderboard);
            setCurrentUserLeaderboardData(data.leaderboard.find(entry => entry.id === user.uid) || null);
            setStats(data.stats);
        } catch (err: any) {
            console.error(`Error fetching leaderboard for quiz ${quizId}:`, err);
            let errorMessage = 'Failed to load leaderboard data';

            if (err.message?.includes('permission') || err.code === 'permission-denied') {
                errorMessage = 'Only showing your own results due to permission restrictions';

                // Try to show a more user-friendly message and fallback to just the user's data
                try {
                    // We can still show the current user's own attempt
                    if (user) {
                        const userAttempts = await getUserQuizAttempts(quizId, user.uid);
                        if (userAttempts.length > 0) {
                            // Show only the user's data in the leaderboard
                            const bestAttempt = userAttempts.find(a => a.isBestAttempt) || userAttempts[0];
                            bestAttempt.rank = 1; // Set a default rank
                            setLeaderboard([bestAttempt]);
                            setStats({
                                totalAttempts: userAttempts.length,
                                totalUsers: 1,
                                averageScore: bestAttempt.percentageScore,
                                bestScore: bestAttempt.percentageScore,
                                fastestTime: bestAttempt.timeTaken
                            });
                            setError(errorMessage);
                            return;
                        }
                    }
                } catch (innerError) {
                    console.error('Error fetching fallback user attempts:', innerError);
                    errorMessage = 'Unable to load any leaderboard data due to permission restrictions';
                }
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700';
            case 2:
                return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700';
            case 3:
                return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700';
            default:
                return 'bg-card border-border';
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
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        // If we have some leaderboard data (even if it's just the user's own entries)
        // display that data but also show an alert with the error
        if (leaderboard.length > 0 && stats) {
            return (
                <div className={`space-y-6 ${className}`}>
                    <Alert variant={error.includes('Only showing your') ? 'default' : 'destructive'}>
                        <AlertDescription>
                            {error}
                            {error.includes('permission') &&
                                " You can still see your own results, but not the complete leaderboard."}
                        </AlertDescription>
                    </Alert>

                    {/* Rest of the component with leaderboard data */}
                    {/* Stats Overview */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Users</p>
                                            <p className="text-lg font-bold">{stats.totalUsers}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ...other stats cards... */}
                        </div>
                    )}

                    {/* Show the partial leaderboard */}
                    <Tabs defaultValue="leaderboard" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                            <TabsTrigger value="myAttempts">My Attempts</TabsTrigger>
                        </TabsList>

                        <TabsContent value="leaderboard" className="space-y-4">
                            {/* Leaderboard content */}
                        </TabsContent>

                        <TabsContent value="myAttempts" className="space-y-4">
                            {/* My attempts content */}
                        </TabsContent>
                    </Tabs>
                </div>
            );
        }

        // If we have no data at all, just show the error
        return (
            <div className={`${className}`}>
                <Alert variant="destructive">
                    <AlertDescription>
                        {error}
                        {error.includes('permission') &&
                            " - Please contact your administrator if you believe you should have access to the leaderboard."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Time Filter */}
            <Tabs
                defaultValue={TimeFilter.ALL_TIME}
                value={localTimeFilter}
                onValueChange={(value) => setLocalTimeFilter(value as TimeFilter)}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value={TimeFilter.ALL_TIME}>All Time</TabsTrigger>
                    <TabsTrigger value={TimeFilter.YEARLY}>Yearly</TabsTrigger>
                    <TabsTrigger value={TimeFilter.MONTHLY}>Monthly</TabsTrigger>
                    <TabsTrigger value={TimeFilter.WEEKLY}>Weekly</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Users</p>
                                    <p className="text-lg font-bold">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-purple-500" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Attempts</p>
                                    <p className="text-lg font-bold">{stats.totalAttempts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Avg. Score</p>
                                    <p className="text-lg font-bold">{stats.averageScore}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Best Score</p>
                                    <p className="text-lg font-bold">{stats.bestScore}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Fastest</p>
                                    <p className="text-lg font-bold">{formatTime(stats.fastestTime)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        {quizTitle}
                    </CardTitle>
                    <CardDescription>
                        Ranked by score and completion time - only best attempts shown
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {error}
                                    {error.includes('permission') &&
                                        " - Please contact your administrator if you believe you should have access to this leaderboard."}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                <span className="text-sm font-medium">Your Ranking</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {currentUserLeaderboardData ? `Rank #${currentUserLeaderboardData.rank}` : 'N/A'}
                            </div>
                        </div>
                        {
                            currentUserLeaderboardData && (
                                <div className={`p-3 rounded-lg border ${getRankColor(currentUserLeaderboardData.rank)} ${showUserHighlight ? 'ring-2 ring-primary/50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {getRankIcon(currentUserLeaderboardData.rank)}
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={currentUserLeaderboardData.photoURL} alt={currentUserLeaderboardData.displayName} />
                                                    <AvatarFallback>
                                                        {currentUserLeaderboardData.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold">{currentUserLeaderboardData.displayName}</h3>
                                                    {showUserHighlight && currentUserLeaderboardData.id === user?.uid && (
                                                        <Badge variant="outline" className="text-xs">You</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(currentUserLeaderboardData.timeTaken)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Attempt #{currentUserLeaderboardData.attemptNumber}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(currentUserLeaderboardData.dateTaken)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                {currentUserLeaderboardData.isBestAttempt && (
                                                    <Star className="h-3 w-3 text-yellow-500" />
                                                )}
                                                <Badge className="text-md">
                                                    {currentUserLeaderboardData.score} pts
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        <Separator className="mt-8 mb-4" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">

                                <Trophy className="h-5 w-5" />
                                <span className="text-sm font-medium">Global Leaderboard</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {leaderboard.length} {leaderboard.length === 1 ? 'entry' : 'entries'}
                            </div>
                        </div>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p>No attempts recorded yet</p>
                            </div>
                        ) : (
                            leaderboard.map((entry) => (
                                <div
                                    key={`${entry.id}-${entry.dateTaken}`}
                                    className={`p-3 rounded-lg border transition-all ${getRankColor(entry.rank)} ${showUserHighlight && entry.id === user?.uid ? 'ring-2 ring-primary/50' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {getRankIcon(entry.rank)}
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={entry.photoURL} alt={entry.displayName} />
                                                    <AvatarFallback>
                                                        {entry.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold">{entry.displayName}</h3>
                                                    {showUserHighlight && entry.id === user?.uid && (
                                                        <Badge variant="outline" className="text-xs">You</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(entry.timeTaken)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Attempt #{entry.attemptNumber}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(entry.dateTaken)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                {entry.isBestAttempt && (
                                                    <Star className="h-3 w-3 text-yellow-500" />
                                                )}
                                                <Badge className="text-md">
                                                    {entry.score} pts
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
