"use client";

import { useState, useMemo } from "react";
import { 
  Users, GraduationCap, BookOpen, Search, Filter, 
  MapPin, School, HelpCircle, Award, Book,
  ChevronDown, ChevronUp, UserCircle, X,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLabel } from "@/lib/censo-dict";
import { RawDataSection } from "./CensoDashboard";

interface DocenteRecord {
  CO_ENTIDADE: number;
  UNIDADE: string;
  NO_MUNICIPIO: string;
  rede: number;
  local: number;
  localDif: number;
  QT_DOC_BAS: number;
  QT_DOC_FUND: number;
  QT_DOC_MED: number;
  QT_DOC_BAS_ESCO_SUP_POS_ESPEC: number;
  QT_DOC_BAS_ESCO_SUP_POS_MESTRA: number;
  QT_DOC_BAS_ESCO_SUP_POS_DOUTO: number;
  QT_DOC_BAS_ESCO_SUP_POS_NENHUM: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface DocentesDashboardProps {
  docentes: DocenteRecord[];
}

const REDE_LABELS: Record<number, string> = { 1: "Federal", 2: "Estadual", 3: "Municipal", 4: "Privada" };

export default function DocentesDashboard({ docentes }: DocentesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [municipioFilter, setMunicipioFilter] = useState("all");
  const [redeFilter, setRedeFilter] = useState("all");
  const [localFilter, setLocalFilter] = useState("all");
  const [selectedDocente, setSelectedDocente] = useState<DocenteRecord | null>(null);
  
  const [sortField, setSortField] = useState<string>("QT_DOC_BAS");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Get unique municipios for filter
  const municipios = useMemo(() => {
    const m = Array.from(new Set(docentes.map(g => g.NO_MUNICIPIO))).sort();
    return m;
  }, [docentes]);

  // Filtered list
  const allFilteredDocentes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return docentes.filter(g => {
      const matchSearch = g.UNIDADE.toLowerCase().includes(term) || String(g.CO_ENTIDADE).includes(term);
      const matchMun = municipioFilter === "all" || g.NO_MUNICIPIO === municipioFilter;
      const matchRede = redeFilter === "all" || Number(g.rede) === Number(redeFilter);
      const matchLocal = localFilter === "all" || Number(g.local) === Number(localFilter);
      return matchSearch && matchMun && matchRede && matchLocal;
    });
  }, [docentes, searchTerm, municipioFilter, redeFilter, localFilter]);

  // Sorted list
  const sortedDocentes = useMemo(() => {
    const list = [...allFilteredDocentes];
    list.sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" 
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [allFilteredDocentes, sortField, sortDir]);

  const displayedDocentes = useMemo(() => sortedDocentes.slice(0, 50), [sortedDocentes]);

  // Global KPIs
  const kpis = useMemo(() => {
    const total = allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_BAS || 0), 0);
    const inf = allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_INF || 0), 0);
    const fund = allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_FUND || 0), 0);
    const med = allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_MED || 0), 0);
    
    // Independent post-grad counts
    const pos = {
      espec: allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_BAS_ESCO_SUP_POS_ESPEC || 0), 0),
      mestra: allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_BAS_ESCO_SUP_POS_MESTRA || 0), 0),
      douto: allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_BAS_ESCO_SUP_POS_DOUTO || 0), 0),
      nenhum: allFilteredDocentes.reduce((s, g) => s + (g.QT_DOC_BAS_ESCO_SUP_POS_NENHUM || 0), 0),
    };

    // "Não Informado" logic: schools where there are docentes but ALL post-grad fields are 0
    const notInform = allFilteredDocentes.reduce((s, g) => {
      if (g.QT_DOC_BAS > 0 && 
          g.QT_DOC_BAS_ESCO_SUP_POS_ESPEC === 0 && 
          g.QT_DOC_BAS_ESCO_SUP_POS_MESTRA === 0 && 
          g.QT_DOC_BAS_ESCO_SUP_POS_DOUTO === 0 &&
          g.QT_DOC_BAS_ESCO_SUP_POS_NENHUM === 0) {
        return s + g.QT_DOC_BAS;
      }
      return s;
    }, 0);

    return { total, inf, fund, med, pos, notInform };
  }, [allFilteredDocentes]);

  const pct = (val: number, total: number) => total > 0 ? `${((val / total) * 100).toFixed(1)}%` : "0%";

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-8">
      {/* ── KPI Cards (General) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Docentes" value={kpis.total} icon={<Users />} color="bg-purple-50 text-purple-600" />
        <KpiCard title="Educação Infantil" value={kpis.inf} icon={<Monitor />} color="bg-pink-50 text-pink-600" />
        <KpiCard title="Fundamental" value={kpis.fund} icon={<BookOpen />} color="bg-blue-50 text-blue-600" />
        <KpiCard title="Ensino Médio" value={kpis.med} icon={<GraduationCap />} color="bg-indigo-50 text-indigo-600" />
        <KpiCard title="Unidades" value={allFilteredDocentes.length} icon={<School />} color="bg-gray-50 text-gray-600" />
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-xs shadow-sm">
        <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500">
          <HelpCircle size={16} />
        </div>
        <p className="font-medium">
          <span className="font-bold">Observação Importante:</span> O mesmo docente pode ser contabilizado mais de uma vez caso atue em diferentes níveis de ensino (Infantil, Fundamental, Médio), múltiplas redes de ensino ou em diversas unidades escolares simultaneamente.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar unidade..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2.5 rounded-2xl border border-gray-100 outline-none text-sm focus:ring-2 focus:ring-purple-200"
            value={municipioFilter}
            onChange={e => setMunicipioFilter(e.target.value)}
          >
            <option value="all">Todos os Municípios</option>
            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            className="px-4 py-2.5 rounded-2xl border border-gray-100 outline-none text-sm focus:ring-2 focus:ring-purple-200"
            value={redeFilter}
            onChange={e => setRedeFilter(e.target.value)}
          >
            <option value="all">Todas as Redes</option>
            <option value="1">Federal</option>
            <option value="2">Estadual</option>
            <option value="3">Municipal</option>
            <option value="4">Privada</option>
          </select>

          <select
            className="px-4 py-2.5 rounded-2xl border border-gray-100 outline-none text-sm focus:ring-2 focus:ring-purple-200"
            value={localFilter}
            onChange={e => setLocalFilter(e.target.value)}
          >
            <option value="all">Localização (Todas)</option>
            <option value="1">Urbana</option>
            <option value="2">Rural</option>
          </select>
        </div>
      </div>

      {/* ── Pós-Graduação (Independent Metrics) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Award size={16} className="text-purple-500" /> Perfil de Pós-Graduação (Campos Independentes)
          </h3>
          <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1">
            <HelpCircle size={10} /> Percentual calculado sobre o total de docentes ({kpis.total.toLocaleString("pt-BR")})
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PosGradCard 
            label="Especialização" 
            value={kpis.pos.espec} 
            total={kpis.total} 
            color="purple" 
            tooltip={getLabel("QT_DOC_BAS_ESCO_SUP_POS_ESPEC")} 
          />
          <PosGradCard 
            label="Mestrado" 
            value={kpis.pos.mestra} 
            total={kpis.total} 
            color="indigo" 
            tooltip={getLabel("QT_DOC_BAS_ESCO_SUP_POS_MESTRA")} 
          />
          <PosGradCard 
            label="Doutorado" 
            value={kpis.pos.douto} 
            total={kpis.total} 
            color="blue" 
            tooltip={getLabel("QT_DOC_BAS_ESCO_SUP_POS_DOUTO")} 
          />
          <PosGradCard 
            label="Pós não concluída" 
            value={kpis.pos.nenhum} 
            total={kpis.total} 
            color="gray" 
            tooltip={getLabel("QT_DOC_BAS_ESCO_SUP_POS_NENHUM")} 
          />
        </div>
        
        <div className="bg-gray-50/50 rounded-2xl p-4 border border-dashed border-gray-200 text-xs text-gray-500 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-gray-100">
            <HelpCircle size={14} className="text-gray-400" />
          </div>
          <span>Docentes sem informação de pós-graduação: <span className="font-bold text-gray-600">{kpis.notInform} ({pct(kpis.notInform, kpis.total)})</span></span>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <SortTh label="Unidade" field="UNIDADE" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortTh label="Município" field="NO_MUNICIPIO" current={sortField} dir={sortDir} onSort={handleSort} />
                <th className="p-4 text-gray-400 font-bold text-[10px] uppercase tracking-wider">Rede</th>
                <SortTh label="Total Docentes" field="QT_DOC_BAS" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortTh label="Especializ." field="QT_DOC_BAS_ESCO_SUP_POS_ESPEC" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortTh label="Mestrado" field="QT_DOC_BAS_ESCO_SUP_POS_MESTRA" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortTh label="Doutorado" field="QT_DOC_BAS_ESCO_SUP_POS_DOUTO" current={sortField} dir={sortDir} onSort={handleSort} />
                <th className="p-4 text-gray-500 font-semibold text-xs text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedDocentes.map(g => (
                <tr key={g.CO_ENTIDADE} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-gray-800 leading-tight">{g.UNIDADE}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-tighter">INEP: {g.CO_ENTIDADE}</div>
                  </td>
                  <td className="p-4 text-gray-500 font-medium">{g.NO_MUNICIPIO}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                      {REDE_LABELS[g.rede] || "—"}
                    </span>
                  </td>
                  <td className="p-4 font-black text-purple-600">{g.QT_DOC_BAS.toLocaleString("pt-BR")}</td>
                  <td className="p-4 text-gray-600 font-semibold">{g.QT_DOC_BAS_ESCO_SUP_POS_ESPEC}</td>
                  <td className="p-4 text-gray-600 font-semibold">{g.QT_DOC_BAS_ESCO_SUP_POS_MESTRA}</td>
                  <td className="p-4 text-gray-600 font-semibold">{g.QT_DOC_BAS_ESCO_SUP_POS_DOUTO}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedDocente(g)}
                      className="p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs text-[#0D6E3F] hover:bg-green-50"
                    >
                      <UserCircle size={15} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedDocentes.length > 50 && (
            <div className="p-4 bg-gray-50/50 text-center text-xs text-gray-400 font-medium">
              Mostrando os primeiros 50 de {sortedDocentes.length} resultados. Refine os filtros para localizar unidades específicas.
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedDocente && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDocente(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
            >
              <div className="p-8 text-white relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-500">
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 scale-[3]">
                   <GraduationCap size={120} />
                </div>
                <div className="relative z-10 flex justify-between items-start gap-4">
                  <div className="flex-grow min-w-0">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight leading-[1.1] drop-shadow-sm break-words uppercase">
                      {selectedDocente.UNIDADE}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
                        <MapPin size={12} /> {selectedDocente.NO_MUNICIPIO || "Tocantins"}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
                        INEP: {selectedDocente.CO_ENTIDADE}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
                        Rede {REDE_LABELS[selectedDocente.rede]}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDocente(null)} 
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all border border-white/10 group flex-shrink-0"
                  >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 bg-gray-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <ModalSection title="Pós-Graduação (Independentes)">
                      <div className="grid grid-cols-2 gap-4">
                        <ModalCard label="Especialização" value={selectedDocente.QT_DOC_BAS_ESCO_SUP_POS_ESPEC} total={selectedDocente.QT_DOC_BAS} color="purple" />
                        <ModalCard label="Mestrado" value={selectedDocente.QT_DOC_BAS_ESCO_SUP_POS_MESTRA} total={selectedDocente.QT_DOC_BAS} color="indigo" />
                        <ModalCard label="Doutorado" value={selectedDocente.QT_DOC_BAS_ESCO_SUP_POS_DOUTO} total={selectedDocente.QT_DOC_BAS} color="blue" />
                        <ModalCard label="Pós não concluída" value={selectedDocente.QT_DOC_BAS_ESCO_SUP_POS_NENHUM} total={selectedDocente.QT_DOC_BAS} color="gray" />
                      </div>
                    </ModalSection>
                    
                    <RawDataSection
                      data={selectedDocente}
                      rawSearch=""
                      setRawSearch={() => {}}
                      accentColor="purple"
                      excludeKeys={[
                        "UNIDADE", "NO_ENTIDADE", "CO_ENTIDADE", "NO_MUNICIPIO", "MUNICIPIO",
                        "QT_DOC_BAS", "QT_DOC_INF", "QT_DOC_FUND", "QT_DOC_MED",
                        "QT_DOC_BAS_ESCO_SUP_POS_ESPEC", "QT_DOC_BAS_ESCO_SUP_POS_MESTRA",
                        "QT_DOC_BAS_ESCO_SUP_POS_DOUTO", "QT_DOC_BAS_ESCO_SUP_POS_NENHUM"
                      ]}
                    />
                  </div>

                  <div className="space-y-6">
                    <ModalSection title="Vínculos e Atuação">
                       <div className="space-y-3">
                          <MiniMetric label="Total Docentes" value={selectedDocente.QT_DOC_BAS} icon={<Users size={14} />} />
                          <MiniMetric label="Educação Infantil" value={selectedDocente.QT_DOC_INF} icon={<Monitor size={14} />} />
                          <MiniMetric label="Ensino Fundamental" value={selectedDocente.QT_DOC_FUND} icon={<BookOpen size={14} />} />
                          <MiniMetric label="Ensino Médio" value={selectedDocente.QT_DOC_MED} icon={<GraduationCap size={14} />} />
                       </div>
                    </ModalSection>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group">
      <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</div>
        <div className="text-xl font-black text-gray-800">{value.toLocaleString("pt-BR")}</div>
      </div>
    </div>
  );
}

function PosGradCard({ label, value, total, color, tooltip }: { label: string; value: number; total: number; color: string; tooltip?: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  const colors: Record<string, string> = {
    purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-700",
    indigo: "from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-700",
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-700",
    gray: "from-gray-400 to-gray-500 bg-gray-50 text-gray-600"
  };

  return (
    <div className={`p-5 rounded-[2rem] border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</div>
          <div className="text-2xl font-black text-gray-800 leading-none">{value.toLocaleString("pt-BR")}</div>
        </div>
        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black bg-gray-50 text-gray-500`}>
          {percentage}%
        </div>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full bg-gradient-to-r ${colors[color].split(" ")[0]} rounded-full`}
        />
      </div>
      {tooltip && (
        <div className="mt-3 text-[9px] text-gray-400 font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function ModalCard({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors: Record<string, string> = {
    purple: "bg-purple-600",
    indigo: "bg-indigo-600",
    blue: "bg-blue-600",
    gray: "bg-gray-400"
  };
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-end mb-2">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-black text-gray-800">{value}</div>
      </div>
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-[9px] text-gray-400 mt-1 font-bold">{percentage}% dos docentes</div>
    </div>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
        <div className="w-8 h-[2px] bg-purple-500/20" /> {title}
      </h3>
      {children}
    </div>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
        {icon} {label}
      </div>
      <div className="font-bold text-gray-800 text-sm">{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function SortTh({ label, field, current, dir, onSort }: { 
  label: string; field: string; current: string; dir: "asc" | "desc"; onSort: (f: string) => void;
}) {
  const active = current === field;
  return (
    <th 
      className="p-4 font-bold text-[10px] uppercase tracking-wider text-gray-400 cursor-pointer hover:text-purple-600 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active && (dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </div>
    </th>
  );
}
