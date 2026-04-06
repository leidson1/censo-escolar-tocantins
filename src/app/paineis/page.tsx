"use client";

import MainLayout from "@/components/layout/MainLayout";
import { motion, Variants } from "framer-motion";
import { ExternalLink, BarChart3, Users, School, GraduationCap, FileBarChart } from "lucide-react";
import Image from "next/image";

export default function Paineis() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const paineis = [
        {
            id: 7,
            titulo: "Sinópse Estatística Censo Escolar 2025",
            descricao: "Visão geral e indicadores resumidos do Censo Escolar de 2025.",
            icone: FileBarChart,
            cor: "bg-indigo-100 text-indigo-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiZTRlZTc2YWEtZjFhNy00ZTJiLWE0YzYtYzg2NDg3NWVhNjAzIiwidCI6IjE0M2U0OWFiLTdiOTEtNGM0NS04MjU3LTRiYjA4ZDhmMDcwNiJ9",
        },
        {
            id: 1,
            titulo: "Unidade Escolar",
            descricao: "Dados das unidades escolares da rede estadual e municipal do Tocantins.",
            icone: School,
            cor: "bg-blue-100 text-blue-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiMWUyNjkzYjQtOGFlYS00OWMxLWJlYjAtMGNlYmM2NmVhMzEzIiwidCI6IjE0M2U0OWFiLTdiOTEtNGM0NS04MjU3LTRiYjA4ZDhmMDcwNiJ9",
        },
        {
            id: 2,
            titulo: "Turma",
            descricao: "Informações sobre turmas, horários e organização escolar.",
            icone: Users,
            cor: "bg-green-100 text-green-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiMGFhOWVlYzgtNDc4ZC00OGQzLWFkYWYtMmU3OTkzZmE3YTY3IiwidCI6IjE0M2U0OWFiLTdiOTEtNGM0NS04MjU3LTRiYjA4ZDhmMDcwNiJ9&pageName=b670ba65b0c062c60451",
        },
        {
            id: 3,
            titulo: "Estudante",
            descricao: "Dados de matrículas, rendimento e movimento escolar dos estudantes.",
            icone: GraduationCap,
            cor: "bg-purple-100 text-purple-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiZWJkZDdlNDAtMDc1MC00ZmIzLWE2N2QtZDNjOTA0MWY2NTlkIiwidCI6IjE0M2U0OWFiLTdiOTEtNGM0NS04MjU3LTRiYjA4ZDhmMDcwNiJ9",
        },
        {
            id: 4,
            titulo: "Profissionais",
            descricao: "Informações sobre docentes e profissionais da educação.",
            icone: Users,
            cor: "bg-orange-100 text-orange-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiMDQzN2JlMTEtNTJiMi00MGE3LWI1MTItZDJiYjg0OWIwZjU0IiwidCI6IjE0M2U0OWFiLTdiOTEtNGM0NS04MjU3LTRiYjA4ZDhmMDcwNiJ9",
        },
        {
            id: 5,
            titulo: "TDI",
            descricao: "Taxa de distorção idade série do Tocantins, a nível de Estado, Município e Brasil.",
            icone: BarChart3,
            cor: "bg-teal-100 text-teal-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiMDE0YzgwY2ItYjYzYi00OGQyLWJjZWEtOTVjMzRmYzAyYTkyIiwidCI6IjE0M2U0OWFiLTdiOTEtNGM0NS04MjU3LTRiYjA4ZDhmMDcwNiJ9&pageName=141161fa8dcc97223674",
        },
        {
            id: 6,
            titulo: "Resultados Nacionais",
            descricao: "Comparativos e resultados educacionais em âmbito nacional.",
            icone: FileBarChart,
            cor: "bg-red-100 text-red-700",
            link: "https://app.powerbi.com/view?r=eyJrIjoiN2ViNDBjNDEtMTM0OC00ZmFhLWIyZWYtZjI1YjU0NzQzMTJhIiwidCI6IjI2ZjczODk3LWM4YWMtNGIxZS05NzhmLWVhNGMwNzc0MzRiZiJ9",
        },
    ];

    return (
        <MainLayout title="Gerência de Estatística e Censo Escolar">
            {/* Header */}
            <div className="text-center bg-[#0D6E3F] text-white py-6 mb-10 shadow-md rounded-lg -mt-4">
                <h2 className="m-0 font-bold text-2xl md:text-3xl">PAINÉIS DE RESULTADOS</h2>
                <p className="mt-2 text-green-100 text-sm">Acesse os painéis interativos com dados educacionais do Tocantins</p>
            </div>

            {/* Info Section */}
            <div className="max-w-[1100px] mx-auto px-4 mb-10">
                <div className="bg-gradient-to-r from-green-50 to-white p-8 rounded-xl border border-green-100">
                    <h3 className="text-[#0D6E3F] font-bold text-xl mb-4">Sobre os Painéis</h3>
                    <p className="text-gray-700 leading-relaxed text-justify">
                        Os painéis interativos são ferramentas desenvolvidas para facilitar o acesso e a análise dos dados educacionais do Estado do Tocantins.
                        Eles permitem visualizar informações sobre matrículas, indicadores de rendimento, IDEB e outros dados importantes para o acompanhamento
                        da educação básica. Os dados são atualizados periodicamente com base no Censo Escolar.
                    </p>
                </div>
            </div>

            {/* Cards Grid */}
            <motion.div
                className="max-w-[1100px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {paineis.map((painel) => {
                    const IconComponent = painel.icone;
                    return (
                        <motion.a
                            key={painel.id}
                            href={painel.link}
                            target="_blank"
                            onClick={(e) => {
                                if (painel.titulo === "TDI") {
                                    e.preventDefault();
                                    const code = window.prompt("Por favor, insira o código de acesso:");
                                    if (code === "@censo@123645") {
                                        // Attempt to open in new tab
                                        const newWin = window.open(painel.link, "_blank", "noopener,noreferrer");
                                        // If blocked by popup blocker, redirect in same tab
                                        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                                            window.location.href = painel.link;
                                        }
                                    } else if (code !== null) {
                                        window.alert("Código incorreto!");
                                    }
                                }
                            }}
                            variants={itemVariants}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 aspect-square flex flex-col items-center justify-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                        >
                            <div className={`${painel.cor} p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                                <IconComponent size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{painel.titulo}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">{painel.descricao}</p>
                            <span className="text-[#0D6E3F] font-semibold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Acessar <ExternalLink size={14} />
                            </span>
                        </motion.a>
                    );
                })}
            </motion.div>
        </MainLayout>
    );
}
