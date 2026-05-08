"use client";

import { useState } from "react";
import { School, Users, GraduationCap, Users2, Layout, BookOpen, UserCheck, UserPlus, Columns, Grid, Award, Book, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CensoDashboard from "./CensoDashboard";
import GestoresDashboard from "./GestoresDashboard";
import DocentesDashboard from "./DocentesDashboard";
import GenericCensoDashboard from "./GenericCensoDashboard";

type Dataset = "escolas" | "gestores" | "docentes" | "matriculas" | "turmas" | "cursos";

interface DatasetSelectorProps {
  schools: Record<string, unknown>[];
  stats: Record<string, number>;
  gestores: Record<string, unknown>[];
  docentes: Record<string, unknown>[];
  matriculas: Record<string, unknown>[];
  turmas: Record<string, unknown>[];
  cursosTecnicos: Record<string, unknown>[];
}

const tabs: { id: Dataset; label: string; icon: React.ElementType; desc: string; color: string; active: string }[] = [
  {
    id: "escolas",
    label: "Escolas",
    icon: School,
    desc: "Infraestrutura e recursos",
    color: "border-[#0D6E3F] text-[#0D6E3F]",
    active: "bg-[#0D6E3F] text-white shadow-lg shadow-green-200",
  },
  {
    id: "gestores",
    label: "Gestores",
    icon: Users,
    desc: "Perfil e vínculo escolar",
    color: "border-indigo-600 text-indigo-600",
    active: "bg-indigo-600 text-white shadow-lg shadow-indigo-200",
  },
  {
    id: "docentes",
    label: "Docentes",
    icon: GraduationCap,
    desc: "Corpo docente por etapa",
    color: "border-purple-600 text-purple-600",
    active: "bg-purple-600 text-white shadow-lg shadow-purple-200",
  },
  {
    id: "matriculas",
    label: "Matrículas",
    icon: Users2,
    desc: "Alunos matriculados",
    color: "border-blue-600 text-blue-600",
    active: "bg-blue-600 text-white shadow-lg shadow-blue-200",
  },
  {
    id: "turmas",
    label: "Turmas",
    icon: Layout,
    desc: "Distribuição de turmas",
    color: "border-teal-600 text-teal-600",
    active: "bg-teal-600 text-white shadow-lg shadow-teal-200",
  },
  {
    id: "cursos",
    label: "Cursos Técnicos",
    icon: BookOpen,
    desc: "Educação Profissional",
    color: "border-rose-600 text-rose-600",
    active: "bg-rose-600 text-white shadow-lg shadow-rose-200",
  },
];

export default function DatasetSelector({
  schools,
  stats,
  gestores,
  docentes,
  matriculas,
  turmas,
  cursosTecnicos,
}: DatasetSelectorProps) {
  const [active, setActive] = useState<Dataset>("escolas");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 text-center
                ${
                  isActive
                    ? tab.active + " border-transparent"
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-gray-700"
                }
              `}
            >
              <div className={`p-2 rounded-xl mb-2 ${isActive ? "bg-white/20" : "bg-gray-50"}`}>
                <Icon size={22} className={isActive ? "opacity-100" : "opacity-60"} />
              </div>
              <div className="font-bold text-xs uppercase tracking-wider">{tab.label}</div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {active === "escolas" && <CensoDashboard schools={schools as never} stats={stats as never} />}
          {active === "gestores" && <GestoresDashboard gestores={gestores as never} />}
          {active === "docentes" && <DocentesDashboard docentes={docentes as never} />}
          {active === "matriculas" && (
            <GenericCensoDashboard
              data={matriculas as never}
              color="green"
              searchPlaceholder="Buscar por escola..."
              showTotalUnits={false}
              note="Nota: A soma das matrículas por etapa pode ultrapassar o total de matrículas da educação básica, pois um mesmo aluno pode estar contabilizado em mais de uma etapa (ex: Ensino Médio, Educação Profissional e EJA)."
              excludePrefixes={["QT_DOC", "QT_TUR", "QT_GEST", "NU_DOC", "NU_TUR", "NU_GEST"]}
              kpiFields={[
                { key: "QT_MAT_BAS", label: "Total Matrículas", color: "blue", icon: <Users2 size={20} /> },
                { key: "QT_MAT_INF", label: "Infantil", color: "blue", icon: <Award size={20} /> },
                { key: "QT_MAT_FUND_AI", label: "Fundamental AI", color: "blue", icon: <UserCheck size={20} /> },
                { key: "QT_MAT_FUND_AF", label: "Fundamental AF", color: "blue", icon: <Columns size={20} /> },
                { key: "QT_MAT_MED", label: "Ens. Médio", color: "blue", icon: <UserPlus size={20} /> },
                { key: "QT_MAT_PROF", label: "Profissional", color: "blue", icon: <Book size={20} /> },
                { key: "QT_MAT_EJA", label: "EJA", color: "blue", icon: <Users size={20} /> },
              ]}
              tableFields={[
                { key: "QT_MAT_BAS", label: "Total" },
                { key: "QT_MAT_INF", label: "Infantil" },
                { key: "QT_MAT_FUND_AI", label: "Fund. AI" },
                { key: "QT_MAT_FUND_AF", label: "Fund. AF" },
                { key: "QT_MAT_MED", label: "Médio" },
                { key: "QT_MAT_PROF", label: "Prof." },
                { key: "QT_MAT_EJA", label: "EJA" },
              ]}
            />
          )}
          {active === "turmas" && (
            <GenericCensoDashboard
              data={turmas as never}
              color="teal"
              searchPlaceholder="Buscar por escola..."
              showTotalUnits={false}
              excludePrefixes={["QT_DOC", "QT_MAT", "QT_GEST", "NU_DOC", "NU_MAT", "NU_GEST"]}
              kpiFields={[
                { key: "QT_TUR_BAS", label: "Total Turmas", color: "teal", icon: <Layout size={20} /> },
                { key: "QT_TUR_INF", label: "Infantil", color: "teal", icon: <Award size={20} /> },
                { key: "QT_TUR_FUND_AI", label: "Fundamental AI", color: "teal", icon: <Columns size={20} /> },
                { key: "QT_TUR_FUND_AF", label: "Fundamental AF", color: "teal", icon: <Columns size={20} /> },
                { key: "QT_TUR_MED", label: "Ens. Médio", color: "teal", icon: <Grid size={20} /> },
                { key: "QT_TUR_PROF", label: "Profissional", color: "teal", icon: <Book size={20} /> },
                { key: "QT_TUR_EJA", label: "EJA", color: "teal", icon: <Users size={20} /> },
              ]}
              tableFields={[
                { key: "QT_TUR_BAS", label: "Total" },
                { key: "QT_TUR_INF", label: "Infantil" },
                { key: "QT_TUR_FUND_AI", label: "Fund. AI" },
                { key: "QT_TUR_FUND_AF", label: "Fund. AF" },
                { key: "QT_TUR_MED", label: "Médio" },
                { key: "QT_TUR_PROF", label: "Prof." },
                { key: "QT_TUR_EJA", label: "EJA" },
              ]}
            />
          )}
          {active === "cursos" && (
            <GenericCensoDashboard
              data={cursosTecnicos as never}
              color="rose"
              searchPlaceholder="Buscar curso..."
              showTotalUnits={false}
              courseField="NO_CURSO_EDUC_PROFISSIONAL"
              excludePrefixes={["QT_DOC", "QT_MAT_BAS", "QT_GEST", "NU_DOC", "NU_MAT", "NU_GEST"]}
              kpiFields={[
                { key: "QT_MAT_CURSO_TEC", label: "Total Matrículas", color: "rose", icon: <Users size={20} /> },
                { key: "QT_MAT_CURSO_TEC_CONC", label: "Concomitante", color: "rose", icon: <Layout size={20} /> },
                { key: "QT_MAT_CURSO_TEC_EJA", label: "Integrado EJA", color: "rose", icon: <Award size={20} /> },
                { key: "QT_MAT_CURSO_TEC_SUBS", label: "Subsequente", color: "rose", icon: <Clock size={20} /> },
                { key: "QT_MAT_CURSO_TEC_IFTP_CT", label: "IFTP Exclusivo", color: "rose", icon: <GraduationCap size={20} /> },
                { key: "QT_MAT_CURSO_TEC_IFTP", label: "Articulado IFTP", color: "rose", icon: <Layout size={20} /> },
                { key: "QT_MAT_CURSO_TEC_NM", label: "Normal/Magistério", color: "rose", icon: <BookOpen size={20} /> },
              ]}
              tableFields={[
                { key: "NO_CURSO_EDUC_PROFISSIONAL", label: "Curso" },
                { key: "QT_MAT_CURSO_TEC", label: "Matrículas" },
                { key: "QT_MAT_CURSO_TEC_CONC", label: "Conc." },
                { key: "QT_MAT_CURSO_TEC_EJA", label: "EJA" },
                { key: "QT_MAT_CURSO_TEC_SUBS", label: "Subs." },
                { key: "QT_MAT_CURSO_TEC_IFTP_CT", label: "IFTP Exc." },
                { key: "QT_MAT_CURSO_TEC_IFTP", label: "IFTP Art." },
                { key: "QT_MAT_CURSO_TEC_NM", label: "Normal" },
              ]}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
