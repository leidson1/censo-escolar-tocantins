import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#1a4a36] text-white pt-16 pb-8 border-t-4 border-[#0D6E3F] text-left">
            <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* Column 1: Institucional */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xl uppercase tracking-wider text-green-300 mb-2">Institucional</h3>
                    <p className="text-gray-300 text-sm leading-relaxed text-justify">
                        A Gerência de Estatística e Censo Escolar é responsável pela coordenação e execução do Censo Escolar da Educação Básica no estado do Tocantins, garantindo a qualidade e fidedignidade dos dados educacionais.
                    </p>
                    <div className="pt-4">
                        <img src="/imagens/Secretaria da Educação1- Branco.png" alt="Seduc TO" className="h-12 opacity-80" />
                        <div className="font-bold text-lg mt-2">SEDUC/TO</div>
                    </div>
                </div>

                {/* Column 2: Links Úteis */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xl uppercase tracking-wider text-green-300 mb-2">Links Rápidos</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>
                            <a href="https://www.to.gov.br/seduc/" target="_blank" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                                Secretaria da Educação
                            </a>
                        </li>
                        <li>
                            <a href="https://www.to.gov.br/" target="_blank" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                                Governo do Tocantins
                            </a>
                        </li>
                        <li>
                            <a href="https://www.gov.br/inep/pt-br" target="_blank" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                                INEP
                            </a>
                        </li>
                        <li>
                            <a href="https://educacenso.inep.gov.br/educacenso/" target="_blank" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                                Sistema Educacenso
                            </a>
                        </li>
                        <li>
                            <a href="https://www.gov.br/inep/pt-br/centrais-de-conteudo/legislacao/censo-escolar" target="_blank" className="hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                                Legislação Educacional
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Column 3: Contatos */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xl uppercase tracking-wider text-green-300 mb-2">Fale Conosco</h3>
                    <ul className="space-y-4 text-sm text-gray-300">
                        <li className="flex items-start gap-3">
                            <MapPin className="text-green-400 shrink-0 mt-0.5" size={18} />
                            <span>
                                Quadra 604 Sul, Alameda 6, Al 13<br />
                                Plano Diretor Sul - Palmas - TO<br />
                                CEP: 77022-038
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Phone className="text-green-400 shrink-0 mt-0.5" size={18} />
                            <span>
                                (63) 3027-3679<br />
                                (63) 3027-3680<br />
                                (63) 3027-3681
                            </span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="text-green-400 shrink-0" size={18} />
                            <a href="mailto:censo@seduc.to.gov.br" className="hover:text-white transition-colors">censo@seduc.to.gov.br</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-xs text-gray-400">
                <p>© 2026 Gerência de Estatística e Censo Escolar - SEDUC/TO. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}
