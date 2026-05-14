"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/supabase-utils";
import { motion } from "framer-motion";
import {
  AlertCircle, Loader2, Filter, Activity,
  BarChart, PieChart, Trophy
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TnrData {
  id: number;
  ano_do_censo: number;
  nome_da_regiao_geografica: string | null;
  nome_da_unidade_federativa: string | null;
  localizacao: string;
  dependencia_administrativa: string;
  nivel_ensino: string;
  segmento: string;
  valor: number;
}

export default function TnrDashboard() {
  const [data, setData] = useState<TnrData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nivelEnsino, setNivelEnsino] = useState<string>("fundamental");
  const [segmentoFilter, setSegmentoFilter] = useState<string>("total");
  const [localizacaoFilter, setLocalizacaoFilter] = useState<string>("Total");
  const [redeFilter, setRedeFilter] = useState<string>("Total");
  const [regiaoComparacao, setRegiaoComparacao] = useState<string>("Norte");
  const [anoReferencia, setAnoReferencia] = useState<number>(2024);
  const [rankingScope, setRankingScope] = useState<"Brasil" | "Região">("Brasil");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all years for this nivel+segmento so we can do historical charts
        const query = supabase
          .from("tnr_escolar")
          .select("*")
          .eq("nivel_ensino", nivelEnsino)
          .eq("segmento", segmentoFilter);
        const result = await fetchAllRows<TnrData>(query);
        setData(result);
        setError(null);
      } catch {
        setError("Não foi possível carregar os dados de não resposta.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nivelEnsino, segmentoFilter]);

  const filteredData = useMemo(() =>
    data.filter(item =>
      item.segmento === segmentoFilter &&
      item.localizacao === localizacaoFilter &&
      item.dependencia_administrativa === redeFilter
    ),
  [data, segmentoFilter, localizacaoFilter, redeFilter]);

  // Historical stats for Tocantins (2022-2024)
  const statsByYear = useMemo(() => {
    const years = [2022, 2023, 2024];
    const stats: Record<number, number | undefined> = {};
    const tocantinsData = filteredData.filter(d => d.nome_da_unidade_federativa === "Tocantins");
    years.forEach(year => {
      stats[year] = tocantinsData.find(d => d.ano_do_censo === year)?.valor;
    });
    return stats;
  }, [filteredData]);

  // Tocantins value for selected reference year
  const tocantinsVal = useMemo(() =>
    filteredData.find(d => d.nome_da_unidade_federativa === "Tocantins" && d.ano_do_censo === anoReferencia)?.valor,
  [filteredData, anoReferencia]);

  const comparativeData = useMemo(() => {
    const getVal = (scope: string) => {
      if (scope === "Tocantins") {
        return filteredData.find(i => i.nome_da_unidade_federativa === "Tocantins" && i.ano_do_censo === anoReferencia)?.valor;
      } else if (scope.startsWith("Região")) {
        return (
          filteredData.find(i => i.nome_da_regiao_geografica === regiaoComparacao && !i.nome_da_unidade_federativa && i.ano_do_censo === anoReferencia)?.valor ??
          data.find(i => i.nome_da_regiao_geografica === regiaoComparacao && !i.nome_da_unidade_federativa && i.ano_do_censo === anoReferencia && i.localizacao === "Total" && i.dependencia_administrativa === "Total" && i.segmento === segmentoFilter)?.valor
        );
      } else {
        return (
          filteredData.find(i => !i.nome_da_regiao_geografica && !i.nome_da_unidade_federativa && i.ano_do_censo === anoReferencia)?.valor ??
          data.find(i => !i.nome_da_regiao_geografica && !i.nome_da_unidade_federativa && i.ano_do_censo === anoReferencia && i.localizacao === "Total" && i.dependencia_administrativa === "Total" && i.segmento === segmentoFilter)?.valor
        );
      }
    };
    return {
      Brasil: getVal("Brasil"),
      [`Região ${regiaoComparacao}`]: getVal(`Região ${regiaoComparacao}`),
      Tocantins: getVal("Tocantins"),
    };
  }, [filteredData, regiaoComparacao, anoReferencia, data, segmentoFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 size={40} className="text-[#0D6E3F] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando dados de não resposta...</p>
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

  const toVal = tocantinsVal;
  const brVal = comparativeData["Brasil"];
  const regVal = comparativeData[`Região ${regiaoComparacao}`];
  const diffBr = toVal != null && brVal != null ? toVal - brVal : null;
  const isPositive = diffBr != null ? diffBr < 0 : null; // menor TNR = melhor

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="sticky top-4 z-50">
        <div className="bg-white/90 backdrop-blur-md px-6 pt-4 pb-5 rounded-2xl shadow-lg border border-gray-100">
          <p className="text-center text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-4">Filtros de Análise</p>
          <div className="flex flex-wrap gap-5 items-end justify-center">
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Nível
            </label>
            <select
              value={nivelEnsino}
              onChange={(e) => {
                setNivelEnsino(e.target.value);
                setSegmentoFilter("total"); // reset segment on nivel change
              }}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[160px]"
            >
              <option value="fundamental">Ensino Fundamental</option>
              <option value="medio">Ensino Médio</option>
            </select>
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Activity size={12} /> Etapa/Série
            </label>
            <select
              value={segmentoFilter}
              onChange={(e) => setSegmentoFilter(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[180px]"
            >
              <option value="total">Total do Nível</option>
              {nivelEnsino === "fundamental" ? (
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
                  <option value="nao_seriado">Não Seriado</option>
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

          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Localização
            </label>
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

          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Rede
            </label>
            <select
              value={redeFilter}
              onChange={(e) => setRedeFilter(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[140px]"
            >
              <option value="Total">Total</option>
              <option value="Estadual">Estadual</option>
              <option value="Municipal">Municipal</option>
              <option value="Pública">Pública</option>
              <option value="Privada">Privada</option>
              <option value="Federal">Federal</option>
            </select>
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Ano de Ref.
            </label>
            <select
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(Number(e.target.value))}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[100px]"
            >
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} /> Região
            </label>
            <select
              value={regiaoComparacao}
              onChange={(e) => setRegiaoComparacao(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none min-w-[160px]"
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
      </div>

      {/* Evolução Histórica (2022-2024) */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <BarChart className="text-amber-500" /> Evolução Histórica — Tocantins (2022–2024)
        </h3>
        {(() => {
          const histVals = [2022, 2023, 2024].map(y => Number(statsByYear[y] || 0));
          const chartMax = Math.max(...histVals, 0.1) * 1.35;
          return (
            <div className="flex justify-center gap-12 h-64 items-end border-b border-gray-100 pb-4">
              {[2022, 2023, 2024].map((year, i) => {
                const val = histVals[i];
                const height = val > 0 ? Math.min(100, Math.max(8, (val / chartMax) * 100)) : 0;
                const isRef = year === anoReferencia;
                return (
                  <div key={year} className="flex flex-col items-center gap-3 w-36 h-full group">
                    <div className="relative w-full flex flex-col items-center justify-end flex-1">
                      <div className={cn(
                        "absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-black whitespace-nowrap px-3 py-1 rounded-xl border-2 shadow-lg z-30",
                        isRef
                          ? "bg-amber-500 text-white border-amber-600"
                          : "bg-white text-gray-700 border-amber-200"
                      )}>
                        {val > 0 ? `${val.toFixed(1)}%` : "N/A"}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={cn(
                          "w-full rounded-t-2xl shadow-md transition-all",
                          isRef
                            ? "bg-gradient-to-t from-amber-600 to-amber-400"
                            : "bg-gradient-to-t from-amber-300 to-amber-100"
                        )}
                      />
                    </div>
                    <span className={cn(
                      "text-sm font-black",
                      isRef ? "text-amber-600" : "text-gray-400"
                    )}>{year}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <p className="mt-4 text-xs text-gray-400 text-center">
          {nivelEnsino === "fundamental" ? "Ensino Fundamental" : "Ensino Médio"} • Ano em destaque: {anoReferencia}
        </p>
      </div>

      {/* KPI Card — Tocantins */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-amber-50 relative overflow-hidden"
        >
          <h3 className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Taxa de Não Resposta — Tocantins ({anoReferencia})</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-gray-800">
              {toVal != null ? `${Number(toVal).toFixed(1)}%` : "N/A"}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (toVal || 0) * 5)}%` }}
              className="h-full bg-amber-500"
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">Percentual de alunos sem situação de rendimento declarada.</p>
        </motion.div>

        {/* Comparativo Brasil e Região */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-gradient-to-br from-amber-50 to-white p-6 rounded-3xl shadow-sm border border-amber-100"
        >
          <h3 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-amber-600" /> Comparativo Geográfico ({anoReferencia})
          </h3>
          {(() => {
            const compVals = ["Brasil", `Região ${regiaoComparacao}`, "Tocantins"].map(
              s => comparativeData[s as keyof typeof comparativeData] ?? 0
            );
            const compMax = Math.max(...compVals, 0.1) * 1.35;
            const scopes = ["Brasil", `Região ${regiaoComparacao}`, "Tocantins"] as const;
            const CHART_H = 160; // px — fixed chart height
            return (
              <div className="flex justify-around gap-4 mt-6 mb-4" style={{ height: CHART_H + 24 }}>
                {scopes.map((scope) => {
                  const val = comparativeData[scope as keyof typeof comparativeData];
                  const pct = val != null && val > 0 ? Math.min(100, Math.max(6, (val / compMax) * 100)) : 0;
                  const barH = Math.round((pct / 100) * CHART_H);
                  const isTocantins = scope === "Tocantins";
                  const isRegiao = scope.startsWith("Região");
                  const gradient = isTocantins
                    ? "bg-gradient-to-t from-amber-600 to-amber-400"
                    : isRegiao
                    ? "bg-gradient-to-t from-sky-500 to-sky-300"
                    : "bg-gradient-to-t from-purple-700 to-purple-400";
                  const badgeColor = isTocantins
                    ? "bg-amber-500 text-white border-amber-600"
                    : isRegiao
                    ? "bg-sky-500 text-white border-sky-600"
                    : "bg-purple-600 text-white border-purple-700";
                  return (
                    <div key={scope} className="flex flex-col items-center justify-end gap-2 flex-1">
                      {/* Bar + label wrapper */}
                      <div className="relative w-full flex items-end justify-center" style={{ height: CHART_H }}>
                        {/* Value badge */}
                        <div className={cn(
                          "absolute left-1/2 -translate-x-1/2 text-xs font-black whitespace-nowrap px-2 py-0.5 rounded-lg border-2 shadow-md z-30",
                          badgeColor
                        )} style={{ bottom: barH + 8 }}>
                          {val != null ? `${Number(val).toFixed(1)}%` : "N/A"}
                        </div>
                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: barH }}
                          transition={{ duration: 1.2, ease: "backOut" }}
                          className={cn(
                            "w-4/5 rounded-t-xl shadow-lg",
                            gradient,
                            isTocantins ? "ring-2 ring-amber-300 ring-offset-1" : ""
                          )}
                        />
                      </div>
                      {/* Scope label */}
                      <span className={cn(
                        "text-[10px] font-black text-center leading-tight",
                        isTocantins ? "text-gray-900" : "text-gray-500"
                      )}>{scope}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {/* Diagnóstico inline */}
          {toVal != null && brVal != null && (
            <div className={cn("mt-4 p-3 rounded-xl border text-xs",
              isPositive ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
            )}>
              <span className="font-bold">Tocantins ({Number(toVal).toFixed(1)}%)</span>{" "}
              está{" "}
              <span className="font-bold">
                {Math.abs(diffBr!) < 0.01 ? "equivalente à" : isPositive ? "abaixo da" : "acima da"}
              </span>{" "}
              média nacional ({brVal != null ? Number(brVal).toFixed(1) : "N/A"}%)
              {Math.abs(diffBr!) >= 0.01 && ` — diferença de ${Math.abs(Number(diffBr)).toFixed(1)} p.p.`}
              {regVal != null && `, e ${Number(toVal).toFixed(1) < Number(regVal) ? "inferior" : Number(toVal).toFixed(1) > Number(regVal) ? "superior" : "igual"} à Região ${regiaoComparacao} (${Number(regVal).toFixed(1)}%).`}
            </div>
          )}
        </motion.div>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500 p-2 rounded-xl text-white">
                <Trophy size={20} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Posicionamento no Ranking</h3>
            </div>
            <p className="text-gray-500 font-medium">Ranking de TNR por estado — quanto menor, melhor ({anoReferencia})</p>
          </div>
          <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setRankingScope("Brasil")}
              className={cn("px-6 py-2 rounded-lg text-xs font-bold transition-all",
                rankingScope === "Brasil" ? "bg-amber-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
              )}
            >Brasil</button>
            <button
              onClick={() => setRankingScope("Região")}
              className={cn("px-6 py-2 rounded-lg text-xs font-bold transition-all",
                rankingScope === "Região" ? "bg-amber-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
              )}
            >Região {regiaoComparacao}</button>
          </div>
        </div>

        {(() => {
          const baseData = data.filter(d =>
            d.ano_do_censo === anoReferencia &&
            d.nome_da_unidade_federativa &&
            d.segmento === segmentoFilter &&
            d.localizacao === localizacaoFilter &&
            d.dependencia_administrativa === redeFilter &&
            (rankingScope === "Brasil" || d.nome_da_regiao_geografica === regiaoComparacao)
          );

          // Lower TNR is better — sort ascending
          const sorted = [...baseData].sort((a, b) => a.valor - b.valor);
          const toPos = sorted.findIndex(s => s.nome_da_unidade_federativa === "Tocantins");
          const tocantinsPos = toPos + 1;
          const tocantinsRankVal = sorted[toPos]?.valor;
          const top3 = sorted.slice(0, 3);
          const neighbors: (typeof sorted[0] & { rank: number; isTocantins?: boolean })[] = [];
          if (toPos > 0) neighbors.push({ ...sorted[toPos - 1], rank: toPos });
          if (toPos >= 0) neighbors.push({ ...sorted[toPos], rank: toPos + 1, isTocantins: true });
          if (toPos >= 0 && toPos < sorted.length - 1) neighbors.push({ ...sorted[toPos + 1], rank: toPos + 2 });

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Position */}
              <div className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Taxa de Não Resposta</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-black italic tracking-tighter text-amber-500">
                        {tocantinsPos > 0 ? `${tocantinsPos}º` : "--"}
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-bold text-gray-800">Lugar no Ranking</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {rankingScope === "Brasil" ? "em todo o país (menor = melhor)" : `na Região ${regiaoComparacao}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-[10px] font-black border bg-amber-50 text-amber-600 border-amber-100">
                    {tocantinsRankVal !== undefined ? `${Number(tocantinsRankVal).toFixed(1)}%` : "N/A"}
                  </div>
                </div>

                {/* Top 3 */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-yellow-400" /> Melhores desempenhos (menor TNR)
                  </p>
                  <div className="space-y-2">
                    {top3.map((state, idx) => (
                      <div key={state.nome_da_unidade_federativa} className={cn(
                        "flex items-center gap-3 p-2 rounded-xl border shadow-sm",
                        state.nome_da_unidade_federativa === "Tocantins"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-white border-gray-100/50"
                      )}>
                        <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner",
                          idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-700"
                        )}>{idx + 1}</span>
                        <span className={cn("text-xs font-bold flex-1",
                          state.nome_da_unidade_federativa === "Tocantins" ? "text-amber-700" : "text-gray-700"
                        )}>{state.nome_da_unidade_federativa}</span>
                        <span className="text-[10px] font-black text-gray-400">{Number(state.valor).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Neighbors — always show when Tocantins is found */}
                {toPos >= 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Posição do Tocantins</p>
                    <div className="space-y-2">
                      {neighbors.map((s) => (
                        <div key={`${s.nome_da_unidade_federativa}-${s.rank}`} className={cn(
                          "flex items-center gap-3 p-2 rounded-xl border",
                          s.isTocantins ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
                        )}>
                          <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-600">{s.rank}</span>
                          <span className={cn("text-xs font-bold flex-1", s.isTocantins ? "text-amber-700 font-black" : "text-gray-700")}>
                            {s.nome_da_unidade_federativa} {s.isTocantins && "◀"}
                          </span>
                          <span className="text-[10px] font-black text-gray-400">{Number(s.valor).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full sorted list */}
              <div className="flex flex-col bg-gray-50/30 rounded-[2rem] p-6 border border-gray-100 max-h-[480px] overflow-y-auto">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Todos os Estados</p>
                <div className="space-y-1.5">
                  {sorted.map((state, idx) => {
                    const isTocantins = state.nome_da_unidade_federativa === "Tocantins";
                    const barW = sorted.length > 0 ? Math.min(100, (state.valor / sorted[sorted.length - 1].valor) * 100) : 0;
                    return (
                      <div key={state.nome_da_unidade_federativa} className={cn(
                        "flex items-center gap-3 p-2 rounded-xl transition-all",
                        isTocantins ? "bg-amber-50 border border-amber-200" : "hover:bg-gray-100"
                      )}>
                        <span className="text-[10px] font-black text-gray-400 w-5 text-right">{idx + 1}</span>
                        <span className={cn("text-xs font-bold flex-1", isTocantins ? "text-amber-700" : "text-gray-700")}>
                          {state.nome_da_unidade_federativa}
                        </span>
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", isTocantins ? "bg-amber-500" : "bg-gray-300")} style={{ width: `${barW}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-gray-500 w-10 text-right">{Number(state.valor).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Info Note */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold">Taxa de Não Resposta (TNR):</span> Percentual de alunos matriculados que não tiveram a situação de rendimento escolar (aprovado, reprovado ou abandonou) declarada pela escola no Censo Escolar {anoReferencia}. {nivelEnsino === "fundamental" ? "Ensino Fundamental" : "Ensino Médio"}.
        </p>
      </div>
    </div>
  );
}
