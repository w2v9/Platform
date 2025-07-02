'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Trophy,
    Medal,
    Award,
    Crown,
    Star,
    TrendingUp,
    ExternalLink,
    Users,
    Target
} from 'lucide-react';
import { LeaderboardEntry, getTopPerformers, getUserRank } from '@/lib/leaderboard';
import { useAuth } from '@/lib/context/authContext';
import Link from 'next/link';

interface LeaderboardWidgetProps {
    maxEntries?: number;
    showUserRank?: boolean;
    className?: string;
}

export default function LeaderboardWidget({
    maxEntries = 5,
    showUserRank = true,
    className = ''
}: LeaderboardWidgetProps) {
    const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, [maxEntries, user]); const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch top performers directly from client-side function
            const topPerformersData = await getTopPerformers(maxEntries);
            setTopPerformers(topPerformersData);

            // Fetch user rank if user is logged in and showUserRank is true
            if (user && showUserRank) {
                const rank = await getUserRank(user.uid);
                setUserRank(rank);
            }
        } catch (error: any) {
            console.error('Error fetching leaderboard widget data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-4 w-4 text-yellow-500" />;
            case 2:
                return <Medal className="h-4 w-4 text-gray-400" />;
            case 3:
                return <Award className="h-4 w-4 text-amber-600" />;
            default:
                return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20';
            case 2:
                return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20';
            case 3:
                return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20';
            default:
                return 'bg-background';
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-3">
                    <div className="animate-pulse">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(maxEntries)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3">
                                <div className="h-8 w-8 bg-muted rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-muted rounded w-2/3 mb-1"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                </div>
                                <div className="h-4 bg-muted rounded w-12"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Leaderboard
                        </CardTitle>
                        <CardDescription>Top performers</CardDescription>
                    </div>
                    <Link href="/dashboard/me/leaderboard">
                        <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* User's Rank */}
                {userRank && showUserRank && (
                    <>
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">Your Rank</span>
                                </div>
                                <Badge variant="outline" className="font-bold">
                                    #{userRank}
                                </Badge>
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

                {/* Top Performers */}
                <div className="space-y-2">
                    {topPerformers.map((performer, index) => (
                        <div
                            key={performer.id}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${getRankColor(performer.rank)}`}
                        >
                            <div className="flex items-center gap-2 min-w-[60px]">
                                {getRankIcon(performer.rank)}
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={performer.photoURL} alt={performer.displayName} />
                                    <AvatarFallback className="text-xs">
                                        {performer.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{performer.displayName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        {performer.averageScore}%
                                    </span>
                                    <span>•</span>
                                    <span>{performer.totalQuizzes} quizzes</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <Badge variant="secondary" className="text-xs">
                                    {performer.averageScore}%
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>

                {topPerformers.length === 0 && !error && (
                    <div className="text-center py-6 text-muted-foreground">
                        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No quiz data available yet</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm text-red-500">Error loading leaderboard data</p>
                    </div>
                )}

                {topPerformers.length > 0 && (
                    <div className="pt-2">
                        <Link href="/dashboard/me/leaderboard">
                            <Button variant="outline" size="sm" className="w-full">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Full Leaderboard
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
