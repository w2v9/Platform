"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, getUserById, resetPasswordMail } from "@/lib/db_user";
import { Loader, UserCog, FileQuestion, Clock, Shield } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase-config";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { getQuizzes } from "@/lib/db_quiz";
import { useAuth } from "@/lib/context/authContext";
import { recordLog } from "@/lib/db_logs";
import { v4 } from "uuid";
import { Quiz } from "@/data/quiz";

const userSchema = z.object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    username: z.string().optional(),
    role: z.enum(["user", "admin"]),
    status: z.enum(["inactive", "active", "warned", "banned"]).default("active"),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    const { user: loggedUser } = useAuth();
    const unwrappedParams = use(params);
    const userId = unwrappedParams.id;

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);


    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema) as Resolver<UserFormValues>,
        defaultValues: {
            displayName: "",
            email: "",
            phone: "",
            username: "",
            role: "user",
            status: "active",
        },
    });

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const userData = await getUserById(userId);
                if (userData) {
                    setUser(userData);
                    form.reset({
                        displayName: userData.displayName,
                        email: userData.email,
                        phone: userData.phone || "",
                        username: userData.username || "",
                        role: userData.role,
                        status: userData.status || "active",
                    });
                } else {
                    toast.error("User not found");
                    router.push("/dashboard/users");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                toast.error("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        const fetchQuizzes = async () => {
            getQuizzes().then((quizzes) => {
                setAvailableQuizzes(quizzes);
            });
        };

        fetchUser();
        fetchQuizzes();
    }, [userId, router, form]);


    const onSubmit = async (data: UserFormValues) => {
        const loadingToast = toast.loading("Saving user information...");
        if (!user) return;

        setSaving(true);
        try {
            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, {
                displayName: data.displayName,
                phone: data.phone,
                username: data.username,
                role: data.role,
                status: data.status,
                "metadata.updatedAt": new Date().toISOString()
            });

            if (loggedUser?.uid === user.id) {
                await recordLog({
                    id: v4(),
                    userId: user.id,
                    action: "USER_UPDATE",
                    details: JSON.stringify({
                        updatedUser: user.id,
                        changedUser: JSON.stringify(user),
                    }),
                    timestamp: new Date().toISOString(),
                });
            }


            toast.success("User updated successfully", {
                id: loadingToast,
            });
            setUser({
                ...user,
                displayName: data.displayName,
                phone: data.phone,
                username: data.username,
                role: data.role,
                status: data.status,
            });
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user", {
                id: loadingToast,
            });
        } finally {
            setSaving(false);
        }
    };

    const resetPassword = async () => {
        if (!user) return;

        try {
            await resetPasswordMail(user.email);
            await recordLog({
                id: v4(),
                userId: user.id,
                action: "RESET_PASSWORD",
                details: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                }),
                timestamp: new Date().toISOString(),
            });

            toast.success("Password reset email sent to user");
        } catch (error) {
            console.error("Error resetting password:", error);
            let errorMessage = "Failed to send password reset email";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            await recordLog({
                id: v4(),
                userId: user.id,
                action: "ERROR",
                details: JSON.stringify({
                    userId: user.id,
                    error: errorMessage,
                }),
                timestamp: new Date().toISOString(),
            });
            toast.error("Failed to send password reset email");
        }
    };

    if (loading) {
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
                                <BreadcrumbPage>Edit User</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex h-screen items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p>Loading user information...</p>
                    </div>
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
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/users">Users</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit User</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="p-4">
                <Card className="mb-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {user?.displayName}
                                    {user?.role === "admin" && (
                                        <Badge variant="outline" className="ml-2 bg-blue-500 text-white">
                                            Admin
                                        </Badge>
                                    )}
                                    {user?.status === "banned" && (
                                        <Badge variant="destructive">
                                            Banned
                                        </Badge>
                                    )}
                                    {user?.status === "inactive" && (
                                        <Badge variant="outline">
                                            Inactive
                                        </Badge>
                                    )}
                                    {user?.status === "warned" && (
                                        <Badge variant="outline" className="ml-2 bg-amber-100">
                                            Warned
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>{user?.email}</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard/users")}
                            >
                                Back to Users
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Activity Log
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Profile</CardTitle>
                                <CardDescription>
                                    Update user information and account status
                                </CardDescription>
                            </CardHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="displayName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} disabled />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Email cannot be changed
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="username"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Username (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="role"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>User Role</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select role" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="user">User</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>
                                                            Controls what actions the user can perform
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Account Status</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                                <SelectItem value="warned">Warned</SelectItem>
                                                                <SelectItem value="banned">Banned</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>
                                                            Controls user&apos;s ability to access the platform
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="pb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Account Information
                                            </h3>
                                            <div className="grid grid-cols-2 text-sm gap-y-2 gap-x-4">
                                                <div className="font-medium">Created At</div>
                                                <div>
                                                    {user?.metadata?.createdAt
                                                        ? new Date(user.metadata.createdAt).toLocaleString()
                                                        : "Unknown"}
                                                </div>
                                                <div className="font-medium">Last Login</div>
                                                <div>
                                                    {user?.metadata?.lastLoginAt
                                                        ? new Date(user.metadata.lastLoginAt).toLocaleString()
                                                        : "Never"}
                                                </div>
                                                <div className="font-medium">Last Updated</div>
                                                <div>
                                                    {user?.metadata?.updatedAt
                                                        ? new Date(user.metadata.updatedAt).toLocaleString()
                                                        : "Unknown"}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push("/dashboard/users")}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={saving}>
                                            {saving ? (
                                                <>
                                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Changes"
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity & Login History</CardTitle>
                                <CardDescription>
                                    View user&apos;s login history and activity
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium mb-2">Login Sessions</h3>

                                    {user?.metadata?.sessions && user.metadata.sessions.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date & Time</TableHead>
                                                        <TableHead>IP Address</TableHead>
                                                        <TableHead>Location</TableHead>
                                                        <TableHead>Device</TableHead>
                                                        <TableHead>Browser</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {user.metadata.sessions.map((session, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                {new Date(session.loginAt).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>{session.ip || "Unknown"}</TableCell>
                                                            <TableCell>
                                                                {session.location?.city && session.location?.country
                                                                    ? `${session.location.city}, ${session.location.country}`
                                                                    : "Unknown"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {session.device?.type || "Unknown"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {session.device?.browser || "Unknown"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No login history available for this user.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-medium mb-2">Quiz Results</h3>

                                    {user?.quizResults && user.quizResults.length > 0 ? (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Quiz</TableHead>
                                                        <TableHead>Score</TableHead>
                                                        <TableHead>Date Taken</TableHead>
                                                        <TableHead>Completion Time</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {user.quizResults.map((result, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{result.quizId}</TableCell>
                                                            <TableCell>
                                                                {result.percentageScore}% ({result.score}/{result.maxScore})
                                                            </TableCell>
                                                            <TableCell>
                                                                {new Date(result.dateTaken).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                {Math.floor(result.completionTime / 60)}m {result.completionTime % 60}s
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No quiz results available for this user.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>
                                    Manage user&apos;s security settings and access
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-center p-4 border rounded-md">
                                    <div>
                                        <h3 className="font-medium">Reset Password</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Send a password reset email to the user
                                        </p>
                                    </div>
                                    <Button onClick={resetPassword}>
                                        Send Reset Link
                                    </Button>
                                </div>

                                <div className="flex justify-between items-center p-4 border rounded-md">
                                    <div>
                                        <h3 className="font-medium">
                                            {user?.status === "banned" ? "Unban User" : "Ban User"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {user?.status === "banned"
                                                ? "Restore user access to the platform"
                                                : "Block user from accessing the platform"}
                                        </p>
                                    </div>
                                    <Button
                                        variant={user?.status === "banned" ? "default" : "destructive"}
                                        onClick={async () => {
                                            if (!user) return;
                                            const loadingToast = toast.loading(
                                                user.status === "banned"
                                                    ? "Unbanning user..."
                                                    : "Banning user..."
                                            );
                                            try {
                                                const userRef = doc(db, "users", user.id);
                                                const newStatus = user.status === "banned" ? "active" : "banned";

                                                await updateDoc(userRef, {
                                                    status: newStatus,
                                                    "metadata.updatedAt": new Date().toISOString()
                                                });

                                                // Update local state and form
                                                setUser({
                                                    ...user,
                                                    status: newStatus
                                                });
                                                form.setValue("status", newStatus);

                                                toast.success(
                                                    newStatus === "banned"
                                                        ? "User has been banned"
                                                        : "User has been unbanned",
                                                    {
                                                        id: loadingToast,
                                                    }
                                                );
                                            } catch (error) {
                                                console.error("Error updating user status:", error);
                                                toast.error("Failed to update user status",
                                                    {
                                                        id: loadingToast,
                                                    }
                                                );
                                            }
                                        }}
                                    >
                                        {user?.status === "banned" ? "Unban User" : "Ban User"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </SidebarInset>
    );
}