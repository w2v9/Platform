'use client';
import React, { useState, useEffect } from 'react';
import {
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Loader, UserPen, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ActionCard } from "@/components/ActionCard";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { UserCog, Ban } from "lucide-react";
import { db } from "@/lib/config/firebase-config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { User } from "@/lib/db_user";
import { getAllUsers } from "@/lib/db_user";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientUsersProps {
    initialUsers: User[];
}

export function ClientUsers({ initialUsers }: ClientUsersProps) {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch users data on client side
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersData = await getAllUsers();
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Failed to load users');
            }
        };

        fetchUsers();
    }, []);

    const actionCards = [
        {
            title: "Create User",
            description: "Create a new user",
            icon: () => <UserPlus />,
            action: '/dashboard/users/create',
        },
        {
            title: "Edit User",
            description: "Edit an existing user",
            icon: () => <UserPen />,
            action: '/dashboard/users/edit',
        },
    ]

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
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard/admin">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Users</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {actionCards.map((card, index) => (
                        <ActionCard
                            key={index}
                            title={card.title}
                            description={card.description}
                            icon={card.icon}
                            action={card.action}
                        />
                    ))}
                </div>
            </div>
            <Separator className="my-4" />

            <div className="p-4">
                <Card className="relative">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Users Management</CardTitle>
                            <CardDescription>
                                Manage platform users and their permissions
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
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
                                        const selectedUsers = Object.keys(rowSelection).length > 0
                                            ? users.filter((_, index) => rowSelection[index as keyof typeof rowSelection])
                                            : users;

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
                                                No users found.
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
    )
}
