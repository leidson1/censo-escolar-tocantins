"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, UserCircle, X, School, Users, GraduationCap, Layout, Book, MapPin, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RawDataSection } from "./CensoDashboard";

/** Dashboard genérico para arquivos com estrutura CO_ENTIDADE + UNIDADE + MUNICIPIO + campos QT_ */
interface GenericRecord {
  CO_ENTIDADE: number;
  UNIDADE: string;
  NO_MUNICIPIO: string;
  TP_DEPENDENCIA?: number;
  TP_LOCALIZACAO?: number;
  [key: string]: string | number | boolean | null | undefined;
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
  /** Cor de destaque: "blue" | "purple" | "teal" | "rose" | "green" */
  color?: "blue" | "purple" | "teal" | "rose" | "green";
  /** Label do campo de busca */
  searchPlaceholder?: string;
  /** Mostrar card de total de unidades? */
  showTotalUnits?: boolean;
  /** Nota explicativa abaixo dos KPIs */
  note?: string;
  /** Prefixos de campos a excluir do dicionário (ex: ["QT_DOC", "QT_TUR"]) */
  excludePrefixes?: string[];
  /** Campo que contém o nome do curso para filtragem específica */
  courseField?: string;
}

const COLOR_MAP = {
  blue:   { ring: "focus:ring-blue-400",   badge: "bg-blue-100 text-blue-700",   border: "border-blue-500",   accent: "text-blue-700",   row: "hover:bg-blue-50/30",  icon: "bg-blue-50 text-blue-600"  },
  purple: { ring: "focus:ring-purple-400", badge: "bg-purple-100 text-purple-700", border: "border-purple-500", accent: "text-purple-700", row: "hover:bg-purple-50/30", icon: "bg-purple-50 text-purple-600" },
  teal:   { ring: "focus:ring-teal-400",   badge: "bg-teal-100 text-teal-700",   border: "border-teal-500",   accent: "text-teal-700",   row: "hover:bg-teal-50/30",  icon: "bg-teal-50 text-teal-600"  },
  rose:   { ring: "focus:ring-rose-400",   badge: "bg-rose-100 text-rose-700",   badge2: "bg-rose-500",       border: "border-rose-500",  accent: "text-rose-700",    row: "hover:bg-rose-50/30",  icon: "bg-rose-50 text-rose-600"  },
  green:  { ring: "focus:ring-[#0D6E3F]/50", badge: "bg-green-100 text-[#0D6E3F]", border: "border-[#0D6E3F]", accent: "text-[#0D6E3F]",  row: "hover:bg-green-50/30", icon: "bg-green-50 text-[#0D6E3F]" },
};

const REDE: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };
const LOCAL: Record<number, string> = { 1: "Urbana", 2: "Rural" };

export default function GenericCensoDashboard({
  data,
  kpiFields,
  tableFields,
  color = "blue",
  searchPlaceholder = "Buscar escola ou código INEP...",
  showTotalUnits = true,
  note,
  excludePrefixes = [],
  courseField,
}: GenericDashboardProps) {
  const [search, setSearch] = useState("");
  const [municipio, setMunicipio] = useState("Todos");
  const [rede, setRede]     = useState("Todas");
  const [local, setLocal]   = useState("Todas");
  const [sortField, setSortField] = useState("UNIDADE");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [indicator, setIndicator] = useState(kpiFields[0]?.key || "Todos");
  const [selectedCourse, setSelectedCourse] = useState("Todos");
  const [selected, setSelected]   = useState<GenericRecord | null>(null);

  const c = COLOR_MAP[color];

  const municipios = useMemo(() => {
    const s = Array.from(new Set(data.map(r => r.NO_MUNICIPIO))).sort();
    return ["Todos", ...s];
  }, [data]);

  const courses = useMemo(() => {
    if (!courseField) return [];
    const s = Array.from(new Set(data.map(r => String(r[courseField] || "")).filter(Boolean))).sort();
    return ["Todos", ...s];
  }, [data, courseField]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const list = data.filter(r => {
      const matchSearch = r.UNIDADE?.toLowerCase().includes(term) || String(r.CO_ENTIDADE).includes(term);
      const matchMun   = municipio === "Todos" || r.NO_MUNICIPIO === municipio;
      const matchRede  = rede === "Todas" || REDE[Number(r.rede ?? 0)] === rede;
      const matchLocal = local === "Todas" || LOCAL[Number(r.local ?? 0)] === local;
      
      // Course Filter (if applicable)
      const matchCourse = !courseField || selectedCourse === "Todos" || r[courseField] === selectedCourse;

      // Dynamic Indicator Filter
      let matchIndicator = true;
      if (indicator !== "Todos") {
        matchIndicator = Number(r[indicator] || 0) > 0;
      }

      return matchSearch && matchMun && matchRede && matchLocal && matchIndicator && matchCourse;
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
    return list;
  }, [data, search, municipio, rede, local, sortField, sortDir, indicator, kpiFields, courseField, selectedCourse]);

  // KPI totals based on FILTERED data
  const kpiTotals = useMemo(() =>
    kpiFields.map(f => ({
      ...f,
      total: filtered.reduce((acc, r) => acc + (Number(r[f.key]) || 0), 0),
    })),
  [filtered, kpiFields]);

  const displayedData = useMemo(() => filtered.slice(0, 100), [filtered]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(kpiFields.length + (showTotalUnits ? 1 : 0), 5)} xl:grid-cols-${Math.min(kpiFields.length + (showTotalUnits ? 1 : 0), 6)} gap-4`}>
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
        {showTotalUnits && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50 text-gray-400">
              <School size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Unidades</div>
              <div className="text-xl font-bold text-gray-800 leading-tight">{filtered.length.toLocaleString("pt-BR")}</div>
            </div>
          </div>
        )}
      </div>
      
      {note && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-2 text-blue-700 text-xs">
          <div className="mt-0.5">ⓘ</div>
          <p className="font-medium">{note}</p>
        </div>
      )}

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

        {courseField ? (
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white min-w-[200px] max-w-[300px]"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="Todos">Todos os Cursos</option>
            {courses.filter(c => c !== "Todos").map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        ) : (
          <select
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-white min-w-[140px]"
            value={indicator}
            onChange={e => setIndicator(e.target.value)}
          >
            {kpiFields.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        )}

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
        <select
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
          value={local}
          onChange={e => setLocal(e.target.value)}
        >
          <option value="Todas">Localização (Todas)</option>
          <option>Urbana</option>
          <option>Rural</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortTh label="Unidade" field="UNIDADE" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Município" field="NO_MUNICIPIO" current={sortField} dir={sortDir} onSort={toggleSort} />
                <th className="p-4 text-gray-500 font-semibold text-xs">Rede</th>
                {tableFields.map(tf => (
                  <SortTh key={tf.key} label={tf.label} field={tf.key} current={sortField} dir={sortDir} onSort={toggleSort} />
                ))}
                <th className="p-4 text-gray-500 font-semibold text-xs text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedData.map(r => (
                <motion.tr
                  layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={`${r.CO_ENTIDADE}-${r[courseField || ""] || ""}-${r.QT_MAT_CURSO_TEC_IFTP_CT || 0}`}
                  className={`transition-colors ${c.row}`}
                >
                  <td className="p-4">
                    <div className="font-semibold text-gray-800 text-sm leading-tight">{r.UNIDADE}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">INEP: {r.CO_ENTIDADE}</div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{r.NO_MUNICIPIO}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.badge}`}>
                      {REDE[Number(r.rede ?? 0)] ?? "—"}
                    </span>
                  </td>
                  {tableFields.map(tf => (
                    <td key={tf.key} className="p-4 text-center font-semibold text-gray-700 text-sm">
                      {r[tf.key] !== undefined 
                        ? (typeof r[tf.key] === "number" || (!isNaN(Number(r[tf.key])) && typeof r[tf.key] !== "string")
                           ? Number(r[tf.key]).toLocaleString("pt-BR") 
                           : String(r[tf.key]))
                        : "—"}
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
              Mostrando os primeiros 100 de {filtered.length} resultados. Refine a busca para ver mais.
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
              <div className={`p-8 text-white relative overflow-hidden bg-gradient-to-br ${
                color === "green"  ? "from-[#0a5330] via-[#0D6E3F] to-[#12a05c]" :
                color === "blue"   ? "from-blue-700 via-blue-600 to-blue-500" :
                color === "purple" ? "from-purple-700 via-purple-600 to-purple-500" :
                color === "teal"   ? "from-teal-700 via-teal-600 to-teal-500" :
                "from-rose-700 via-rose-600 to-rose-500"
              }`}>
                {/* Decorative background icon */}
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 scale-[3]">
                   {color === "blue" ? <Users size={120} /> : color === "purple" ? <GraduationCap size={120} /> : color === "teal" ? <Layout size={120} /> : <Book size={120} />}
                </div>

                <div className="relative z-10 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight drop-shadow-sm break-words pr-4">
                      {String(selected.UNIDADE)}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-white/80 text-xs font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> {String(selected.NO_MUNICIPIO)}</span>
                      <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                      <span>INEP: {String(selected.CO_ENTIDADE)}</span>
                      <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                      <span>{REDE[Number(selected.rede) ?? 0]}</span>
                    </div>
                    {!!selected.NO_AREA_CURSO_PROFISSIONAL && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-sm font-medium">
                        <Award size={16} className="text-white/60" />
                        {String(selected.NO_AREA_CURSO_PROFISSIONAL)} — {String(selected.NO_CURSO_EDUC_PROFISSIONAL)}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelected(null)} 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all border border-white/10 group"
                  >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Summary KPI Cards */}
              <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {tableFields
                    .filter(tf => {
                      const val = selected[tf.key];
                      return typeof val === "number" || (!isNaN(Number(val)) && typeof val !== "string");
                    })
                    .map(tf => (
                      <div key={tf.key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{tf.label}</div>
                        <div className={`text-xl font-black ${c.accent.split(" ")[0]}`}>
                          {Number(selected[tf.key] ?? 0).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Raw data with dictionary */}
              <div className="flex-grow overflow-y-auto p-8 bg-white">
                <RawDataSection
                  data={selected}
                  rawSearch={search}
                  setRawSearch={setSearch}
                  accentColor={color}
                  excludeKeys={[
                    "UNIDADE", "NO_ENTIDADE", "CO_ENTIDADE", "NO_MUNICIPIO", "CO_MUNICIPIO",
                    ...excludePrefixes,
                    ...tableFields.map(tf => tf.key)
                  ]}
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
