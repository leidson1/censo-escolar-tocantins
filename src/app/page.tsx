"use client";

import MainLayout from "@/components/layout/MainLayout";
import { ArrowRight, BookOpen, UserCheck, BarChart, GraduationCap } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

export default function Home() {
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

  return (
    <MainLayout title="Gerência de Estatística e Censo Escolar">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-white to-green-50 rounded-xl shadow-sm p-8 mb-8 border border-green-100 relative overflow-hidden"
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-[#0D6E3F] mb-4">Bem-vindo ao Censo Escolar</h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            O principal instrumento de coleta de informações da educação básica e a mais importante pesquisa estatística educacional brasileira. Coordenado pelo Inep, é fundamental para compreender a situação educacional do país e acompanhar a efetividade das políticas públicas.
          </p>
        </div>
        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
      </motion.div>

      {/* Cards Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Card: O que é */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-lg text-[#0D6E3F]">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">O que é o Censo?</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Pesquisa estatística que abrange todas as etapas e modalidades da educação básica: Ensino Regular, Educação Especial, EJA e Educação Profissional.
          </p>
        </motion.div>

        {/* Card: Etapas */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
              <UserCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">As Duas Etapas</h3>
          </div>
          <div className="space-y-3">
            <Link href="/1-etapa" className="block p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors group">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 group-hover:text-blue-700">1ª Etapa: Matrícula Inicial</span>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-700" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Estabelecimentos, turmas, alunos e profissionais.</p>
            </Link>
            <Link href="/2-etapa" className="block p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors group">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 group-hover:text-[#0D6E3F]">2ª Etapa: Situação do Aluno</span>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-[#0D6E3F]" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Rendimento e movimento escolar ao final do ano.</p>
            </Link>
          </div>
        </motion.div>

        {/* Card: Indicadores */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-700">
              <BarChart size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Indicadores & IDEB</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Os dados coletados permitem calcular o Índice de Desenvolvimento da Educação Básica (Ideb), taxas de rendimento, fluxo escolar e distorção idade-série.
          </p>
          <a href="#" className="text-[#0D6E3F] font-semibold hover:underline text-sm flex items-center gap-1">
            Acessar Painel de Indicadores <ArrowRight size={14} />
          </a>
        </motion.div>

        {/* Card: Responsabilidades */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-3 rounded-lg text-orange-700">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Responsabilidades</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="font-bold text-gray-800">INEP:</span> Define cronograma e instrumentos.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gray-800">Estados/Municípios:</span> Treinam e acompanham o processo.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gray-800">Diretores:</span> Respondem ao Censo com veracidade.
            </li>
          </ul>
        </motion.div>

      </motion.div>
    </MainLayout>
  );
}
