"use client"
import { useState, useEffect, useCallback } from "react";
import { FileDown, FileText, Info, RefreshCw, Search, Eye, Calendar, User, FileType } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
    userId: string;
    userEmail: string;
    userName: string;
    fileName: string;
    downloadTime: string;
    ipAddress: string;
    watermarkData: {
        userId: string;
        userEmail: string;
        userName: string;
        downloadTime: string;
        filename: string;
    };
}

export default function DownloadLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Set page title
    useEffect(() => {
        document.title = "Download Logs - AzoozGAT Platform";
    }, []);

    const filterLogs = useCallback(() => {
        if (!searchTerm.trim()) {
            setFilteredLogs(logs);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = logs.filter(log =>
            log.fileName.toLowerCase().includes(term) ||
            log.userEmail.toLowerCase().includes(term) ||
            log.userName.toLowerCase().includes(term) ||
            log.userId.toLowerCase().includes(term) ||
            log.ipAddress.toLowerCase().includes(term)
        );

        setFilteredLogs(filtered);
    }, [logs, searchTerm]);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        if (logs.length > 0) {
            filterLogs();
        }
    }, [logs, searchTerm, filterLogs]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/logs/pdf-downloads');

            if (!response.ok) {
                throw new Error(`Error fetching logs: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Sort logs by download time (newest first)
            const sortedLogs = data.logs.sort((a: LogEntry, b: LogEntry) =>
                new Date(b.downloadTime).getTime() - new Date(a.downloadTime).getTime()
            );

            setLogs(sortedLogs);
            setFilteredLogs(sortedLogs);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching logs');
        } finally {
            setLoading(false);
        }
    };



    const handleViewDetails = (log: LogEntry) => {
        setSelectedLog(log);
        setIsDialogOpen(true);
    };

    const handleDownloadLogs = async () => {
        try {
            window.location.href = '/api/logs/pdf-downloads';
        } catch (err) {
            console.error('Error downloading logs:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while downloading logs');
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'PPpp');
        } catch (err) {
            return dateString;
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
                            <BreadcrumbLink href="/dashboard/admin">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Download Logs</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="container mx-auto p-6">
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">PDF Download Logs</h1>
                            <p className="text-sm text-muted-foreground">
                                View and download logs of all PDF file downloads
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                            <Button onClick={handleDownloadLogs} size={"sm"}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Download Logs
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search logs..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {filteredLogs.length} of {logs.length} entries
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md">
                            <p className="font-semibold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                <p>Loading logs...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 border rounded-md">
                                    <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No logs found</p>
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>File Name</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Download Time</TableHead>
                                                <TableHead>IP Address</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLogs.map((log, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{log.fileName}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span>{log.userName}</span>
                                                            <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDateTime(log.downloadTime)}</TableCell>
                                                    <TableCell>{log.ipAddress}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(log)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Download Log Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about the PDF download
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[450px] pr-4">
                        {selectedLog && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileType className="h-5 w-5" />
                                            File Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                                            <div>
                                                <p className="text-sm font-medium">File Name</p>
                                                <p className="text-sm">{selectedLog.fileName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Download Time</p>
                                                <p className="text-sm">{formatDateTime(selectedLog.downloadTime)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            User Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                                            <div>
                                                <p className="text-sm font-medium">User Name</p>
                                                <p className="text-sm">{selectedLog.userName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">User Email</p>
                                                <p className="text-sm">{selectedLog.userEmail}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">User ID</p>
                                                <p className="text-sm text-muted-foreground">{selectedLog.userId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">IP Address</p>
                                                <p className="text-sm">{selectedLog.ipAddress}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Info className="h-5 w-5" />
                                            Watermark Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                                            <code className="text-white text-xs">
                                                {JSON.stringify(selectedLog.watermarkData, null, 2)}
                                            </code>
                                        </pre>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </SidebarInset>
    );
}