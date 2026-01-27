import Image from "next/image";
import Link from "next/link";

export default function LinkGrid() {
    return (
        <div className="flex justify-between items-center my-2.5 mx-5 flex-wrap gap-4">
            {/* Logo Censo */}
            <div className="w-[170px]">
                <Image src="/imagens/Censo Escolar.jpg" alt="Logotipo do Censo Escolar" width={170} height={100} className="w-full h-auto" />
            </div>

            {/* Text Links 1 */}
            <a href="https://www.to.gov.br/seduc/" target="_blank" className="text-blue-700 text-center inline-block hover:underline font-bold">
                Secretaria da Educação<br />Governo do Tocantins
            </a>

            {/* Text Links 2 */}
            <a href="https://www.gov.br/inep/pt-br/centrais-de-conteudo/legislacao" target="_blank" className="text-blue-700 text-center inline-block hover:underline font-bold">
                INEP<br /> Legislação
            </a>

            {/* Text Links 3 */}
            <div className="text-center">
                <a href="#" className="text-blue-700 inline-block hover:underline font-bold">Manuais</a>
            </div>

            {/* Text Links 4 (Etapas) */}
            <div className="text-center flex flex-col items-center">
                <Link href="/2-etapa" className="text-blue-700 hover:underline font-bold block mb-1">
                    2ª Etapa (Situação do Aluno - 2025)
                </Link>
                <Link href="/1-etapa" className="text-blue-700 hover:underline font-bold block">
                    1ª Etapa (Matrícula Inicial - 2026)
                </Link>
            </div>

            {/* Logo Seduc */}
            <div>
                <Image src="/imagens/Secretaria_da_Educação.png" alt="Logotipo da SEDUC" width={200} height={80} className="h-[60px] w-auto" />
            </div>
        </div>
    );
}
