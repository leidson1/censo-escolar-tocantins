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
  const [selectedSchool, setSelectedSchool] = useState<Record<string, unknown> | null>(null);
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

  // Filter raw data entries based on search
  const rawEntries = useMemo(() => {
    if (!selectedSchool) return [];
    const term = rawSearch.toLowerCase();
    return Object.entries(selectedSchool).filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (!term) return true;
      const label = getLabel(key).toLowerCase();
      const valStr = getValueLabel(key, value).toLowerCase();
      return key.toLowerCase().includes(term) || label.includes(term) || valStr.includes(term);
    });
  }, [selectedSchool, rawSearch]);

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
                  <h2 className="text-2xl font-bold">{selectedSchool.NO_ENTIDADE}</h2>
                  <p className="text-green-100 text-sm flex items-center gap-2">
                    <MapPin size={14} /> {selectedSchool.NO_MUNICIPIO} - TO | INEP: {selectedSchool.CO_ENTIDADE}
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
                    <DetailItem label="Água Potável" value={selectedSchool.IN_AGUA_POTAVEL ? "Sim" : "Não"} active={selectedSchool.IN_AGUA_POTAVEL} />
                    <DetailItem label="Energia Elétrica" value={selectedSchool.IN_ENERGIA_REDE_PUBLICA ? "Sim" : "Não"} active={selectedSchool.IN_ENERGIA_REDE_PUBLICA} />
                    <DetailItem label="Esgoto Sanitário" value={selectedSchool.IN_ESGOTO_REDE_PUBLICA ? "Sim" : "Não"} active={selectedSchool.IN_ESGOTO_REDE_PUBLICA} />
                    <DetailItem label="Coleta de Lixo" value={selectedSchool.IN_LIXO_SERVICO_COLETA ? "Sim" : "Não"} active={selectedSchool.IN_LIXO_SERVICO_COLETA} />
                    <DetailItem label="Alimentação Escolar" value={selectedSchool.IN_ALIMENTACAO ? "Sim" : "Não"} active={selectedSchool.IN_ALIMENTACAO} />
                    <DetailItem label="Início Ano Letivo" value={selectedSchool.DT_ANO_LETIVO_INICIO} />
                    <DetailItem label="Término Ano Letivo" value={selectedSchool.DT_ANO_LETIVO_TERMINO} />
                  </DetailSection>

                  <DetailSection title="Tecnologia e TI">
                    <DetailItem label="Internet" value={selectedSchool.IN_INTERNET ? "Sim" : "Não"} active={selectedSchool.IN_INTERNET} />
                    <DetailItem label="Banda Larga" value={selectedSchool.IN_BANDA_LARGA ? "Sim" : "Não"} active={selectedSchool.IN_BANDA_LARGA} />
                    <DetailItem label="Laboratório Informática" value={selectedSchool.IN_LABORATORIO_INFORMATICA ? "Sim" : "Não"} active={selectedSchool.IN_LABORATORIO_INFORMATICA} />
                    <DetailItem label="Desktops Alunos" value={selectedSchool.QT_DESKTOP_ALUNO || 0} />
                    <DetailItem label="Laptops Alunos" value={selectedSchool.QT_COMP_PORTATIL_ALUNO || 0} />
                    <DetailItem label="Tablets Alunos" value={selectedSchool.QT_TABLET_ALUNO || 0} />
                    <DetailItem label="Acesso para Comunidade" value={selectedSchool.IN_INTERNET_COMUNIDADE ? "Sim" : "Não"} />
                  </DetailSection>

                  <DetailSection title="Espaços Físicos">
                    <DetailItem label="Total de Salas" value={selectedSchool.QT_SALAS_UTILIZADAS || 0} />
                    <DetailItem label="Salas Climatizadas" value={selectedSchool.QT_SALAS_UTILIZA_CLIMATIZADAS || 0} />
                    <DetailItem label="Biblioteca" value={selectedSchool.IN_BIBLIOTECA ? "Sim" : "Não"} active={selectedSchool.IN_BIBLIOTECA} />
                    <DetailItem label="Quadra Esportes" value={selectedSchool.IN_QUADRA_ESPORTES ? "Sim" : "Não"} active={selectedSchool.IN_QUADRA_ESPORTES} />
                    <DetailItem label="Refeitório" value={selectedSchool.IN_REFEITORIO ? "Sim" : "Não"} />
                    <DetailItem label="Cozinha" value={selectedSchool.IN_COZINHA ? "Sim" : "Não"} />
                    <DetailItem label="Piscina" value={selectedSchool.IN_PISCINA ? "Sim" : "Não"} />
                    <DetailItem label="Parque Infantil" value={selectedSchool.IN_PARQUE_INFANTIL ? "Sim" : "Não"} />
                  </DetailSection>

                  <DetailSection title="Equipamentos">
                    <DetailItem label="TVs" value={selectedSchool.QT_EQUIP_TV || 0} />
                    <DetailItem label="Aparelhos de Som" value={selectedSchool.QT_EQUIP_SOM || 0} />
                    <DetailItem label="Lousas Digitais" value={selectedSchool.QT_EQUIP_LOUSA_DIGITAL || 0} />
                    <DetailItem label="Projetores (DataShow)" value={selectedSchool.QT_EQUIP_MULTIMIDIA || 0} />
                    <DetailItem label="Impressoras" value={selectedSchool.IN_EQUIP_IMPRESSORA ? "Sim" : "Não"} />
                    <DetailItem label="Copiadoras" value={selectedSchool.IN_EQUIP_COPIADORA ? "Sim" : "Não"} />
                  </DetailSection>

                  <DetailSection title="Recursos Humanos">
                    <DetailItem label="Prof. Administrativos" value={selectedSchool.QT_PROF_ADMINISTRATIVOS || 0} />
                    <DetailItem label="Prof. Serviços Gerais" value={selectedSchool.QT_PROF_SERVICOS_GERAIS || 0} />
                    <DetailItem label="Bibliotecário" value={selectedSchool.QT_PROF_BIBLIOTECARIO || 0} />
                    <DetailItem label="Psicólogo" value={selectedSchool.QT_PROF_PSICOLOGO || 0} />
                    <DetailItem label="Nutricionista" value={selectedSchool.QT_PROF_NUTRICIONISTA || 0} />
                    <DetailItem label="Assistente Social" value={selectedSchool.QT_PROF_ASSIST_SOCIAL || 0} />
                    <DetailItem label="Segurança/Vigilante" value={selectedSchool.QT_PROF_SEGURANCA || 0} />
                  </DetailSection>

                  <DetailSection title="Etapas de Ensino">
                    <DetailItem label="Ensino Regular" value={selectedSchool.IN_REGULAR ? "Sim" : "Não"} active={selectedSchool.IN_REGULAR} />
                    <DetailItem label="Educação Especial" value={selectedSchool.IN_ESPECIAL_EXCLUSIVA ? "Sim" : "Não"} />
                    <DetailItem label="EJA" value={selectedSchool.IN_EJA ? "Sim" : "Não"} />
                    <DetailItem label="Ensino Profissional" value={selectedSchool.IN_PROFISSIONALIZANTE ? "Sim" : "Não"} />
                    <DetailItem label="Ensino Fundamental AF" value={selectedSchool.IN_COMUM_FUND_AF ? "Sim" : "Não"} />
                    <DetailItem label="Ensino Médio" value={selectedSchool.IN_COMUM_MEDIO_MEDIO ? "Sim" : "Não"} />
                  </DetailSection>
                </div>

                {/* Raw Data with Dictionary */}
                <RawDataSection data={selectedSchool} accentColor="green" />

                {/* Address */}
                <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-bold text-[#0D6E3F] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Localização e Endereço Oficial
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-semibold">Endereço:</span> {selectedSchool.DS_ENDERECO}, {selectedSchool.NU_ENDERECO}</p>
                    {selectedSchool.DS_COMPLEMENTO && <p><span className="font-semibold">Complemento:</span> {selectedSchool.DS_COMPLEMENTO}</p>}
                    <p><span className="font-semibold">Bairro:</span> {selectedSchool.NO_BAIRRO || "Não informado"}</p>
                    <p><span className="font-semibold">CEP:</span> {selectedSchool.CO_CEP} | <span className="font-semibold">Município:</span> {selectedSchool.NO_MUNICIPIO} - TO</p>
                    <p><span className="font-semibold">Telefone:</span> ({selectedSchool.NU_DDD}) {selectedSchool.NU_TELEFONE}</p>
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

export function RawDataSection({ data, accentColor = "green" }: { data: Record<string, unknown>; accentColor?: "green" | "indigo" }) {
  const [rawSearch, setRawSearch] = useState("");
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(false);

  const ring   = accentColor === "green" ? "focus:ring-green-500" : "focus:ring-indigo-400";
  const border = accentColor === "green" ? "border-green-500" : "border-indigo-500";
  const text   = accentColor === "green" ? "text-[#0D6E3F]" : "text-indigo-700";

  const entries = useMemo(() => {
    const term = rawSearch.toLowerCase();
    return Object.entries(data).filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (showOnlyNonZero && value === 0) return false;
      if (!term) return true;
      const label = getLabel(key).toLowerCase();
      const valStr = getValueLabel(key, value).toLowerCase();
      return key.toLowerCase().includes(term) || label.includes(term) || valStr.includes(term);
    });
  }, [data, rawSearch, showOnlyNonZero]);

  return (
    <div>
      <h3 className={`font-bold text-gray-700 border-l-4 ${border} pl-3 text-xs uppercase tracking-wider mb-3 flex items-center gap-2`}>
        <Database size={13} /> Todos os Campos do Censo (Dados Brutos)
      </h3>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Pesquisar campo, descrição ou valor..."
            className={`w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 ${ring} outline-none text-xs`}
            value={rawSearch}
            onChange={e => setRawSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:border-gray-300 transition-colors whitespace-nowrap">
          <input
            type="checkbox"
            checked={showOnlyNonZero}
            onChange={e => setShowOnlyNonZero(e.target.checked)}
            className="rounded"
          />
          Apenas valores &gt; 0
        </label>
        <span className="flex items-center text-xs text-gray-400 px-2">{entries.length} campos</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0">
          {entries.map(([key, value], i) => {
            const entry = getDictEntry(key);
            const label = entry?.descricao || key;
            const displayVal = getValueLabel(key, value);
            const hasCategory = !!entry?.categoria;
            const isZero = value === 0;

            return (
              <div
                key={key}
                className={`flex items-start justify-between gap-3 px-4 py-2.5 border-b border-gray-50 group ${
                  i % 2 === 0 ? "" : "md:border-l border-gray-50"
                } ${isZero ? "opacity-50" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  {/* Human label */}
                  <div className={`text-xs font-medium leading-tight ${isZero ? "text-gray-400" : "text-gray-700"}`}>
                    {label !== key ? label : <span className="font-mono text-[10px] text-gray-400 uppercase">{key}</span>}
                  </div>
                  {/* Technical key as tooltip */}
                  {label !== key && (
                    <div className="text-[10px] font-mono text-gray-300 uppercase truncate" title={key}>{key}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-xs font-bold text-right ${
                    isZero ? "text-gray-300" :
                    hasCategory && displayVal !== String(value) ? text :
                    "text-gray-700"
                  }`}>
                    {displayVal}
                  </span>
                  {/* Show original numeric code if category mapped */}
                  {hasCategory && displayVal !== String(value) && (
                    <span className="text-[10px] text-gray-300">({value})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {entries.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum campo encontrado.</div>
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
