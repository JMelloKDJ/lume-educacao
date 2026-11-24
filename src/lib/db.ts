import { Pool, type PoolConfig, type QueryResultRow } from "pg";

declare global {
  var __lumePgPool: Pool | undefined;
}

export function buildPoolConfig(connectionString: string): PoolConfig {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  const base: PoolConfig = {
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 8_000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  };

  try {
    new URL(connectionString);
    return { connectionString, ...base };
  } catch {
    const schemeMatch = connectionString.match(/^([a-zA-Z0-9+.-]+):\/\/(.*)$/);
    if (!schemeMatch) {
      return { connectionString, ...base };
    }
    const [, scheme, rest] = schemeMatch;
    const lastAt = rest.lastIndexOf("@");
    if (lastAt === -1) {
      return { connectionString, ...base };
    }
    const userInfo = rest.slice(0, lastAt);
    const hostPart = rest.slice(lastAt + 1);
    const firstColon = userInfo.indexOf(":");
    const user = firstColon >= 0 ? userInfo.slice(0, firstColon) : userInfo;
    const password = firstColon >= 0 ? userInfo.slice(firstColon + 1) : "";

    const parsed = new URL(`${scheme}://placeholder:placeholder@${hostPart}`);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      user,
      password,
      ...base,
    };
  }
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada no ambiente.");
  }

  return new Pool(buildPoolConfig(connectionString));
}

export function getPool(): Pool {
  if (!global.__lumePgPool) {
    global.__lumePgPool = createPool();
  }
  return global.__lumePgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryReadOnly<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL statement_timeout = '5s'");
    const result = await client.query<T>(text, params);
    await client.query("COMMIT");
    return result.rows;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function getDataFingerprint(): Promise<{
  fingerprint: string;
  dataStatus: string;
  controlesOk: number;
  controlesTotal: number;
}> {
  const [paramRow] = await queryReadOnly<{ valor: string }>(
    `SELECT valor FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status' LIMIT 1`
  );
  const controles = await queryReadOnly<{
    codigo: string;
    atual_dinamico: string;
    status_13_11: string;
  }>(
    `SELECT codigo, atual_dinamico::text, status_13_11
     FROM lume_educacao.vw_numeros_controle
     ORDER BY ordem`
  );

  const dataStatus = paramRow?.valor ?? "2026-11-13";
  const controlesOk = controles.filter((c) => c.status_13_11 === "OK").length;
  const sig = controles.map((c) => `${c.codigo}:${c.atual_dinamico}`).join("|");

  return {
    fingerprint: `${dataStatus}#${sig}`,
    dataStatus,
    controlesOk,
    controlesTotal: controles.length,
  };
}
