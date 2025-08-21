'use client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { Quiz } from "@/data/quiz"
import { db } from "@/lib/config/firebase-config"
import type { User } from "@/lib/db_user"
import { getAllReports, type QuizReport } from "@/lib/utils/db_reports"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { useEffect, useState } from "react"
import type { Log } from "@/lib/db_logs"
import { checkActiveSession, forceLogoutUser } from "@/lib/db_user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  Users as UsersIcon,
  BookOpen,
  FileText,
  Clock,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, subDays } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { getQuizzes } from "@/lib/db_quiz"


export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<QuizReport[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  useEffect(() => {
    // Set page title
    document.title = "Admin Dashboard - AzoozGAT Platform";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          usersList.push({ ...doc.data(), id: doc.id } as User);
        });
        setUsers(usersList);

        const reportsData = await getAllReports();
        setReports(reportsData);

        const quizzesData = await getQuizzes();
        setQuizzes(quizzesData)
        const logsCollection = collection(db, "logs");
        const logsQuery = query(logsCollection, orderBy("timestamp", "desc"), limit(100));
        const logsSnapshot = await getDocs(logsQuery);
        const logsData: Log[] = [];
        logsSnapshot.forEach((doc) => {
          logsData.push({ ...doc.data(), id: doc.id } as Log);
        });
        setLogs(logsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const totalUsers = users.length;
  const totalQuizzes = quizzes.length;
  const totalReports = reports.length;

  const averageScore = reports.length > 0
    ? reports.reduce((sum, report) => sum + (report.percentageScore || 0), 0) / reports.length
    : 0;

  const passedReports = reports.filter(report => (report.percentageScore || 0) >= 50);
  const passRate = reports.length > 0 ? (passedReports.length / reports.length) * 100 : 0;

  const recentLogs = logs.slice(0, 8);

  const quizReportCounts = quizzes.map(quiz => {
    const quizReports = reports.filter(report => report.quizId === quiz.id);
    return {
      ...quiz,
      reportCount: quizReports.length,
      averageScore: quizReports.length > 0
        ? quizReports.reduce((sum, report) => sum + (report.percentageScore || 0), 0) / quizReports.length
        : 0
    };
  });

  const popularQuizzes = [...quizReportCounts].sort((a, b) => b.reportCount - a.reportCount).slice(0, 5);

  const userPerformance = users.map(user => {
    const userReports = reports.filter(report => report.userId === user.id);
    return {
      ...user,
      reportCount: userReports.length,
      averageScore: userReports.length > 0
        ? userReports.reduce((sum, report) => sum + (report.percentageScore || 0), 0) / userReports.length
        : 0
    };
  });

  const topPerformers = [...userPerformance]
    .filter(user => user.reportCount > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5);

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return <UserIcon className="h-4 w-4 mr-2 text-blue-500" />;
      case 'QUIZ_CREATE':
        return <BookOpen className="h-4 w-4 mr-2 text-green-500" />;
      case 'QUIZ_UPDATE':
        return <FileText className="h-4 w-4 mr-2 text-amber-500" />;
      case 'CREATE_REPORT':
        return <Activity className="h-4 w-4 mr-2 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  return (
    <>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your platform&apos;s performance and activity.</p>
            </div>

          </div>

          {/* Key Metrics Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active platform users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQuizzes}</div>
                <p className="text-xs text-muted-foreground">
                  {quizzes.filter(q => q.quizType === 'normal').length} normal, {quizzes.filter(q => q.quizType === 'no-review').length} no review mode
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReports}</div>
                <p className="text-xs text-muted-foreground">
                  {passedReports.length} passed, {reports.length - passedReports.length} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
                <div className="mt-2">
                  <Progress value={passRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables Section */}
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4 mb-8 h-12">
              <TabsTrigger value="overview">Platform Overview</TabsTrigger>
              <TabsTrigger value="quizzes">Quiz Metrics</TabsTrigger>
              <TabsTrigger value="users">User Activity</TabsTrigger>
              <TabsTrigger value="sessions">Session Management</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Average Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Average Score</CardTitle>
                    <CardDescription>
                      Overall average score across all quizzes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-4xl font-bold">{averageScore.toFixed(1)}%</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs">0%</span>
                          <span className="text-xs">100%</span>
                        </div>
                        <Progress value={averageScore} className="h-3" />
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-green-500">
                          {reports.filter(r => (r.percentageScore || 0) >= 70).length}
                        </div>
                        <div className="text-xs text-muted-foreground">High Scores</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-yellow-500">
                          {reports.filter(r => (r.percentageScore || 0) >= 50 && (r.percentageScore || 0) < 70).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Medium Scores</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-500">
                          {reports.filter(r => (r.percentageScore || 0) < 50).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Low Scores</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity Log */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest actions on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {recentLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start">
                        <div className="mr-2 mt-0.5">
                          {getLogIcon(log.action)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={() => setSelectedLog(log)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Activity Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this activity
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Action</h4>
                                    <p className="text-sm">{selectedLog.action.replace(/_/g, ' ')}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Time</h4>
                                    <p className="text-sm">
                                      {format(new Date(selectedLog.timestamp), 'PPpp')}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">User ID</h4>
                                  <p className="text-sm text-muted-foreground">{selectedLog.userId}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Details</h4>
                                  <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                                    <code className="text-white text-xs">
                                      { // if plain text, show it as is
                                        selectedLog.details && !selectedLog.details.startsWith('{') &&
                                          selectedLog.details && !selectedLog.details.startsWith('[') ? (
                                          selectedLog.details
                                        ) : JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}

                    <Button variant="outline" className="w-full" asChild>
                      <a href="/dashboard/logs">View All Logs</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Popular Quizzes */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Attempted Quizzes</CardTitle>
                  <CardDescription>
                    Quizzes with the highest number of attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quiz Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Avg. Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {popularQuizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell className="font-medium">{quiz.title}</TableCell>
                          <TableCell>
                            <Badge variant={quiz.quizType === 'no-review' ? 'default' : 'outline'}>
                              {quiz.quizType || 'normal'}
                            </Badge>
                          </TableCell>
                          <TableCell>{quiz.reportCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full mr-2 ${quiz.averageScore >= 70 ? 'bg-green-500' :
                                quiz.averageScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                              {quiz.averageScore.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/dashboard/quizzes/edit/${quiz.id}`}>View</a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {popularQuizzes.length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No quiz attempts recorded yet</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <a href="/dashboard/quizzes">Manage Quizzes</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              {/* Quiz Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quiz Completion Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(reports.length / (users.length * quizzes.length) * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {reports.length} attempts out of {users.length * quizzes.length} possible
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reports.length > 0
                        ? Math.floor(reports.reduce((sum, report) => sum + report.timeTaken, 0) / reports.length)
                        : 0} min
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average time per quiz attempt
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Easy Questions</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-muted-foreground">
                      Average correct answer rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hard Questions</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">22%</div>
                    <p className="text-xs text-muted-foreground">
                      Average incorrect answer rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quiz Types Distribution */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Type Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of quiz types in the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-8">
                    <div className="w-full max-w-md flex flex-col gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            <span>Normal Quizzes</span>
                          </div>
                          <span className="font-medium">
                            {quizzes.filter(q => q.quizType === 'normal' || !q.quizType).length}
                          </span>
                        </div>
                        <Progress
                          value={(quizzes.filter(q => q.quizType === 'normal' || !q.quizType).length / quizzes.length) * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                            <span>No-review Quizzes</span>
                          </div>
                          <span className="font-medium">
                            {quizzes.filter(q => q.quizType === 'no-review').length}
                          </span>
                        </div>
                        <Progress
                          value={(quizzes.filter(q => q.quizType === 'no-review').length / quizzes.length) * 100}
                          className="h-2 bg-secondary"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of score ranges across all attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-6">
                    <div className="w-full max-w-md space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>90-100%</span>
                          <span className="font-medium">
                            {reports.filter(r => (r.percentageScore || 0) >= 90).length}
                          </span>
                        </div>
                        <Progress
                          value={(reports.filter(r => (r.percentageScore || 0) >= 90).length / reports.length) * 100}
                          className="h-2 bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>70-89%</span>
                          <span className="font-medium">
                            {reports.filter(r => (r.percentageScore || 0) >= 70 && (r.percentageScore || 0) < 90).length}
                          </span>
                        </div>
                        <Progress
                          value={(reports.filter(r => (r.percentageScore || 0) >= 70 && (r.percentageScore || 0) < 90).length / reports.length) * 100}
                          className="h-2 bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>50-69%</span>
                          <span className="font-medium">
                            {reports.filter(r => (r.percentageScore || 0) >= 50 && (r.percentageScore || 0) < 70).length}
                          </span>
                        </div>
                        <Progress
                          value={(reports.filter(r => (r.percentageScore || 0) >= 50 && (r.percentageScore || 0) < 70).length / reports.length) * 100}
                          className="h-2 bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>0-49%</span>
                          <span className="font-medium">
                            {reports.filter(r => (r.percentageScore || 0) < 50).length}
                          </span>
                        </div>
                        <Progress
                          value={(reports.filter(r => (r.percentageScore || 0) < 50).length / reports.length) * 100}
                          className="h-2 bg-muted"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Quiz Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Quiz Reports</CardTitle>
                  <CardDescription>
                    Latest quiz attempts by users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Time Taken</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.slice(0, 5).map((report) => {
                        const user = users.find(u => u.id === report.userId);
                        const quiz = quizzes.find(q => q.id === report.quizId);

                        return (
                          <TableRow key={report.dateTaken}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user?.displayName || user?.email || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{quiz?.title || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${(report.percentageScore || 0) >= 70 ? 'bg-green-100 text-green-800' :
                                (report.percentageScore || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {report.score} / {report.maxScore} ({report.percentageScore?.toFixed(0)}%)
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {
                                // timeTaken is in minutes and a float
                                report.timeTaken ? `${Math.floor(report.timeTaken)} min ${Math.round((report.timeTaken % 1) * 60)} sec` : 'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              {report.dateTaken ? format(new Date(report.dateTaken), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {reports.length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No quiz reports available</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <a href="/dashboard/results">View All Results</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              {/* User Activity Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(user =>
                        reports.some(report => report.userId === user.id)
                      ).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users who have taken at least one quiz
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hard Mode Users</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(user =>
                        reports.some(report =>
                          report.userId === user.id &&
                          (report.percentageScore || 0) >= 70 &&
                          quizzes.find(q => q.id === report.quizId)?.quizType === 'no-review'
                        )
                      ).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users who passed hard mode quizzes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Attempts</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.length > 0 ? (reports.length / users.length).toFixed(1) : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average quiz attempts per user
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {logs.filter(log =>
                        log.action === 'USER_LOGIN' &&
                        new Date(log.timestamp) > subDays(new Date(), 7)
                      ).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Logins in the past 7 days
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>
                    Users with the highest average scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Quiz Attempts</TableHead>
                        <TableHead>Avg. Score</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPerformers.map((user) => {
                        const userLogs = logs.filter(log => log.userId === user.id);
                        const latestLog = userLogs.length > 0 ?
                          userLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null;

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.displayName || user.email}</p>
                                  <p className="text-xs text-muted-foreground">{user.role || 'user'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.reportCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${user.averageScore >= 70 ? 'bg-green-500' :
                                  user.averageScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                {user.averageScore.toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell>
                              {latestLog ? format(new Date(latestLog.timestamp), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/dashboard/users/${user.id}`}>View</a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {topPerformers.length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No user data available</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <a href="/dashboard/users">Manage Users</a>
                  </Button>
                </CardContent>
              </Card>

              {/* Inactive Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Inactive Users</CardTitle>
                  <CardDescription>
                    Users who haven&apos;t taken any quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(user => !reports.some(report => report.userId === user.id))
                        .slice(0, 5)
                        .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.displayName || 'Unnamed User'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.metadata.createdAt ? format(new Date(user.metadata.createdAt), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/dashboard/users/${user.id}`}>View</a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <a href="/dashboard/users">Manage Users</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              {/* Active Sessions Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(user => user.role === "user" && user.metadata.currentSession).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users currently logged in
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(user => user.role === "user" && !user.metadata.currentSession).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users not currently logged in
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admin Sessions</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(user => user.role === "admin").length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Admin accounts (multi-session enabled)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Session Policy</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Single</div>
                    <p className="text-xs text-muted-foreground">
                      One session per user account
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Sessions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Active User Sessions</CardTitle>
                  <CardDescription>
                    Currently logged in users with session details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(user => user.role === "user" && user.metadata.currentSession)
                        .map((user) => {
                          const session = user.metadata.currentSession;
                          return (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.displayName || user.email}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {session?.loginAt ? format(new Date(session.loginAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">{session?.ip || 'N/A'}</span>
                              </TableCell>
                              <TableCell>
                                {session?.location ? (
                                  <div className="text-sm">
                                    <div>{session.location.city || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {session.location.country || 'Unknown'}
                                    </div>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {session?.device ? (
                                  <div className="text-sm">
                                    <div>{session.device.browser || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {session.device.os || 'Unknown'} • {session.device.type || 'Unknown'}
                                    </div>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await forceLogoutUser(user.id);
                                      // Refresh the page to update the data
                                      window.location.reload();
                                    } catch (error) {
                                      console.error('Error forcing logout:', error);
                                    }
                                  }}
                                >
                                  Force Logout
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>

                  {users.filter(user => user.role === "user" && user.metadata.currentSession).length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No active user sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Session History</CardTitle>
                  <CardDescription>
                    Recent login and logout events for user accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(user => user.role === "user" && user.metadata.sessions && user.metadata.sessions.length > 0)
                        .flatMap(user => 
                          user.metadata.sessions!.map(session => ({
                            user,
                            session,
                            event: session.endedAt ? 'Logout' : 'Login'
                          }))
                        )
                        .sort((a, b) => new Date(b.session.loginAt).getTime() - new Date(a.session.loginAt).getTime())
                        .slice(0, 10)
                        .map((item, index) => {
                          const duration = item.session.endedAt 
                            ? Math.round((new Date(item.session.endedAt).getTime() - new Date(item.session.loginAt).getTime()) / (1000 * 60))
                            : null;
                          
                          return (
                            <TableRow key={`${item.user.id}-${item.session.sessionId}-${index}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>{item.user.displayName?.charAt(0) || item.user.email?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{item.user.displayName || item.user.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.event === 'Login' ? 'default' : 'secondary'}>
                                  {item.event}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(item.session.loginAt), 'MMM d, yyyy h:mm a')}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">{item.session.ip || 'N/A'}</span>
                              </TableCell>
                              <TableCell>
                                {duration ? `${duration} min` : 'Active'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>

                  {users.filter(user => user.role === "user" && user.metadata.sessions && user.metadata.sessions.length > 0).length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No session history available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </>
  )
}

