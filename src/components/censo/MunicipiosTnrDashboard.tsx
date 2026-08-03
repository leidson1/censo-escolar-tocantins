"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Filter, Activity, BarChart, Trophy, MapPin, Building2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import SearchableSelect from "@/components/ui/SearchableSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MunicipioTnrData {
  id: number;
  codigo_municipio: number;
  sre: string | null;
  nome_municipio: string;
  ano: number;
  regiao: string | null;
  uf: string | null;
  localizacao: string;
  dependencia_administrativa: string;
  nivel_ensino: string;
  segmento: string;
  valor: number;
}

const ANOS = [2023, 2024, 2025];

export default function MunicipiosTnrDashboard() {
  const [data, setData] = useState<MunicipioTnrData[]>([]);
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
          .from("tnr_municipios_to")
          .select("*")
          .eq("nivel_ensino", nivelFilter)
          .eq("segmento", segmentoFilter);

        const result = await fetchAllRows<MunicipioTnrData>(query);
        setData(result);
        setError(null);

        if (!municipioSelecionado && result.length > 0) {
          const nomes = Array.from(new Set(result.map((d) => d.nome_municipio))).sort();
          if (nomes.includes("Palmas")) setMunicipioSelecionado("Palmas");
          else if (nomes.length > 0) setMunicipioSelecionado(nomes[0]);
        }
      } catch (err) {
        console.error("Error fetching municipios TNR data:", err);
        setError("Não foi possível carregar os dados de não resposta por município.");
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

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.localizacao === localizacaoFilter &&
        item.dependencia_administrativa === redeFilter &&
        (sreFilter === "Todas" || item.sre === sreFilter)
    );
  }, [data, localizacaoFilter, redeFilter, sreFilter]);

  const statsByYear = useMemo(() => {
    const stats: Record<number, number | undefined> = {};
    const municipioData = filteredData.filter((d) => d.nome_municipio === municipioSelecionado);
    ANOS.forEach((year) => {
      stats[year] = municipioData.find((d) => d.ano === year)?.valor;
    });
    return stats;
  }, [filteredData, municipioSelecionado]);

  const ranking = useMemo(() => {
    const rows = filteredData.filter((d) => d.ano === anoReferencia && d.valor != null);
    const byMunicipio = new Map<string, number>();
    rows.forEach((r) => byMunicipio.set(r.nome_municipio, Number(r.valor)));
    return Array.from(byMunicipio.entries())
      .map(([nome_municipio, valor]) => ({ nome_municipio, valor }))
      .sort((a, b) => a.valor - b.valor); // menor TNR é melhor
  }, [filteredData, anoReferencia]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
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
  const val = statsByYear[kpiYear];
  const pos = ranking.findIndex((r) => r.nome_municipio === municipioSelecionado);
  const top5 = ranking.slice(0, 5);
  const neighbors = [];
  if (pos > 5) neighbors.push({ ...ranking[pos - 1], rank: pos });
  if (pos >= 0) neighbors.push({ ...ranking[pos], rank: pos + 1, isSelected: true });
  if (pos >= 0 && pos < ranking.length - 1) neighbors.push({ ...ranking[pos + 1], rank: pos + 2 });

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

          <div className="space-y-2 min-w-[220px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={12} /> Município
            </label>
            <SearchableSelect value={municipioSelecionado} onChange={setMunicipioSelecionado} options={municipios} placeholder="Buscar município..." />
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Localização</label>
            <select
              value={localizacaoFilter}
              onChange={(e) => setLocalizacaoFilter(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[140px]"
            >
              <option value="Total">Total</option>
              <option value="Urbana">Urbana</option>
              <option value="Rural">Rural</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rede</label>
            <select
              value={redeFilter}
              onChange={(e) => setRedeFilter(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[140px]"
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
          <p className="text-xs text-gray-400 font-semibold mt-2 truncate">{municipioSelecionado || "Selecione um município"}</p>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (val || 0) * 5)}%` }}
              className="h-full bg-amber-500"
            />
          </div>
        </motion.div>

        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart size={16} className="text-amber-500" /> Evolução Histórica — {municipioSelecionado || "..."} (2023-2025)
          </h3>
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

      {/* Ranking */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500 p-2 rounded-xl text-white">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ranking entre Municípios</h3>
            </div>
            <p className="text-gray-500 font-medium">
              Menor TNR é melhor — {municipios.length} municípios {sreFilter === "Todas" ? "do Tocantins" : `da SRE ${sreFilter}`} em {anoReferencia}
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
                    <p className="text-[10px] text-gray-400 font-medium">de {ranking.length} municípios</p>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-[10px] font-black border bg-amber-50 text-amber-600 border-amber-100">
                {pos >= 0 ? `${ranking[pos].valor.toFixed(1)}%` : "N/A"}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-yellow-400" /> Melhores desempenhos (menor TNR)
              </p>
              <div className="space-y-2">
                {top5.map((m, idx) => (
                  <div
                    key={m.nome_municipio}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl border shadow-sm",
                      m.nome_municipio === municipioSelecionado ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100/50"
                    )}
                  >
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
              <div className="mt-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Posição de {municipioSelecionado}</p>
                <div className="space-y-2">
                  {neighbors.map((m: any) => (
                    <div
                      key={m.nome_municipio}
                      className={cn("flex items-center gap-3 p-2 rounded-xl border", m.isSelected ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100")}
                    >
                      <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600">{m.rank}</span>
                      <span className={cn("text-xs font-bold flex-1 truncate", m.isSelected ? "text-amber-700 font-black" : "text-gray-700")}>
                        {m.nome_municipio} {m.isSelected && "◀"}
                      </span>
                      <span className="text-[10px] font-black text-gray-400">{m.valor.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100 max-h-[480px] overflow-y-auto">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Todos os Municípios</p>
            <div className="space-y-1.5">
              {ranking.map((m, idx) => {
                const isSelected = m.nome_municipio === municipioSelecionado;
                const maxVal = ranking[ranking.length - 1]?.valor || 1;
                const barW = maxVal > 0 ? Math.min(100, (m.valor / maxVal) * 100) : 0;
                return (
                  <div
                    key={m.nome_municipio}
                    className={cn("flex items-center gap-3 p-2 rounded-xl transition-all", isSelected ? "bg-amber-50 border border-amber-200" : "hover:bg-gray-100")}
                  >
                    <span className="text-[10px] font-black text-gray-400 w-5 text-right">{idx + 1}</span>
                    <span className={cn("text-xs font-bold flex-1 truncate", isSelected ? "text-amber-700" : "text-gray-700")}>{m.nome_municipio}</span>
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", isSelected ? "bg-amber-500" : "bg-gray-300")} style={{ width: `${barW}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 w-10 text-right">{m.valor.toFixed(1)}%</span>
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
