import { createHash } from "node:crypto";
import { query } from "../db";
import { AGENT_MANIFEST } from "./manifest";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function buildCacheKey(
  toolName: string,
  args: unknown,
  dataFingerprint: string
): string {
  const raw = `${AGENT_MANIFEST.version}:${toolName}:${stableStringify(args)}:${dataFingerprint}`;
  return createHash("sha256").update(raw).digest("hex");
}

export async function getToolCache<T = unknown>(
  toolName: string,
  args: unknown,
  dataFingerprint: string
): Promise<{ hit: true; payload: T } | { hit: false }> {
  const cacheKey = buildCacheKey(toolName, args, dataFingerprint);
  const rows = await query<{ payload: T }>(
    `SELECT payload
     FROM lume_agent.tool_cache
     WHERE cache_key = $1
       AND data_fingerprint = $2
       AND expires_at > now()
     LIMIT 1`,
    [cacheKey, dataFingerprint]
  );

  if (rows.length > 0) {
    return { hit: true, payload: rows[0].payload };
  }
  return { hit: false };
}

export async function setToolCache(
  toolName: string,
  args: unknown,
  dataFingerprint: string,
  payload: unknown,
  ttlSeconds: number = AGENT_MANIFEST.cacheTtlSeconds
): Promise<void> {
  const cacheKey = buildCacheKey(toolName, args, dataFingerprint);
  await query(
    `INSERT INTO lume_agent.tool_cache (cache_key, tool_name, data_fingerprint, payload, expires_at)
     VALUES ($1, $2, $3, $4::jsonb, now() + ($5 || ' seconds')::interval)
     ON CONFLICT (cache_key) DO UPDATE SET
       data_fingerprint = EXCLUDED.data_fingerprint,
       payload = EXCLUDED.payload,
       expires_at = EXCLUDED.expires_at,
       created_at = now()`,
    [cacheKey, toolName, dataFingerprint, JSON.stringify(payload), String(ttlSeconds)]
  );
}
