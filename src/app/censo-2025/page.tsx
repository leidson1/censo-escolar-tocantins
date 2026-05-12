import MainLayout from "@/components/layout/MainLayout";
import CensoDictionary from "@/components/censo/CensoDictionary";
import CensoDataLoader from "@/components/censo/CensoDataLoader";

export const metadata = {
  title: "Censo Escolar 2025 | Portal Censo Escolar Tocantins",
  description: "Dados completos das escolas, gestores, docentes, matriculas, turmas e cursos técnicos do Tocantins no Censo Escolar 2025.",
};

export default function Censo2025Page() {
  return (
    <MainLayout title="Dados do Censo Escolar 2025">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Painel do Censo Escolar 2025</h1>
        <p className="text-gray-500">
          Consulte informações completas de escolas, gestores, docentes, matrículas, turmas e cursos técnicos
          das unidades escolares do Tocantins.
        </p>
      </div>

      <CensoDataLoader />

      {/* Floating Dictionary Button */}
      <CensoDictionary />
    </MainLayout>
  );
}
