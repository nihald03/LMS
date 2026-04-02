import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, User, LogOut } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search courses, lectures..."
                        className="pl-10 bg-slate-50 border-none h-10 w-full focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-px bg-slate-200 mx-1"></div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 transition-colors">
                            <Avatar className="h-8 w-8 border border-slate-200">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} />
                                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="hidden md:flex flex-col items-start mr-2">
                                <span className="text-sm font-semibold leading-none">{user?.name}</span>
                                <span className="text-xs text-slate-500 mt-1 capitalize">{user?.role}</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={logout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Navbar;
