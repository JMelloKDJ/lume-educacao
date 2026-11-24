import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

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

async function main() {
  loadLocalEnv();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERRO: GEMINI_API_KEY não encontrada em .env.local ou no ambiente.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log("=== Teste de Modelos Gemini (Lume Educação LE-15) ===\n");

  for (const model of ["gemini-3.5-flash-lite", "gemini-3.8-flash"]) {
    const start = Date.now();
    try {
      const res = await ai.models.generateContent({
        model,
        contents: 'Responda apenas com JSON válido: {"ok": true, "modelo": "' + model + '"}',
        config: { temperature: 0 },
      });
      const ms = Date.now() - start;
      console.log(`[OK] ${model}`);
      console.log(`  modelVersion retornado: ${res.modelVersion ?? "n/d"}`);
      console.log(`  latência: ${ms} ms`);
      console.log(`  tokens (in/out): ${res.usageMetadata?.promptTokenCount ?? 0} / ${res.usageMetadata?.candidatesTokenCount ?? 0}`);
      console.log(`  texto: ${(res.text ?? "").trim()}\n`);
    } catch (err) {
      const ms = Date.now() - start;
      console.error(`[FALHA] ${model} (${ms} ms):`, err instanceof Error ? err.message : err);
    }
  }

  const embStart = Date.now();
  try {
    const emb = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: "Lume Educação: plataforma ENEM com 46 tabelas e 8 views M5.",
      config: {
        outputDimensionality: 1536,
        taskType: "RETRIEVAL_DOCUMENT",
        title: "Teste embedding",
      },
    });
    const dims = emb.embeddings?.[0]?.values?.length ?? 0;
    console.log(`[OK] gemini-embedding-2`);
    console.log(`  dimensões: ${dims}`);
    console.log(`  latência: ${Date.now() - embStart} ms\n`);
  } catch (err) {
    console.error(`[FALHA] gemini-embedding-2 (${Date.now() - embStart} ms):`, err instanceof Error ? err.message : err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
