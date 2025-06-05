'use client';
import React, { useState } from "react";
import Image from "next/image";
import CustomLink from "./Link";
import { User, UserIcon, Settings, LogOutIcon, LayoutDashboard, LogInIcon, Menu, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
} from "./ui/dropdown-menu";
import { useAuth } from "@/lib/context/authContext";
import { signOut } from "@/lib/config/firebase-config";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Button } from "./ui/button";

const Navbar: React.FC = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { isMobile } = useBreakpoint();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const logout = async () => {
        try {
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Error signing out: ", error);
            toast.error("Error signing out: " + error);
        }

        toast.success("Logout successful!");
    };

    return (
        <nav className="sticky top-0 z-50 flex flex-wrap justify-between items-center px-4 md:px-8 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center text-xl md:text-2xl font-bold">
                <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="mr-2" />
                <CustomLink href={'/'} className="hidden sm:block">AzoozGAT Platform</CustomLink>
            </div>

            {/* Mobile menu button */}
            {isMobile && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            )}

            {/* Desktop navigation */}
            <div className={`${isMobile ? (mobileMenuOpen ? 'flex flex-col w-full mt-4' : 'hidden') : 'flex'} items-center space-x-4`}>
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer transition duration-200 ease-in-out">
                            <UserIcon className="h-6 w-6" />
                        </div>
                    </DropdownMenuTrigger>
                    {user ? (
                        <DropdownMenuContent className="w-48" side="bottom" align="end">
                            <DropdownMenuItem>
                                <CustomLink href={'/dashboard/'} className="flex items-center">
                                    <LayoutDashboard className="mr-2" />
                                    <span>Dashboard</span>
                                </CustomLink>
                            </DropdownMenuItem>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={logout}>
                                    <LogOutIcon className="mr-2 text-red-400" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    ) : (
                        <DropdownMenuContent className="w-48" side="bottom" align="end">
                            <DropdownMenuItem onClick={() => router.push('/login')}>
                                <LogInIcon className="mr-2 text-green-700" />
                                <span>Sign In</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    )}
                </DropdownMenu>
            </div>
        </nav>
    );
};

export default Navbar;