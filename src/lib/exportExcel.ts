import ExcelJS from 'exceljs';

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

// ─── Palette ───────────────────────────────────────────────────────────────────
const C = {
  NAVY:       'FF1F3864',
  WHITE:      'FFFFFFFF',
  YELLOW_BG:  'FFFFFF99',
  RED:        'FFFF0000',
  DADOS_BG:   'FF17375E',
  DATA_BG:    'FF375623',
  DIARIAS_BG: 'FF7F3F00',
  COL_HDR_BG: 'FF2E75B6',
  REGIONAL_BG:'FFBDD7EE',
  ROW_A:      'FFFFFFFF',
  ROW_B:      'FFEFF7FB',
  OS_BG:      'FFFFF2CC',
  DIARIA_BG:  'FFFDE9D9',
  TOTAL_BG:   'FFE2EFDA',
  GRAND_BG:   'FFBDD7EE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function b(cell: ExcelJS.Cell, style: ExcelJS.BorderStyle = 'thin') {
  cell.border = {
    top:    { style, color: { argb: 'FF000000' } },
    left:   { style, color: { argb: 'FF000000' } },
    bottom: { style, color: { argb: 'FF000000' } },
    right:  { style, color: { argb: 'FF000000' } },
  };
}

function f(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function fnt(
  cell: ExcelJS.Cell,
  opts: { bold?: boolean; size?: number; color?: string; italic?: boolean }
) {
  cell.font = {
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    size: opts.size ?? 9,
    color: { argb: opts.color ?? 'FF000000' },
    name: 'Calibri',
  };
}

function al(
  cell: ExcelJS.Cell,
  h: ExcelJS.Alignment['horizontal'] = 'center',
  v: ExcelJS.Alignment['vertical'] = 'middle',
  wrap = false
) {
  cell.alignment = { horizontal: h, vertical: v, wrapText: wrap };
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export async function exportDiariasToExcel(
  data: DiarioEntry[],
  options: ExportRelatoriosOptions = {}
) {
  const { incluirDiarias = true, incluirEscolas = true } = options;
  if (!incluirDiarias && !incluirEscolas) return;

  const now = new Date();
  const mesAno = now
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SEDUC/TO – Censo Escolar';
  wb.created  = now;

  if (incluirDiarias) {
  const ws = wb.addWorksheet('Diárias', {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // Columns A-L
  ws.columns = [
    { width: 11 },  // A REGIONAL
    { width: 28 },  // B NOME
    { width: 13 },  // C MAT.
    { width: 42 },  // D DESTINO
    { width: 11 },  // E SAÍDA
    { width: 11 },  // F RETORNO
    { width: 9  },  // G OS
    { width: 13 },  // H VL DIÁRIA
    { width: 7  },  // I QTD
    { width: 11 },  // J T.DIARIAS
    { width: 16 },  // K DIÁRIA P/PESSOA
    { width: 15 },  // L T./POR OS
  ];

  // ── ROW 1 (height 28): institution | title | INEP ──────────────────────────
  ws.getRow(1).height = 28;
  ws.mergeCells('A1:B1');
  ws.mergeCells('C1:J1');
  ws.mergeCells('K1:L1');

  const r1inst = ws.getCell('A1');
  r1inst.value = 'SECRETARIA DA EDUCAÇÃO';
  fnt(r1inst, { bold: true, size: 9, color: C.NAVY }); al(r1inst, 'center', 'middle', true);
  f(r1inst, C.WHITE); b(r1inst, 'medium');

  const r1title = ws.getCell('C1');
  r1title.value = `PLANILHA DE DIARIAS PARA MONITORAMENTO ${mesAno}`;
  fnt(r1title, { bold: true, size: 14, color: C.WHITE }); al(r1title, 'center', 'middle');
  f(r1title, C.NAVY); b(r1title, 'medium');

  const r1inep = ws.getCell('K1');
  r1inep.value = 'CONVENIO INEP';
  fnt(r1inep, { bold: true, size: 12, color: C.WHITE }); al(r1inep, 'center', 'middle');
  f(r1inep, C.NAVY); b(r1inep, 'medium');

  // ── ROW 2 (height 20): sub-institution row ──────────────────────────────────
  ws.getRow(2).height = 20;
  ws.mergeCells('A2:B2');
  ws.mergeCells('C2:J2');
  ws.mergeCells('K2:L2');

  const r2inst = ws.getCell('A2');
  r2inst.value = 'TOCANTINS – GOVERNO DO ESTADO';
  fnt(r2inst, { bold: true, size: 8, color: C.NAVY }); al(r2inst, 'center', 'middle', true);
  f(r2inst, C.WHITE); b(r2inst, 'medium');

  const r2title = ws.getCell('C2');
  r2title.value = '';
  f(r2title, C.NAVY); b(r2title, 'medium');

  const r2inep = ws.getCell('K2');
  r2inep.value = '';
  f(r2inep, C.NAVY); b(r2inep, 'medium');

  // ── ROW 3 (height 6): spacer ────────────────────────────────────────────────
  ws.getRow(3).height = 6;

  // ── ROW 4 (height 44): objective text + R$ value ────────────────────────────
  ws.getRow(4).height = 44;
  ws.mergeCells('A4:I4');

  const valorPadrao = data.length > 0 ? Number(data[0].valor_diaria) : 335;

  const r4obj = ws.getCell('A4');
  r4obj.value =
    'Realizar Monitoramento in loco da Matricula Inicial do censo Escolar 2026 nas Escolas ' +
    'Publicas e Privadas da Educação Basica com foco na orientação e na Melhoria continua da ' +
    'Coleta de Dados Garantindo Sua Fidedignidade.';
  fnt(r4obj, { italic: true, size: 10, color: 'FF17375E' });
  al(r4obj, 'left', 'middle', true);
  f(r4obj, 'FFDCE6F1'); b(r4obj, 'thin');

  const r4j = ws.getCell('J4');
  r4j.value = ''; f(r4j, C.YELLOW_BG); b(r4j, 'medium');

  const r4k = ws.getCell('K4');
  r4k.value = 'R$';
  fnt(r4k, { bold: true, size: 16, color: C.RED }); al(r4k, 'right', 'middle');
  f(r4k, C.YELLOW_BG); b(r4k, 'medium');

  const r4l = ws.getCell('L4');
  r4l.value = valorPadrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  fnt(r4l, { bold: true, size: 22, color: C.RED }); al(r4l, 'center', 'middle');
  f(r4l, C.YELLOW_BG); b(r4l, 'medium');

  // ── ROW 5 (height 6): spacer ────────────────────────────────────────────────
  ws.getRow(5).height = 6;

  // ── ROW 6 (height 18): section group headers ─────────────────────────────────
  ws.getRow(6).height = 18;
  ws.mergeCells('A6:D6');
  ws.mergeCells('E6:G6');
  ws.mergeCells('H6:L6');

  const secHdr = (addr: string, label: string, bg: string) => {
    const c = ws.getCell(addr);
    c.value = label;
    fnt(c, { bold: true, size: 10, color: C.WHITE });
    al(c, 'center', 'middle');
    f(c, bg); b(c, 'medium');
  };
  secHdr('A6', 'DADOS CADASTRAIS', C.DADOS_BG);
  secHdr('E6', 'DATA', C.DATA_BG);
  secHdr('H6', 'DIÁRIAS', C.DIARIAS_BG);

  // ── ROW 7 (height 28): column headers ────────────────────────────────────────
  ws.getRow(7).height = 28;
  const hdrs = [
    'REGIONAL', 'NOME', 'MAT.', 'DESTINO',
    'SAÍDA', 'RETORNO', 'OS',
    'VL DIÁRIA', 'QTD', 'T.DIARIAS', 'DIÁRIA\nP/PESSOA', 'T./POR OS',
  ];
  hdrs.forEach((h, i) => {
    const c = ws.getRow(7).getCell(i + 1);
    c.value = h;
    fnt(c, { bold: true, size: 9, color: C.WHITE });
    al(c, 'center', 'middle', true);
    f(c, C.COL_HDR_BG); b(c, 'medium');
  });

  // ── DATA ROWS ────────────────────────────────────────────────────────────────
  // Group by OS
  const groups = new Map<string, DiarioEntry[]>();
  data.forEach((e) => {
    const key = e.ordem_servico?.trim() || '(Sem OS)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });

  let row = 8;
  let gi  = 0;

  groups.forEach((entries, osKey) => {
    const start = row;
    const end   = row + entries.length - 1;

    const totalQtd  = entries.reduce((s, e) => s + Number(e.quantidade_diarias), 0);
    const totalVal  = entries.reduce((s, e) => s + Number(e.valor_diaria) * Number(e.quantidade_diarias), 0);
    const rowBg     = gi % 2 === 0 ? C.ROW_A : C.ROW_B;

    entries.forEach((entry, idx) => {
      const rn = row + idx;
      ws.getRow(rn).height = 18;

      const vlD = Number(entry.valor_diaria);
      const qtd = Number(entry.quantidade_diarias);
      const dpp = vlD * qtd;

      // A – REGIONAL
      const cA = ws.getRow(rn).getCell(1);
      if (idx === 0) { cA.value = entry.tecnicos.regional; }
      fnt(cA, { bold: true, size: 9, color: 'FF17375E' }); al(cA, 'center', 'middle', true);
      f(cA, C.REGIONAL_BG); b(cA);

      // B – NOME
      const cB = ws.getRow(rn).getCell(2);
      cB.value = entry.tecnicos.nome;
      fnt(cB, { size: 9 }); al(cB, 'left', 'middle');
      f(cB, rowBg); b(cB);

      // C – MAT.
      const cC = ws.getRow(rn).getCell(3);
      cC.value = entry.tecnicos.matricula;
      fnt(cC, { size: 9 }); al(cC, 'center', 'middle');
      f(cC, rowBg); b(cC);

      // D – DESTINO
      const cD = ws.getRow(rn).getCell(4);
      cD.value = entry.destino;
      fnt(cD, { size: 9 }); al(cD, 'left', 'middle', true);
      f(cD, rowBg); b(cD);

      // E – SAÍDA
      const cE = ws.getRow(rn).getCell(5);
      cE.value = fmtDate(entry.data_saida);
      fnt(cE, { size: 9 }); al(cE, 'center', 'middle');
      f(cE, rowBg); b(cE);

      // F – RETORNO
      const cF = ws.getRow(rn).getCell(6);
      cF.value = fmtDate(entry.data_retorno);
      fnt(cF, { size: 9 }); al(cF, 'center', 'middle');
      f(cF, rowBg); b(cF);

      // G – OS (merged per group)
      const cG = ws.getRow(rn).getCell(7);
      if (idx === 0) { cG.value = osKey !== '(Sem OS)' ? osKey : '—'; }
      fnt(cG, { bold: true, size: 9, color: C.WHITE }); al(cG, 'center', 'middle', true);
      f(cG, C.DADOS_BG); b(cG);

      // H – VL DIÁRIA
      const cH = ws.getRow(rn).getCell(8);
      cH.value = fmtCur(vlD);
      fnt(cH, { size: 9 }); al(cH, 'right', 'middle');
      f(cH, rowBg); b(cH);

      // I – QTD
      const cI = ws.getRow(rn).getCell(9);
      cI.value = qtd;
      fnt(cI, { bold: true, size: 9, color: 'FF375623' }); al(cI, 'center', 'middle');
      f(cI, rowBg); b(cI);

      // J – T.DIARIAS (merged per OS)
      const cJ = ws.getRow(rn).getCell(10);
      if (idx === 0) {
        cJ.value = totalQtd;
        fnt(cJ, { bold: true, size: 11, color: 'FF375623' }); al(cJ, 'center', 'middle');
      }
      f(cJ, C.OS_BG); b(cJ);

      // K – DIÁRIA P/PESSOA
      const cK = ws.getRow(rn).getCell(11);
      cK.value = fmtCur(dpp);
      fnt(cK, { size: 9 }); al(cK, 'right', 'middle');
      f(cK, C.DIARIA_BG); b(cK);

      // L – T./POR OS (merged per OS)
      const cL = ws.getRow(rn).getCell(12);
      if (idx === 0) {
        cL.value = fmtCur(totalVal);
        fnt(cL, { bold: true, size: 10, color: C.NAVY }); al(cL, 'right', 'middle');
      }
      f(cL, C.TOTAL_BG); b(cL);
    });

    // Merge per-OS cells if multiple rows
    if (entries.length > 1) {
      ws.mergeCells(`A${start}:A${end}`);
      ws.mergeCells(`G${start}:G${end}`);
      ws.mergeCells(`J${start}:J${end}`);
      ws.mergeCells(`L${start}:L${end}`);
    }

    row = end + 1;
    gi++;
  });

  // ── GRAND TOTAL ROW ──────────────────────────────────────────────────────────
  ws.getRow(row).height = 22;
  ws.mergeCells(`A${row}:I${row}`);

  const grandQtd = data.reduce((s, e) => s + Number(e.quantidade_diarias), 0);
  const grandVal = data.reduce((s, e) => s + Number(e.valor_diaria) * Number(e.quantidade_diarias), 0);

  const tLabel = ws.getRow(row).getCell(1);
  tLabel.value = `TOTAL GERAL — ${data.length} técnico(s)`;
  fnt(tLabel, { bold: true, size: 10, color: C.WHITE }); al(tLabel, 'right', 'middle');
  f(tLabel, C.NAVY); b(tLabel, 'medium');

  const tQtd = ws.getRow(row).getCell(10);
  tQtd.value = grandQtd;
  fnt(tQtd, { bold: true, size: 12, color: C.NAVY }); al(tQtd, 'center', 'middle');
  f(tQtd, C.GRAND_BG); b(tQtd, 'medium');

  const tEmpty = ws.getRow(row).getCell(11);
  tEmpty.value = ''; f(tEmpty, C.GRAND_BG); b(tEmpty, 'medium');

  const tVal = ws.getRow(row).getCell(12);
  tVal.value = fmtCur(grandVal);
  fnt(tVal, { bold: true, size: 11, color: C.NAVY }); al(tVal, 'right', 'middle');
  f(tVal, C.GRAND_BG); b(tVal, 'medium');
  } // incluirDiarias

  // ── SHEET 2: Escolas Monitoradas ─────────────────────────────────────────────
  if (incluirEscolas) {
  const wsEsc = wb.addWorksheet('Escolas Monitoradas', {
    views: [{ showGridLines: false }],
  });

  wsEsc.columns = [
    { width: 11 },  // A REGIONAL
    { width: 26 },  // B TÉCNICO
    { width: 13 },  // C MAT.
    { width: 30 },  // D DESTINO
    { width: 9  },  // E OS
    { width: 13 },  // F CÓD. INEP
    { width: 42 },  // G ESCOLA
    { width: 20 },  // H MUNICÍPIO
    { width: 12 },  // I SRE
    { width: 12 },  // J LOCALIZAÇÃO
    { width: 14 },  // K DEPENDÊNCIA
    { width: 40 },  // L ETAPAS MONITORADAS
  ];

  wsEsc.getRow(1).height = 24;
  const escHdrs = [
    'REGIONAL', 'TÉCNICO', 'MAT.', 'DESTINO', 'OS',
    'CÓD. INEP', 'ESCOLA', 'MUNICÍPIO', 'SRE', 'LOCALIZAÇÃO', 'DEPENDÊNCIA', 'ETAPAS MONITORADAS',
  ];
  escHdrs.forEach((h, i) => {
    const c = wsEsc.getRow(1).getCell(i + 1);
    c.value = h;
    fnt(c, { bold: true, size: 9, color: C.WHITE });
    al(c, 'center', 'middle', true);
    f(c, C.COL_HDR_BG); b(c, 'medium');
  });

  let escRow = 2;
  data.forEach((entry) => {
    (entry.escolas || []).forEach((esc) => {
      const rn = escRow;
      wsEsc.getRow(rn).height = 16;
      const rowBg = escRow % 2 === 0 ? C.ROW_A : C.ROW_B;

      const values = [
        entry.tecnicos.regional,
        entry.tecnicos.nome,
        entry.tecnicos.matricula,
        entry.destino,
        entry.ordem_servico || '—',
        esc.codigo_escola,
        esc.escola,
        esc.municipio,
        esc.sre,
        esc.localizacao,
        esc.dependencia,
        (esc.etapas && esc.etapas.length > 0) ? esc.etapas.join(', ') : '—',
      ];

      values.forEach((val, i) => {
        const c = wsEsc.getRow(rn).getCell(i + 1);
        c.value = val;
        fnt(c, { size: 9 });
        al(c, (i === 6 || i === 11) ? 'left' : 'center', 'middle', i === 6 || i === 11);
        f(c, rowBg); b(c);
      });

      escRow++;
    });
  });

  if (escRow === 2) {
    const c = wsEsc.getCell('A2');
    c.value = 'Nenhuma escola monitorada foi vinculada às diárias exportadas.';
    fnt(c, { italic: true, size: 9, color: 'FF888888' });
    al(c, 'left', 'middle');
    wsEsc.mergeCells('A2:L2');
  }
  } // incluirEscolas

  // ── Download ──────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url    = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href     = url;
  anchor.download = `Planilha_Diarias_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
