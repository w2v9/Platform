"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Users,
  Target,
  Zap,
  Calendar,
  BarChart3,
  Timer,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Loader,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/config/firebase-config";
import { toast } from "sonner";
import {
  LeaderboardEntry,
  LeaderboardStats,
  getLeaderboardData,
  TimeFilter,
} from "@/lib/leaderboard";
import { useAuth } from "@/lib/context/authContext";
import type { QuizReport } from "@/lib/utils/db_reports";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "./ui/skeleton";

interface ClientUserLeaderboardProps {
  initialLeaderboard: LeaderboardEntry[];
  initialStats: LeaderboardStats;
}

export function ClientUserLeaderboard({
  initialLeaderboard,
  initialStats,
}: ClientUserLeaderboardProps) {
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(initialLeaderboard);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LeaderboardStats>(initialStats);
  const [currentUserRank, setCurrentUserRank] =
    useState<LeaderboardEntry | null>(null);
  const [userQuizzes, setUserQuizzes] = useState<
    {
      id: string;
      title: string;
      lastAttempt: string;
      score: number;
      maxScore: number;
      percentageScore: number;
      attemptCount: number;
    }[]
  >([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimeFilter.ALL_TIME);
  const { user } = useAuth();
  const router = useRouter();

  // Set page title
  useEffect(() => {
    document.title = "Leaderboard - AzoozGAT Platform";
  }, []);

  // Fetch leaderboard data on client side
  console.log(loading, leaderboard);
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboardData(timeFilter);
        console.log("data", data);
        setLeaderboard(data.leaderboard);
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [timeFilter]);

  useEffect(() => {
    if (user) {
      fetchUserQuizzes();
      // Find current user's ranking
      const userEntry = leaderboard.find(
        (entry: LeaderboardEntry) => entry.id === user.uid
      );
      setCurrentUserRank(userEntry || null);
    }
  }, [user, timeFilter, leaderboard]);

  const fetchUserQuizzes = async () => {
    if (!user) return;

    try {
      setLoadingQuizzes(true);
      const reportsRef = collection(db, "reports");

      // Calculate the start date based on the time filter
      const startDate = getStartDateForTimeFilter(timeFilter);

      let q;
      if (startDate && timeFilter !== TimeFilter.ALL_TIME) {
        q = query(
          reportsRef,
          where("userId", "==", user.uid),
          where("dateTaken", ">=", startDate),
          limit(100)
        );
      } else {
        q = query(reportsRef, where("userId", "==", user.uid), limit(100));
      }

      const querySnapshot = await getDocs(q);
      const reports: QuizReport[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({
          ...doc.data(),
          id: doc.id,
        } as QuizReport);
      });

      // Group reports by quiz
      const quizMap = new Map<string, QuizReport[]>();
      reports.forEach((report) => {
        if (!quizMap.has(report.quizId)) {
          quizMap.set(report.quizId, []);
        }
        quizMap.get(report.quizId)?.push(report);
      });

      // Get the best attempt for each quiz
      const userQuizzesData = Array.from(quizMap.entries()).map(
        ([quizId, quizReports]) => {
          // Sort by score (highest first), then by time (fastest first) if scores are equal
          const sortedReports = quizReports.sort((a, b) => {
            if (a.percentageScore !== b.percentageScore) {
              return b.percentageScore! - a.percentageScore!;
            }
            return a.timeTaken - b.timeTaken;
          });

          const bestAttempt = sortedReports[0];
          return {
            id: quizId,
            title: bestAttempt.quizTitle,
            lastAttempt: bestAttempt.dateTaken || "",
            score: bestAttempt.score || 0,
            maxScore: bestAttempt.maxScore || 0,
            percentageScore: bestAttempt.percentageScore || 0,
            attemptCount: quizReports.length,
          };
        }
      );

      setUserQuizzes(userQuizzesData);
    } catch (err: any) {
      console.error("Error fetching user quizzes:", err);
      toast.error("Failed to load your quiz data");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground">
            #{rank}
          </span>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700";
      default:
        return "bg-card border-border";
    }
  };

  const getBadgeColor = (badge: string) => {
    const badgeColors: { [key: string]: string } = {
      "First Quiz":
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Quiz Explorer":
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "Quiz Enthusiast":
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Quiz Master":
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
      "Quiz Legend":
        "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
      Perfectionist:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      "High Achiever":
        "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "Good Student":
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400",
      "Perfect Score":
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
      "Consistency King":
        "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
      "Flawless Performer":
        "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
      "Top Performer":
        "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
      "Elite Scorer":
        "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      "Speed Demon":
        "bg-lime-100 text-lime-800 dark:bg-lime-900/20 dark:text-lime-400",
      "Weekly Warrior":
        "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400",
    };
    return (
      badgeColors[badge] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    );
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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Helper function to get the start date for a time filter
   * @param timeFilter The time filter to get the start date for
   * @returns A Date object representing the start date for the time filter, or null for ALL_TIME
   */
  function getStartDateForTimeFilter(timeFilter: TimeFilter): string | null {
    const now = new Date();

    switch (timeFilter) {
      case TimeFilter.WEEKLY:
        // Go back 7 days
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo.toISOString();

      case TimeFilter.MONTHLY:
        // Go back 30 days
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        return monthAgo.toISOString();

      case TimeFilter.YEARLY:
        // Go back 365 days
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return yearAgo.toISOString();

      case TimeFilter.ALL_TIME:
      default:
        return null;
    }
  }

  return (
    <SidebarInset>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard/me">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            Compete with other quiz takers and track your performance
          </p>
        </div>

        {/* Time Filter */}
        <Tabs
          defaultValue={TimeFilter.ALL_TIME}
          value={timeFilter}
          onValueChange={(value) => setTimeFilter(value as TimeFilter)}
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
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Quizzes
                    </p>
                    <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Average Score
                    </p>
                    <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Top Score
                    </p>
                    <p className="text-2xl font-bold">{stats.topScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current User Rank */}
        {currentUserRank && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Your Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(currentUserRank.rank)}
                    <span className="text-xl font-bold">
                      Rank #{currentUserRank.rank}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {currentUserRank.averageScore}% Average
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {currentUserRank.totalQuizzes} quizzes completed
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentUserRank.badges.slice(0, 3).map((badge, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={getBadgeColor(badge)}
                    >
                      {badge}
                    </Badge>
                  ))}
                  {currentUserRank.badges.length > 3 && (
                    <Badge variant="outline">
                      +{currentUserRank.badges.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overall" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overall">Overall Ranking</TabsTrigger>
            <TabsTrigger value="top10">Top 10</TabsTrigger>
            <TabsTrigger value="myQuizzes">My Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Complete Leaderboard
                </CardTitle>
                <CardDescription>
                  All users ranked by average quiz performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border transition-all ${getRankColor(
                        entry.rank
                      )} ${
                        entry.id === user?.uid ? "ring-2 ring-primary/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            {getRankIcon(entry.rank)}
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={entry.photoURL}
                                alt={entry.displayName}
                              />
                              <AvatarFallback>
                                {entry.displayName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {entry.displayName}
                              </h3>
                              {entry.id === user?.uid && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {entry.averageScore}% avg
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {entry.totalQuizzes} quizzes
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {entry.bestScore}% best
                              </span>
                              {entry.averageCompletionTime > 0 && (
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {formatTime(entry.averageCompletionTime)} avg
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Progress
                            value={entry.averageScore}
                            className="w-24"
                          />
                          <div className="flex flex-wrap gap-1 justify-end">
                            {entry.badges
                              .slice(0, 2)
                              .map((badge, badgeIndex) => (
                                <Badge
                                  key={badgeIndex}
                                  variant="secondary"
                                  className={`text-xs ${getBadgeColor(badge)}`}
                                >
                                  {badge}
                                </Badge>
                              ))}
                            {entry.badges.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.badges.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top10" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <Card
                  key={entry.id}
                  className={`${getRankColor(
                    entry.rank
                  )} relative overflow-hidden`}
                >
                  {entry.rank <= 3 && (
                    <div className="absolute top-0 right-0 p-2">
                      {getRankIcon(entry.rank)}
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={entry.photoURL}
                          alt={entry.displayName}
                        />
                        <AvatarFallback>
                          {entry.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{entry.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Rank #{entry.rank}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{entry.averageScore}%</p>
                          <p className="text-xs text-muted-foreground">
                            Average
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="font-medium">{entry.bestScore}%</p>
                          <p className="text-xs text-muted-foreground">Best</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">{entry.totalQuizzes}</p>
                          <p className="text-xs text-muted-foreground">
                            Quizzes
                          </p>
                        </div>
                      </div>
                      {entry.averageCompletionTime > 0 && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="font-medium">
                              {formatTime(entry.averageCompletionTime)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg Time
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Badges
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {entry.badges.slice(0, 4).map((badge, badgeIndex) => (
                          <Badge
                            key={badgeIndex}
                            variant="secondary"
                            className={`text-xs ${getBadgeColor(badge)}`}
                          >
                            {badge}
                          </Badge>
                        ))}
                        {entry.badges.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.badges.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {entry.lastQuizDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Last active: {formatDate(entry.lastQuizDate)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="myQuizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Quiz Performance
                </CardTitle>
                <CardDescription>
                  View your performance in individual quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingQuizzes ? (
                  <div className="py-6 flex items-center justify-center">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userQuizzes.length > 0 ? (
                  <div className="space-y-4">
                    {userQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-4 rounded-md border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/me/leaderboard/${quiz.id}`)
                        }
                      >
                        <div className="flex flex-col gap-1">
                          <h3 className="font-medium">{quiz.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>
                              {quiz.attemptCount} attempt
                              {quiz.attemptCount !== 1 ? "s" : ""}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(quiz.lastAttempt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">
                              {quiz.percentageScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Best Score
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-1">
                      No Quizzes Completed
                    </h3>
                    <p className="text-muted-foreground">
                      You haven&apos;t completed any quizzes yet. Take some
                      quizzes to see your performance!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {leaderboard.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Quiz Results Yet
              </h3>
              <p className="text-muted-foreground text-center">
                Complete some quizzes to see your ranking on the leaderboard!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-2">
                {/* Label placeholder */}
                <Skeleton className="h-3 w-24" />
                {/* Number placeholder */}
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}