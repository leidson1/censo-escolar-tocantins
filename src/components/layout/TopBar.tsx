import Image from "next/image";

export default function TopBar() {
    return (
        <div className="w-full bg-white border-b-4 border-yellow-400 shadow-sm relative z-40">
            {/* Reverted to justify-between for spacious, elegant feel */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-6">

                {/* Left: Censo Logo */}
                <div className="flex-1 flex justify-start w-full md:w-auto">
                    <Image
                        src="/imagens/Censo EScolar Atual.png"
                        alt="Logotipo do Censo Escolar"
                        width={180}
                        height={60}
                        className="h-14 md:h-16 w-auto object-contain"
                    />
                </div>


                {/* Center: Title Block */}
                <div className="flex-none flex flex-col items-center text-center mx-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#0D6E3F] tracking-tight leading-none uppercase">
                        Censo Escolar
                    </h1>
                    <div className="flex items-center gap-3 mt-1 justify-center">
                        <span className="h-0.5 w-8 bg-yellow-400 rounded-full"></span>
                        <h2 className="text-sm md:text-lg font-bold text-gray-500 uppercase tracking-[0.3em]">
                            Tocantins
                        </h2>
                        <span className="h-0.5 w-8 bg-yellow-400 rounded-full"></span>
                    </div>
                </div>

                {/* Divider 2 */}
                <div className="hidden md:block w-px h-16 bg-gray-200"></div>

                {/* Right: Seduc / Governo Text Block - Replaces the "Too Big" Logo */}
                <div className="flex-1 flex flex-col items-end justify-center w-full md:w-auto text-right">
                    <span className="text-xs uppercase tracking-widest text-[#0D6E3F] font-semibold">Secretaria da Educação</span>
                    <span className="text-xs font-bold text-gray-400 mt-0.5">Governo do Tocantins</span>
                </div>

            </div>
        </div>
    );
}
