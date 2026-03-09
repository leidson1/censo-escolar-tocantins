"use client";

import MainLayout from "@/components/layout/MainLayout";
import { FileText, Download, AlertCircle, ChevronDown, HelpCircle, School, Users, GraduationCap, Briefcase, Info } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PrimeiraEtapa() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqItems = [
        {
            pergunta: "O que é a \"Data de Referência\"?",
            resposta: "É a última quarta-feira de maio. Para o Censo 2025, a data de referência é 28 de maio de 2025. Os dados declarados devem refletir a realidade da escola nesta data específica."
        },
        {
            pergunta: "Como conferir os dados declarados?",
            resposta: "Acesse o menu \"Relatórios\" no sistema Educacenso. É fundamental conferir os relatórios de conferência para garantir que não existam erros ou duplicidades antes do fechamento."
        },
        {
            pergunta: "Quais são os módulos de coleta?",
            resposta: "A coleta é organizada em cinco módulos principais: Escola, Gestor, Turma, Aluno e Profissional Escolar em Sala de Aula."
        },
        {
            pergunta: "Como declarar alunos com TDAH ou Dislexia?",
            resposta: "A partir de 2025, alunos com TDAH, Dislexia, Discalculia ou Disgrafia devem ser informados no novo campo específico 'Transtorno...', e não mais no campo de Deficiência, conforme o novo Glossário da Educação Especial."
        },
        {
            pergunta: "Recuperação de login e senha?",
            resposta: "A gestão de usuários é feita pelo Superusuário da Secretaria de Educação (Estadual ou Municipal). Caso tenha perdido o acesso, entre em contato com a SRE ou SME responsável."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <MainLayout title="Censo Escolar 2025 - 1ª Etapa">
            <div className="max-w-[1000px] mx-auto space-y-12 mb-16 px-4">

                {/* Header */}
                <div className="text-center relative py-12 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
                    <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 tracking-wide uppercase">
                        Coleta Ativa
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Matrícula Inicial 2025</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        A primeira etapa do Censo Escolar é fundamental para o planejamento educacional.
                        Coletamos dados precisos para garantir recursos e qualidade para a educação brasileira.
                    </p>
                </div>

                {/* Grid de Módulos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { icon: School, title: "Escola", desc: "Dados cadastrais e estrutura." },
                        { icon: Briefcase, title: "Gestor", desc: "Dados dos dirigentes." },
                        { icon: Users, title: "Turma", desc: "Organização escolar." },
                        { icon: GraduationCap, title: "Aluno", desc: "Dados biopsicossociais." },
                        { icon: Users, title: "Profissional", desc: "Atuação em sala." },
                    ].map((mod, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                            <div className="bg-green-50 p-3 rounded-full text-[#0D6E3F] mb-3">
                                <mod.icon size={28} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm uppercase mb-1">{mod.title}</h3>
                            <p className="text-xs text-gray-500 leading-tight">{mod.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Destaque TDAH / 2025 Updates */}
                <div className="bg-[#0D6E3F] text-white p-8 md:p-10 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-white/20 p-4 rounded-2xl">
                            <Info size={48} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-3">Atualizações Censo 2025 (TDAH e Transtornos)</h2>
                            <p className="text-green-50 text-justify leading-relaxed">
                                A partir de 2025, o registro de alunos com <strong>TDAH, Dislexia, Discalculia e Disgrafia</strong> deve ser feito no novo campo <strong>'Aluno(a) com transtorno que impacta o desenvolvimento da aprendizagem'</strong>.
                                Estes transtornos **não devem** ser marcados como deficiência, seguindo o novo Glossário da Educação Especial do Inep.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card: Caderno de Conceitos */}
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                        <div className="bg-gray-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-[#0D6E3F]">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Caderno de Conceitos</h3>
                        <p className="text-gray-500 mb-8 leading-relaxed">Consulte as definições oficiais para a Matrícula Inicial 2025.</p>
                        <a
                            href="https://download.inep.gov.br/publicacoes/institucionais/estatisticas_e_indicadores/cadernos_de_conceitos_2025.pdf"
                            target="_blank"
                            className="w-full inline-flex items-center justify-center gap-2 bg-[#0D6E3F] text-white px-8 py-4 rounded-xl font-bold hover:bg-green-800 transition-all shadow-md active:scale-[0.98]"
                        >
                            <Download size={20} />
                            Baixar Censo 2025 PDF
                        </a>
                    </div>

                    <div className="flex-1 bg-green-50 p-8 rounded-2xl border border-green-100">
                        <div className="flex items-center gap-3 mb-4 text-[#0D6E3F]">
                            <AlertCircle size={24} />
                            <h3 className="font-bold text-lg">Informações Importantes</h3>
                        </div>
                        <ul className="space-y-4 text-sm text-green-900 leading-relaxed font-medium">
                            <li className="flex gap-2"><span>•</span> <span>O rastreamento dos Itinerários Formativos agora é sistematizado para o Ensino Médio.</span></li>
                            <li className="flex gap-2"><span>•</span> <span>O registro da Educação em Tempo Integral foi aprimorado para atender às metas do PNE.</span></li>
                            <li className="flex gap-2"><span>•</span> <span>A verificação de polos EAD e cursos técnicos integrados possui campos específicos no Educacenso.</span></li>
                        </ul>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                        <HelpCircle size={24} className="text-[#0D6E3F]" />
                        <h2 className="text-xl font-bold text-gray-800">Principais Dúvidas - FAQ Censo Escolar</h2>
                    </div>

                    <div className="space-y-3">
                        {faqItems.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-green-50/50"
                                >
                                    <span className="font-semibold text-gray-700">{item.pergunta}</span>
                                    <motion.div
                                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown size={20} className="text-gray-400" />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="p-4 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/30">
                                                {item.resposta}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
