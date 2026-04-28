import MainLayout from "@/components/layout/MainLayout";
import DatasetSelector from "@/components/censo/DatasetSelector";

export const metadata = {
  title: "Censo Escolar 2025 | Portal Censo Escolar Tocantins",
  description: "Dados completos das escolas, gestores, docentes, matrículas, turmas e cursos técnicos do Tocantins no Censo Escolar 2025.",
};

import schools from "@/data/escolas-resumo.json";
import stats from "@/data/censo-stats.json";
import gestores from "@/data/gestores_escolares_2025_TO.json";
import docentes from "@/data/docentes_2025_TO.json";
import matriculas from "@/data/matriculas_2025_TO.json";
import turmas from "@/data/turmas_2025_TO.json";
import cursosTecnicos from "@/data/cursos_tecnicos_2025_TO.json";

export default async function Censo2025Page() {

  return (
    <MainLayout title="Dados do Censo Escolar 2025">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Painel do Censo Escolar 2025</h1>
        <p className="text-gray-500">
          Consulte informações completas de escolas, gestores, docentes, matrículas, turmas e cursos técnicos
          das unidades escolares do Tocantins.
        </p>
      </div>

      <DatasetSelector
        schools={schools}
        stats={stats}
        gestores={gestores}
        docentes={docentes}
        matriculas={matriculas}
        turmas={turmas}
        cursosTecnicos={cursosTecnicos}
      />
    </MainLayout>
  );
}
