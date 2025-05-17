"use client";

import { useState, useEffect } from "react";
import { getAllLogs, getLogsByUserId, Log } from "@/lib/db_logs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowUpDown,
    Download,
    Eye,
    Loader,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function LogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [userId, setUserId] = useState<string>("");

    const [sorting, setSorting] = useState<SortingState>([
        { id: "timestamp", desc: true }
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const columns: ColumnDef<Log>[] = [
        {
            accessorKey: "timestamp",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="whitespace-nowrap"
                >
                    Timestamp
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const timestamp = row.getValue("timestamp") as string;
                return (
                    <div className="font-medium">
                        {format(new Date(timestamp), "PPp")}
                    </div>
                );
            },
        },
        {
            accessorKey: "userId",
            header: "User ID",
            cell: ({ row }) => {
                const userId = row.getValue("userId") as string;
                return (
                    <div className="max-w-[180px] truncate" title={userId}>
                        {userId}
                    </div>
                );
            },
        },
        {
            accessorKey: "action",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Action
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const action = row.getValue("action") as string;
                return (
                    <Badge variant={getBadgeVariant(action)}>
                        {action}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "details",
            header: "Details",
            cell: ({ row }) => {
                const details = row.getValue("details") as string;
                return (
                    <div className="max-w-[300px] truncate" title={details}>
                        {details}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSelectedLog(row.original);
                            setIsDialogOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                );
            },
        },
    ];

    function getBadgeVariant(action: string): "default" | "destructive" | "outline" | "secondary" {
        if (action.includes("login") || action.includes("LOGIN")) return "default";
        if (action.includes("create") || action.includes("CREATE")) return "secondary";
        if (action.includes("delete") || action.includes("DELETE") ||
            action.includes("error") || action.includes("ERROR")) return "destructive";
        return "outline";
    }

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            try {
                const fetchedLogs = userId
                    ? await getLogsByUserId(userId)
                    : await getAllLogs();

                setLogs(fetchedLogs);
                setError(null);
            } catch (err) {
                console.error("Error fetching logs:", err);
                setError("Failed to load logs. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchLogs();
    }, [userId]);

    const table = useReactTable({
        data: logs,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const exportToCSV = () => {
        const dataToExport = Object.keys(rowSelection).length > 0
            ? logs.filter((_, index) => rowSelection[index as keyof typeof rowSelection])
            : logs;

        const headers = ["Timestamp", "User ID", "Action", "Details"];
        const csvContent = [
            headers.join(","),
            ...dataToExport.map(log => [
                new Date(log.timestamp).toLocaleString(),
                log.userId,
                `"${log.action}"`,
                `"${log.details}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `logs_export_${new Date().toISOString()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            <BreadcrumbPage>Logs</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="p-4">
                <Card className="relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm rounded-md">
                            <div className="flex flex-col items-center gap-2">
                                <Loader className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading logs...</p>
                            </div>
                        </div>
                    )}

                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>System Logs</CardTitle>
                                <CardDescription>
                                    View and analyze system activity logs
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportToCSV}
                                    className="whitespace-nowrap"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {error ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-destructive mb-4">{error}</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setError(null);
                                        setLoading(true);
                                        getAllLogs().then(logs => {
                                            setLogs(logs);
                                            setLoading(false);
                                        }).catch(err => {
                                            console.error("Error fetching logs:", err);
                                            setError("Failed to load logs. Please try again.");
                                            setLoading(false);
                                        });
                                    }}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="relative w-full md:w-auto flex-1 max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search logs..."
                                            className="pl-8"
                                            value={(table.getColumn("details")?.getFilterValue() as string) ?? ""}
                                            onChange={(event) =>
                                                table.getColumn("details")?.setFilterValue(event.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="ml-auto">
                                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                                    View
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {table
                                                    .getAllColumns()
                                                    .filter((column) => column.getCanHide())
                                                    .map((column) => {
                                                        return (
                                                            <DropdownMenuCheckboxItem
                                                                key={column.id}
                                                                className="capitalize"
                                                                checked={column.getIsVisible()}
                                                                onCheckedChange={(value) =>
                                                                    column.toggleVisibility(!!value)
                                                                }
                                                            >
                                                                {column.id === "userId" ? "User ID" : column.id}
                                                            </DropdownMenuCheckboxItem>
                                                        );
                                                    })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <TableRow key={headerGroup.id}>
                                                    {headerGroup.headers.map((header) => (
                                                        <TableHead key={header.id}>
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableHeader>
                                        <TableBody>
                                            {table.getRowModel().rows?.length ? (
                                                table.getRowModel().rows.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        data-state={row.getIsSelected() && "selected"}
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell key={cell.id}>
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={columns.length}
                                                        className="h-24 text-center"
                                                    >
                                                        {loading ? "Loading..." : "No logs found."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <div className="flex-1 text-sm text-muted-foreground">
                                        {logs.length} log entries found.
                                    </div>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Log Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl max-w-[95vw] p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Log Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about this log entry
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 overflow-hideen">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                                <div className="col-span-1 font-medium">Timestamp</div>
                                <div className="col-span-1 sm:col-span-2">
                                    {format(new Date(selectedLog.timestamp), "PPpp")}
                                </div>

                                <div className="col-span-1 font-medium">User ID</div>
                                <div className="col-span-1 sm:col-span-2 break-all text-sm sm:text-base">
                                    {selectedLog.userId}
                                </div>

                                <div className="col-span-1 font-medium">Action</div>
                                <div className="col-span-1 sm:col-span-2">
                                    <Badge variant={getBadgeVariant(selectedLog.action)}>
                                        {selectedLog.action}
                                    </Badge>
                                </div>

                                <div className="col-span-1 font-medium">Log ID</div>
                                <div className="col-span-1 sm:col-span-2 break-all text-sm sm:text-base">
                                    {selectedLog.id}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="font-medium mb-2">Details</div>
                                <ScrollArea className="w-[85vw] md:w-lg rounded-md border p-4">
                                    <div>
                                        <pre className="text-sm sm:text-base whitespace-pre-wrap break-words">
                                            {selectedLog.details}
                                        </pre>
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </SidebarInset>
    );
}