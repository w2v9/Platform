"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Clock,
  TrendingUp,
  Users,
  Target,
  Zap,
  Calendar,
  BarChart3,
  Timer,
  Brain,
  BookOpen,
  CheckCircle2,
  Search,
  Download,
  RefreshCw,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  LeaderboardEntry,
  LeaderboardStats,
  getLeaderboardData,
} from "@/lib/leaderboard";
import { Skeleton } from "./ui/skeleton";

interface ClientLeaderboardProps {
  initialLeaderboard: LeaderboardEntry[];
  initialStats: LeaderboardStats;
  isAdmin?: boolean;
}

export function ClientLeaderboard({
  initialLeaderboard,
  initialStats,
  isAdmin = false,
}: ClientLeaderboardProps) {
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(initialLeaderboard);
  const [loading, setLoading] = useState(false);
  const [filteredLeaderboard, setFilteredLeaderboard] =
    useState<LeaderboardEntry[]>(initialLeaderboard);
  const [stats, setStats] = useState<LeaderboardStats>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "name" | "score" | "quizzes">(
    "rank"
  );

  // Set page title
  useEffect(() => {
    document.title = isAdmin
      ? "Admin Leaderboard - AzoozGAT Platform"
      : "Leaderboard - AzoozGAT Platform";
  }, [isAdmin]);

  // Fetch leaderboard data on client side
  console.log("leaderboard:", leaderboard);
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboardData();
        setLeaderboard(data.leaderboard);
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);
  console.log(loading, leaderboard);

  const filterAndSortLeaderboard = useCallback(() => {
    const filtered = leaderboard.filter(
      (entry) =>
        entry.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case "rank":
        filtered.sort((a, b) => a.rank - b.rank);
        break;
      case "name":
        filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case "score":
        filtered.sort((a, b) => b.averageScore - a.averageScore);
        break;
      case "quizzes":
        filtered.sort((a, b) => b.totalQuizzes - a.totalQuizzes);
        break;
    }

    setFilteredLeaderboard(filtered);
  }, [leaderboard, searchTerm, sortBy]);

  useEffect(() => {
    filterAndSortLeaderboard();
  }, [leaderboard, searchTerm, sortBy, filterAndSortLeaderboard]);

  const exportLeaderboard = () => {
    const csvContent = [
      [
        "Rank",
        "Name",
        "Email",
        "Average Score",
        "Best Score",
        "Total Quizzes",
        "Total Score",
        "Avg Completion Time",
        "Badges",
        "Last Quiz Date",
      ].join(","),
      ...filteredLeaderboard.map((entry) =>
        [
          entry.rank,
          `"${entry.displayName}"`,
          entry.email,
          entry.averageScore,
          entry.bestScore,
          entry.totalQuizzes,
          entry.totalScore,
          entry.averageCompletionTime,
          `"${entry.badges.join("; ")}"`,
          entry.lastQuizDate || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaderboard-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Leaderboard exported successfully");
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
        return (
          <span className="text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        );
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "Admin Leaderboard" : "Leaderboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Comprehensive view of user performance and rankings"
              : "Your performance and rankings"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button onClick={exportLeaderboard} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

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
                    Active Users
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
                    Platform Average
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
                    Highest Score
                  </p>
                  <p className="text-2xl font-bold">{stats.topScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="rank">Sort by Rank</option>
                <option value="name">Sort by Name</option>
                <option value="score">Sort by Score</option>
                <option value="quizzes">Sort by Quiz Count</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Rankings ({filteredLeaderboard.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <h2 className="py-3 text-center">Loading ...</h2>
          ) : (
            <div className="space-y-3">
              {filteredLeaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3 min-w-[80px]">
                        {getRankIcon(entry.rank)}
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={entry.photoURL}
                            alt={entry.displayName}
                          />
                          <AvatarFallback className="text-xs">
                            {entry.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {entry.displayName}
                          </h3>
                          {isAdmin && (
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              ID: {entry.id.slice(-6)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {entry.email}
                        </p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">
                            {entry.averageScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Score
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{entry.bestScore}%</div>
                          <div className="text-xs text-muted-foreground">
                            Best
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">
                            {entry.totalQuizzes}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quizzes
                          </div>
                        </div>
                        {entry.averageCompletionTime > 0 && (
                          <div className="text-center">
                            <div className="font-medium">
                              {formatTime(entry.averageCompletionTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Avg Time
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress
                        value={entry.averageScore}
                        className="w-20 hidden sm:block"
                      />
                      <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                        {entry.badges.slice(0, 3).map((badge, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`text-xs ${getBadgeColor(badge)}`}
                          >
                            {badge}
                          </Badge>
                        ))}
                        {entry.badges.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.badges.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile view details */}
                  <div className="md:hidden mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Avg Score:{" "}
                        </span>
                        <span className="font-medium">
                          {entry.averageScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Best: </span>
                        <span className="font-medium">{entry.bestScore}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quizzes: </span>
                        <span className="font-medium">
                          {entry.totalQuizzes}
                        </span>
                      </div>
                      {entry.averageCompletionTime > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            Avg Time:{" "}
                          </span>
                          <span className="font-medium">
                            {formatTime(entry.averageCompletionTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredLeaderboard.length === 0 && searchTerm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground text-center">
              No users match your search criteria. Try adjusting your search
              terms.
            </p>
          </CardContent>
        </Card>
      )}

      {leaderboard.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Quiz Data Available
            </h3>
            <p className="text-muted-foreground text-center">
              No users have completed any quizzes yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
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