"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/db_user";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import {
    ArrowUpDown,
    ChevronDown,
    MoreHorizontal,
    UserCog,
    FileQuestion,
    Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { doc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase-config";

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [quizAssignDialogOpen, setQuizAssignDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const columns: ColumnDef<User>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={
                            table.getIsAllPageRowsSelected()
                        }
                        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                        aria-label="Select all"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={row.getIsSelected()}
                        onChange={(e) => row.toggleSelected(!!e.target.checked)}
                        aria-label="Select row"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "displayName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="font-medium">{row.getValue("displayName")}</div>
                    {row.original.role === "admin" && (
                        <Badge variant="outline" className="ml-2 bg-amber-100">
                            Admin
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <div>{row.getValue("email")}</div>,
        },
        {
            accessorKey: "metadata.lastLoginAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Last Login
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const lastLogin = row.original.metadata.lastLoginAt;
                if (!lastLogin) return <div className="text-muted-foreground">Never</div>;
                return (
                    <div title={new Date(lastLogin).toLocaleString()}>
                        {new Date(lastLogin).toLocaleDateString()}
                    </div>
                );
            },
        },
        {
            accessorKey: "quizAccess",
            header: "Quiz Access",
            cell: ({ row }) => {
                const quizAccess = row.original.quizAccess;
                const count = Object.keys(quizAccess || {}).length;

                return (
                    <div className="text-center">
                        <Badge variant={count > 0 ? "default" : "outline"}>
                            {count}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/users/edit/${user.id}`)}
                            >
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit User
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedUser(user);
                                    setQuizAssignDialogOpen(true);
                                }}
                            >
                                <FileQuestion className="mr-2 h-4 w-4" />
                                Manage Quiz Access
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedUser(user);
                                    setBanDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // Fetch users data
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersCollection = collection(db, "users");
                const usersSnapshot = await getDocs(usersCollection);
                const usersList: User[] = [];

                usersSnapshot.forEach((doc) => {
                    usersList.push(doc.data() as User);
                });

                setUsers(usersList);
                setError(null);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to load users");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const table = useReactTable({
        data: users,
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

    const handleBanUser = async (userId: string, isBanned: boolean) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                "status": isBanned ? "banned" : "active",
                "metadata.updatedAt": new Date().toISOString()
            });

            setUsers(users.map(user =>
                user.id === userId
                    ? { ...user, status: isBanned ? "banned" : "active" }
                    : user
            ));

            toast.success(`User ${isBanned ? "banned" : "unbanned"} successfully!`);
            setBanDialogOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user status");
        }
    };

    return (
        <SidebarInset>
            <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/admin">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit</BreadcrumbPage>
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
                                <p className="text-sm text-muted-foreground">Loading users...</p>
                            </div>
                        </div>
                    )}

                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Users Management</CardTitle>
                            <CardDescription>
                                Manage platform users and their permissions
                            </CardDescription>
                        </div>
                        <Button onClick={() => router.push("/dashboard/users/create")}>
                            Add New User
                        </Button>
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
                                        // Refetch users
                                        const fetchUsers = async () => {
                                            try {
                                                const usersCollection = collection(db, "users");
                                                const usersSnapshot = await getDocs(usersCollection);
                                                const usersList: User[] = [];

                                                usersSnapshot.forEach((doc) => {
                                                    usersList.push(doc.data() as User);
                                                });

                                                setUsers(usersList);
                                                setError(null);
                                            } catch (err) {
                                                console.error("Error fetching users:", err);
                                                setError("Failed to load users");
                                            } finally {
                                                setLoading(false);
                                            }
                                        };
                                        fetchUsers();
                                    }}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex items-center justify-between">
                                    <Input
                                        placeholder="Filter users..."
                                        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                                        onChange={(event) =>
                                            table.getColumn("email")?.setFilterValue(event.target.value)
                                        }
                                        className="max-w-sm"
                                    />

                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline">
                                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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
                                                                {column.id === "metadata.lastLoginAt" ? "Last Login" : column.id}
                                                            </DropdownMenuCheckboxItem>
                                                        );
                                                    })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                // Export selected users or all if none selected
                                                const selectedUsers = Object.keys(rowSelection).length > 0
                                                    ? users.filter((_, index) => rowSelection[index as keyof typeof rowSelection])
                                                    : users;

                                                // Create CSV
                                                const headers = ["Name", "Email", "Role", "Last Login"];
                                                const csvContent = [
                                                    headers.join(","),
                                                    ...selectedUsers.map(user => [
                                                        user.displayName,
                                                        user.email,
                                                        user.role,
                                                        user.metadata.lastLoginAt
                                                            ? new Date(user.metadata.lastLoginAt).toLocaleDateString()
                                                            : "Never"
                                                    ].join(","))
                                                ].join("\n");

                                                // Download
                                                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement("a");
                                                link.setAttribute("href", url);
                                                link.setAttribute("download", "users.csv");
                                                link.style.visibility = "hidden";
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            Export
                                        </Button>
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
                                                        className={
                                                            row.original.status === "banned" ? "bg-red-50" : ""
                                                        }
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
                                                        {loading ? "Loading..." : "No users found."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <div className="flex-1 text-sm text-muted-foreground">
                                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                        {table.getFilteredRowModel().rows.length} row(s) selected.
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

            <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedUser?.status === "banned" ? "Unban User" : "Ban User"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedUser?.status === "banned"
                                ? "This will restore the user's access to the platform."
                                : "This will prevent the user from accessing the platform."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="mb-2">
                            <span className="font-semibold">User:</span> {selectedUser?.displayName}
                        </p>
                        <p>
                            <span className="font-semibold">Email:</span> {selectedUser?.email}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBanDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={selectedUser?.status === "banned" ? "default" : "destructive"}
                            onClick={() => {
                                if (selectedUser) {
                                    handleBanUser(
                                        selectedUser.id,
                                        selectedUser.status !== "banned"
                                    );
                                }
                            }}
                        >
                            {selectedUser?.status === "banned" ? "Unban User" : "Ban User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarInset>
    );
}