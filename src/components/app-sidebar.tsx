import { FileUser, Home, Inbox, ScrollText, Settings, Users } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
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


const items = [
    {
        title: "Home",
        url: "/dashboard/home",
        icon: Home,
    },
    {
        title: "Quizzes",
        url: "/dashboard/quizzes",
        icon: ScrollText,
    },
    {
        title: "Results",
        url: "/dashboard/results",
        icon: FileUser,
    },
    {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
    },
    {
        title: "Logs",
        url: "/dashboard/logs",
        icon: Inbox,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                                    <Image
                                        src="/images/logo.png"
                                        alt="Logo"
                                        width={32}
                                        height={32}
                                        className="rounded-full object-cover"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        AzoozGAT Platform
                                    </span>
                                    <span className="truncate text-xs">Quiz App</span>
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
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
