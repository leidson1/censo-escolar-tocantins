"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Loader2, 
  Filter, 
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  PieChart,
  Activity,
  Trophy,
  Equal
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RendimentoData {
  id: number;
  ano_do_censo: number;
  tipo_taxa: "aprovacao" | "reprovacao" | "abandono";
  nivel_ensino: string;
  segmento: string;
  valor: number;
  localizacao: string;
  dependencia_administrativa: string;
}

export default function RendimentoDashboard() {
  const [data, setData] = useState<RendimentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [nivelFilter, setNivelFilter] = useState<string>("fundamental");
  const [segmentoFilter, setSegmentoFilter] = useState<string>("total");
  const [localizacaoFilter, setLocalizacaoFilter] = useState<string>("Total");
  const [redeFilter, setRedeFilter] = useState<string>("Total");
  const [regiaoComparacao, setRegiaoComparacao] = useState<string>("Norte");
  const [estadoComparacao, setEstadoComparacao] = useState<string>("São Paulo");
  const [anoReferencia, setAnoReferencia] = useState<number>(2024);
  const [rankingScope, setRankingScope] = useState<"Brasil" | "Região">("Brasil");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all states, regions and national data for the SELECTED level and segment
        const query = supabase
          .from("tx_rendimento_escolar")
          .select("*")
          .eq("nivel_ensino", nivelFilter)
          .eq("segmento", segmentoFilter);
        
        const result = await fetchAllRows<RendimentoData>(query);
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching rendimento data:", err);
        setError("Não foi possível carregar os dados de rendimento.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nivelFilter, segmentoFilter]);

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nivel_ensino === nivelFilter && 
      item.segmento === segmentoFilter &&
      item.localizacao === localizacaoFilter &&
      item.dependencia_administrativa === redeFilter
    );
  }, [data, nivelFilter, segmentoFilter, localizacaoFilter, redeFilter]);

  const statsByYear = useMemo(() => {
    const years = [2022, 2023, 2024];
    const stats: Record<number, Record<string, number | undefined>> = {};
    
    // Filter specifically for Tocantins for historical evolution
    const tocantinsData = filteredData.filter(d => d.nome_da_unidade_federativa === "Tocantins");
    
    years.forEach(year => {
      stats[year] = {
        aprovacao: tocantinsData.find(d => d.ano_do_censo === year && d.tipo_taxa === "aprovacao")?.valor,
        reprovacao: tocantinsData.find(d => d.ano_do_censo === year && d.tipo_taxa === "reprovacao")?.valor,
        abandono: tocantinsData.find(d => d.ano_do_censo === year && d.tipo_taxa === "abandono")?.valor,
      };
    });
    
    return stats;
  }, [filteredData]);

  const comparativeData = useMemo(() => {
    const year = anoReferencia;
    const scopes = ["Brasil", `Região ${regiaoComparacao}`, "Tocantins"];
    const results: Record<string, Record<string, number | undefined>> = {};

    scopes.forEach(scope => {
      // We need to fetch each rate type for this scope
      const getVal = (type: string) => {
        let d;
        if (scope === "Tocantins") {
          d = filteredData.find(i => i.ano_do_censo === year && i.tipo_taxa === type && i.nome_da_unidade_federativa === "Tocantins");
        } else if (scope.startsWith("Região")) {
          // Find region data - fallback to "Total" rede/loc if specific filter returns nothing
          d = filteredData.find(i => i.ano_do_censo === year && i.tipo_taxa === type && i.nome_da_regiao_geografica === regiaoComparacao && !i.nome_da_unidade_federativa);
          
          if (!d) {
            d = data.find(i => 
              i.ano_do_censo === year && 
              i.tipo_taxa === type && 
              i.nome_da_regiao_geografica === regiaoComparacao && 
              !i.nome_da_unidade_federativa &&
              i.localizacao === "Total" &&
              i.dependencia_administrativa === "Total" &&
              i.nivel_ensino === nivelFilter &&
              i.segmento === segmentoFilter
            );
          }
        } else {
          // Brasil Data: Try specific filter first, then fallback to National Total
          d = filteredData.find(i => 
            i.ano_do_censo === year && 
            i.tipo_taxa === type && 
            (!i.nome_da_regiao_geografica || i.nome_da_regiao_geografica === "Brasil") && 
            !i.nome_da_unidade_federativa
          );

          if (!d) {
            d = data.find(i => 
              i.ano_do_censo === year && 
              i.tipo_taxa === type && 
              (!i.nome_da_regiao_geografica || i.nome_da_regiao_geografica === "Brasil") && 
              !i.nome_da_unidade_federativa &&
              i.localizacao === "Total" &&
              i.dependencia_administrativa === "Total" &&
              i.nivel_ensino === nivelFilter &&
              i.segmento === segmentoFilter
            );
          }
        }
        return d?.valor;
      };

      results[scope] = {
        aprovacao: getVal("aprovacao"),
        reprovacao: getVal("reprovacao"),
        abandono: getVal("abandono"),
      };
    });

    return results;
  }, [filteredData, regiaoComparacao, anoReferencia, data, nivelFilter, segmentoFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 size={40} className="text-[#0D6E3F] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando dados históricos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
        <p className="text-red-700 font-bold">{error}</p>
      </div>
    );
  }

  const kpiYear = 2024;
  const kpiPrevYear = 2023;
  
  const getTrend = (type: string) => {
    const current = statsByYear[kpiYear]?.[type];
    const previous = statsByYear[kpiPrevYear]?.[type];
    
    if (current == null || previous == null) {
      return { icon: <Minus size={14} />, color: "text-gray-300", label: "N/A" };
    }
    
    const diff = current - previous;
    
    // Declinio (Decrease) is now always RED per user request
    if (diff > 0) return { 
      icon: <TrendingUp size={14} />, 
      color: "text-green-600", 
      label: `+${Number(diff).toFixed(1)}%` 
    };
    if (diff < 0) return { 
      icon: <TrendingDown size={14} />, 
      color: "text-red-600", 
      label: `${Number(diff).toFixed(1)}%` 
    };
    
    return { 
      icon: <Equal size={14} className="stroke-[3]" />, 
      color: "text-indigo-400", 
      label: "Estável" 
    };
  };

  return (
    <div className="space-y-8">
      {/* Filters Bar - Sticky */}
      <div className="sticky top-4 z-50 transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-wrap gap-6 items-end justify-center">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Filter size={12} /> Nível de Ensino
          </label>
          <select 
            value={nivelFilter}
            onChange={(e) => {
              setNivelFilter(e.target.value);
              // Reset segmento if not compatible
              if (e.target.value === "medio" && !["total", "1serie", "2serie", "3serie", "4serie", "nao_seriado"].includes(segmentoFilter)) {
                setSegmentoFilter("total");
              } else if (e.target.value === "fundamental" && ["1serie", "2serie", "3serie", "4serie"].includes(segmentoFilter)) {
                setSegmentoFilter("total");
              }
            }}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none min-w-[180px]"
          >
            <option value="fundamental">Ensino Fundamental</option>
            <option value="medio">Ensino Médio</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Activity size={12} /> Etapa/Série
          </label>
          <select 
            value={segmentoFilter}
            onChange={(e) => setSegmentoFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none min-w-[180px]"
          >
            <option value="total">Total do Nível</option>
            {nivelFilter === "fundamental" ? (
              <>
                <option value="anos_iniciais">Anos Iniciais</option>
                <option value="anos_finais">Anos Finais</option>
                <option value="1ano">1º Ano</option>
                <option value="2ano">2º Ano</option>
                <option value="3ano">3º Ano</option>
                <option value="4ano">4º Ano</option>
                <option value="5ano">5º Ano</option>
                <option value="6ano">6º Ano</option>
                <option value="7ano">7º Ano</option>
                <option value="8ano">8º Ano</option>
                <option value="9ano">9º Ano</option>
              </>
            ) : (
              <>
                <option value="1serie">1ª Série</option>
                <option value="2serie">2ª Série</option>
                <option value="3serie">3ª Série</option>
                <option value="4serie">4ª Série</option>
                <option value="nao_seriado">Não Seriado</option>
              </>
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            Localização
          </label>
          <select 
            value={localizacaoFilter}
            onChange={(e) => setLocalizacaoFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none min-w-[140px]"
          >
            <option value="Total">Total</option>
            <option value="Urbana">Urbana</option>
            <option value="Rural">Rural</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            Rede
          </label>
          <select 
            value={redeFilter}
            onChange={(e) => setRedeFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none min-w-[140px]"
          >
            <option value="Total">Total</option>
            <option value="Estadual">Estadual</option>
            <option value="Municipal">Municipal</option>
            <option value="Privada">Privada</option>
            <option value="Federal">Federal</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            Ano de Ref.
          </label>
          <select 
            value={anoReferencia}
            onChange={(e) => setAnoReferencia(Number(e.target.value))}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none min-w-[100px]"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            Região
          </label>
          <select 
            value={regiaoComparacao}
            onChange={(e) => setRegiaoComparacao(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none min-w-[160px]"
          >
            <option value="Norte">Região Norte</option>
            <option value="Nordeste">Região Nordeste</option>
            <option value="Sudeste">Região Sudeste</option>
            <option value="Sul">Região Sul</option>
            <option value="Centro-Oeste">Região Centro-Oeste</option>
          </select>
        </div>
      </div>
    </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Aprovação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-green-50 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "p-3 rounded-2xl",
              getTrend("aprovacao").label === "Estável" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"
            )}>
              {getTrend("aprovacao").icon}
            </div>
            <div className={cn("flex items-center gap-1 text-sm font-bold", getTrend("aprovacao").color)}>
              {getTrend("aprovacao").icon}
              {getTrend("aprovacao").label}
            </div>
          </div>
          <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Taxa de Aprovação (2024)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-800">
              {statsByYear[2024]?.aprovacao != null 
                ? `${Number(statsByYear[2024].aprovacao).toFixed(1)}%` 
                : "N/A"}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${statsByYear[2024]?.aprovacao || 0}%` }}
              className="h-full bg-green-500"
            />
          </div>
        </motion.div>

        {/* Reprovação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-red-50 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "p-3 rounded-2xl",
              getTrend("reprovacao").label === "Estável" ? "bg-indigo-100 text-indigo-700" : 
              getTrend("reprovacao").color.includes("red") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}>
              {getTrend("reprovacao").icon}
            </div>
            <div className={cn("flex items-center gap-1 text-sm font-bold", getTrend("reprovacao").color)}>
              {getTrend("reprovacao").icon}
              {getTrend("reprovacao").label}
            </div>
          </div>
          <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Taxa de Reprovação (2024)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-800">
              {statsByYear[2024]?.reprovacao != null 
                ? `${Number(statsByYear[2024].reprovacao).toFixed(1)}%` 
                : "N/A"}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${statsByYear[2024]?.reprovacao || 0}%` }}
              className="h-full bg-red-500"
            />
          </div>
        </motion.div>

        {/* Abandono */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "p-3 rounded-2xl",
              getTrend("abandono").label === "Estável" ? "bg-indigo-100 text-indigo-700" : 
              getTrend("abandono").color.includes("red") ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
            )}>
              {getTrend("abandono").icon}
            </div>
            <div className={cn("flex items-center gap-1 text-sm font-bold", getTrend("abandono").color)}>
              {getTrend("abandono").icon}
              {getTrend("abandono").label}
            </div>
          </div>
          <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Taxa de Abandono (2024)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-800">
              {statsByYear[2024]?.abandono != null 
                ? `${Number(statsByYear[2024].abandono).toFixed(1)}%` 
                : "N/A"}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${statsByYear[2024]?.abandono || 0}%` }}
              className="h-full bg-orange-500"
            />
          </div>
        </motion.div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <BarChart className="text-[#0D6E3F]" /> Evolução Histórica (2022-2024)
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Chart Columns */}
          {["aprovacao", "reprovacao", "abandono"].map((type) => (
            <div key={type} className="space-y-6">
              <h4 className="text-center font-bold text-gray-400 uppercase text-xs tracking-widest">{type}</h4>
              <div className="flex justify-around h-64 border-b border-gray-100 pb-2 gap-4">
                {[2022, 2023, 2024].map((year) => {
                  const val = Number(statsByYear[year][type] || 0);
                  // Scale: Approval is 0-100, Reprovacao/Abandono are usually 0-20
                  const maxScale = type === "aprovacao" ? 100 : 20;
                  const height = val > 0 ? Math.min(100, Math.max(2, (val / maxScale) * 100)) : 0;
                  const color = type === "aprovacao" ? "bg-green-500" : type === "reprovacao" ? "bg-red-500" : "bg-orange-500";
                  
                  return (
                    <div key={year} className="flex flex-col items-center gap-2 flex-1 min-w-[30px] max-w-[60px] h-full group">
                      <div className="relative w-full flex flex-col items-center justify-end flex-1">
                        {/* Bar */}
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "w-full rounded-t-lg shadow-sm transition-all group-hover:brightness-110 border-x border-t border-black/5 relative", 
                            color
                          )}
                        >
                          {/* Constant Value Label at Top */}
                          <div className={cn(
                            "absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black text-gray-800 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-lg border shadow-md backdrop-blur-sm z-30",
                            type === "aprovacao" ? "border-green-500" : type === "reprovacao" ? "border-red-500" : "border-orange-500"
                          )}>
                            {val != null ? `${Number(val).toFixed(1)}%` : "N/A"}
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Section (Benchmarks) */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl shadow-sm border border-indigo-100">
        <h3 className="text-xl font-bold text-indigo-900 mb-8 flex items-center gap-2">
          <PieChart className="text-indigo-600" /> Comparativo Geográfico ({anoReferencia})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {["aprovacao", "reprovacao", "abandono"].map((type) => (
            <div key={type} className="space-y-6">
              <h4 className="text-center font-bold text-indigo-400 uppercase text-xs tracking-widest">{type}</h4>
              <div className="flex items-end justify-around h-48 border-b border-indigo-100 pb-2 gap-4">
                {["Brasil", `Região ${regiaoComparacao}`, "Tocantins"].map((scope) => {
                  const val = comparativeData[scope][type];
                  const maxScale = type === "aprovacao" ? 100 : 20;
                  const height = val > 0 ? Math.min(100, Math.max(4, (val / maxScale) * 100)) : 0;
                  
                  // Vibrant Color Palette
                  let color = "";
                  let borderColor = "";
                  if (scope === "Tocantins") {
                    color = type === "aprovacao" ? "bg-emerald-500" : type === "reprovacao" ? "bg-rose-500" : "bg-amber-500";
                    borderColor = type === "aprovacao" ? "border-emerald-500" : type === "reprovacao" ? "border-rose-500" : "border-amber-500";
                  } else if (scope.startsWith("Região")) {
                    color = "bg-sky-500";
                    borderColor = "border-sky-500";
                  } else {
                    color = "bg-purple-600";
                    borderColor = "border-purple-600";
                  }
                  
                  return (
                    <div key={scope} className="flex flex-col items-center gap-2 flex-1 min-w-[30px] h-full group">
                      <div className="relative w-full flex flex-col items-center justify-end flex-1">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1.2, ease: "backOut" }}
                          className={cn(
                            "w-full rounded-t-lg shadow-lg transition-all group-hover:brightness-110 relative", 
                            color,
                            scope === "Tocantins" ? "ring-2 ring-white ring-offset-2 ring-offset-indigo-50 z-20" : "opacity-90"
                          )}
                        >
                          <div className={cn(
                            "absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-gray-800 whitespace-nowrap bg-white/95 px-2 py-1 rounded-lg border shadow-md transition-all z-30",
                            borderColor
                          )}>
                            {val != null ? `${Number(val).toFixed(1)}%` : "N/A"}
                          </div>
                        </motion.div>
                      </div>
                      <span className={cn(
                        "text-[9px] font-black text-center leading-tight h-8 flex items-center tracking-tight",
                        scope === "Tocantins" ? "text-gray-900" : "text-gray-500"
                      )}>
                        {scope}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Report (Replaces Insight) */}
        <div className="mt-10 pt-8 border-t border-indigo-100/50 space-y-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-indigo-900">Relatório de Diagnóstico Educacional</h4>
              <p className="text-xs text-indigo-500 font-medium">Análise comparativa baseada no Censo Escolar {anoReferencia}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["aprovacao", "reprovacao", "abandono"].map(type => {
              const toData = comparativeData["Tocantins"][type];
              const regData = comparativeData[`Região ${regiaoComparacao}`][type];
              const brData = comparativeData["Brasil"][type];
              
              const isApproval = type === "aprovacao";
              
              if (toData === undefined || brData === undefined) {
                return (
                  <div key={type} className="p-5 rounded-2xl border bg-gray-50/30 border-gray-100 opacity-60 flex items-center justify-center min-h-[160px]">
                    <p className="text-xs font-bold text-gray-400 text-center leading-relaxed">
                      Dados de <span className="uppercase">{type}</span> para os filtros selecionados não estão disponíveis no Censo {anoReferencia}.
                    </p>
                  </div>
                );
              }

              const diffBr = toData - brData;
              const isPositive = isApproval ? diffBr > 0 : diffBr < 0;

              return (
                <div key={type} className={cn(
                  "p-5 rounded-2xl border transition-all",
                  isPositive ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50/30 border-rose-100"
                )}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                      isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {type}
                    </span>
                    {isPositive ? <TrendingUp size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-500" />}
                  </div>
                  
                  <p className="text-xs font-bold text-gray-800 mb-2 leading-relaxed">
                    {isApproval 
                      ? `O Tocantins apresenta uma taxa de sucesso escolar de ${Number(toData).toFixed(1)}%.`
                      : `A taxa de ${type === "reprovacao" ? "retenção" : "evasão"} está em ${Number(toData).toFixed(1)}%.`
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Em relação à média nacional ({Number(brData).toFixed(1)}%), o estado está 
                      <span className={cn(
                        "font-bold mx-1", 
                        Math.abs(toData - brData) < 0.01 ? "text-indigo-500" : isPositive ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {Math.abs(toData - brData) < 0.01 ? "equivalente" : isPositive ? "em vantagem" : "em desvantagem"}
                      </span>
                      {Math.abs(toData - brData) < 0.01 ? "à média" : `com uma diferença de ${Math.abs(Number(diffBr)).toFixed(1)} p.p.`}
                    </p>

                    {regData != null && (
                      <p className="text-[11px] text-gray-600 leading-relaxed pt-2 border-t border-gray-100/50">
                        Comparado à <span className="font-bold">Região {regiaoComparacao}</span> ({Number(regData).toFixed(1)}%): 
                        {Math.abs(toData - regData) < 0.01 ? (
                          <span className="font-bold ml-1 text-indigo-500 italic">Igual à média</span>
                        ) : (
                          <>
                            <span className={cn("font-bold ml-1", (isApproval ? toData > regData : toData < regData) ? "text-emerald-600" : "text-rose-600")}>
                              {(isApproval ? toData > regData : toData < regData) ? " Superior" : " Inferior"}
                            </span>
                            {` (${Math.abs(toData - regData).toFixed(1)} p.p.)`}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  
                  {/* Detailed insights removed at user request */}
                </div>
              );
            })}
          </div>

          {/* Regional Conclusion summary removed at user request */}
        </div>
      </div>

      {/* Ranking Redesigned: Podium + Peers */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Posicionamento no Ranking</h3>
            </div>
            <p className="text-gray-500 font-medium">Comparativo de desempenho escolar no ano de {anoReferencia}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
            {/* Scope Toggle */}
            <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm border border-gray-100">
              <button 
                onClick={() => setRankingScope("Brasil")}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  rankingScope === "Brasil" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Brasil
              </button>
              <button 
                onClick={() => setRankingScope("Região")}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  rankingScope === "Região" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Região {regiaoComparacao}
              </button>
            </div>

            <div className="flex gap-6 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm" />
                <span className="text-xs font-bold text-gray-700">Tocantins</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {["aprovacao", "reprovacao", "abandono"].map((type) => {
            const baseData = data.filter(d => 
              d.ano_do_censo === anoReferencia && 
              d.tipo_taxa === type && 
              d.nome_da_unidade_federativa &&
              d.nivel_ensino === nivelFilter &&
              d.segmento === segmentoFilter &&
              d.localizacao === localizacaoFilter &&
              d.dependencia_administrativa === redeFilter &&
              (rankingScope === "Brasil" || d.nome_da_regiao_geografica === regiaoComparacao)
            );
            
            const sortedStates = [...baseData].sort((a, b) => {
              if (type === "aprovacao") return b.valor - a.valor;
              return a.valor - b.valor;
            });

            const toPos = sortedStates.findIndex(s => s.nome_da_unidade_federativa === "Tocantins");
            const tocantinsPos = toPos + 1;
            const tocantinsVal = sortedStates[toPos]?.valor;

            // Get Top 3
            const top3 = sortedStates.slice(0, 3);
            
            // Get neighbors (1 above, TO, 1 below)
            const neighbors = [];
            if (toPos > 3) neighbors.push({ ...sortedStates[toPos - 1], rank: toPos });
            if (toPos >= 0) neighbors.push({ ...sortedStates[toPos], rank: toPos + 1, isTocantins: true });
            if (toPos >= 0 && toPos < sortedStates.length - 1) neighbors.push({ ...sortedStates[toPos + 1], rank: toPos + 2 });

            const getMetricColor = () => {
              if (type === "aprovacao") return "indigo";
              if (type === "reprovacao") return "emerald"; // Changed from rose to emerald
              return "amber";
            };
            const mColor = getMetricColor();

            return (
              <div key={type} className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{type}</h4>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "text-5xl font-black italic tracking-tighter",
                        type === "aprovacao" ? "text-indigo-600" : type === "reprovacao" ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {tocantinsPos > 0 ? `${tocantinsPos}º` : "--"}
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-gray-800">Lugar no Ranking</p>
                        <p className="text-[10px] text-gray-400 font-medium">{rankingScope === "Brasil" ? "em todo o país" : `na Região ${regiaoComparacao}`}</p>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black border",
                    type === "aprovacao" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                    type === "reprovacao" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    {tocantinsVal !== undefined ? `${Number(tocantinsVal).toFixed(1)}%` : "N/A"}
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Top 3 Podium Style */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-yellow-400" /> Líderes do Ranking
                    </p>
                    <div className="space-y-2">
                      {top3.map((state, idx) => (
                        <div key={state.nome_da_unidade_federativa} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100/50 shadow-sm">
                          <span className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner",
                            idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-700"
                          )}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-700 flex-1">{state.nome_da_unidade_federativa}</span>
                          <span className="text-[10px] font-black text-gray-400">
                            {state.valor !== undefined && state.valor !== null ? `${Number(state.valor).toFixed(1)}%` : "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contextual Peers */}
                  {tocantinsPos > 3 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-indigo-400" /> Contexto do Tocantins
                      </p>
                      <div className="space-y-2">
                        {neighbors.map((state: any) => {
                          const isTO = state.isTocantins;
                          const isComparison = state.nome_da_unidade_federativa === estadoComparacao;
                          return (
                            <div key={state.nome_da_unidade_federativa} className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all",
                              isTO ? (
                                type === "aprovacao" ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105 z-10" :
                                type === "reprovacao" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105 z-10" :
                                "bg-amber-600 text-white border-amber-600 shadow-lg scale-105 z-10"
                              ) : "bg-white/50 border-gray-100"
                            )}>
                              <span className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                isTO ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                              )}>
                                {state.rank}
                              </span>
                              <span className={cn(
                                "text-xs font-bold flex-1",
                                isTO ? "text-white" : "text-gray-600"
                              )}>
                                {state.nome_da_unidade_federativa}
                              </span>
                              <span className={cn(
                                "text-[10px] font-black",
                                isTO ? "text-white/80" : "text-gray-400"
                              )}>
                                {state.valor !== undefined && state.valor !== null ? `${Number(state.valor).toFixed(1)}%` : "N/A"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
