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
