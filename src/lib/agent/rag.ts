import { GoogleGenAI } from "@google/genai";
import { queryReadOnly } from "../db";
import { getToolCache, setToolCache } from "./cache";
import { AGENT_MANIFEST } from "./manifest";

let cachedAiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no ambiente.");
  }
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({ apiKey });
  }
  return cachedAiClient;
}

export function normalizeVector(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((acc, v) => acc + v * v, 0));
  if (!norm || !Number.isFinite(norm)) return values;
  return values.map((v) => v / norm);
}

export function toPgVectorLiteral(values: number[]): string {
  return `[${values.map((v) => Number(v.toFixed(7))).join(",")}]`;
}

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" = "RETRIEVAL_QUERY",
  title?: string
): Promise<number[]> {
  const ai = getGenAI();
  const response = await ai.models.embedContent({
    model: AGENT_MANIFEST.models.embedding,
    contents: text,
    config: {
      outputDimensionality: AGENT_MANIFEST.embeddingDimensions,
      taskType,
      ...(title && taskType === "RETRIEVAL_DOCUMENT" ? { title } : {}),
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Embedding vazio retornado por gemini-embedding-2.");
  }
  return normalizeVector(values);
}

export interface KnowledgeChunkHit {
  id: number;
  source_file: string;
  section_title: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

export async function searchKnowledgeBase(
  queryText: string,
  matchCount = 6,
  dataFingerprint = "static"
): Promise<{
  hits: KnowledgeChunkHit[];
  cacheHit: boolean;
  durationMs: number;
}> {
  const start = Date.now();
  const safeLimit = Math.min(Math.max(matchCount, 1), 12);
  const cacheArgs = { queryText: queryText.trim().toLowerCase(), safeLimit };

  const cached = await getToolCache<KnowledgeChunkHit[]>(
    "rag_search",
    cacheArgs,
    dataFingerprint
  );
  if (cached.hit) {
    return {
      hits: cached.payload,
      cacheHit: true,
      durationMs: Date.now() - start,
    };
  }

  const countRows = await queryReadOnly<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM lume_agent.knowledge_chunks`
  );
  if (Number(countRows[0]?.total ?? "0") === 0) {
    return {
      hits: [],
      cacheHit: false,
      durationMs: Date.now() - start,
    };
  }

  const vector = await embedText(queryText, "RETRIEVAL_QUERY");
  const vectorLiteral = toPgVectorLiteral(vector);

  const hits = await queryReadOnly<KnowledgeChunkHit>(
    `SELECT id::integer, source_file, section_title, chunk_index, content, similarity
     FROM lume_agent.match_knowledge_chunks($1::vector, $2)`,
    [vectorLiteral, safeLimit]
  );

  await setToolCache("rag_search", cacheArgs, dataFingerprint, hits);

  return {
    hits,
    cacheHit: false,
    durationMs: Date.now() - start,
  };
}
