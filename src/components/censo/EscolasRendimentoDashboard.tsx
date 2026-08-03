"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { motion } from "framer-motion";
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
  School,
  MapPin,
  Building2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SearchableSelect from "@/components/ui/SearchableSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EscolaRendimentoData {
  id: number;
  codigo_municipio: number;
  sre: string | null;
  nome_municipio: string;
  codigo_escola: number;
  nome_escola: string;
  ano: number;
  localizacao: string;
  dependencia_administrativa: string;
  tipo_taxa: "aprovacao" | "reprovacao" | "abandono";
  nivel_ensino: string;
  segmento: string;
  valor: number;
}

const ANOS = [2023, 2024, 2025];
const TIPOS = ["aprovacao", "reprovacao", "abandono"] as const;

export default function EscolasRendimentoDashboard() {
  const [data, setData] = useState<EscolaRendimentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nivelFilter, setNivelFilter] = useState<string>("fundamental");
  const [segmentoFilter, setSegmentoFilter] = useState<string>("total");
  const [sreFilter, setSreFilter] = useState<string>("Todas");
  const [anoReferencia, setAnoReferencia] = useState<number>(2025);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>("");
  const [escolaSelecionada, setEscolaSelecionada] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = supabase
          .from("tx_rendimento_escolas_to")
          .select("*")
          .eq("nivel_ensino", nivelFilter)
          .eq("segmento", segmentoFilter);

        const result = await fetchAllRows<EscolaRendimentoData>(query);
        setData(result);
        setError(null);

        if (!municipioSelecionado && result.length > 0) {
          const nomes = Array.from(new Set(result.map((d) => d.nome_municipio))).sort();
          if (nomes.includes("Palmas")) setMunicipioSelecionado("Palmas");
          else if (nomes.length > 0) setMunicipioSelecionado(nomes[0]);
        }
      } catch (err) {
        console.error("Error fetching escolas rendimento data:", err);
        setError("Não foi possível carregar os dados de rendimento por escola.");
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

  // Uma escola pode ter o nome grafado de forma diferente entre os anos (ex: sigla
  // abreviada vs. nome por extenso). O codigo_escola é o identificador estável — toda
  // a lógica de filtro/comparação usa ele, e exibimos sempre o nome mais recente.
  const escolasDoMunicipio = useMemo(() => {
    const porCodigo = new Map<number, { codigo_escola: number; nome_escola: string; ano: number }>();
    data
      .filter((d) => d.nome_municipio === municipioSelecionado)
      .forEach((d) => {
        const atual = porCodigo.get(d.codigo_escola);
        if (!atual || d.ano > atual.ano) {
          porCodigo.set(d.codigo_escola, { codigo_escola: d.codigo_escola, nome_escola: d.nome_escola, ano: d.ano });
        }
      });
    return Array.from(porCodigo.values()).sort((a, b) => a.nome_escola.localeCompare(b.nome_escola));
  }, [data, municipioSelecionado]);

  const escolaNomes = useMemo(() => escolasDoMunicipio.map((e) => e.nome_escola), [escolasDoMunicipio]);

  const escolaCodigoPorNome = useMemo(() => {
    const m = new Map<string, number>();
    escolasDoMunicipio.forEach((e) => m.set(e.nome_escola, e.codigo_escola));
    return m;
  }, [escolasDoMunicipio]);

  const escolaCodigoSelecionado = escolaCodigoPorNome.get(escolaSelecionada);

  // Reset escola quando muda o município
  useEffect(() => {
    if (escolaNomes.length > 0 && !escolaNomes.includes(escolaSelecionada)) {
      setEscolaSelecionada(escolaNomes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolaNomes]);

  const statsByYear = useMemo(() => {
    const stats: Record<number, Record<string, number | undefined>> = {};
    const escolaData = data.filter((d) => d.codigo_escola === escolaCodigoSelecionado);

    ANOS.forEach((year) => {
      stats[year] = {
        aprovacao: escolaData.find((d) => d.ano === year && d.tipo_taxa === "aprovacao")?.valor,
        reprovacao: escolaData.find((d) => d.ano === year && d.tipo_taxa === "reprovacao")?.valor,
        abandono: escolaData.find((d) => d.ano === year && d.tipo_taxa === "abandono")?.valor,
      };
    });

    return stats;
  }, [data, escolaCodigoSelecionado]);

  // Ranking das escolas dentro do município selecionado (agrupado por codigo_escola)
  const rankingMunicipio = useMemo(() => {
    const result: Record<string, { codigo_escola: number; nome_escola: string; valor: number }[]> = {};
    TIPOS.forEach((type) => {
      const rows = data.filter(
        (d) => d.nome_municipio === municipioSelecionado && d.ano === anoReferencia && d.tipo_taxa === type && d.valor != null
      );
      const byEscola = new Map<number, { nome_escola: string; valor: number }>();
      rows.forEach((r) => byEscola.set(r.codigo_escola, { nome_escola: r.nome_escola, valor: Number(r.valor) }));

      const sorted = Array.from(byEscola.entries())
        .map(([codigo_escola, v]) => ({ codigo_escola, nome_escola: v.nome_escola, valor: v.valor }))
        .sort((a, b) => (type === "aprovacao" ? b.valor - a.valor : a.valor - b.valor));

      result[type] = sorted;
    });
    return result;
  }, [data, municipioSelecionado, anoReferencia]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 size={40} className="text-[#0D6E3F] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando dados por escola...</p>
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

  const escolaPos = (type: string) => rankingMunicipio[type]?.findIndex((r) => r.codigo_escola === escolaCodigoSelecionado) ?? -1;

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

          <div className="space-y-2 min-w-[200px]">
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

          <div className="space-y-2 min-w-[240px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <School size={12} /> Escola
            </label>
            <SearchableSelect
              value={escolaSelecionada}
              onChange={setEscolaSelecionada}
              options={escolaNomes}
              placeholder="Buscar escola..."
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
              <p className="text-xs text-gray-400 font-semibold mt-2 truncate">{escolaSelecionada || "Selecione uma escola"}</p>
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
        <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <BarChart className="text-[#0D6E3F]" /> Evolução Histórica (2023-2025)
        </h3>
        <p className="text-sm text-gray-400 font-medium mb-8 truncate">{escolaSelecionada} — {municipioSelecionado}</p>

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
                    <div key={year} className="flex flex-col items-center gap-2 flex-1 min-w-[30px] max-w-[70px] h-full group">
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

      {/* Ranking dentro do município */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ranking entre Escolas do Município</h3>
            </div>
            <p className="text-gray-500 font-medium">
              Comparativo entre as escolas de {municipioSelecionado}
              {sreFilter !== "Todas" ? ` (SRE ${sreFilter})` : ""} em {anoReferencia}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {TIPOS.map((type) => {
            const sorted = rankingMunicipio[type] || [];
            const pos = escolaPos(type);
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
                        <p className="text-[10px] text-gray-400 font-medium">de {sorted.length} escolas</p>
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
                      {top5.map((esc, idx) => (
                        <div key={esc.codigo_escola} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100/50 shadow-sm">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner shrink-0",
                              idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-700 flex-1 truncate">{esc.nome_escola}</span>
                          <span className="text-[10px] font-black text-gray-400 shrink-0">{esc.valor.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pos > 5 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-indigo-400" /> Contexto da Escola
                      </p>
                      <div className="space-y-2">
                        {neighbors.map((esc: any) => (
                          <div
                            key={esc.codigo_escola}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all",
                              esc.isSelected
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
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                esc.isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                              )}
                            >
                              {esc.rank}
                            </span>
                            <span className={cn("text-xs font-bold flex-1 truncate", esc.isSelected ? "text-white" : "text-gray-600")}>
                              {esc.nome_escola}
                            </span>
                            <span className={cn("text-[10px] font-black shrink-0", esc.isSelected ? "text-white/80" : "text-gray-400")}>
                              {esc.valor.toFixed(1)}%
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
