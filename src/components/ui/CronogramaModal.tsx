"use client";

import { X } from "lucide-react";

interface CronogramaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CronogramaModal({ isOpen, onClose }: CronogramaModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex justify-center items-center bg-black/60 p-5">
            <div className="bg-white p-8 border border-gray-400 w-full max-w-[700px] rounded-lg shadow-2xl relative">
                <span
                    className="absolute top-2 right-5 text-gray-500 hover:text-green-700 cursor-pointer text-4xl font-bold"
                    onClick={onClose}
                >
                    &times;
                </span>

                <h2 className="text-[#0D6E3F] font-bold text-2xl mt-0 border-b border-dashed border-gray-300 pb-2">
                    📅 Cronograma – Segunda Etapa do Censo Escolar 2025
                </h2>
                <p className="mb-6 text-gray-700 mt-4">Datas importantes para a declaração da Situação do Aluno:</p>

                <div className="mb-5 p-4 border-l-4 border-[#0D6E3F] bg-[#f1f8f3] rounded">
                    <h4 className="text-[#0D6E3F] text-lg font-bold mb-2">📌 02/02/2026 a 13/03/2026 (Período de Coleta)</h4>
                    <ul className="list-disc pl-5 text-base">
                        <li>Disponibilização da funcionalidade Situação do Aluno no Sistema Educacenso.</li>
                        <li>Digitação e exportação dos dados de rendimento e movimento escolar.</li>
                    </ul>
                    <p className="italic text-sm text-gray-600 mt-2 border-t border-dotted border-gray-300 pt-1">
                        Responsáveis: Diretores escolares e gestores municipais e estadual.
                    </p>
                </div>

                <div className="mb-5 p-4 border-l-4 border-[#0D6E3F] bg-[#f1f8f3] rounded">
                    <h4 className="text-[#0D6E3F] text-lg font-bold mb-2">📌 01/04/2026 a 15/04/2026 (Período de Retificação)</h4>
                    <ul className="list-disc pl-5 text-base">
                        <li>Conferência, ratificação e correção de eventuais inconsistências nos dados.</li>
                    </ul>
                    <p className="italic text-sm text-gray-600 mt-2 border-t border-dotted border-gray-300 pt-1">
                        Responsáveis: Diretor escolar e gestores municipais e estadual.
                    </p>
                </div>

                <p className="mt-5 border-t border-dashed border-gray-300 pt-4 text-center">
                    Para ver o <strong>cronograma completo</strong> (incluindo todas as fases e etapas), acesse a <a href="https://www.in.gov.br/en/web/dou/-/portaria-n-239-de-5-de-maio-de-2025-627643964" target="_blank" className="text-[#0D6E3F] font-bold hover:underline">PORTARIA Nº 239, DE 5 DE MAIO DE 2025</a>.
                </p>
            </div>
        </div>
    );
}
