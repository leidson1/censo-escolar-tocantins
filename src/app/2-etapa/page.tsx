"use client";

import { useState } from "react";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import CronogramaModal from "@/components/ui/CronogramaModal";

export default function SegundaEtapa() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <MainLayout title="Gerência de Estatística e Censo Escolar">
            <CronogramaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Header Bar */}
            <div className="text-center bg-[#0D6E3F] text-white py-6 mb-10 shadow-md rounded-lg -mt-4">
                <h2 className="m-0 font-bold text-2xl md:text-3xl">SITUAÇÃO DO ALUNO (MOVIMENTO E RENDIMENTO)</h2>
            </div>

            {/* Content Container */}
            <div className="max-w-[1000px] mx-auto px-1">

                {/* 1. Informações Gerais */}
                <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm text-justify leading-loose mb-10 text-lg border border-gray-100">
                    <h2 className="text-[#0D6E3F] font-bold text-2xl mt-0 pb-1 border-b border-dashed border-gray-300">1. Informações Gerais</h2>
                    <p className="mt-4">O Censo Escolar é o levantamento estatístico mais importante da educação básica no Brasil, coordenado pelo <strong>Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP)</strong>.</p>

                    <h3 className="text-[#0D6E3F] font-bold text-xl mt-6 mb-2">Módulo Situação do Aluno (2ª Etapa)</h3>
                    <p>Este módulo é a segunda etapa da coleta do Censo Escolar, na qual devem ser informados os dados de rendimento e movimento escolar alcançados pelos alunos declarados no Sistema Educacenso durante a 1ª etapa da coleta (Matrícula Inicial).</p>
                    <p>Os dados são cruciais, pois são utilizados para o cálculo da taxa de rendimento (aprovação, reprovação e abandono) e da taxa de não resposta. As taxas de rendimento escolar compõem o cálculo do <strong>Índice de Desenvolvimento da Educação Básica (Ideb)</strong>, que é um indicador de qualidade educacional divulgado a cada dois anos.</p>
                    <p className="text-sm text-gray-500 mt-2">A <strong>Taxa de Não Resposta (TNR)</strong> indica a porcentagem de alunos que não tiveram as informações de rendimento/movimento computadas por falta de informação ou por inconsistências.</p>
                </div>

                {/* 2. Cenários */}
                <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm text-justify leading-loose mb-10 text-lg border border-gray-100">
                    <h2 className="text-[#0D6E3F] font-bold text-2xl mt-0 pb-1 border-b border-dashed border-gray-300">2. Cenários de Participação</h2>

                    <h3 className="text-[#0D6E3F] font-bold text-xl mt-6 mb-2">✅ Respondem à Situação do Aluno</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Escolas com Matrículas de Escolarização:</strong> Devem informar o rendimento ou movimento escolar para cada matrícula de escolarização declarada na 1ª etapa de coleta do Censo Escolar 2025.</li>
                        <li><strong>Escolas Novas e Paralisadas:</strong> Escolas que iniciaram as atividades após a data de referência do Censo Escolar 2025 (28/05) e que puderam admitir alunos transferidos de outras instituições. Após a admissão, a escola deverá informar a situação de rendimento ou movimento escolar desses alunos ao final do ano letivo.</li>
                    </ul>

                    <h3 className="text-[#0D6E3F] font-bold text-xl mt-6 mb-2">❌ Não Respondem à Situação do Aluno</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Escolas que <strong>não informaram matrículas de escolarização</strong> na 1ª etapa de coleta 2025 não preenchem o módulo Situação do Aluno.</li>
                        <li>Escolas <strong>exclusivas de atividade complementar</strong> e/ou Atendimento Educacional Especializado (AEE).</li>
                        <li>Escolas que informaram apenas matrículas de <strong>Itinerário Formativo</strong>.</li>
                        <li>Escolas que <strong>não realizaram o fechamento</strong> na 1ª etapa da coleta 2025 tiveram suas matrículas desconsideradas e, dessa forma, não preenchem o módulo Situação do Aluno.</li>
                    </ul>
                </div>
            </div>

            {/* 3. Conceitos (Full width container approx) */}
            <div className="max-w-[1000px] mx-auto px-1 mb-14">
                <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm flex flex-col md:flex-row gap-8 items-start border border-gray-100">
                    <div className="flex-1 text-justify leading-relaxed">
                        <h2 className="text-[#333] font-semibold text-2xl mt-0 border-b border-dotted border-gray-300 pb-1 mb-4">3. Conceitos de Movimento e Rendimento Escolar</h2>

                        <h3 className="text-[#333] font-bold text-lg mt-4 mb-2">Movimento Escolar</h3>
                        <p>Compreende a mudança do vínculo escolar do aluno depois da data de referência do Censo Escolar 2025 (28/05) e antes do término do ano letivo.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Transferido:</strong> O aluno mudou de uma escola para outra mediante um requerimento formal, ou mudou de modalidade de ensino na mesma escola (ex: regular para EJA).</li>
                            <li><strong>Deixou de Frequentar:</strong> O aluno abandonou a escola antes do término do ano letivo, sem requerer formalmente a transferência para outra instituição de ensino.</li>
                            <li><strong>Falecido:</strong> O aluno faleceu antes do término do ano letivo.</li>
                        </ul>

                        <h3 className="text-[#333] font-bold text-lg mt-6 mb-2">Rendimento Escolar</h3>
                        <p>Compreende os resultados obtidos pelos alunos que estavam matriculados e frequentes na escola no término do ano letivo.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Aprovado:</strong> Alcançou os critérios mínimos para a conclusão satisfatória da etapa de ensino e está apto a ser matriculado na etapa seguinte no próximo ano letivo.</li>
                            <li><strong>Reprovado:</strong> Não alcançou os critérios mínimos para a conclusão da etapa de ensino e, portanto, não está apto a ser matriculado na etapa seguinte no próximo ano letivo.</li>
                            <li><strong>Concluinte:</strong> Aluno que foi aprovado e concluiu, com emissão de certificado, a etapa que estava cursando (ensino fundamental, ensino médio ou educação profissional).</li>
                        </ul>
                    </div>
                    <div className="w-full md:w-[450px] shrink-0">
                        <Image src="/imagens/Rendimento.png" alt="Fluxograma" width={500} height={400} className="w-full h-auto" />
                        <p className="text-center text-sm mt-2">Opções de Rendimento e Movimento Escolar.</p>
                    </div>
                </div>
            </div>

            {/* 4. Alunos Admitidos and 5. Orientações */}
            <div className="max-w-[1000px] mx-auto px-1 space-y-10">
                {/* 4. Admitidos */}
                <div className="bg-[#e9f5ee] p-8 md:p-10 rounded-lg border-l-[5px] border-[#0D6E3F] text-justify leading-loose">
                    <h2 className="text-[#0D6E3F] font-bold text-2xl mt-0 pb-1 border-b border-dashed border-gray-300">4. Alunos Admitidos Após o Censo</h2>
                    <p className="mt-4">São os alunos que ingressaram na escola após a data de referência do Censo Escolar 2025 (28/05). É fundamental a admissão desses alunos, pois a situação final da matrícula será declarada na escola que o admitiu, sendo essa informação utilizada no cálculo das taxas de rendimento escolar.</p>

                    <h4 className="font-bold mt-4">Regras de Admissão</h4>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Apenas alunos com matrícula de <strong>escolarização</strong> na 1ª etapa de coleta poderão ser admitidos após o Censo.</li>
                        <li>Para &quot;admitir após&quot; um aluno na <strong>mesma escola</strong>, só será possível se for em uma modalidade diferente. Para isso, o aluno deve ter sido previamente marcado como “transferido” ou “deixou de frequentar” na modalidade anterior.</li>
                        <li>As informações de modalidade e etapa de ensino da admissão após devem ser <strong>compatíveis</strong> com a 1ª etapa. Exemplo: um aluno de creche não poderá ser admitido após no ensino médio.</li>
                        <li>Na Admissão após <strong>não é possível realizar a edição do vínculo</strong> do aluno admitido.</li>
                    </ul>
                </div>

                {/* 5. Orientações */}
                <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm text-justify leading-loose border border-gray-100">
                    <h2 className="text-[#0D6E3F] font-bold text-2xl mt-0 pb-1 border-b border-dashed border-gray-300">5. Orientações por Etapa/Modalidade de Ensino</h2>

                    <h3 className="font-bold text-lg mt-6">Educação Infantil (Creche e Pré-escola)</h3>
                    <p>A informação de rendimento (<strong>Aprovado</strong> ou <strong>Reprovado</strong>) <strong>não se aplica</strong> a alunos da Educação Infantil.</p>
                    <ul className="list-disc pl-6">
                        <li>Deve-se informar apenas o <strong>movimento</strong> do aluno (Transferido, Deixou de Frequentar ou Falecido).</li>
                        <li>Se o aluno permaneceu na escola, informe a opção <strong>“Sem Movimentação (SM)”</strong>.</li>
                    </ul>

                    <hr className="my-6 border-t border-gray-200" />

                    <h3 className="font-bold text-lg">Ensino Fundamental e Médio (Ensino Regular e Educação Especial)</h3>
                    <p>O preenchimento da informação de rendimento ou movimento escolar é <strong>obrigatório</strong>.</p>
                    <ul className="list-disc pl-6">
                        <li><strong>Dependência Escolar:</strong> Para alunos em regime de Progressão Parcial/Dependência, a opção a ser informada é <strong>“Aprovado”</strong>. No caso de séries/anos finais, marque também a opção <strong>“Não concluinte”</strong>.</li>
                        <li>Matrículas exclusivas de <strong>Itinerário Formativo</strong> não estarão disponíveis para a declaração da Situação do Aluno.</li>
                    </ul>

                    <hr className="my-6 border-t border-gray-200" />

                    <h3 className="font-bold text-lg">Educação de Jovens e Adultos (EJA) e Educação Profissional</h3>
                    <p>A informação de rendimento escolar (<strong>Aprovado</strong> ou <strong>Reprovado</strong>) deverá ser declarada <strong>apenas ao final da etapa de ensino</strong>, devido à organização diferenciada (modular, seriada, cíclica).</p>
                    <ul className="list-disc pl-6">
                        <li>Se a etapa ainda não terminou e a informação de rendimento não existe, a opção a ser declarada é <strong>“Curso em Andamento (CA)”</strong>.</li>
                        <li>Para alunos aprovados nas <strong>etapas finais</strong> da EJA e da Educação Profissional, é obrigatória a informação de <strong>Concluinte</strong> (ou Não Concluinte) da etapa de ensino.</li>
                    </ul>

                    <div className="mt-8 pt-5 border-t border-dashed border-gray-300 text-center">
                        <Image src="/imagens/situacao1.png" alt="Tabela de Conceitos" width={800} height={400} className="max-w-full h-auto mx-auto rounded shadow-sm" />
                        <p className="text-sm text-gray-600 mt-2">Exemplo de preenchimento da Situação do Aluno.</p>
                    </div>
                </div>
            </div>

            {/* Cards Section */}
            <div className="flex flex-wrap justify-center max-w-[1000px] mx-auto gap-8 my-14 px-1">
                <div className="flex-1 min-w-[260px] bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer hover:-translate-y-1 transition-transform border border-gray-100"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Image src="/imagens/Cronograma.png" alt="Cronograma" width={80} height={80} className="mx-auto h-[90px] w-auto mb-4" />
                    <h3 className="text-[#0D6E3F] font-bold text-lg uppercase mb-3">CRONOGRAMA<br />CENSO 2025</h3>
                    <p className="text-gray-600">Acompanhe as datas oficiais do Censo Escolar 2025.</p>
                </div>

                <div className="flex-1 min-w-[260px] bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer hover:-translate-y-1 transition-transform border border-gray-100">
                    <Image src="/imagens/PDF.png" alt="PDF" width={80} height={80} className="mx-auto h-[90px] w-auto mb-4" />
                    <h3 className="text-[#0D6E3F] font-bold text-lg uppercase mb-3">
                        <a href="/Legislação/caderno_de_conceitos_e_orientacoes_situacao_do_aluno_2024.pdf" target="_blank" className="hover:underline">ORIENTAÇÕES - INEP</a>
                    </h3>
                    <p className="text-gray-600">Manual de Instruções da 2ª Etapa do Censo Escolar.</p>
                </div>

                {/* ... Other cards can be added similarly ... */}
                <div className="flex-1 min-w-[260px] bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer hover:-translate-y-1 transition-transform border border-gray-100">
                    <Image src="/imagens/Portaria.png" alt="Portaria" width={80} height={80} className="mx-auto h-[90px] w-auto mb-4" />
                    <h3 className="text-[#0D6E3F] font-bold text-lg uppercase mb-3 text-wrap overflow-hidden">
                        <a href="https://www.in.gov.br/en/web/dou/-/portaria-n-239-de-5-de-maio-de-2025-627643964" target="_blank" className="hover:underline">PORTARIA Nº 239/2025</a>
                    </h3>
                    <p className="text-gray-600">Normas e diretrizes oficiais do Censo 2025.</p>
                </div>
            </div>

            {/* Diagnóstico */}
            <div className="max-w-[1000px] mx-auto px-1 flex flex-col md:flex-row items-center gap-8 mb-24">
                <Image src="/imagens/Livros.JPEG" alt="Livros" width={320} height={200} className="rounded-lg shadow w-full md:w-[320px]" />
                <div>
                    <h3 className="text-[#0D6E3F] font-bold text-2xl mb-4">Diagnóstico dos Municípios</h3>
                    <p className="mb-4 text-justify">Com base nos dados do Censo Escolar, o <strong>MEC</strong> produz relatórios oficiais que permitem analisar a educação pública em todo o país.</p>
                    <p className="text-justify">No portal <strong><a href="https://www.gov.br/mec/pt-br/aqui-tem-mec" target="_blank" className="text-blue-700 underline">Aqui tem MEC</a></strong>, estão disponíveis <strong>painéis interativos, mapas e gráficos</strong> com informações detalhadas.</p>
                </div>
            </div>

            {/* 6. Dúvidas */}
            <div className="max-w-[1000px] mx-auto px-1 mb-10">
                <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-[#0D6E3F] font-bold text-2xl mt-0 pb-1 border-b border-dashed border-gray-300">6. Dúvidas e Contatos</h2>
                    <p className="mt-4 mb-6">Em caso de dúvidas sobre o preenchimento, entre em contato com o(a) técnico censitário da sua Superintendência Regional de Educação:</p>

                    <h3 className="font-bold text-lg mb-4">Contatos da SRE&apos;s (Tocantins)</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm md:text-base">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 border border-gray-200 font-semibold w-[15%]">Regional</th>
                                    <th className="p-3 border border-gray-200 font-semibold w-[30%]">E-mail (Diretoria)</th>
                                    <th className="p-3 border border-gray-200 font-semibold w-[30%]">E-mail (Censo Escolar)</th>
                                    <th className="p-3 border border-gray-200 font-semibold w-[25%]">Telefone SRE&apos;s</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="even:bg-gray-50 bg-white">
                                    <td className="p-3 border border-gray-200">000 - Palmas</td>
                                    <td className="p-3 border border-gray-200 text-[#0D6E3F] hover:underline"><a href="mailto:diretoria-palmas@seduc.to.gov.br">diretoria-palmas@seduc.to.gov.br</a></td>
                                    <td className="p-3 border border-gray-200 text-[#0D6E3F] hover:underline"><a href="mailto:censo-palmas@seduc.to.gov.br">censo-palmas@seduc.to.gov.br</a></td>
                                    <td className="p-3 border border-gray-200">(63) 3218-6164</td>
                                </tr>
                                <tr className="even:bg-gray-50 bg-white">
                                    <td className="p-3 border border-gray-200">001 - Araguaína</td>
                                    <td className="p-3 border border-gray-200 text-[#0D6E3F] hover:underline"><a href="mailto:diretoria-araguaina@seduc.to.gov.br">diretoria-araguaina@seduc.to.gov.br</a></td>
                                    <td className="p-3 border border-gray-200 text-[#0D6E3F] hover:underline"><a href="mailto:censo-araguaina@seduc.to.gov.br">censo-araguaina@seduc.to.gov.br</a></td>
                                    <td className="p-3 border border-gray-200">(63) 3411-5007<br />(63) 3411-5016</td>
                                </tr>
                                <tr className="even:bg-gray-50 bg-white">
                                    <td className="p-3 border border-gray-200">003 - Arraias</td>
                                    <td className="p-3 border border-gray-200 text-[#0D6E3F] hover:underline"><a href="mailto:dre.arraias.seduc.to@gmail.com">dre.arraias.seduc.to@gmail.com</a></td>
                                    <td className="p-3 border border-gray-200 text-[#0D6E3F] hover:underline"><a href="mailto:apa.arraias@gmail.com">apa.arraias@gmail.com</a></td>
                                    <td className="p-3 border border-gray-200">(63) 3951-1009</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
