"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Equal,
  Minus,
  AlertCircle,
  Loader2,
  Filter,
  Activity,
  BarChart,
  Trophy,
  MapPin,
  Building2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SearchableSelect from "@/components/ui/SearchableSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MunicipioRendimentoData {
  id: number;
  codigo_municipio: number;
  sre: string | null;
  nome_municipio: string;
  ano: number;
  regiao: string | null;
  uf: string | null;
  localizacao: string;
  dependencia_administrativa: string;
  tipo_taxa: "aprovacao" | "reprovacao" | "abandono";
  nivel_ensino: string;
  segmento: string;
  valor: number;
}

const ANOS = [2022, 2023, 2024, 2025];
const TIPOS = ["aprovacao", "reprovacao", "abandono"] as const;

export default function MunicipiosRendimentoDashboard() {
  const [data, setData] = useState<MunicipioRendimentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nivelFilter, setNivelFilter] = useState<string>("fundamental");
  const [segmentoFilter, setSegmentoFilter] = useState<string>("total");
  const [localizacaoFilter, setLocalizacaoFilter] = useState<string>("Total");
  const [redeFilter, setRedeFilter] = useState<string>("Total");
  const [sreFilter, setSreFilter] = useState<string>("Todas");
  const [anoReferencia, setAnoReferencia] = useState<number>(2025);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = supabase
          .from("tx_rendimento_municipios_to")
          .select("*")
          .eq("nivel_ensino", nivelFilter)
          .eq("segmento", segmentoFilter);

        const result = await fetchAllRows<MunicipioRendimentoData>(query);
        setData(result);
        setError(null);

        if (!municipioSelecionado && result.length > 0) {
          const nomes = Array.from(new Set(result.map((d) => d.nome_municipio))).sort();
          if (nomes.includes("Palmas")) setMunicipioSelecionado("Palmas");
          else if (nomes.length > 0) setMunicipioSelecionado(nomes[0]);
        }
      } catch (err) {
        console.error("Error fetching municipios rendimento data:", err);
        setError("Não foi possível carregar os dados de rendimento por município.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivelFilter, segmentoFilter]);

  const sres = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.sre).filter((s): s is string => !!s))).sort();
  }, [data]);

  const municipios = useMemo(() => {
    const base = sreFilter === "Todas" ? data : data.filter((d) => d.sre === sreFilter);
    return Array.from(new Set(base.map((d) => d.nome_municipio))).sort();
  }, [data, sreFilter]);

  // Se o município selecionado não pertence mais à SRE escolhida, troca para o primeiro disponível
  useEffect(() => {
    if (municipios.length > 0 && !municipios.includes(municipioSelecionado)) {
      setMunicipioSelecionado(municipios[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipios]);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.localizacao === localizacaoFilter &&
        item.dependencia_administrativa === redeFilter &&
        (sreFilter === "Todas" || item.sre === sreFilter)
    );
  }, [data, localizacaoFilter, redeFilter, sreFilter]);

  const statsByYear = useMemo(() => {
    const stats: Record<number, Record<string, number | undefined>> = {};
    const municipioData = filteredData.filter((d) => d.nome_municipio === municipioSelecionado);

    ANOS.forEach((year) => {
      stats[year] = {
        aprovacao: municipioData.find((d) => d.ano === year && d.tipo_taxa === "aprovacao")?.valor,
        reprovacao: municipioData.find((d) => d.ano === year && d.tipo_taxa === "reprovacao")?.valor,
        abandono: municipioData.find((d) => d.ano === year && d.tipo_taxa === "abandono")?.valor,
      };
    });

    return stats;
  }, [filteredData, municipioSelecionado]);

  const ranking = useMemo(() => {
    const result: Record<string, { nome_municipio: string; valor: number }[]> = {};
    TIPOS.forEach((type) => {
      const rows = filteredData
        .filter((d) => d.ano === anoReferencia && d.tipo_taxa === type && d.valor != null)
        .map((d) => ({ nome_municipio: d.nome_municipio, valor: Number(d.valor) }));

      // Dedup by município (should already be 1:1, but just in case)
      const byMunicipio = new Map<string, number>();
      rows.forEach((r) => byMunicipio.set(r.nome_municipio, r.valor));

      const sorted = Array.from(byMunicipio.entries())
        .map(([nome_municipio, valor]) => ({ nome_municipio, valor }))
        .sort((a, b) => (type === "aprovacao" ? b.valor - a.valor : a.valor - b.valor));

      result[type] = sorted;
    });
    return result;
  }, [filteredData, anoReferencia]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 size={40} className="text-[#0D6E3F] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando dados por município...</p>
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

  const kpiYear = anoReferencia;
  const kpiPrevYear = anoReferencia - 1;

  const getTrend = (type: string) => {
    const current = statsByYear[kpiYear]?.[type];
    const previous = statsByYear[kpiPrevYear]?.[type];

    if (current == null || previous == null) {
      return { icon: <Minus size={14} />, color: "text-gray-300", label: "N/A" };
    }

    const diff = current - previous;

    if (diff > 0)
      return { icon: <TrendingUp size={14} />, color: "text-green-600", label: `+${Number(diff).toFixed(1)}%` };
    if (diff < 0)
      return { icon: <TrendingDown size={14} />, color: "text-red-600", label: `${Number(diff).toFixed(1)}%` };

    return { icon: <Equal size={14} className="stroke-[3]" />, color: "text-indigo-400", label: "Estável" };
  };

  const municipioPos = (type: string) =>
    ranking[type]?.findIndex((r) => r.nome_municipio === municipioSelecionado) ?? -1;

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="sticky top-4 z-50 transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-wrap gap-6 items-end justify-center">
          <div className="space-y-2 min-w-[180px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 size={12} /> SRE
            </label>
            <SearchableSelect
              value={sreFilter}
              onChange={setSreFilter}
              options={["Todas", ...sres]}
              placeholder="Buscar SRE..."
            />
          </div>

          <div className="space-y-2 min-w-[220px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={12} /> Município
            </label>
            <SearchableSelect
              value={municipioSelecionado}
              onChange={setMunicipioSelecionado}
              options={municipios}
              placeholder="Buscar município..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} /> Nível de Ensino
            </label>
            <select
              value={nivelFilter}
              onChange={(e) => {
                setNivelFilter(e.target.value);
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
              <option value="Pública">Pública</option>
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
              {ANOS.slice()
                .reverse()
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["aprovacao", "reprovacao", "abandono"] as const).map((type, idx) => {
          const trend = getTrend(type);
          const barColor = type === "aprovacao" ? "bg-green-500" : type === "reprovacao" ? "bg-red-500" : "bg-orange-500";
          const borderColor = type === "aprovacao" ? "border-green-50" : type === "reprovacao" ? "border-red-50" : "border-orange-50";
          const iconBg =
            trend.label === "Estável"
              ? "bg-indigo-100 text-indigo-700"
              : type === "aprovacao"
              ? "bg-green-100 text-green-700"
              : trend.color.includes("red")
              ? type === "reprovacao"
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
              : "bg-green-100 text-green-700";

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn("bg-white p-6 rounded-3xl shadow-sm border relative overflow-hidden", borderColor)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", iconBg)}>{trend.icon}</div>
                <div className={cn("flex items-center gap-1 text-sm font-bold", trend.color)}>
                  {trend.icon}
                  {trend.label}
                </div>
              </div>
              <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">
                Taxa de {type === "aprovacao" ? "Aprovação" : type === "reprovacao" ? "Reprovação" : "Abandono"} ({kpiYear})
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-800">
                  {statsByYear[kpiYear]?.[type] != null ? `${Number(statsByYear[kpiYear][type]).toFixed(1)}%` : "N/A"}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-2 truncate">{municipioSelecionado || "Selecione um município"}</p>
              <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${statsByYear[kpiYear]?.[type] || 0}%` }}
                  className={cn("h-full", barColor)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Evolution Chart */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <BarChart className="text-[#0D6E3F]" /> Evolução Histórica — {municipioSelecionado || "..."} (2022-2025)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {TIPOS.map((type) => (
            <div key={type} className="space-y-6">
              <h4 className="text-center font-bold text-gray-400 uppercase text-xs tracking-widest">{type}</h4>
              <div className="flex justify-around h-64 border-b border-gray-100 pb-2 gap-4">
                {ANOS.map((year) => {
                  const val = Number(statsByYear[year]?.[type] || 0);
                  const maxScale = type === "aprovacao" ? 100 : 20;
                  const height = val > 0 ? Math.min(100, Math.max(2, (val / maxScale) * 100)) : 0;
                  const color = type === "aprovacao" ? "bg-green-500" : type === "reprovacao" ? "bg-red-500" : "bg-orange-500";

                  return (
                    <div key={year} className="flex flex-col items-center gap-2 flex-1 min-w-[30px] max-w-[60px] h-full group">
                      <div className="relative w-full flex flex-col items-center justify-end flex-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "w-full rounded-t-lg shadow-sm transition-all group-hover:brightness-110 border-x border-t border-black/5 relative",
                            color
                          )}
                        >
                          <div
                            className={cn(
                              "absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black text-gray-800 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded-lg border shadow-md backdrop-blur-sm z-30",
                              type === "aprovacao" ? "border-green-500" : type === "reprovacao" ? "border-red-500" : "border-orange-500"
                            )}
                          >
                            {statsByYear[year]?.[type] != null ? `${val.toFixed(1)}%` : "N/A"}
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

      {/* Ranking */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ranking entre Municípios</h3>
            </div>
            <p className="text-gray-500 font-medium">
              Comparativo entre {municipios.length} municípios {sreFilter === "Todas" ? "do Tocantins" : `da SRE ${sreFilter}`} em {anoReferencia}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {TIPOS.map((type) => {
            const sorted = ranking[type] || [];
            const pos = municipioPos(type);
            const top5 = sorted.slice(0, 5);
            const neighbors = [];
            if (pos > 5) neighbors.push({ ...sorted[pos - 1], rank: pos });
            if (pos >= 0) neighbors.push({ ...sorted[pos], rank: pos + 1, isSelected: true });
            if (pos >= 0 && pos < sorted.length - 1) neighbors.push({ ...sorted[pos + 1], rank: pos + 2 });

            const mColor = type === "aprovacao" ? "indigo" : type === "reprovacao" ? "emerald" : "amber";

            return (
              <div key={type} className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{type}</h4>
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "text-5xl font-black italic tracking-tighter",
                          mColor === "indigo" ? "text-indigo-600" : mColor === "emerald" ? "text-emerald-600" : "text-amber-600"
                        )}
                      >
                        {pos >= 0 ? `${pos + 1}º` : "--"}
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-gray-800">Lugar no Ranking</p>
                        <p className="text-[10px] text-gray-400 font-medium">de {sorted.length} municípios</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black border",
                      mColor === "indigo"
                        ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                        : mColor === "emerald"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    )}
                  >
                    {pos >= 0 ? `${sorted[pos].valor.toFixed(1)}%` : "N/A"}
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-yellow-400" /> Líderes do Ranking
                    </p>
                    <div className="space-y-2">
                      {top5.map((m, idx) => (
                        <div key={m.nome_municipio} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100/50 shadow-sm">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner",
                              idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-700 flex-1 truncate">{m.nome_municipio}</span>
                          <span className="text-[10px] font-black text-gray-400">{m.valor.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pos > 5 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-indigo-400" /> Contexto de {municipioSelecionado}
                      </p>
                      <div className="space-y-2">
                        {neighbors.map((m: any) => (
                          <div
                            key={m.nome_municipio}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all",
                              m.isSelected
                                ? type === "aprovacao"
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105 z-10"
                                  : type === "reprovacao"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105 z-10"
                                  : "bg-amber-600 text-white border-amber-600 shadow-lg scale-105 z-10"
                                : "bg-white/50 border-gray-100"
                            )}
                          >
                            <span
                              className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                m.isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                              )}
                            >
                              {m.rank}
                            </span>
                            <span className={cn("text-xs font-bold flex-1 truncate", m.isSelected ? "text-white" : "text-gray-600")}>
                              {m.nome_municipio}
                            </span>
                            <span className={cn("text-[10px] font-black", m.isSelected ? "text-white/80" : "text-gray-400")}>
                              {m.valor.toFixed(1)}%
                            </span>
                          </div>
                        ))}
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
