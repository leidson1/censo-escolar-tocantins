"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, ChevronDown, FileText, Users, ExternalLink, Home, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    const toggleSubmenu = (id: string) => {
        setOpenSubmenu(openSubmenu === id ? null : id);
    };

    const menuVariants: Variants = {
        closed: { x: "100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
        open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    };

    const backdropVariants: Variants = {
        closed: { opacity: 0 },
        open: { opacity: 1 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        onClick={onClose}
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        className="fixed top-0 right-0 h-full w-[300px] bg-white shadow-2xl z-[70] overflow-y-auto"
                        variants={menuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                    >
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#0D6E3F] text-white">
                            <h2 className="font-bold text-lg">Menu</h2>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 space-y-2">
                            <Link href="/" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 text-gray-700 hover:text-[#0D6E3F] transition-colors">
                                <Home size={20} />
                                <span className="font-medium">Início</span>
                            </Link>

                            <Link href="/1-etapa" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 text-gray-700 hover:text-[#0D6E3F] transition-colors">
                                <BookOpen size={20} />
                                <span className="font-medium">1ª Etapa: Matrícula</span>
                            </Link>

                            <Link href="/2-etapa" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 text-gray-700 hover:text-[#0D6E3F] transition-colors">
                                <BookOpen size={20} />
                                <span className="font-medium">2ª Etapa: Situação do Aluno</span>
                            </Link>

                            <div className="h-px bg-gray-100 my-2"></div>

                            {/* Submenu: Conteúdos */}
                            <div>
                                <button
                                    onClick={() => toggleSubmenu("conteudos")}
                                    className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText size={20} className="text-gray-500" />
                                        <span>Central de Conteúdos</span>
                                    </div>
                                    <ChevronDown size={16} className={`transform transition-transform ${openSubmenu === 'conteudos' ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {openSubmenu === "conteudos" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pl-11 pr-2 space-y-1"
                                        >
                                            <a href="#" className="block py-2 text-sm text-gray-600 hover:text-[#0D6E3F] hover:underline">Cadernos de Conceitos</a>
                                            <a href="#" className="block py-2 text-sm text-gray-600 hover:text-[#0D6E3F] hover:underline">Legislação e Portarias</a>
                                            <a href="#" className="block py-2 text-sm text-gray-600 hover:text-[#0D6E3F] hover:underline">Tutoriais e Manuais</a>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Submenu: Servidores */}
                            <div>
                                <button
                                    onClick={() => toggleSubmenu("servidores")}
                                    className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users size={20} className="text-gray-500" />
                                        <span>Servidores</span>
                                    </div>
                                    <ChevronDown size={16} className={`transform transition-transform ${openSubmenu === 'servidores' ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {openSubmenu === "servidores" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pl-11 pr-2 space-y-1"
                                        >
                                            <a href="#" className="block py-2 text-sm text-gray-600 hover:text-[#0D6E3F] hover:underline">Modulação</a>
                                            <a href="#" className="block py-2 text-sm text-gray-600 hover:text-[#0D6E3F] hover:underline">Recursos Humanos</a>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="h-px bg-gray-100 my-2"></div>

                            <div className="p-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Links Externos</p>
                                <a href="https://educacenso.inep.gov.br/educacenso/" target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-2">
                                    <ExternalLink size={14} /> Sistema Educacenso
                                </a>
                                <a href="https://www.to.gov.br/seduc" target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                    <ExternalLink size={14} /> Portal SEDUC/TO
                                </a>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
