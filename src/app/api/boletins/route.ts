import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getBoletimById,
  SUPABASE_TABLES,
  validateBoletimPayload,
} from '@/lib/boletins-config';

export const dynamic = 'force-dynamic';

function getLumeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas no ambiente.');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'lume_educacao' as unknown as 'public' },
  });
}

// GET — Lista registros de um boletim OU consulta as views reativas (controles + EVM)
export async function GET(req: NextRequest) {
  try {
    const supabase = getLumeSupabase();
    const { searchParams } = new URL(req.url);
    const boletimId = searchParams.get('boletimId');
    const mode = searchParams.get('mode');

    if (mode === 'resumo') {
      const [controlesRes, evmRes] = await Promise.all([
        supabase.from('vw_numeros_controle').select('*').order('ordem', { ascending: true }),
        supabase.from('vw_evm_resumo').select('*'),
      ]);

      return NextResponse.json({
        controles: controlesRes.data ?? [],
        evm: evmRes.data ?? [],
        errors: {
          controles: controlesRes.error?.message ?? null,
          evm: evmRes.error?.message ?? null,
        },
      });
    }

    if (!boletimId) {
      return NextResponse.json({ error: 'Informe boletimId na query.' }, { status: 400 });
    }

    const boletim = getBoletimById(boletimId);
    if (!boletim) {
      return NextResponse.json({ error: `Boletim desconhecido: ${boletimId}` }, { status: 404 });
    }

    const tableName = SUPABASE_TABLES[boletim.tableKey];
    let query = supabase.from(tableName).select('*').limit(30);
    if (boletim.orderBy) {
      query = query.order(boletim.orderBy, { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno ao consultar Supabase.' },
      { status: 500 }
    );
  }
}

// POST — Cria registro CRUD (B1-B10) OU executa Boletim Surpresa ao vivo
export async function POST(req: NextRequest) {
  try {
    const supabase = getLumeSupabase();
    const body = await req.json();

    if (body.mode === 'boletim_surpresa') {
      const log: string[] = [];

      if (body.atraso?.enabled) {
        const bRisco = getBoletimById('b8_riscos')!;
        const v = validateBoletimPayload(bRisco, body.atraso.data);
        if (!v.valid) return NextResponse.json({ error: v.errors.join(' ') }, { status: 400 });
        const { error } = await supabase
          .from(SUPABASE_TABLES.riscos_ocorrencias)
          .insert(v.clean);
        if (error) return NextResponse.json({ error: `Atraso: ${error.message}` }, { status: 500 });
        log.push(`Atraso ${v.clean.id_ocorrencia} gravado (+${v.clean.impacto_prazo_real_du} du).`);
      }

      if (body.mudanca?.enabled) {
        const bMud = getBoletimById('b8_mudancas')!;
        const v = validateBoletimPayload(bMud, body.mudanca.data);
        if (!v.valid) return NextResponse.json({ error: v.errors.join(' ') }, { status: 400 });
        const { error } = await supabase
          .from(SUPABASE_TABLES.mudancas_solicitacoes)
          .insert(v.clean);
        if (error) return NextResponse.json({ error: `Mudança: ${error.message}` }, { status: 500 });
        log.push(`Mudança ${v.clean.id_mudanca} (${v.clean.status}) gravada.`);
      }

      if (body.cartao?.enabled) {
        const bTr = getBoletimById('b6_transicoes')!;
        const v = validateBoletimPayload(bTr, body.cartao.data);
        if (!v.valid) return NextResponse.json({ error: v.errors.join(' ') }, { status: 400 });
        const { error } = await supabase
          .from(SUPABASE_TABLES.itens_transicoes)
          .insert(v.clean);
        if (error) return NextResponse.json({ error: `Cartão: ${error.message}` }, { status: 500 });

        await supabase
          .from(SUPABASE_TABLES.backlog_itens)
          .update({
            status: v.clean.status_destino,
            ...(v.clean.status_destino === 'CONCLUIDO' ? { data_conclusao: v.clean.data } : {}),
          })
          .eq('id_item', v.clean.id_item);

        log.push(`Cartão ${v.clean.id_item} movido para ${v.clean.status_destino}.`);
      }

      if (log.length === 0) {
        return NextResponse.json(
          { error: 'Marque ao menos um bloco do Boletim Surpresa para lançar.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: 'Boletim Surpresa gravado em lume_educacao! Views SQL recalculadas.',
        detalhes: log,
      });
    }

    const { boletimId, data: payload } = body;
    const boletim = getBoletimById(boletimId);
    if (!boletim) {
      return NextResponse.json({ error: `Boletim inválido: ${boletimId}` }, { status: 400 });
    }

    const { valid, errors, clean } = validateBoletimPayload(boletim, payload ?? {});
    if (!valid) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const tableName = SUPABASE_TABLES[boletim.tableKey];
    const { data, error } = await supabase.from(tableName).insert(clean).select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (boletim.id === 'b6_transicoes') {
      await supabase
        .from(SUPABASE_TABLES.backlog_itens)
        .update({
          status: clean.status_destino,
          ...(clean.status_destino === 'CONCLUIDO' ? { data_conclusao: clean.data } : {}),
        })
        .eq('id_item', clean.id_item);
    }

    return NextResponse.json({
      ok: true,
      message: `${boletim.codigo} gravado em lume_educacao.${tableName}! Views SQL atualizadas.`,
      record: data?.[0] ?? clean,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao gravar boletim.' },
      { status: 500 }
    );
  }
}

// PATCH — Atualiza registro existente
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getLumeSupabase();
    const { boletimId, keys, data: payload } = await req.json();
    const boletim = getBoletimById(boletimId);
    if (!boletim) {
      return NextResponse.json({ error: 'Boletim inválido.' }, { status: 400 });
    }

    const { valid, errors, clean } = validateBoletimPayload(boletim, payload ?? {});
    if (!valid) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const tableName = SUPABASE_TABLES[boletim.tableKey];
    let query = supabase.from(tableName).update(clean);
    for (const pk of boletim.pkColumns) {
      if (keys?.[pk] === undefined) {
        return NextResponse.json({ error: `Chave primária ausente: ${pk}` }, { status: 400 });
      }
      query = query.eq(pk, keys[pk]);
    }

    const { data, error } = await query.select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Registro de ${boletim.codigo} atualizado! Views SQL recalculadas.`,
      record: data?.[0] ?? clean,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar.' },
      { status: 500 }
    );
  }
}

// DELETE — Remove registro
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getLumeSupabase();
    const { boletimId, keys } = await req.json();
    const boletim = getBoletimById(boletimId);
    if (!boletim) {
      return NextResponse.json({ error: 'Boletim inválido.' }, { status: 400 });
    }

    const tableName = SUPABASE_TABLES[boletim.tableKey];
    let query = supabase.from(tableName).delete();
    for (const pk of boletim.pkColumns) {
      if (keys?.[pk] === undefined) {
        return NextResponse.json({ error: `Chave primária ausente: ${pk}` }, { status: 400 });
      }
      query = query.eq(pk, keys[pk]);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Registro excluído de ${boletim.codigo}. Views SQL recalculadas.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao excluir.' },
      { status: 500 }
    );
  }
}
