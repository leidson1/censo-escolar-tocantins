"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Filter, Activity, BarChart, Trophy, MapPin, School, Building2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SearchableSelect from "@/components/ui/SearchableSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EscolaTnrData {
  id: number;
  codigo_municipio: number;
  sre: string | null;
  nome_municipio: string;
  codigo_escola: number;
  nome_escola: string;
  ano: number;
  localizacao: string;
  dependencia_administrativa: string;
  nivel_ensino: string;
  segmento: string;
  valor: number;
}

const ANOS = [2023, 2024, 2025];

export default function EscolasTnrDashboard() {
  const [data, setData] = useState<EscolaTnrData[]>([]);
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
          .from("tnr_escolas_to")
          .select("*")
          .eq("nivel_ensino", nivelFilter)
          .eq("segmento", segmentoFilter);

        const result = await fetchAllRows<EscolaTnrData>(query);
        setData(result);
        setError(null);

        if (!municipioSelecionado && result.length > 0) {
          const nomes = Array.from(new Set(result.map((d) => d.nome_municipio))).sort();
          if (nomes.includes("Palmas")) setMunicipioSelecionado("Palmas");
          else if (nomes.length > 0) setMunicipioSelecionado(nomes[0]);
        }
      } catch (err) {
        console.error("Error fetching escolas TNR data:", err);
        setError("Não foi possível carregar os dados de não resposta por escola.");
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

  useEffect(() => {
    if (escolaNomes.length > 0 && !escolaNomes.includes(escolaSelecionada)) {
      setEscolaSelecionada(escolaNomes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolaNomes]);

  const statsByYear = useMemo(() => {
    const stats: Record<number, number | undefined> = {};
    const escolaData = data.filter((d) => d.codigo_escola === escolaCodigoSelecionado);
    ANOS.forEach((year) => {
      stats[year] = escolaData.find((d) => d.ano === year)?.valor;
    });
    return stats;
  }, [data, escolaCodigoSelecionado]);

  const rankingMunicipio = useMemo(() => {
    const rows = data.filter((d) => d.nome_municipio === municipioSelecionado && d.ano === anoReferencia && d.valor != null);
    const byEscola = new Map<number, { nome_escola: string; valor: number }>();
    rows.forEach((r) => byEscola.set(r.codigo_escola, { nome_escola: r.nome_escola, valor: Number(r.valor) }));
    return Array.from(byEscola.entries())
      .map(([codigo_escola, v]) => ({ codigo_escola, nome_escola: v.nome_escola, valor: v.valor }))
      .sort((a, b) => a.valor - b.valor); // menor TNR é melhor
  }, [data, municipioSelecionado, anoReferencia]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
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
  const val = statsByYear[kpiYear];
  const pos = rankingMunicipio.findIndex((r) => r.codigo_escola === escolaCodigoSelecionado);
  const top5 = rankingMunicipio.slice(0, 5);
  const neighbors = [];
  if (pos > 5) neighbors.push({ ...rankingMunicipio[pos - 1], rank: pos });
  if (pos >= 0) neighbors.push({ ...rankingMunicipio[pos], rank: pos + 1, isSelected: true });
  if (pos >= 0 && pos < rankingMunicipio.length - 1) neighbors.push({ ...rankingMunicipio[pos + 1], rank: pos + 2 });

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="sticky top-4 z-50 transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-wrap gap-6 items-end justify-center">
          <div className="space-y-2 min-w-[180px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 size={12} /> SRE
            </label>
            <SearchableSelect value={sreFilter} onChange={setSreFilter} options={["Todas", ...sres]} placeholder="Buscar SRE..." />
          </div>

          <div className="space-y-2 min-w-[200px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={12} /> Município
            </label>
            <SearchableSelect value={municipioSelecionado} onChange={setMunicipioSelecionado} options={municipios} placeholder="Buscar município..." />
          </div>

          <div className="space-y-2 min-w-[240px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <School size={12} /> Escola
            </label>
            <SearchableSelect value={escolaSelecionada} onChange={setEscolaSelecionada} options={escolaNomes} placeholder="Buscar escola..." />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} /> Nível de Ensino
            </label>
            <select
              value={nivelFilter}
              onChange={(e) => {
                setNivelFilter(e.target.value);
                setSegmentoFilter("total");
              }}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[180px]"
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
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[180px]"
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ano de Ref.</label>
            <select
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(Number(e.target.value))}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[100px]"
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

      {/* KPI + Evolution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-amber-50 relative overflow-hidden"
        >
          <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">TNR — {kpiYear}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-800">{val != null ? `${Number(val).toFixed(1)}%` : "N/A"}</span>
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-2 truncate">{escolaSelecionada || "Selecione uma escola"}</p>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (val || 0) * 5)}%` }}
              className="h-full bg-amber-500"
            />
          </div>
        </motion.div>

        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
            <BarChart size={16} className="text-amber-500" /> Evolução Histórica (2023-2025)
          </h3>
          <p className="text-xs text-gray-400 font-medium mb-6 truncate">{escolaSelecionada} — {municipioSelecionado}</p>
          {(() => {
            const histVals = ANOS.map((y) => Number(statsByYear[y] || 0));
            const chartMax = Math.max(...histVals, 0.1) * 1.35;
            return (
              <div className="flex justify-around gap-6 h-40 items-end border-b border-gray-100 pb-2">
                {ANOS.map((year) => {
                  const v = Number(statsByYear[year] || 0);
                  const height = v > 0 ? Math.min(100, Math.max(8, (v / chartMax) * 100)) : 0;
                  const isRef = year === anoReferencia;
                  return (
                    <div key={year} className="flex flex-col items-center gap-2 flex-1 max-w-[70px] h-full group">
                      <div className="relative w-full flex flex-col items-center justify-end flex-1">
                        <div
                          className={cn(
                            "absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black whitespace-nowrap px-2 py-0.5 rounded-lg border shadow-md z-30",
                            isRef ? "bg-amber-500 text-white border-amber-600" : "bg-white text-gray-700 border-amber-200"
                          )}
                        >
                          {statsByYear[year] != null ? `${v.toFixed(1)}%` : "N/A"}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "w-full rounded-t-lg shadow-sm",
                            isRef ? "bg-gradient-to-t from-amber-600 to-amber-400" : "bg-gradient-to-t from-amber-300 to-amber-100"
                          )}
                        />
                      </div>
                      <span className={cn("text-[10px] font-bold", isRef ? "text-amber-600" : "text-gray-400")}>{year}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Ranking dentro do município */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500 p-2 rounded-xl text-white">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ranking entre Escolas do Município</h3>
            </div>
            <p className="text-gray-500 font-medium">
              Menor TNR é melhor — escolas de {municipioSelecionado}
              {sreFilter !== "Todas" ? ` (SRE ${sreFilter})` : ""} em {anoReferencia}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Taxa de Não Resposta</h4>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-black italic tracking-tighter text-amber-500">{pos >= 0 ? `${pos + 1}º` : "--"}</div>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-gray-800">Lugar no Ranking</p>
                    <p className="text-[10px] text-gray-400 font-medium">de {rankingMunicipio.length} escolas</p>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-[10px] font-black border bg-amber-50 text-amber-600 border-amber-100">
                {pos >= 0 ? `${rankingMunicipio[pos].valor.toFixed(1)}%` : "N/A"}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-yellow-400" /> Melhores desempenhos (menor TNR)
              </p>
              <div className="space-y-2">
                {top5.map((esc, idx) => (
                  <div
                    key={esc.codigo_escola}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl border shadow-sm",
                      esc.codigo_escola === escolaCodigoSelecionado ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100/50"
                    )}
                  >
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
              <div className="mt-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Posição da Escola</p>
                <div className="space-y-2">
                  {neighbors.map((esc: any) => (
                    <div
                      key={esc.codigo_escola}
                      className={cn("flex items-center gap-3 p-2 rounded-xl border", esc.isSelected ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100")}
                    >
                      <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600 shrink-0">{esc.rank}</span>
                      <span className={cn("text-xs font-bold flex-1 truncate", esc.isSelected ? "text-amber-700 font-black" : "text-gray-700")}>
                        {esc.nome_escola} {esc.isSelected && "◀"}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 shrink-0">{esc.valor.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100 max-h-[480px] overflow-y-auto">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Todas as Escolas</p>
            <div className="space-y-1.5">
              {rankingMunicipio.map((esc, idx) => {
                const isSelected = esc.codigo_escola === escolaCodigoSelecionado;
                const maxVal = rankingMunicipio[rankingMunicipio.length - 1]?.valor || 1;
                const barW = maxVal > 0 ? Math.min(100, (esc.valor / maxVal) * 100) : 0;
                return (
                  <div
                    key={esc.codigo_escola}
                    className={cn("flex items-center gap-3 p-2 rounded-xl transition-all", isSelected ? "bg-amber-50 border border-amber-200" : "hover:bg-gray-100")}
                  >
                    <span className="text-[10px] font-black text-gray-400 w-5 text-right shrink-0">{idx + 1}</span>
                    <span className={cn("text-xs font-bold flex-1 truncate", isSelected ? "text-amber-700" : "text-gray-700")}>{esc.nome_escola}</span>
                    <div className="flex items-center gap-2 w-32 shrink-0">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", isSelected ? "bg-amber-500" : "bg-gray-300")} style={{ width: `${barW}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 w-10 text-right">{esc.valor.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
