import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Escola {
  codigo_escola: number;
  codigo_municipio: number;
  sre: string;
  municipio: string;
  escola: string;
  localizacao: string;
  dependencia: string;
  etapas?: string[];
}

interface DiarioEntry {
  id: string;
  destino: string;
  data_saida: string;
  data_retorno: string;
  ordem_servico?: string | null;
  valor_diaria: number;
  quantidade_diarias: number;
  origem_rota?: string | null;
  distancia_km?: number | null;
  tecnicos: {
    matricula: string;
    nome: string;
    regional: string;
  };
  escolas?: Escola[];
}

function fmtCur(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export interface ExportRelatoriosOptions {
  incluirDiarias?: boolean;
  incluirEscolas?: boolean;
}

export function exportDiariasToPdf(
  data: DiarioEntry[],
  options: ExportRelatoriosOptions = {}
) {
  const { incluirDiarias = true, incluirEscolas = true } = options;
  if (!incluirDiarias && !incluirEscolas) return;

  const now = new Date();
  const mesAno = now
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 30;

  if (incluirDiarias) {
  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(31, 56, 100); // navy
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PLANILHA DE DIÁRIAS PARA MONITORAMENTO ${mesAno}`, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SECRETARIA DA EDUCAÇÃO — TOCANTINS', margin, 42);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const objText =
    'Realizar Monitoramento in loco da Matrícula Inicial do Censo Escolar 2026 nas Escolas Públicas e Privadas da ' +
    'Educação Básica com foco na orientação e na melhoria contínua da coleta de dados garantindo sua fidedignidade.';
  const objLines = doc.splitTextToSize(objText, pageWidth - margin * 2 - 140);
  doc.text(objLines, margin, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 0, 0);
  const valorPadrao = data.length > 0 ? Number(data[0].valor_diaria) : 335;
  doc.text(`R$ ${valorPadrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin, 70, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ── Table grouped by OS ────────────────────────────────────────────────
  const groups = new Map<string, DiarioEntry[]>();
  data.forEach((e) => {
    const key = e.ordem_servico?.trim() || '(Sem OS)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });

  const rows: (string | number)[][] = [];
  groups.forEach((entries, osKey) => {
    entries.forEach((entry) => {
      const vlD = Number(entry.valor_diaria);
      const qtd = Number(entry.quantidade_diarias);
      rows.push([
        entry.tecnicos.regional,
        entry.tecnicos.nome,
        entry.tecnicos.matricula,
        entry.destino,
        `${fmtDate(entry.data_saida)} a ${fmtDate(entry.data_retorno)}`,
        osKey !== '(Sem OS)' ? osKey : '—',
        fmtCur(vlD),
        qtd,
        fmtCur(vlD * qtd),
      ]);
    });
  });

  autoTable(doc, {
    startY: 95,
    margin: { left: margin, right: margin },
    head: [['REGIONAL', 'NOME', 'MAT.', 'DESTINO', 'SAÍDA / RETORNO', 'OS', 'VL DIÁRIA', 'QTD', 'TOTAL']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [46, 117, 182], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [239, 247, 251] },
    columnStyles: {
      3: { cellWidth: 130 },
      6: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const grandQtd = data.reduce((s, e) => s + Number(e.quantidade_diarias), 0);
  const grandVal = data.reduce((s, e) => s + Number(e.valor_diaria) * Number(e.quantidade_diarias), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY as number;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `TOTAL GERAL — ${data.length} técnico(s)   |   ${grandQtd} diária(s)   |   ${fmtCur(grandVal)}`,
    pageWidth - margin,
    finalY + 20,
    { align: 'right' }
  );
  } // incluirDiarias

  // ── Escolas Monitoradas ────────────────────────────────────────────────
  if (incluirEscolas) {
    const escRows: (string | number)[][] = [];
    data.forEach((entry) => {
      (entry.escolas || []).forEach((esc) => {
        escRows.push([
          entry.tecnicos.regional,
          entry.tecnicos.nome,
          entry.tecnicos.matricula,
          entry.destino,
          entry.ordem_servico || '—',
          esc.codigo_escola,
          esc.escola,
          esc.municipio,
          esc.sre,
          esc.dependencia,
          esc.etapas && esc.etapas.length > 0 ? esc.etapas.join(', ') : '—',
        ]);
      });
    });

    if (incluirDiarias) doc.addPage();

    doc.setFontSize(13);
    doc.setTextColor(31, 56, 100);
    doc.text(
      incluirDiarias ? 'ESCOLAS MONITORADAS' : `ESCOLAS MONITORADAS — ${mesAno}`,
      margin,
      30
    );
    doc.setTextColor(0, 0, 0);

    if (escRows.length > 0) {
      autoTable(doc, {
        startY: 45,
        margin: { left: margin, right: margin },
        head: [['REGIONAL', 'TÉCNICO', 'MAT.', 'DESTINO', 'OS', 'CÓD. INEP', 'ESCOLA', 'MUNICÍPIO', 'SRE', 'DEPENDÊNCIA', 'ETAPAS MONITORADAS']],
        body: escRows,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 3 },
        headStyles: { fillColor: [46, 117, 182], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [239, 247, 251] },
        columnStyles: {
          6: { cellWidth: 130 },
          10: { cellWidth: 130 },
        },
      });
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(136, 136, 136);
      doc.text('Nenhuma escola monitorada foi vinculada às diárias exportadas.', margin, 55);
      doc.setTextColor(0, 0, 0);
    }
  }

  doc.save(`Planilha_Diarias_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
}
