"use client";

import MainLayout from "@/components/layout/MainLayout";
import RendimentoDashboard from "@/components/censo/RendimentoDashboard";
import { BarChart3 } from "lucide-react";

export default function AnaliseRendimentoPage() {
  return (
    <MainLayout title="Análise de Rendimento Escolar (2022-2024)">
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
          no Estado do Tocantins entre os anos de 2022 e 2024.
        </p>
      </div>

      <RendimentoDashboard />
    </MainLayout>
  );
}
