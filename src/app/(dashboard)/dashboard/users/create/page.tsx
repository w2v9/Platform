"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserByAdmin, User } from "@/lib/db_user";
import generatePassword from "@/lib/utils/pass_gen";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { z } from "zod";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/context/authContext";
import { recordLog } from "@/lib/db_logs";
import { v4 } from "uuid";

const userSchema = z.object({
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    phone: z.string().optional(),
    role: z.enum(["user", "admin"]).default("user"),
})
    .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type FormValues = z.infer<typeof userSchema>;

export default function CreateUserPage() {
    const router = useRouter();
    const { user, handleError } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(userSchema) as Resolver<FormValues>,
        defaultValues: {
            displayName: "",
            email: "",
            password: "",
            confirmPassword: "",
            username: "",
            phone: "",
            role: "user",
        },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            setIsSubmitting(true);
            const userData: User = {
                id: "",
                displayName: data.displayName,
                email: data.email,
                username: data.username,
                phone: data.phone,
                role: data.role,
                status: "inactive",
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                quizResults: [],
            }

            await createUserByAdmin(
                userData,
                data.password,
            );

            if (user?.uid) {
                await recordLog({
                    id: v4(),
                    userId: user.uid,
                    action: "CREATE_USER",
                    details: JSON.stringify({
                        userId: userData.id,
                        displayName: userData.displayName,
                        email: userData.email,
                        role: userData.role,
                        status: userData.status,
                        createdAt: userData.metadata.createdAt,
                        updatedAt: userData.metadata.updatedAt,
                    }),
                    timestamp: new Date().toISOString(),
                })
            }

            toast.success("User created successfully! The user will need to set up their Firebase Auth account using their email.");
            router.push("/dashboard/users");
        } catch (error) {
            console.error("Error creating user:", error);
            
            // Check if it's a specific error we can handle gracefully
            if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
                toast.error("You don't have permission to create users.");
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                // Use the comprehensive error handler for other errors
                handleError(error, "User Creation");
            }
        } finally {
            setIsSubmitting(false);
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
                            <BreadcrumbPage>Create User</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <Card className="max-w-6xl mx-auto my-4">
                <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>
                        Add a new user to the platform
                    </CardDescription>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">User Information</h3>
                                <Separator />

                                <FormField
                                    control={form.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The user&apos;s full name as displayed in the platform.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="user@example.com" type="email" {...field} />
                                                </FormControl>
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
                                                    <Input placeholder="johndoe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1 (555) 123-4567" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Account Settings</h3>
                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <div className="flex items-center space-x-2">
                                                    <div className="relative flex-1">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="••••••••"
                                                                type={showPassword ? "text" : "password"}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-0 top-0 h-full px-3"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            <span className="sr-only">
                                                                {showPassword ? "Hide password" : "Show password"}
                                                            </span>
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newPassword = generatePassword();
                                                            form.setValue("password", newPassword);
                                                            form.setValue("confirmPassword", newPassword);
                                                        }}
                                                        title="Generate strong password"
                                                    >
                                                        <Wand2 className="h-4 w-4" />
                                                        <span className="sr-only">Generate password</span>
                                                    </Button>
                                                </div>
                                                <FormDescription>
                                                    Must be at least 8 characters with uppercase, lowercase, and numbers.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="••••••••"
                                                        type={showPassword ? "text" : "password"}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Please confirm your password.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                This determines what permissions the user will have.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push("/dashboard/users")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create User"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </SidebarInset>
    );
}