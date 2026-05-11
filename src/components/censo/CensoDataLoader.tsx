"use client";

import { useEffect } from "react";
import { useCenso } from "@/context/CensoContext";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw, Database } from "lucide-react";
import DatasetSelector from "./DatasetSelector";

export default function CensoDataLoader() {
  const { data, loading, error, loadStep, fetchCensoData } = useCenso();

  useEffect(() => {
    // Trigger fetch if no data is present
    if (!data && !loading && !error) {
      fetchCensoData();
    }
  }, [data, loading, error, fetchCensoData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-green-50 flex flex-col items-center max-w-sm w-full"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-green-50 p-6 rounded-full text-[#0D6E3F]">
              <Database size={40} className="animate-pulse" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">Carregando Dados</h3>
          <p className="text-gray-500 text-center text-sm mb-6">
            Estamos processando cerca de 8.000 registros para montar os dashboards.
          </p>

          <div className="w-full bg-gray-100 h-2 rounded-full mb-4 overflow-hidden">
            <motion.div
              className="bg-[#0D6E3F] h-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <Loader2 size={14} className="animate-spin" />
            <span>{loadStep}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col items-center max-w-sm w-full text-center">
          <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar</h3>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchCensoData(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DatasetSelector
      schools={data.schools}
      stats={data.stats}
      gestores={data.gestores}
      docentes={data.docentes}
      matriculas={data.matriculas}
      turmas={data.turmas}
      cursosTecnicos={data.cursosTecnicos}
    />
  );
}
