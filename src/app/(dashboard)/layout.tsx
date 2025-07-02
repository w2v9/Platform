'use client';
import React, { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/context/authContext";
import { Toaster } from "@/components/ui/sonner";
import { useRouter, usePathname } from "next/navigation";
import { getUserById, UserRole } from "@/lib/db_user";
import { FileUser, Home, Inbox, ScrollText, Users, AlertTriangle, Loader2, FileDown, Trophy, BadgeCheck, Logs } from "lucide-react";
import { SidebarItem } from "@/components/app-sidebar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { auth } from "@/lib/config/firebase-config";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
    variable: "--font-noto-sans-arabic",
    subsets: ["arabic"],
});

// Define route types for better type safety
type RouteType = 'admin' | 'user' | 'common';

interface RouteDef {
    path: string;
    type: RouteType;
}

// Define the routes with their access level
const routes: RouteDef[] = [
    { path: '/dashboard/me', type: 'user' },
    { path: '/dashboard/me/quizzes', type: 'user' },
    { path: '/dashboard/me/results', type: 'user' },
    { path: '/dashboard/me/download', type: 'user' },
    { path: '/dashboard/me/leaderboard', type: 'user' },
    { path: '/dashboard/admin', type: 'admin' },
    { path: '/dashboard/verify-pdf', type: 'admin' },
    { path: '/dashboard/results', type: 'admin' },
    { path: '/dashboard/quizzes', type: 'admin' },
    { path: '/dashboard/quizzes/create', type: 'admin' },
    { path: '/dashboard/quizzes/edit', type: 'admin' },
    { path: '/dashboard/quizzes/edit/:id', type: 'admin' },
    { path: '/dashboard/quizzes/preview', type: 'admin' },
    { path: '/dashboard/users', type: 'admin' },
    { path: '/dashboard/users/create', type: 'admin' },
    { path: '/dashboard/users/edit', type: 'admin' },
    { path: '/dashboard/users/edit/:id', type: 'admin' },
    { path: '/dashboard/leaderboard', type: 'admin' },
    { path: '/dashboard/logs', type: 'admin' },
    { path: '/dashboard/download-logs', type: 'admin' },
];

const getNavigationItems = (role: UserRole | undefined): SidebarItem[] => {
    const userItems: SidebarItem[] = [
        {
            title: "Home",
            url: "/dashboard/me",
            icon: Home,
        },
        {
            title: "Quizzes",
            url: "/dashboard/me/quizzes",
            icon: ScrollText,
        },
        {
            title: "Results",
            url: "/dashboard/me/results",
            icon: FileUser,
        },
        {
            title: "Download",
            url: "/dashboard/me/download",
            icon: FileDown,
        },
        {
            title: "Leaderboard",
            url: "/dashboard/me/leaderboard",
            icon: Trophy,
        }
    ];

    const adminItems: SidebarItem[] = [
        {
            title: "admin",
            url: "/dashboard/admin",
            icon: Home,
        },
        {
            title: "Quizzes",
            url: "/dashboard/quizzes",
            icon: ScrollText,
        },
        {
            title: "Users",
            url: "/dashboard/users",
            icon: Users,
        },
        {
            title: "Leaderboard",
            url: "/dashboard/leaderboard",
            icon: Trophy,
        },
        {
            title: "Verify PDF",
            url: "/dashboard/verify-pdf",
            icon: BadgeCheck,
        },
        {
            title: "Download Logs",
            url: "/dashboard/download-logs",
            icon: Logs,
        },
        {
            title: "Logs",
            url: "/dashboard/logs",
            icon: Inbox,
        }
    ];

    return role === 'admin' ? [...adminItems] : userItems;
};

function RouteProtection({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [userData, setUserData] = useState<{ role?: UserRole } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (loading) return;

        async function checkAuth() {
            setIsLoading(true);
            setError(null);

            if (!user) {
                console.log("User not authenticated, redirecting to login");
                router.push("/login");
                return;
            }

            try {
                const userDoc = await getUserById(user.uid);
                setUserData(userDoc);
                if (!userDoc) {
                    console.error("User data not found in database");
                    router.push("/login");
                    return;
                }

                if (userDoc?.status === 'banned') {
                    console.error("User is banned!");
                    setError("Your account has been banned.");
                    return;
                }

                const currentRoute = routes.find(route =>
                    pathname === route.path || pathname.startsWith(`${route.path}/`)
                );

                if (currentRoute?.type === 'admin' && userDoc?.role !== 'admin') {
                    console.error("Unauthorized access attempt to admin route:", pathname);
                    setError("You don't have permission to access this page, Redirecting to home");
                    router.push("/dashboard/me");
                }
            } catch (error) {
                console.error("Authentication error:", error);
                setError("Authentication error occurred");
            } finally {
                setIsLoading(false);
            }
        }

        checkAuth();
    }, [user, loading, pathname, router]);

    if (isLoading || loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>
                            {error}. Please contact your administrator if you believe this is an error.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar items={getNavigationItems(userData?.role)} user={user} />
            <Toaster />
            <main className="w-full flex-1 overflow-auto bg-background">
                {children}
            </main>
        </SidebarProvider>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <RouteProtection>
                {children}
            </RouteProtection>
        </AuthProvider>
    );
}