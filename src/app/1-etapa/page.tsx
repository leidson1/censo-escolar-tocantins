"use client";

import MainLayout from "@/components/layout/MainLayout";
import { FileText, Download, AlertCircle } from "lucide-react";

export default function PrimeiraEtapa() {
    return (
        <MainLayout title="Censo Escolar 2026 - 1ª Etapa">
            <div className="max-w-2xl mx-auto space-y-8">

                <div className="text-center">
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                        Em Breve
                    </span>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Matrícula Inicial 2026</h1>
                    <p className="text-gray-600">
                        A primeira etapa do Censo Escolar coleta informações sobre estabelecimentos, turmas, alunos e profissionais escolares.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0D6E3F]">
                        <FileText size={32} />
                    </div>

                    <h3 className="text-xl font-semibold mb-2">Caderno de Conceitos e Orientações</h3>
                    <p className="text-gray-500 text-sm mb-6">Versão PDF para Situação do Aluno 2024 (Referência)</p>

                    <a
                        href="file:///C:/Users/jnils/OneDrive/Área%20de%20Trabalho/Censo%202025/2ª%20Etapa/caderno_de_conceitos_e_orientacoes_situacao_do_aluno_2024.pdf"
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-[#0D6E3F] text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors"
                    >
                        <Download size={20} />
                        Baixar Documento
                    </a>

                    <div className="mt-6 flex items-start gap-2 text-left bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                            <strong>Atenção:</strong> O link acima aponta para um arquivo local original. Em um ambiente de produção real, este arquivo deve estar hospedado na pasta pública do servidor.
                        </p>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
