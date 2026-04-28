"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, School, Wifi, WifiOff, Info, Filter, ArrowUpDown, ExternalLink, Database, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSchoolDetails } from "@/app/censo-2025/actions";
import { getLabel, getValueLabel, getDictEntry } from "@/lib/censo-dict";

interface SchoolSummary {
  id: number;
  nome: string;
  municipio: string;
  rede: number;
  local: number;
  internet: boolean;
  salas: number;
}

interface CensoDashboardProps {
  schools: SchoolSummary[];
  stats: {
    total: number;
    estaduais: number;
    municipais: number;
    privadas: number;
    federais: number;
    comInternet: number;
    zonaUrbana: number;
    zonaRural: number;
  };
}

const REDE_LABELS: Record<number, string> = {
  1: "Federal",
  2: "Estadual",
  3: "Municipal",
  4: "Privada",
};

const LOCAL_LABELS: Record<number, string> = {
  1: "Urbana",
  2: "Rural",
};

export default function CensoDashboard({ schools, stats }: CensoDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [municipioFilter, setMunicipioFilter] = useState("Todos");
  const [redeFilter, setRedeFilter] = useState("Todas");
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [rawSearch, setRawSearch] = useState("");

  const municipios = useMemo(() => {
    const list = Array.from(new Set(schools.map(s => s.municipio))).sort();
    return ["Todos", ...list];
  }, [schools]);

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = school.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           school.id.toString().includes(searchTerm);
      const matchesMunicipio = municipioFilter === "Todos" || school.municipio === municipioFilter;
      const matchesRede = redeFilter === "Todas" || REDE_LABELS[school.rede] === redeFilter;
      return matchesSearch && matchesMunicipio && matchesRede;
    }).slice(0, 100);
  }, [schools, searchTerm, municipioFilter, redeFilter]);

  const handleShowDetails = async (id: number) => {
    setIsLoadingDetails(true);
    setRawSearch("");
    const details = await getSchoolDetails(id);
    setSelectedSchool(details);
    setIsLoadingDetails(false);
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total de Escolas" value={stats.total} icon={<School />} color="bg-blue-50 text-blue-600" />
        <StatCard title="Rede Estadual" value={stats.estaduais} icon={<MapPin />} color="bg-green-50 text-green-600" />
        <StatCard title="Rede Municipal" value={stats.municipais} icon={<MapPin />} color="bg-orange-50 text-orange-600" />
        <StatCard title="Acesso à Internet" value={`${Math.round((stats.comInternet / stats.total) * 100)}%`} icon={<Wifi />} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow space-y-2 w-full">
          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Search size={14} /> Buscar Escola ou Código INEP
          </label>
          <input
            type="text"
            placeholder="Ex: Escola Estadual..."
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 space-y-2">
          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Filter size={14} /> Município
          </label>
          <select
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
            value={municipioFilter}
            onChange={(e) => setMunicipioFilter(e.target.value)}
          >
            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <ArrowUpDown size={14} /> Rede
          </label>
          <select
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
            value={redeFilter}
            onChange={(e) => setRedeFilter(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Estadual">Estadual</option>
            <option value="Municipal">Municipal</option>
            <option value="Privada">Privada</option>
            <option value="Federal">Federal</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Escola</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Município</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Rede</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Local</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Internet</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSchools.map((school) => (
                <motion.tr
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={school.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{school.nome}</div>
                    <div className="text-xs text-gray-400">INEP: {school.id}</div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{school.municipio}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      school.rede === 2 ? "bg-green-100 text-green-700" :
                      school.rede === 3 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {REDE_LABELS[school.rede]}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{LOCAL_LABELS[school.local]}</td>
                  <td className="p-4">
                    {school.internet ?
                      <Wifi size={18} className="text-green-500" /> :
                      <WifiOff size={18} className="text-gray-300" />
                    }
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleShowDetails(school.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 text-sm"
                    >
                      <Info size={16} /> Detalhes
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredSchools.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              Nenhuma escola encontrada com esses filtros.
            </div>
          )}
          {filteredSchools.length >= 100 && (
            <div className="p-4 bg-gray-50 text-center text-xs text-gray-500">
              Mostrando os primeiros 100 resultados. Refine sua busca para encontrar uma escola específica.
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSchool(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-gradient-to-r from-[#0D6E3F] to-green-600 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{String(selectedSchool.NO_ENTIDADE)}</h2>
                  <p className="text-green-100 text-sm flex items-center gap-2">
                    <MapPin size={14} /> {String(selectedSchool.NO_MUNICIPIO)} - TO | INEP: {String(selectedSchool.CO_ENTIDADE)}
                  </p>
                </div>
                <button onClick={() => setSelectedSchool(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ExternalLink size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 bg-gray-50/30">
                {/* Structured sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <DetailSection title="Infraestrutura Básica">
                    <DetailItem label="Água Potável" value={selectedSchool.IN_AGUA_POTAVEL ? "Sim" : "Não"} active={!!selectedSchool.IN_AGUA_POTAVEL} />
                    <DetailItem label="Energia Elétrica" value={selectedSchool.IN_ENERGIA_REDE_PUBLICA ? "Sim" : "Não"} active={!!selectedSchool.IN_ENERGIA_REDE_PUBLICA} />
                    <DetailItem label="Esgoto Sanitário" value={selectedSchool.IN_ESGOTO_REDE_PUBLICA ? "Sim" : "Não"} active={!!selectedSchool.IN_ESGOTO_REDE_PUBLICA} />
                    <DetailItem label="Coleta de Lixo" value={selectedSchool.IN_LIXO_SERVICO_COLETA ? "Sim" : "Não"} active={!!selectedSchool.IN_LIXO_SERVICO_COLETA} />
                    <DetailItem label="Alimentação Escolar" value={selectedSchool.IN_ALIMENTACAO ? "Sim" : "Não"} active={!!selectedSchool.IN_ALIMENTACAO} />
                  </DetailSection>

                  <DetailSection title="Tecnologia e TI">
                    <DetailItem label="Internet" value={selectedSchool.IN_INTERNET ? "Sim" : "Não"} active={!!selectedSchool.IN_INTERNET} />
                    <DetailItem label="Banda Larga" value={selectedSchool.IN_BANDA_LARGA ? "Sim" : "Não"} active={!!selectedSchool.IN_BANDA_LARGA} />
                    <DetailItem label="Laboratório Informática" value={selectedSchool.IN_LABORATORIO_INFORMATICA ? "Sim" : "Não"} active={!!selectedSchool.IN_LABORATORIO_INFORMATICA} />
                    <DetailItem label="Desktops Alunos" value={Number(selectedSchool.QT_DESKTOP_ALUNO) || 0} />
                  </DetailSection>
                </div>

                {/* Raw Data with Dictionary */}
                <RawDataSection data={selectedSchool} rawSearch={rawSearch} setRawSearch={setRawSearch} accentColor="green" />

                {/* Address */}
                <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-bold text-[#0D6E3F] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Localização e Endereço Oficial
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-semibold">Endereço:</span> {String(selectedSchool.DS_ENDERECO)}, {String(selectedSchool.NU_ENDERECO)}</p>
                    <p><span className="font-semibold">Bairro:</span> {String(selectedSchool.NO_BAIRRO || "Não informado")}</p>
                    <p><span className="font-semibold">Telefone:</span> ({String(selectedSchool.NU_DDD)}) {String(selectedSchool.NU_TELEFONE)}</p>
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

// ── Shared Raw Data Section ────────────────────────────────────────────

const PREFIX_LABELS: Record<string, string> = {
  "IN_": "Infraestrutura e Recursos",
  "QT_": "Quantitativos e Totais",
  "NO_": "Identificação e Nomes",
  "TP_": "Tipos e Classificações",
  "CO_": "Códigos e Chaves",
  "NU_": "Numéricos e Datas",
  "DS_": "Descrições",
};

export function RawDataSection({ data, rawSearch, setRawSearch, accentColor = "blue" }: { data: any, rawSearch: string, setRawSearch: (v: string) => void, accentColor?: string }) {
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(false);

  const entries = useMemo(() => {
    const term = rawSearch.toLowerCase();
    return Object.entries(data).filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (showOnlyNonZero && (value === 0 || value === "0")) return false;
      if (!term) return true;
      const label = getLabel(key).toLowerCase();
      const valStr = getValueLabel(key, value).toLowerCase();
      return key.toLowerCase().includes(term) || label.includes(term) || valStr.includes(term);
    });
  }, [data, rawSearch, showOnlyNonZero]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, [string, any][]> = {};
    entries.forEach(([key, value]) => {
      const prefix = key.substring(0, 3);
      const cat = PREFIX_LABELS[prefix] || "Outras Informações";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push([key, value]);
    });
    return groups;
  }, [entries]);

  const colorMap: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50 border-blue-100",
    green: "text-green-500 bg-green-50 border-green-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100",
    indigo: "text-indigo-500 bg-indigo-50 border-indigo-100",
    rose: "text-rose-500 bg-rose-50 border-rose-100",
    teal: "text-teal-500 bg-teal-50 border-teal-100",
    amber: "text-amber-500 bg-amber-50 border-amber-100",
  };

  const accent = colorMap[accentColor] || colorMap.blue;
  const accentText = accent.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Database className={accentText} size={20} />
            Dicionário de Variáveis e Dados Brutos
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Exploração técnica de {entries.length} campos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50 transition-all select-none shadow-sm">
            <input
              type="checkbox"
              checked={showOnlyNonZero}
              onChange={e => setShowOnlyNonZero(e.target.checked)}
              className={`rounded focus:ring-2 focus:ring-offset-2 ${accentText}`}
            />
            Ocultar valores zerados
          </label>
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:${accentText} transition-colors`} size={16} />
            <input
              type="text"
              placeholder="Pesquisar campos..."
              className="w-full md:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 focus:bg-white transition-all shadow-sm"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {Object.entries(groupedEntries).sort().map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className={`w-8 h-[2px] rounded-full bg-current ${accentText}`}></span>
              {category}
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold">{items.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
              {items.map(([key, value]) => {
                const entry = getDictEntry(key);
                const label = entry?.descricao || key;
                const displayVal = getValueLabel(key, value);
                const isZero = value === 0 || value === "0";

                return (
                  <div
                    key={key}
                    className={`flex items-start justify-between gap-4 px-3 py-2 rounded-xl transition-all group border border-transparent hover:bg-white hover:shadow-md hover:border-gray-100 ${
                      isZero ? "opacity-30 grayscale" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-bold text-gray-700 leading-tight truncate group-hover:${accentText}`} title={label}>
                        {label !== key ? label : key}
                      </div>
                      <div className="text-[9px] font-mono text-gray-300 uppercase mt-0.5" title="Nome técnico da variável">{key}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[11px] font-black ${isZero ? "text-gray-400" : accentText}`}>
                        {displayVal}
                      </div>
                      {(displayVal !== String(value)) && (
                        <div className="text-[9px] text-gray-300 font-mono italic">({value})</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/30">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
              <HelpCircle size={32} className={`opacity-20 ${accentText}`} />
            </div>
            <p className="text-sm font-bold text-gray-400">Nenhum campo encontrado</p>
            <p className="text-xs text-gray-300 mt-1">Tente ajustar seus termos de busca ou filtros</p>
            <button 
              onClick={() => { setRawSearch(""); setShowOnlyNonZero(false); }}
              className={`mt-6 px-6 py-2 bg-white border border-gray-200 rounded-xl text-[10px] uppercase tracking-widest font-bold ${accentText} hover:bg-gray-50 hover:border-blue-200 transition-all shadow-sm`}
            >
              Resetar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-400">{title}</div>
        <div className="text-xl font-bold text-gray-800 leading-tight">{value}</div>
      </div>
    </div>
  );
}

function DetailSection({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="font-bold text-gray-800 border-l-4 border-green-500 pl-3 uppercase text-xs tracking-wider">{title}</h3>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </div>
  );
}

function DetailItem({ label, value, active }: { label: string, value: string | number, active?: boolean }) {
  return (
    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${active ? "text-green-600" : active === false ? "text-red-400" : "text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}
