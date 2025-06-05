'use client'
import { LogOut } from "lucide-react"
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
            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupLabel asChild>
                        <div>
                            <span>{user?.displayName}</span>
                            <Label className="ml-4 text-xs text-muted-foreground">
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
