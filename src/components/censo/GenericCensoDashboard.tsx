"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, UserCircle, X, School } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLabel, getValueLabel } from "@/lib/censo-dict";
import { RawDataSection } from "./CensoDashboard";

/** Dashboard genérico para arquivos com estrutura CO_ENTIDADE + UNIDADE + MUNICIPIO + campos QT_ */
interface GenericRecord {
  CO_ENTIDADE: number;
  UNIDADE: string;
  MUNICIPIO: string;
  TP_DEPENDENCIA?: number;
  TP_LOCALIZACAO?: number;
  [key: string]: unknown;
}

interface KpiDef {
  key: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

interface GenericDashboardProps {
  data: GenericRecord[];
  /** Campos a exibir como KPI totalizador no topo */
  kpiFields: KpiDef[];
  /** Campos a exibir na tabela (além de UNIDADE e MUNICIPIO) */
  tableFields: { key: string; label: string }[];
  /** Cor de destaque: "blue" | "purple" | "teal" | "rose" */
  color?: "blue" | "purple" | "teal" | "rose";
  /** Label do campo de busca */
  searchPlaceholder?: string;
}

const COLOR_MAP = {
  blue:   { ring: "focus:ring-blue-400",   badge: "bg-blue-100 text-blue-700",   border: "border-blue-500",   accent: "text-blue-700",   row: "hover:bg-blue-50/30",  icon: "bg-blue-50 text-blue-600"  },
  purple: { ring: "focus:ring-purple-400", badge: "bg-purple-100 text-purple-700", border: "border-purple-500", accent: "text-purple-700", row: "hover:bg-purple-50/30", icon: "bg-purple-50 text-purple-600" },
  teal:   { ring: "focus:ring-teal-400",   badge: "bg-teal-100 text-teal-700",   border: "border-teal-500",   accent: "text-teal-700",   row: "hover:bg-teal-50/30",  icon: "bg-teal-50 text-teal-600"  },
  rose:   { ring: "focus:ring-rose-400",   badge: "bg-rose-100 text-rose-700",   badge2: "bg-rose-500",       border: "border-rose-500",  accent: "text-rose-700",    row: "hover:bg-rose-50/30",  icon: "bg-rose-50 text-rose-600"  },
};

const REDE: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };
const LOCAL: Record<number, string> = { 1: "Urbana", 2: "Rural" };

export default function GenericCensoDashboard({
  data,
  kpiFields,
  tableFields,
  color = "blue",
  searchPlaceholder = "Buscar escola ou código INEP...",
}: GenericDashboardProps) {
  const [search, setSearch] = useState("");
  const [municipio, setMunicipio] = useState("Todos");
  const [rede, setRede]     = useState("Todas");
  const [sortField, setSortField] = useState("UNIDADE");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [selected, setSelected]   = useState<GenericRecord | null>(null);

  const c = COLOR_MAP[color];

  const municipios = useMemo(() => {
    const s = Array.from(new Set(data.map(r => r.MUNICIPIO))).sort();
    return ["Todos", ...s];
  }, [data]);

  // KPI totals
  const kpiTotals = useMemo(() =>
    kpiFields.map(f => ({
      ...f,
      total: data.reduce((acc, r) => acc + (Number(r[f.key]) || 0), 0),
    })),
  [data, kpiFields]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const list = data.filter(r => {
      const matchSearch = r.UNIDADE?.toLowerCase().includes(term) || String(r.CO_ENTIDADE).includes(term);
      const matchMun   = municipio === "Todos" || r.MUNICIPIO === municipio;
      const matchRede  = rede === "Todas" || REDE[r.TP_DEPENDENCIA ?? 0] === rede;
      return matchSearch && matchMun && matchRede;
    });
    list.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list.slice(0, 100);
  }, [data, search, municipio, rede, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(kpiFields.length + 1, 4)} gap-4`}>
        {kpiTotals.map(kpi => (
          <div key={kpi.key} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${c.icon}`}>
              {kpi.icon}
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">{kpi.label}</div>
              <div className={`text-xl font-bold text-gray-800 leading-tight`}>{kpi.total.toLocaleString("pt-BR")}</div>
            </div>
          </div>
        ))}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-50 text-gray-400">
            <School size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Unidades</div>
            <div className="text-xl font-bold text-gray-800 leading-tight">{data.length.toLocaleString("pt-BR")}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 ${c.ring} outline-none text-sm`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
          value={municipio}
          onChange={e => setMunicipio(e.target.value)}
        >
          {municipios.map(m => <option key={m}>{m}</option>)}
        </select>
        <select
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
          value={rede}
          onChange={e => setRede(e.target.value)}
        >
          <option value="Todas">Todas as redes</option>
          <option>Federal</option><option>Estadual</option>
          <option>Municipal</option><option>Privada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortTh label="Unidade" field="UNIDADE" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Município" field="MUNICIPIO" current={sortField} dir={sortDir} onSort={toggleSort} />
                <th className="p-4 text-gray-500 font-semibold text-xs">Rede</th>
                {tableFields.map(tf => (
                  <SortTh key={tf.key} label={tf.label} field={tf.key} current={sortField} dir={sortDir} onSort={toggleSort} />
                ))}
                <th className="p-4 text-gray-500 font-semibold text-xs text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <motion.tr
                  layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={`${r.CO_ENTIDADE}-${r.NO_AREA_CURSO_PROFISSIONAL ?? ""}`}
                  className={`transition-colors ${c.row}`}
                >
                  <td className="p-4">
                    <div className="font-semibold text-gray-800 text-sm leading-tight">{r.UNIDADE}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">INEP: {r.CO_ENTIDADE}</div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{r.MUNICIPIO}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.badge}`}>
                      {REDE[r.TP_DEPENDENCIA ?? 0] ?? "—"}
                    </span>
                  </td>
                  {tableFields.map(tf => (
                    <td key={tf.key} className="p-4 text-center font-semibold text-gray-700 text-sm">
                      {r[tf.key] !== undefined ? Number(r[tf.key]).toLocaleString("pt-BR") : "—"}
                    </td>
                  ))}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelected(r)}
                      className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs ${c.accent} hover:bg-gray-100`}
                    >
                      <UserCircle size={15} /> Ver
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">Nenhum resultado encontrado.</div>
          )}
          {filtered.length >= 100 && (
            <div className="p-3 bg-gray-50 text-center text-xs text-gray-400">
              Mostrando os primeiros 100 resultados. Refine a busca para ver mais.
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className={`p-6 text-white flex justify-between items-start bg-gradient-to-r ${
                color === "blue"   ? "from-blue-700 to-blue-500" :
                color === "purple" ? "from-purple-700 to-purple-500" :
                color === "teal"   ? "from-teal-700 to-teal-500" :
                "from-rose-700 to-rose-500"
              }`}>
                <div>
                  <h2 className="text-xl font-bold leading-tight">{selected.UNIDADE}</h2>
                  <p className="text-white/70 text-xs mt-1">
                    {selected.MUNICIPIO} · INEP: {selected.CO_ENTIDADE} · {REDE[selected.TP_DEPENDENCIA ?? 0]} · {LOCAL[selected.TP_LOCALIZACAO ?? 0]}
                  </p>
                  {selected.NO_AREA_CURSO_PROFISSIONAL && (
                    <p className="text-white/80 text-sm mt-1 font-medium">
                      {selected.NO_AREA_CURSO_PROFISSIONAL} — {selected.NO_CURSO_EDUC_PROFISSIONAL}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-full ml-4 flex-shrink-0">
                  <X size={20} />
                </button>
              </div>

              {/* Summary badges */}
              <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50/50">
                {tableFields.map(tf => (
                  <span key={tf.key} className={`px-3 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
                    {tf.label}: {Number(selected[tf.key] ?? 0).toLocaleString("pt-BR")}
                  </span>
                ))}
              </div>

              {/* Raw data with dictionary */}
              <div className="flex-grow overflow-y-auto p-6">
                <RawDataSection
                  data={selected}
                  accentColor={color === "blue" || color === "teal" ? "indigo" : color === "purple" ? "indigo" : "indigo"}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortTh({ label, field, current, dir, onSort }: {
  label: string; field: string; current: string; dir: "asc" | "desc"; onSort: (f: string) => void;
}) {
  const active = current === field;
  return (
    <th
      className="p-4 font-semibold text-gray-500 text-xs cursor-pointer select-none hover:bg-gray-100 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active && (dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
    </th>
  );
}
