import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { Pool } from "pg";
import { buildPoolConfig } from "../src/lib/db";
import { embedText, toPgVectorLiteral } from "../src/lib/agent/rag";

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

interface RawChunk {
  sourceFile: string;
  sectionTitle: string;
  chunkIndex: number;
  content: string;
}

function splitMarkdownBySections(
  sourceFile: string,
  markdown: string,
  maxChars = 1500,
  overlapChars = 220
): RawChunk[] {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ title: string; body: string }> = [];
  let currentTitle = path.basename(sourceFile);
  let buffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      if (buffer.join("\n").trim().length > 0) {
        sections.push({ title: currentTitle, body: buffer.join("\n").trim() });
      }
      currentTitle = headingMatch[1].trim();
      buffer = [line];
    } else {
      buffer.push(line);
    }
  }
  if (buffer.join("\n").trim().length > 0) {
    sections.push({ title: currentTitle, body: buffer.join("\n").trim() });
  }

  const chunks: RawChunk[] = [];
  let chunkIndex = 0;

  for (const sec of sections) {
    if (sec.body.length <= maxChars) {
      chunks.push({
        sourceFile,
        sectionTitle: sec.title,
        chunkIndex: chunkIndex++,
        content: sec.body,
      });
      continue;
    }

    let cursor = 0;
    while (cursor < sec.body.length) {
      let end = Math.min(cursor + maxChars, sec.body.length);
      if (end < sec.body.length) {
        const lastNewline = sec.body.lastIndexOf("\n", end);
        if (lastNewline > cursor + maxChars * 0.5) {
          end = lastNewline;
        }
      }
      const slice = sec.body.slice(cursor, end).trim();
      if (slice.length > 0) {
        chunks.push({
          sourceFile,
          sectionTitle: sec.title,
          chunkIndex: chunkIndex++,
          content: `[Seção: ${sec.title}]\n${slice}`,
        });
      }
      if (end >= sec.body.length) break;
      cursor = Math.max(end - overlapChars, cursor + 1);
    }
  }

  return chunks;
}

function extractDocxText(docxPath: string): string {
  const zip = new AdmZip(docxPath);
  const xmlEntry = zip.getEntry("word/document.xml");
  if (!xmlEntry) return "";
  const xml = xmlEntry.getData().toString("utf8");
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<w:tc[^>]*>/g, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  loadLocalEnv();
  if (!process.env.DATABASE_URL || !process.env.GEMINI_API_KEY) {
    console.error("ERRO: configure DATABASE_URL e GEMINI_API_KEY em .env.local.");
    process.exit(1);
  }

  const root = process.cwd();
  const allChunks: RawChunk[] = [];

  // 1. DICIONARIO.md
  const dictPath = path.join(root, "DICIONARIO.md");
  if (fs.existsSync(dictPath)) {
    allChunks.push(
      ...splitMarkdownBySections("DICIONARIO.md", fs.readFileSync(dictPath, "utf8"))
    );
  }

  // 2. docs/*.md
  const docsDir = path.join(root, "docs");
  if (fs.existsSync(docsDir)) {
    const files = fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(docsDir, file), "utf8");
      allChunks.push(...splitMarkdownBySections(`docs/${file}`, content));
    }
  }

  // 3. Dossiê .docx
  const docxPath = path.join(root, "G4 - Dossiê do grupo - Lume Educação.docx");
  if (fs.existsSync(docxPath)) {
    const dossieText = extractDocxText(docxPath);
    if (dossieText) {
      allChunks.push(
        ...splitMarkdownBySections("G4 - Dossiê do grupo - Lume Educação.docx", dossieText)
      );
    }
  }

  console.log(`Total de chunks preparados: ${allChunks.length}`);

  const pool = new Pool(buildPoolConfig(process.env.DATABASE_URL));

  try {
    await pool.query("TRUNCATE TABLE lume_agent.knowledge_chunks RESTART IDENTITY");

    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const vec = await embedText(
        chunk.content,
        "RETRIEVAL_DOCUMENT",
        `${chunk.sourceFile} — ${chunk.sectionTitle}`
      );
      const vecLiteral = toPgVectorLiteral(vec);

      await pool.query(
        `INSERT INTO lume_agent.knowledge_chunks
          (source_file, section_title, chunk_index, content, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
         ON CONFLICT (source_file, chunk_index) DO UPDATE SET
           section_title = EXCLUDED.section_title,
           content = EXCLUDED.content,
           metadata = EXCLUDED.metadata,
           embedding = EXCLUDED.embedding`,
        [
          chunk.sourceFile,
          chunk.sectionTitle,
          chunk.chunkIndex,
          chunk.content,
          JSON.stringify({ chars: chunk.content.length }),
          vecLiteral,
        ]
      );

      if ((i + 1) % 10 === 0 || i + 1 === allChunks.length) {
        console.log(`Indexados ${i + 1}/${allChunks.length} chunks...`);
      }
    }

    console.log("Ingestão RAG concluída com sucesso.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
