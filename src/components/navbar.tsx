import React from "react";
import Image from "next/image";
import CustomLink from "./Link";
import { User, UserIcon, Settings, LogOutIcon, LayoutDashboard } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
} from "./ui/dropdown-menu";

const Navbar: React.FC = () => {
    return (
        <nav className="flex justify-between items-center px-8 py-4 ">
            <div className="flex items-center text-2xl font-bold">
                <Image src="/images/logo.png" alt="Logo" width={50} height={50} className="mr-2" />
                <CustomLink href={'/'}>Quiz App</CustomLink>
            </div>
            <div className="flex items-center space-x-4">
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer transition duration-200 ease-in-out">
                            <UserIcon className="h-6 w-6" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" side="bottom" align="end">
                        <DropdownMenuItem>
                            <LayoutDashboard className="mr-2" />
                            <span>Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <UserIcon className="mr-2" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <LogOutIcon className="mr-2" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
};

export default Navbar;