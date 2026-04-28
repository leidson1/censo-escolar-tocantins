import MainLayout from "@/components/layout/MainLayout";
import DatasetSelector from "@/components/censo/DatasetSelector";

export const metadata = {
  title: "Censo Escolar 2025 | Portal Censo Escolar Tocantins",
  description: "Dados completos das escolas, gestores, docentes, matrículas, turmas e cursos técnicos do Tocantins no Censo Escolar 2025.",
};

import { supabase } from "@/lib/supabase";
import { mapSchoolSummary } from "@/lib/supabase-mapping";
import stats from "@/data/censo-stats.json";

// Dados desativados por enquanto
const gestores: any[] = [];
const docentes: any[] = [];
const matriculas: any[] = [];
const turmas: any[] = [];
const cursosTecnicos: any[] = [];

export default async function Censo2025Page() {
  const { data: schoolsRaw, error } = await supabase
    .from('escolas_2025_to')
    .select('codigo_da_escola, nome_da_escola, nome_do_municipio, dependencia_administrativa, localizacao, acesso_a_internet, numero_de_salas_de_aula_utilizadas_na_escola_dentro_e_fora_do_p');

  const schools = (schoolsRaw || []).map(mapSchoolSummary);

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
