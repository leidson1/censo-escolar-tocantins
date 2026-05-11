import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Gerência de Estatística e Censo Escolar",
  description: "Censo Escolar - Secretaria da Educação - Governo do Tocantins",
};

import { CensoProvider } from "@/context/CensoContext";
import HomeRedirect from "@/components/layout/HomeRedirect";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <CensoProvider>
          <HomeRedirect />
          {children}
        </CensoProvider>
      </body>
    </html>
  );
}
