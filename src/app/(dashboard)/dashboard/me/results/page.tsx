"use client"
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/authContext";
import { getReportsByUserId, QuizReport, QuizReports } from "@/lib/utils/db_reports";
import { User } from "@/lib/db_user";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertCircle, CalendarIcon, Clock, FileText, ListFilter, Loader2, Search, User as UserIcon, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function ResultsPage() {
    const { user } = useAuth();
    const [userData, setUserData] = useState<User | null>(null);
    const [reports, setReports] = useState<QuizReports>([]);
    const [filteredReports, setFilteredReports] = useState<QuizReports>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReport, setSelectedReport] = useState<QuizReport | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [searchField, setSearchField] = useState<"quizTitle" | "quizId">("quizTitle");
    const [quizIds, setQuizIds] = useState<string[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string>("");
    const router = useRouter();


    const scoreRanges = [
        { label: "Below 50%", value: "below50", checked: false },
        { label: "50% - 70%", value: "50to70", checked: false },
        { label: "70% - 90%", value: "70to90", checked: false },
        { label: "Above 90%", value: "above90", checked: false },
    ];

    const [filters, setFilters] = useState(scoreRanges);

    useEffect(() => {
        document.title = "Quiz Results - AzoozGAT Platform";
    }, []);

    useEffect(() => {
        async function fetchReports() {
            if (!user) return;

            setLoading(true);
            setError(null);

            try {
                let reportData: QuizReports = [];

                reportData = await getReportsByUserId(user.uid);

                reportData = reportData.map(report => ({
                    ...report,
                    username: userData?.displayName || userData?.email || "You"
                }));

                const uniqueQuizIds = [...new Set(reportData.map(report => report.quizId))];
                setQuizIds(uniqueQuizIds);

                // Sort reports by date taken, most recent first
                reportData.sort((a, b) => {
                    const dateA = new Date(a.dateTaken || 0);
                    const dateB = new Date(b.dateTaken || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                setReports(reportData);
                setFilteredReports(reportData);
            } catch (error) {
                console.error("Error fetching reports:", error);
                setError("Failed to load reports");
            } finally {
                setLoading(false);
            }
        }

        fetchReports();
    }, [user, userData]);

    useEffect(() => {
        const applyFilters = () => {
            let filtered = [...reports];

            const activeFilters = filters.filter(f => f.checked).map(f => f.value);

            if (activeFilters.length > 0) {
                filtered = filtered.filter(report => {
                    const score = report.percentageScore || 0;

                    if (activeFilters.includes("below50") && score < 50) return true;
                    if (activeFilters.includes("50to70") && score >= 50 && score < 70) return true;
                    if (activeFilters.includes("70to90") && score >= 70 && score < 90) return true;
                    if (activeFilters.includes("above90") && score >= 90) return true;

                    return false;
                });
            }

            if (selectedQuizId) {
                filtered = filtered.filter(report => report.quizId === selectedQuizId);
            }

            if (searchTerm.trim() !== "") {
                const search = searchTerm.toLowerCase();

                if (searchField === "quizTitle") {
                    filtered = filtered.filter(report =>
                        report.quizTitle.toLowerCase().includes(search)
                    );
                } else if (searchField === "quizId") {
                    filtered = filtered.filter(report =>
                        report.quizId.toLowerCase().includes(search)
                    );
                } else if (searchField === "username") {
                    filtered = filtered.filter(report =>
                        report.userName?.toLowerCase().includes(search)
                    );
                }
            }

            // Apply tab filtering
            if (activeTab === "passed") {
                filtered = filtered.filter(report => (report.percentageScore || 0) >= 50);
            } else if (activeTab === "failed") {
                filtered = filtered.filter(report => (report.percentageScore || 0) < 50);
            }

            setFilteredReports(filtered);
        };

        applyFilters();
    }, [reports, searchTerm, searchField, filters, activeTab, selectedQuizId]);

    const handleFilterChange = (value: string) => {
        setFilters(filters.map(filter =>
            filter.value === value ? { ...filter, checked: !filter.checked } : filter
        ));
    };

    const handleClearFilters = () => {
        setFilters(scoreRanges.map(filter => ({ ...filter, checked: false })));
        setSearchTerm("");
        setSelectedQuizId("");
        setActiveTab("all");
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "PPP");
    };

    const formatTime = (minutes: number) => {
        if (minutes < 1) {
            const seconds = Math.round(minutes * 60);
            return `${String(seconds).padStart(2, "0")}s`;
        }

        const wholeMinutes = Math.floor(minutes);
        const seconds = Math.round((minutes - wholeMinutes) * 60);

        const formattedMinutes = String(wholeMinutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        return `${formattedMinutes}:${formattedSeconds}`;
    };

    const getScoreColor = (percentage?: number) => {
        if (!percentage) return "bg-gray-200 text-gray-800";
        if (percentage >= 90) return "bg-green-100 text-green-800";
        if (percentage >= 70) return "bg-blue-100 text-blue-800";
        if (percentage >= 50) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.some(f => f.checked)) count++;
        if (selectedQuizId) count++;
        return count;
    };

    if (loading) {
        return (
            <SidebarInset>
                <div className="h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading results...</p>
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
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="container mx-auto p-4">
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
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
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/me">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <BreadcrumbPage>Results</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Quiz Results</h1>

                <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex-1 w-full md:max-w-md flex items-center gap-2">
                        <Select
                            value={searchField}
                            onValueChange={(value) => setSearchField(value as "quizTitle" | "quizId")}
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Search by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="quizTitle">Quiz Title</SelectItem>
                                <SelectItem value="quizId">Quiz ID</SelectItem>
                                <SelectItem value="username">Username</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={`Search by ${searchField === "quizTitle" ? "quiz title" : searchField === "quizId" ? "quiz ID" : "username"}...`}
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ListFilter className="h-4 w-4 mr-2" />
                                    Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter Results</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Score Range</DropdownMenuLabel>
                                    {filters.map((filter) => (
                                        <DropdownMenuCheckboxItem
                                            key={filter.value}
                                            checked={filter.checked}
                                            onCheckedChange={() => handleFilterChange(filter.value)}
                                        >
                                            {filter.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Filter by Quiz</DropdownMenuLabel>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        <span>{selectedQuizId ? filteredReports.find(r => r.quizId === selectedQuizId)?.quizTitle || "Selected Quiz" : "Select Quiz"}</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="p-0">
                                        <div className="max-h-[200px] overflow-y-auto py-1">
                                            <DropdownMenuCheckboxItem
                                                checked={!selectedQuizId}
                                                onCheckedChange={() => setSelectedQuizId("")}
                                            >
                                                All Quizzes
                                            </DropdownMenuCheckboxItem>
                                            {quizIds.map((id) => {
                                                const quiz = reports.find(r => r.quizId === id);
                                                return (
                                                    <DropdownMenuCheckboxItem
                                                        key={id}
                                                        checked={selectedQuizId === id}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedQuizId(id);
                                                            else setSelectedQuizId("");
                                                        }}
                                                    >
                                                        {quiz?.quizTitle || id}
                                                    </DropdownMenuCheckboxItem>
                                                );
                                            })}
                                        </div>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-center mt-2"
                                    onClick={handleClearFilters}
                                    disabled={getActiveFiltersCount() === 0}
                                >
                                    Clear Filters
                                </Button>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList>
                        <TabsTrigger value="all">All Results</TabsTrigger>
                        <TabsTrigger value="passed">Passed</TabsTrigger>
                        <TabsTrigger value="failed">Failed</TabsTrigger>
                    </TabsList>
                </Tabs>

                {filteredReports.length === 0 ? (
                    <Card>
                        <CardContent className="py-10">
                            <div className="flex flex-col items-center justify-center text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">No results found</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {getActiveFiltersCount() > 0 || searchTerm
                                        ? "Try changing your search or filter criteria"
                                        : "You haven't taken any quizzes yet"}
                                </p>
                                {(getActiveFiltersCount() > 0 || searchTerm) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={handleClearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableCaption>
                                Showing {filteredReports.length} of {reports.length} results
                                {getActiveFiltersCount() > 0 && " (filtered)"}
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Quiz</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Time Taken</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map((report) => (
                                    <TableRow key={report.quizId + report.dateTaken + report.userId}>
                                        <TableCell className="font-medium">
                                            <div className="max-w-[200px] truncate" title={report.quizTitle}>
                                                {report.quizTitle}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                ID: {report.quizId.substring(0, 8)}...
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {formatDate(report.dateTaken)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getScoreColor(report.percentageScore)}`}>
                                                {report.score} / {report.maxScore} ({report.percentageScore?.toFixed(0)}%)
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {formatTime(report.timeTaken)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/dashboard/me/results/${report.id}`)}
                                            >
                                                View Details
                                            </Button>

                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </SidebarInset>
    );
}
