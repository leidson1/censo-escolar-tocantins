"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import RendimentoDashboard from "@/components/censo/RendimentoDashboard";
import MunicipiosRendimentoDashboard from "@/components/censo/MunicipiosRendimentoDashboard";
import EscolasRendimentoDashboard from "@/components/censo/EscolasRendimentoDashboard";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Globe2, MapPin, School } from "lucide-react";

type Escopo = "estado" | "municipios" | "escolas";

const tabs: { id: Escopo; label: string; icon: React.ElementType; desc: string; active: string }[] = [
  {
    id: "estado",
    label: "Tocantins x Brasil",
    icon: Globe2,
    desc: "Comparativo nacional e regional",
    active: "bg-[#0D6E3F] text-white shadow-lg shadow-green-200",
  },
  {
    id: "municipios",
    label: "Municípios",
    icon: MapPin,
    desc: "Ranking e evolução por município",
    active: "bg-indigo-600 text-white shadow-lg shadow-indigo-200",
  },
  {
    id: "escolas",
    label: "Escolas",
    icon: School,
    desc: "Ranking e evolução por escola",
    active: "bg-purple-600 text-white shadow-lg shadow-purple-200",
  },
];

export default function AnaliseRendimentoPage() {
  const [escopo, setEscopo] = useState<Escopo>("estado");

  return (
    <MainLayout title="Análise de Rendimento Escolar (2022-2025)">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-green-100 p-3 rounded-2xl text-[#0D6E3F] shadow-sm">
            <BarChart3 size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">
            Análise da Taxa de Rendimento
          </h1>
        </div>
        <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">
          Acompanhamento histórico das taxas de aprovação, reprovação e abandono escolar
          no Estado do Tocantins entre os anos de 2022 e 2025.
        </p>
      </div>

      {/* Scope tab bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = escopo === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setEscopo(tab.id)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 text-center
                ${isActive ? tab.active + " border-transparent" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"}
              `}
            >
              <div className={`p-2 rounded-xl mb-2 ${isActive ? "bg-white/20" : "bg-gray-50"}`}>
                <Icon size={22} className={isActive ? "opacity-100" : "opacity-60"} />
              </div>
              <div className="font-bold text-xs uppercase tracking-wider">{tab.label}</div>
              <div className={`text-[10px] mt-0.5 ${isActive ? "text-white/80" : "text-gray-400"}`}>{tab.desc}</div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={escopo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {escopo === "estado" && <RendimentoDashboard />}
          {escopo === "municipios" && <MunicipiosRendimentoDashboard />}
          {escopo === "escolas" && <EscolasRendimentoDashboard />}
        </motion.div>
      </AnimatePresence>
    </MainLayout>
  );
}
