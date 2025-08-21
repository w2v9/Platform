'use client'
import { LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"
import { signOut } from "@/lib/config/firebase-config"
import { User } from "firebase/auth"

// Telegram icon component
const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.27-.48.74-.74 2.87-1.25 4.79-2.09 5.76-2.51 2.7-1.18 3.26-1.38 3.63-1.39.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>
);

export type SidebarItem = {
    title: string
    url: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export function AppSidebar({ items, user }: { items: SidebarItem[], user: User | null }) {
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (user?.uid) {
            fetchUserRole();
        }
    }, [user?.uid]);

    const fetchUserRole = async () => {
        try {
            const { getUserById } = await import('@/lib/db_user');
            const userData = await getUserById(user!.uid);
            setUserRole(userData?.role || null);
            
            // Only fetch announcements for regular users, not admins
            if (userData?.role !== 'admin') {
                fetchUnreadAnnouncements();
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
    };

    const fetchUnreadAnnouncements = async () => {
        try {
            const { getUnreadAnnouncements } = await import('@/lib/db_announcement');
            const announcements = await getUnreadAnnouncements(user!.uid);
            setUnreadAnnouncements(announcements.length);
        } catch (error) {
            console.error('Error fetching unread announcements:', error);
        }
    };
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >                                <div className="flex aspect-square size-6 sm:size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                                    <Image
                                        src="/images/logo.png"
                                        alt="Logo"
                                        width={32}
                                        height={32}
                                        className="rounded-full object-cover"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-xs sm:text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        AzoozGAT
                                    </span>
                                    <span className="truncate text-xs hidden sm:block">Platform</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </ SidebarMenu>
                </SidebarHeader>
                <Separator />
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item, index) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url} className="relative">
                                            <item.icon />
                                            <span>{item.title}</span>
                                            {item.title === "Announcements" && userRole !== 'admin' && unreadAnnouncements > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                                                    {unreadAnnouncements > 99 ? '99+' : unreadAnnouncements}
                                                </span>
                                            )}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupLabel asChild>
                        <div className="flex flex-col space-y-1">
                            <span className="font-medium">{user?.displayName}</span>
                            <Label className="text-xs text-muted-foreground">
                                {user?.email}
                            </Label>
                        </div>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Telegram button - only for regular users */}
                            {userRole === 'user' && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton 
                                        className="cursor-pointer" 
                                        onClick={() => {
                                            const url = "https://t.me/+epP9cCfPOphhMmQ5";
                                            window.open(url, '_blank');
                                        }}
                                    >
                                        <TelegramIcon />
                                        <span>Telegram</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton className="cursor-pointer" onClick={() => {
                                    signOut()
                                }}>
                                    <LogOut />
                                    <span>Logout</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    )
}
