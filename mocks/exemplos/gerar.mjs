// Regenera os documentos fictícios de teste. `node mocks/exemplos/gerar.mjs`
//
// Nada aqui desenha dado real: são faixas de cor da paleta do design system e
// um PDF de uma página em branco. Ver README.md nesta pasta.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

const crc32 = (buf) => {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

const chunk = (tipo, dados) => {
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
};

function png(nome, largura, altura, faixas) {
  const linhas = [];
  for (let y = 0; y < altura; y++) {
    const cor = faixas.find(([limite]) => y < limite)[1];
    linhas.push(
      Buffer.concat([
        Buffer.from([0]),
        Buffer.from(Array.from({ length: largura }, () => cor).flat()),
      ]),
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  writeFileSync(
    join(AQUI, nome),
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(Buffer.concat(linhas))),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

const CREME = [253, 251, 245];
const AMARELO = [242, 176, 30];
const VERMELHO = [228, 69, 31];
const OLIVA = [79, 107, 46];
const TINTA = [19, 17, 16];

png("rg-frente-fake.png", 320, 200, [
  [40, TINTA],
  [150, CREME],
  [200, AMARELO],
]);
png("rg-verso-fake.png", 320, 200, [
  [40, TINTA],
  [150, CREME],
  [200, OLIVA],
]);
png("rg-desbotado-fake.png", 320, 200, [
  [30, CREME],
  [200, CREME],
]);
png("rg-rasurado-fake.png", 320, 200, [
  [60, VERMELHO],
  [140, CREME],
  [200, VERMELHO],
]);

writeFileSync(
  join(AQUI, "procuracao-fake.pdf"),
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n" +
    "trailer<</Root 1 0 R>>\n%%EOF\n",
);

console.log("5 documentos ficticios regenerados em mocks/exemplos/");
