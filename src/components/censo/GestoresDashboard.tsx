"use client";

import { useState, useMemo } from "react";
import {
  Search, Users, UserCheck, GraduationCap,
  Briefcase, Award, ChevronDown, ChevronUp, X,
  UserCircle, BookOpen, BarChart2, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RawDataSection } from "./CensoDashboard";
import { getLabel } from "@/lib/censo-dict";

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

const LOCAL_DIF_LABELS: Record<number, string> = {
  0: "Não se aplica",
  1: "Área de assentamento",
  2: "Terra indígena",
  3: "Área remanescente de quilombos",
};

interface Gestor {
  CO_ENTIDADE: number;
  NU_ANO_CENSO: number;
  UNIDADE: string;
  QT_GEST_BAS: number;
  QT_GEST_BAS_FEM: number;
  QT_GEST_BAS_MASC: number;
  QT_GEST_BAS_BRANCA: number;
  QT_GEST_BAS_PRETA: number;
  QT_GEST_BAS_PARDA: number;
  QT_GEST_BAS_AMARELA: number;
  QT_GEST_BAS_INDIGENA: number;
  QT_GEST_BAS_0_24: number;
  QT_GEST_BAS_25_29: number;
  QT_GEST_BAS_30_39: number;
  QT_GEST_BAS_40_49: number;
  QT_GEST_BAS_50_54: number;
  QT_GEST_BAS_55_59: number;
  QT_GEST_BAS_60_MAIS: number;
  QT_GEST_BAS_PCD: number;
  QT_GEST_BAS_ZR_URB: number;
  QT_GEST_BAS_ZR_RUR: number;
  QT_GEST_BAS_ESCO_EF: number;
  QT_GEST_BAS_ESCO_EM: number;
  QT_GEST_BAS_ESCO_SUP_GRAD: number;
  QT_GEST_BAS_ESCO_SUP_GRAD_LICEN: number;
  QT_GEST_BAS_ESCO_SUP_POS_ESPEC: number;
  QT_GEST_BAS_ESCO_SUP_POS_MESTRA: number;
  QT_GEST_BAS_ESCO_SUP_POS_DOUTO: number;
  QT_GEST_BAS_VINCULO_CONCUR: number;
  QT_GEST_BAS_VINCULO_CONTRA: number;
  QT_GEST_BAS_DIRETOR: number;
  QT_GEST_BAS_OUTRO: number;
  QT_GEST_BAS_ACESSO_CARGO_PROP: number;
  QT_GEST_BAS_ACESSO_CARGO_INDIC: number;
  QT_GEST_BAS_ACESSO_CARGO_SEL: number;
  QT_GEST_BAS_ACESSO_CARGO_CONC: number;
  QT_GEST_BAS_ACESSO_CARGO_ELEIC: number;
  QT_GEST_BAS_ESPEC_GESTAO: number;
  QT_GEST_BAS_ESPEC_EDUC_TIC: number;
  QT_GEST_BAS_ESPEC_NENHUM: number;
  [key: string]: any;
}

interface GestoresDashboardProps {
  gestores: Gestor[];
}

export default function GestoresDashboard({ gestores }: GestoresDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [redeFilter, setRedeFilter] = useState<number | "all">("all");
  const [localFilter, setLocalFilter] = useState<number | "all">("all");
  const [localDifFilter, setLocalDifFilter] = useState<number | "all">("all");
  const [municipioFilter, setMunicipioFilter] = useState<string>("all");
  const [selectedGestor, setSelectedGestor] = useState<Gestor | null>(null);
  const [sortField, setSortField] = useState<keyof Gestor>("UNIDADE");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Extract unique municipios
  const municipios = useMemo(() => {
    const list = Array.from(new Set(gestores.map(g => g.NO_MUNICIPIO).filter(m => m && m !== "#N/D")));
    return list.sort((a, b) => String(a).localeCompare(String(b)));
  }, [gestores]);

  // ── Filtered & sorted list ─────────────────────────────────────────
  const allFilteredGestores = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = gestores.filter(g => {
      const matchSearch = g.UNIDADE?.toLowerCase().includes(term) || String(g.CO_ENTIDADE).includes(term);
      const matchRede = redeFilter === "all" || Number(g.rede) === Number(redeFilter);
      const matchLocal = localFilter === "all" || Number(g.local) === Number(localFilter);
      const matchLocalDif = localDifFilter === "all" || Number(g.localDif) === Number(localDifFilter);
      const matchMun = municipioFilter === "all" || g.NO_MUNICIPIO === municipioFilter;
      return matchSearch && matchRede && matchLocal && matchLocalDif && matchMun;
    });
    list.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [gestores, searchTerm, redeFilter, localFilter, localDifFilter, sortField, sortDir]);

  // ── Calculate KPIs based on FILTERED data ──────────────────────────
  const kpis = useMemo(() => {
    const total = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS || 0), 0);
    const fem = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_FEM || 0), 0);
    const masc = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_MASC || 0), 0);
    const grad = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_GRAD || 0), 0);
    const mestrado = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_POS_MESTRA || 0), 0);
    const doutorado = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_POS_DOUTO || 0), 0);
    const pcd = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_PCD || 0), 0);
    const escolas = allFilteredGestores.length;
    
    // Stats by dependency
    const federais = allFilteredGestores.filter(g => Number(g.rede) === 1).reduce((s, g) => s + (Number(g.QT_GEST_BAS) || 0), 0);
    const estaduais = allFilteredGestores.filter(g => Number(g.rede) === 2).reduce((s, g) => s + (Number(g.QT_GEST_BAS) || 0), 0);
    const municipais = allFilteredGestores.filter(g => Number(g.rede) === 3).reduce((s, g) => s + (Number(g.QT_GEST_BAS) || 0), 0);
    const privadas = allFilteredGestores.filter(g => Number(g.rede) === 4).reduce((s, g) => s + (Number(g.QT_GEST_BAS) || 0), 0);

    // Cargo Access Breakdown
    const access = {
      prop: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_PROP || 0), 0),
      indic: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_INDIC || 0), 0),
      sel: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_SEL || 0), 0),
      conc: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_CONC || 0), 0),
      eleic: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_ELEIC || 0), 0),
      p_sel: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_P_SEL || 0), 0),
      outro: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ACESSO_CARGO_OUTRO || 0), 0),
    };

    const accessSum = access.indic + access.eleic + access.conc + access.sel + access.p_sel + access.prop + access.outro;
    const notInform = total - accessSum;

    // Education Breakdown
    const edu = {
      fundamental: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_EF || 0), 0),
      medio: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_EM || 0), 0),
      graduacao: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_GRAD || 0), 0),
      licenciatura: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_GRAD_LICEN || 0), 0),
    };

    const pos = {
      espec: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_POS_ESPEC || 0), 0),
      mestra: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_POS_MESTRA || 0), 0),
      douto: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_POS_DOUTO || 0), 0),
      nenhum: allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_POS_NENHUM || 0), 0),
    };

    const posSum = pos.espec + pos.mestra + pos.douto + pos.nenhum;
    const posNotInform = total - posSum;

    return { total, fem, masc, grad, mestrado, doutorado, pcd, escolas, federais, estaduais, municipais, privadas, access: { ...access, notInform }, edu, pos: { ...pos, notInform: posNotInform } };
  }, [allFilteredGestores]);

  const filteredStats = useMemo(() => {
    const total = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS || 0), 0);
    const fem = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_FEM || 0), 0);
    const masc = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_MASC || 0), 0);
    const grad = allFilteredGestores.reduce((s, g) => s + (g.QT_GEST_BAS_ESCO_SUP_GRAD || 0), 0);
    const escolas = allFilteredGestores.length;
    return { total, fem, masc, grad, escolas };
  }, [allFilteredGestores]);

  const displayedGestores = useMemo(() => {
    return allFilteredGestores.slice(0, 100);
  }, [allFilteredGestores]);

  const toggleSort = (field: keyof Gestor) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const pct = (v: number, total: number) =>
    total > 0 ? `${Math.round((v / total) * 100)}%` : "—";

  return (
    <div className="space-y-8">

      {/* ── KPI Cards (General) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Geral" value={kpis.total} icon={<Users />} color="bg-blue-50 text-blue-600" />
        <KpiCard title="Rede Estadual" value={kpis.estaduais} icon={<MapPin />} color="bg-green-50 text-green-600" />
        <KpiCard title="Rede Municipal" value={kpis.municipais} icon={<MapPin />} color="bg-orange-50 text-orange-600" />
        <KpiCard title="Rede Federal" value={kpis.federais} icon={<MapPin />} color="bg-indigo-50 text-indigo-600" />
        <KpiCard title="Rede Privada" value={kpis.privadas} icon={<MapPin />} color="bg-rose-50 text-rose-600" />
      </div>

      {/* ── Stats Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Acesso ao cargo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Award size={14} /> Acesso ao Cargo
          </h3>
          <div className="space-y-4">
            <MiniBar label="Indicação" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_INDIC")} value={kpis.access.indic} total={kpis.total} color="bg-amber-400" />
            <MiniBar label="Seleção" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_SEL")} value={kpis.access.sel} total={kpis.total} color="bg-indigo-500" />
            <MiniBar label="Proc. Seletivo" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_P_SEL")} value={kpis.access.p_sel} total={kpis.total} color="bg-purple-500" />
            <MiniBar label="Concurso" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_CONC")} value={kpis.access.conc} total={kpis.total} color="bg-blue-500" />
            <MiniBar label="Eleição" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_ELEIC")} value={kpis.access.eleic} total={kpis.total} color="bg-green-500" />
            <MiniBar label="Proprietário" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_PROP")} value={kpis.access.prop} total={kpis.total} color="bg-emerald-500" />
            <MiniBar label="Outro" tooltip={getLabel("QT_GEST_BAS_ACESSO_CARGO_OUTRO")} value={kpis.access.outro} total={kpis.total} color="bg-gray-400" />
            <MiniBar label="Não Informado" tooltip="Gestores sem informação de acesso ao cargo registrada" value={kpis.access.notInform} total={kpis.total} color="bg-gray-200" />
          </div>
        </div>

        {/* Escolaridade */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <BookOpen size={14} /> Escolaridade
          </h3>
          <div className="space-y-4">
            <MiniBar label="Graduação" value={kpis.edu.graduacao} total={kpis.total} color="bg-indigo-500" />
            <MiniBar label="Licenciatura" tooltip={getLabel("QT_GEST_BAS_ESCO_SUP_GRAD_LICEN")} value={kpis.edu.licenciatura} total={kpis.total} color="bg-indigo-400" />
            <MiniBar label="Ens. Médio" value={kpis.edu.medio} total={kpis.total} color="bg-blue-400" />
            <MiniBar label="Ens. Fundamental" value={kpis.edu.fundamental} total={kpis.total} color="bg-blue-300" />
          </div>
        </div>

        {/* Pós-Graduação */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Award size={14} /> Pós-Graduação
          </h3>
          <div className="space-y-4">
            <MiniBar label="Especialização" tooltip={getLabel("QT_GEST_BAS_ESCO_SUP_POS_ESPEC")} value={kpis.pos.espec} total={kpis.total} color="bg-purple-400" />
            <MiniBar label="Mestrado" tooltip={getLabel("QT_GEST_BAS_ESCO_SUP_POS_MESTRA")} value={kpis.pos.mestra} total={kpis.total} color="bg-purple-500" />
            <MiniBar label="Doutorado" tooltip={getLabel("QT_GEST_BAS_ESCO_SUP_POS_DOUTO")} value={kpis.pos.douto} total={kpis.total} color="bg-purple-600" />
            <div className="pt-2 mt-2 border-t border-gray-50">
              <MiniBar label="Pós não Concluída" tooltip={getLabel("QT_GEST_BAS_ESCO_SUP_POS_NENHUM")} value={kpis.pos.nenhum} total={kpis.total} color="bg-gray-200" />
              <MiniBar label="Não Informado" tooltip="Gestores sem informação de pós-graduação registrada" value={kpis.pos.notInform} total={kpis.total} color="bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Diversidade - REMOVED PER USER REQUEST */}
      </div>

      {/* ── Search & Filters ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Search */}
          <div className="md:col-span-5">
            <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
              <Search size={14} /> Localizar Gestor ou Unidade Escolar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Escola ou INEP..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Município Filter */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Município</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all text-sm bg-white"
                value={municipioFilter}
                onChange={e => setMunicipioFilter(e.target.value)}
              >
                <option value="all">Todos os Municípios</option>
                {municipios.map(m => (
                  <option key={String(m)} value={String(m)}>{String(m)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Rede Filter */}
          <div className="md:col-span-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Dependência Adm.</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all text-sm bg-white"
                value={redeFilter}
                onChange={e => setRedeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Todas as Redes</option>
                {Object.entries(REDE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Local Filter */}
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Localização</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all text-sm bg-white"
                value={localFilter}
                onChange={e => setLocalFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Todas</option>
                {Object.entries(LOCAL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Local Dif Filter */}
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Tipo de Local (Dif.)</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all text-sm bg-white"
                value={localDifFilter}
                onChange={e => setLocalDifFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Todos os tipos</option>
                {Object.entries(LOCAL_DIF_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* ── Quantitative Results Section ── */}

        {/* ── Quantitative Results Section ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.1em]">Gestores Filtrados</div>
                <div className="text-2xl font-black text-gray-800 tracking-tight">{filteredStats.total}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 flex items-center justify-between group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500 text-white rounded-xl shadow-lg shadow-pink-100 group-hover:scale-110 transition-transform">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.1em]">Perfil Feminino</div>
                <div className="text-2xl font-black text-gray-800 tracking-tight">{pct(filteredStats.fem, filteredStats.total)}</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-full">{filteredStats.fem}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex items-center justify-between group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 text-white rounded-xl shadow-lg shadow-green-100 group-hover:scale-110 transition-transform">
                <GraduationCap size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-[0.1em]">Com Graduação</div>
                <div className="text-2xl font-black text-gray-800 tracking-tight">{pct(filteredStats.grad, filteredStats.total)}</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{filteredStats.grad}</div>
          </motion.div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortTh label="Unidade Escolar" field="UNIDADE" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Total" field="QT_GEST_BAS" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Fem / Masc" field="QT_GEST_BAS_FEM" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Graduação" field="QT_GEST_BAS_ESCO_SUP_GRAD" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Acesso" field="QT_GEST_BAS_ACESSO_CARGO_INDIC" current={sortField} dir={sortDir} onSort={toggleSort} />
                <th className="p-4 font-semibold text-gray-600 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedGestores.map((g) => (
                <motion.tr
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={g.CO_ENTIDADE}
                  className="hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-semibold text-gray-800 text-sm">{g.UNIDADE}</div>
                    <div className="text-xs text-gray-400">INEP: {g.CO_ENTIDADE}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {g.QT_GEST_BAS}
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-600">
                    <span className="text-pink-500 font-semibold">{g.QT_GEST_BAS_FEM}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-sky-500 font-semibold">{g.QT_GEST_BAS_MASC}</span>
                  </td>
                  <td className="p-4 text-center">
                    {g.QT_GEST_BAS_ESCO_SUP_GRAD > 0 ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700">Sim</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-400">Não</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-gray-600 text-xs">
                    {g.QT_GEST_BAS_ACESSO_CARGO_INDIC > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full mr-1">Indicação</span>}
                    {g.QT_GEST_BAS_ACESSO_CARGO_ELEIC > 0 && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full mr-1">Eleição</span>}
                    {g.QT_GEST_BAS_ACESSO_CARGO_CONC > 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">Concurso</span>}
                    {g.QT_GEST_BAS_ACESSO_CARGO_INDIC === 0 && g.QT_GEST_BAS_ACESSO_CARGO_ELEIC === 0 && g.QT_GEST_BAS_ACESSO_CARGO_CONC === 0 && (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedGestor(g)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs"
                    >
                      <UserCircle size={15} /> Ver
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {displayedGestores.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              Nenhuma escola ou gestor encontrado com esses filtros.
            </div>
          )}
          {allFilteredGestores.length > 100 && (
            <div className="p-4 bg-gray-50 text-center text-xs text-gray-500">
              Mostrando os primeiros 100 de {allFilteredGestores.length} resultados. Refine a busca para encontrar uma unidade específica.
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedGestor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGestor(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-8 bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500 text-white relative overflow-hidden">
                {/* Decorative background icon */}
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 scale-[3]">
                   <Users size={120} />
                </div>

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight leading-none drop-shadow-sm">{selectedGestor.UNIDADE}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-white/80 text-xs font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> Tocantins</span>
                      <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                      <span>INEP: {selectedGestor.CO_ENTIDADE}</span>
                      <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                      <span>Censo {selectedGestor.NU_ANO_CENSO}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGestor(null)} 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all border border-white/10 group"
                  >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-white">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Gestores</div>
                    <div className="text-2xl font-black text-indigo-700">{selectedGestor.QT_GEST_BAS}</div>
                  </div>
                  <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100/50">
                    <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">Feminino</div>
                    <div className="text-2xl font-black text-pink-700">{selectedGestor.QT_GEST_BAS_FEM}</div>
                  </div>
                  <div className="bg-sky-50/50 p-4 rounded-2xl border-sky-100/50 border">
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">Masculino</div>
                    <div className="text-2xl font-black text-sky-700">{selectedGestor.QT_GEST_BAS_MASC}</div>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-2xl border-orange-100/50 border">
                    <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Pessoas PcD</div>
                    <div className="text-2xl font-black text-orange-700">{selectedGestor.QT_GEST_BAS_PCD}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <ModalSection title="Raça / Cor">
                    <ModalRow label="Branca" value={selectedGestor.QT_GEST_BAS_BRANCA} />
                    <ModalRow label="Preta" value={selectedGestor.QT_GEST_BAS_PRETA} />
                    <ModalRow label="Parda" value={selectedGestor.QT_GEST_BAS_PARDA} />
                    <ModalRow label="Amarela" value={selectedGestor.QT_GEST_BAS_AMARELA} />
                    <ModalRow label="Indígena" value={selectedGestor.QT_GEST_BAS_INDIGENA} />
                  </ModalSection>

                  <ModalSection title="Faixa Etária">
                    <ModalRow label="Até 24 anos" value={selectedGestor.QT_GEST_BAS_0_24} />
                    <ModalRow label="25–29 anos" value={selectedGestor.QT_GEST_BAS_25_29} />
                    <ModalRow label="30–39 anos" value={selectedGestor.QT_GEST_BAS_30_39} />
                    <ModalRow label="40–49 anos" value={selectedGestor.QT_GEST_BAS_40_49} />
                    <ModalRow label="50–54 anos" value={selectedGestor.QT_GEST_BAS_50_54} />
                    <ModalRow label="55–59 anos" value={selectedGestor.QT_GEST_BAS_55_59} />
                    <ModalRow label="60+ anos" value={selectedGestor.QT_GEST_BAS_60_MAIS} />
                  </ModalSection>

                  <ModalSection title="Escolaridade">
                    <ModalRow label="Ens. Fundamental" value={selectedGestor.QT_GEST_BAS_ESCO_EF} />
                    <ModalRow label="Ens. Médio" value={selectedGestor.QT_GEST_BAS_ESCO_EM} />
                    <ModalRow label="Graduação" value={selectedGestor.QT_GEST_BAS_ESCO_SUP_GRAD} />
                    <ModalRow label="Licenciatura" value={selectedGestor.QT_GEST_BAS_ESCO_SUP_GRAD_LICEN} />
                    <ModalRow label="Especialização" value={selectedGestor.QT_GEST_BAS_ESCO_SUP_POS_ESPEC} />
                    <ModalRow label="Mestrado" value={selectedGestor.QT_GEST_BAS_ESCO_SUP_POS_MESTRA} />
                    <ModalRow label="Doutorado" value={selectedGestor.QT_GEST_BAS_ESCO_SUP_POS_DOUTO} />
                  </ModalSection>

                  <ModalSection title="Acesso ao Cargo">
                    <ModalRow label="Indicação" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_INDIC} />
                    <ModalRow label="Eleição" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_ELEIC} />
                    <ModalRow label="Seleção" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_SEL} />
                    <ModalRow label="Concurso" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_CONC} />
                    <ModalRow label="Própria (prop)" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_PROP} />
                    <ModalRow label="Processo Seletivo" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_P_SEL} />
                    <ModalRow label="Outros" value={selectedGestor.QT_GEST_BAS_ACESSO_CARGO_OUTRO} />
                  </ModalSection>

                  <ModalSection title="Vínculo e Função">
                    <ModalRow label="Concursado / Efetivo" value={selectedGestor.QT_GEST_BAS_VINCULO_CONCUR} />
                    <ModalRow label="Contratado / Temporário" value={selectedGestor.QT_GEST_BAS_VINCULO_CONTRA} />
                    <ModalRow label="Atua como Diretor" value={selectedGestor.QT_GEST_BAS_DIRETOR} />
                    <ModalRow label="Outras Funções" value={selectedGestor.QT_GEST_BAS_OUTRO} />
                  </ModalSection>

                  <ModalSection title="Formação Específica">
                    <ModalRow label="Esp. em Gestão Escolar" value={selectedGestor.QT_GEST_BAS_ESPEC_GESTAO} />
                    <ModalRow label="Esp. em TIC na Educ." value={selectedGestor.QT_GEST_BAS_ESPEC_EDUC_TIC} />
                    <ModalRow label="Nenhuma Esp. Específica" value={selectedGestor.QT_GEST_BAS_ESPEC_NENHUM} />
                  </ModalSection>
                </div>

                {/* ── Dados Brutos com Dicionário ── */}
                <div className="pt-8 border-t border-gray-100">
                  <RawDataSection data={selectedGestor} rawSearch={searchTerm} setRawSearch={setSearchTerm} accentColor="indigo" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function KpiCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <div className="text-xs font-medium text-gray-400">{title}</div>
        <div className="text-xl font-bold text-gray-800 leading-tight">{value}</div>
      </div>
    </div>
  );
}

function MiniBar({ label, tooltip, value, total, color }: { label: string; tooltip?: string; value: number; total: number; color: string }) {
  const pctValue = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="group/bar relative">
      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
        <span className="font-semibold">{label}</span>
        <span className="font-bold text-gray-700">{value} <span className="text-gray-300 ml-1 font-normal">({pctValue}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pctValue}%` }} />
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl">
          {tooltip}
          <div className="absolute top-full left-4 border-8 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

function SortTh({ label, field, current, dir, onSort }: {
  label: string; field: keyof Gestor; current: keyof Gestor; dir: "asc" | "desc"; onSort: (f: keyof Gestor) => void;
}) {
  const active = current === field;
  return (
    <th
      className="p-4 font-semibold text-gray-600 text-sm cursor-pointer select-none hover:bg-gray-100 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
      </span>
    </th>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="font-bold text-gray-700 border-l-4 border-indigo-500 pl-3 text-xs uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ModalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className={`flex justify-between items-center p-2 rounded-lg text-sm ${value > 0 ? "bg-indigo-50/50" : "opacity-40"}`}>
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${value > 0 ? "text-indigo-700" : "text-gray-400"}`}>{value}</span>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    pink: "bg-pink-100 text-pink-700",
    sky: "bg-sky-100 text-sky-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[color] ?? "bg-gray-100 text-gray-700"}`}>
      {children}
    </span>
  );
}
