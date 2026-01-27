"use client";

import { ReactNode, useState } from "react";
import TopBar from "./TopBar";
import NavBar from "./NavBar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

interface MainLayoutProps {
    children: ReactNode;
    title?: string; // Optional title for the green bar
}

export default function MainLayout({ children, title = "Gerência de Estatística e Censo Escolar" }: MainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <TopBar />
            <NavBar />

            {/* Green Gerencia Bar */}
            <div className="bg-[#0D6E3F] text-white py-4 px-6 md:px-15 font-semibold text-lg flex justify-between items-center shadow-md">
                <span>{title}</span>
                <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-green-800 p-2 rounded transition-colors"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <Menu size={20} />
                    <span className="text-base">Menu</span>
                </div>
            </div>

            <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 py-8">
                {children}
            </main>

            <Footer />
        </div>
    );
}
