"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, GraduationCap } from "lucide-react";

export default function NavBar() {
    const pathname = usePathname();

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        const base = "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300";
        // Active: Green Pill with shadow
        const active = "bg-[#0D6E3F] text-white shadow-md transform scale-105";
        // Inactive: Transparent text with hover effect
        const inactive = "text-gray-600 hover:bg-green-50 hover:text-[#0D6E3F]";

        return `${base} ${isActive ? active : inactive}`;
    };

    return (
        <nav className="flex justify-center items-center py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
            <div className="flex flex-wrap gap-2 md:gap-4 px-4 overflow-x-auto no-scrollbar justify-center w-full">

                <Link href="/" className={getLinkClass("/")}>
                    <Home size={18} />
                    <span>Página Inicial</span>
                </Link>

                <Link href="/1-etapa" className={getLinkClass("/1-etapa")}>
                    <ListOrdered size={18} />
                    <span>1ª Etapa: Matrícula</span>
                </Link>

                <Link href="/2-etapa" className={getLinkClass("/2-etapa")}>
                    <GraduationCap size={18} />
                    <span>2ª Etapa: Situação do Aluno</span>
                </Link>

            </div>
        </nav>
    );
}
