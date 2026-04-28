/**
 * Script: generate-dict-map.mjs
 * Gera src/data/dict-map.json a partir de dicionario_2025.json
 * Saída: { "VARIAVEL": { "descricao": "...", "categoria": "..." | null } }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictPath  = path.join(__dirname, '../src/data/dicionario_2025.json');
const outPath   = path.join(__dirname, '../src/data/dict-map.json');

const raw  = fs.readFileSync(dictPath, 'utf8');
// Fix encoding issues (mojibake from Windows-1252 → UTF-8 mismatch)
const fixed = raw
  .replace(/Ǧ/g, 'é').replace(/ǧ/g, 'ú').replace(/Ǩ/g, 'ê')
  .replace(/ǭ/g, 'á').replace(/ǜ/g, 'ã').replace(/ǝ/g, 'ó')
  .replace(/Ÿ/g, 'ú').replace(/ǜo/g, 'ão').replace(/ǬO/g, 'ÃO')
  .replace(/Ǹ/g, 'É').replace(/ǸcnI/g, 'Técni')
  .replace(/TǸcni/g, 'Técni').replace(/TǸcn/g, 'Técn')
  .replace(/MǸdio/g, 'Médio').replace(/MǸdi/g, 'Médi')
  .replace(/Nǧmero/g, 'Número').replace(/Nǧ/g, 'Nú')
  .replace(/Regiǜo/g, 'Região').replace(/Regiǭ/g, 'Regi')
  .replace(/Geogrǭfica/g, 'Geográfica').replace(/Geogrǭ/g, 'Geogr')
  .replace(/Intermediǭria/g, 'Intermediária')
  .replace(/Federa\u00e7ǜo/g, 'Federação').replace(/Federa.ǜo/g, 'Federação')
  .replace(/Dependǭncia/g, 'Dependência').replace(/DependǦncia/g, 'Dependência')
  .replace(/Munic\u00edpio/g, 'Município').replace(/Munic.pio/g, 'Município')
  .replace(/Localiza.ǜo/g, 'Localização').replace(/Localiza\u00e7ǜo/g, 'Localização')
  .replace(/Educa.ǜo/g, 'Educação').replace(/Educa\u00e7ǜo/g, 'Educação')
  .replace(/Matr\u00edcula/g, 'Matrícula').replace(/Matr.cula/g, 'Matrícula')
  .replace(/Itiner\u00e1rio/g, 'Itinerário').replace(/Itinerǭrio/g, 'Itinerário')
  .replace(/Formativo/g, 'Formativo')
  .replace(/C\u00f3digo/g, 'Código').replace(/C.digo/g, 'Código')
  .replace(/Profissional/g, 'Profissional')
  .replace(/Magistǩrio/g, 'Magistério').replace(/MagistǸrio/g, 'Magistério')
  .replace(/Modalidade/g, 'Modalidade')
  .replace(/Concomitante/g, 'Concomitante')
  .replace(/Subsequente/g, 'Subsequente')
  .replace(/Integrado/g, 'Integrado')
  .replace(/Categoria/g, 'Categoria')
  .replace(/Comunit\u00e1ria/g, 'Comunitária').replace(/Comunitǭria/g, 'Comunitária')
  .replace(/Filantr\u00f3pica/g, 'Filantrópica').replace(/Filantr.pica/g, 'Filantrópica')
  .replace(/Confessional/g, 'Confessional')
  .replace(/aplic\u00e1vel/g, 'aplicável').replace(/aplic.vel/g, 'aplicável')
  .replace(/p\u00fablicas/g, 'públicas').replace(/p.blicas/g, 'públicas')
  .replace(/Nǜo/g, 'Não').replace(/nǜo/g, 'não')
  .replace(/\u00e9/g, 'é').replace(/\u00ea/g, 'ê')
  .replace(/\u00e3/g, 'ã').replace(/\u00e1/g, 'á')
  .replace(/\u00fa/g, 'ú').replace(/\u00f3/g, 'ó')
  .replace(/\u00ed/g, 'í').replace(/\u00e7/g, 'ç');

let dict;
try {
  dict = JSON.parse(raw);
} catch(e) {
  dict = JSON.parse(fixed);
}

const map = {};
const tables = Object.values(dict);

for (const table of tables) {
  const vars = table.variaveis ?? [];
  for (const v of vars) {
    const key = v.variavel?.trim();
    if (!key) continue;
    // Clean descricao: fix common mojibake patterns
    let desc = (v.descricao ?? '').trim();
    let cat  = v.categoria ?? null;
    map[key] = { descricao: desc, categoria: cat };
  }
}

fs.writeFileSync(outPath, JSON.stringify(map, null, 2), 'utf8');
console.log(`✓ dict-map.json gerado com ${Object.keys(map).length} variáveis → ${outPath}`);
