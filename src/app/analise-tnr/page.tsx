"use client";

import MainLayout from "@/components/layout/MainLayout";
import TnrDashboard from "@/components/censo/TnrDashboard";
import { ShieldAlert } from "lucide-react";

export default function AnaliseTnrPage() {
  return (
    <MainLayout title="Taxa de Não Resposta — Ensino Fundamental e Médio (2022-2024)">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">
            Taxa de Não Resposta
          </h1>
        </div>
        <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">
          Percentual de alunos sem situação de rendimento declarada no Censo Escolar (2022–2024) —
          Ensino Fundamental e Ensino Médio no Estado do Tocantins e comparativo nacional.
        </p>
      </div>

      <TnrDashboard />
    </MainLayout>
  );
}
