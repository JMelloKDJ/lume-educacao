-- Lume Educação (ENGN62 — Grupo 4)
-- Migration 04:
--   1) Destrava constraints CHECK de data (<= 2026-11-13 -> <= 2027-12-31) para suportar Boletim Surpresa ao vivo (25/11/2026)
--   2) Corrige rótulo descritivo da métrica 10_avanco_informes em vw_numeros_controle
--   3) Cria views SQL determinísticas complementares (EVM, Riscos/Reservas/Alçadas, Piloto/OKRs, Equipe/Produtividade, Cenários)

-- ============================================================================
-- PARTE 1: Relaxar constraints CHECK de corte temporal até 2027-12-31
-- ============================================================================
ALTER TABLE lume_educacao.apontamento_horas DROP CONSTRAINT IF EXISTS chk_apontamento_horas_data_status;
ALTER TABLE lume_educacao.apontamento_horas ADD CONSTRAINT chk_apontamento_horas_data_status CHECK (semana_inicio <= DATE '2027-12-31');

ALTER TABLE lume_educacao.avanco_semanal DROP CONSTRAINT IF EXISTS chk_avanco_semanal_data_status;
ALTER TABLE lume_educacao.avanco_semanal ADD CONSTRAINT chk_avanco_semanal_data_status CHECK (semana_fim <= DATE '2027-12-31');

ALTER TABLE lume_educacao.custos_realizados DROP CONSTRAINT IF EXISTS chk_custos_realizados_data_status;
ALTER TABLE lume_educacao.custos_realizados ADD CONSTRAINT chk_custos_realizados_data_status CHECK (data <= DATE '2027-12-31');

ALTER TABLE lume_educacao.defeitos DROP CONSTRAINT IF EXISTS chk_defeitos_data_status;
ALTER TABLE lume_educacao.defeitos ADD CONSTRAINT chk_defeitos_data_status CHECK (data_abertura <= DATE '2027-12-31' AND (data_resolucao IS NULL OR data_resolucao <= DATE '2027-12-31'));

ALTER TABLE lume_educacao.funil_piloto_semanal DROP CONSTRAINT IF EXISTS chk_funil_piloto_data_status;
ALTER TABLE lume_educacao.funil_piloto_semanal ADD CONSTRAINT chk_funil_piloto_data_status CHECK (semana_inicio <= DATE '2027-12-31');

ALTER TABLE lume_educacao.impedimentos DROP CONSTRAINT IF EXISTS chk_impedimentos_data_status;
ALTER TABLE lume_educacao.impedimentos ADD CONSTRAINT chk_impedimentos_data_status CHECK (data_abertura <= DATE '2027-12-31' AND (data_fechamento IS NULL OR data_fechamento <= DATE '2027-12-31'));

ALTER TABLE lume_educacao.implantacoes DROP CONSTRAINT IF EXISTS chk_implantacoes_data_status;
ALTER TABLE lume_educacao.implantacoes ADD CONSTRAINT chk_implantacoes_data_status CHECK (data <= DATE '2027-12-31');

ALTER TABLE lume_educacao.inspecoes_aceite DROP CONSTRAINT IF EXISTS chk_inspecoes_aceite_data_status;
ALTER TABLE lume_educacao.inspecoes_aceite ADD CONSTRAINT chk_inspecoes_aceite_data_status CHECK (data <= DATE '2027-12-31');

ALTER TABLE lume_educacao.itens_transicoes DROP CONSTRAINT IF EXISTS chk_itens_transicoes_data_status;
ALTER TABLE lume_educacao.itens_transicoes ADD CONSTRAINT chk_itens_transicoes_data_status CHECK (data <= DATE '2027-12-31');

ALTER TABLE lume_educacao.producao_semanal DROP CONSTRAINT IF EXISTS chk_producao_semanal_data_status;
ALTER TABLE lume_educacao.producao_semanal ADD CONSTRAINT chk_producao_semanal_data_status CHECK (semana_fim <= DATE '2027-12-31');

ALTER TABLE lume_educacao.reunioes DROP CONSTRAINT IF EXISTS chk_reunioes_data_status;
ALTER TABLE lume_educacao.reunioes ADD CONSTRAINT chk_reunioes_data_status CHECK (data <= DATE '2027-12-31');

ALTER TABLE lume_educacao.riscos_ocorrencias DROP CONSTRAINT IF EXISTS chk_riscos_ocorrencias_data_status;
ALTER TABLE lume_educacao.riscos_ocorrencias ADD CONSTRAINT chk_riscos_ocorrencias_data_status CHECK (data <= DATE '2027-12-31');

-- ============================================================================
-- PARTE 2: Atualizar rótulo da métrica 10 em vw_numeros_controle
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_numeros_controle AS
WITH bruto AS (
  SELECT
    1 AS ordem,
    '01_horas_totais'::text AS codigo,
    '18_apontamento_horas'::text AS tabela_origem,
    'Horas apontadas (normais + extras)'::text AS metrica,
    ROUND(SUM(horas_normais + horas_extras) FILTER (WHERE semana_inicio <= DATE '2026-10-26')::numeric, 1) AS ate_2026_10_30,
    12359.0::numeric AS meta_2026_10_30,
    ROUND(SUM(horas_normais + horas_extras) FILTER (WHERE semana_inicio <= DATE '2026-11-09')::numeric, 1) AS ate_2026_11_13,
    13092.5::numeric AS meta_2026_11_13,
    ROUND(SUM(horas_normais + horas_extras)::numeric, 1) AS atual_dinamico
  FROM lume_educacao.apontamento_horas

  UNION ALL
  SELECT
    2, '02_linhas_horas', '18_apontamento_horas', 'Linhas de apontamento de horas',
    COUNT(*) FILTER (WHERE semana_inicio <= DATE '2026-10-26')::numeric, 425::numeric,
    COUNT(*) FILTER (WHERE semana_inicio <= DATE '2026-11-09')::numeric, 447::numeric,
    COUNT(*)::numeric
  FROM lume_educacao.apontamento_horas

  UNION ALL
  SELECT
    3, '03_custos_total_rs', '19_custos_realizados', 'Custos lançados (R$)',
    ROUND(SUM(valor_rs) FILTER (WHERE data <= DATE '2026-10-30')::numeric, 2), 2271592.42::numeric,
    ROUND(SUM(valor_rs) FILTER (WHERE data <= DATE '2026-11-13')::numeric, 2), 2337973.42::numeric,
    ROUND(SUM(valor_rs)::numeric, 2)
  FROM lume_educacao.custos_realizados

  UNION ALL
  SELECT
    4, '04_custos_preditiva_rs', '19_custos_realizados', 'Custos da frente preditiva (R$)',
    ROUND(SUM(valor_rs) FILTER (WHERE UPPER(TRIM(frente)) = 'PREDITIVA' AND data <= DATE '2026-10-30')::numeric, 2), 1883836.07::numeric,
    ROUND(SUM(valor_rs) FILTER (WHERE UPPER(TRIM(frente)) = 'PREDITIVA' AND data <= DATE '2026-11-13')::numeric, 2), 1891365.77::numeric,
    ROUND(SUM(valor_rs) FILTER (WHERE UPPER(TRIM(frente)) = 'PREDITIVA')::numeric, 2)
  FROM lume_educacao.custos_realizados

  UNION ALL
  SELECT
    5, '05_lancamentos_custo', '19_custos_realizados', 'Lançamentos de custo',
    COUNT(*) FILTER (WHERE data <= DATE '2026-10-30')::numeric, 118::numeric,
    COUNT(*) FILTER (WHERE data <= DATE '2026-11-13')::numeric, 123::numeric,
    COUNT(*)::numeric
  FROM lume_educacao.custos_realizados

  UNION ALL
  SELECT
    6, '06_backlog_itens', '14_backlog_itens', 'Itens no backlog',
    COUNT(*) FILTER (WHERE data_criacao <= DATE '2026-10-30')::numeric, 134::numeric,
    COUNT(*) FILTER (WHERE data_criacao <= DATE '2026-11-13')::numeric, 141::numeric,
    COUNT(*)::numeric
  FROM lume_educacao.backlog_itens

  UNION ALL
  SELECT
    7, '07_backlog_concluidos', '14_backlog_itens', 'Itens concluídos',
    COUNT(*) FILTER (WHERE data_conclusao <= DATE '2026-10-30')::numeric, 95::numeric,
    COUNT(*) FILTER (WHERE data_conclusao <= DATE '2026-11-13')::numeric, 100::numeric,
    COUNT(*) FILTER (WHERE data_conclusao IS NOT NULL)::numeric
  FROM lume_educacao.backlog_itens

  UNION ALL
  SELECT
    8, '08_backlog_pts_concluidos', '14_backlog_itens', 'Pontos concluídos',
    COALESCE(SUM(pontos) FILTER (WHERE data_conclusao <= DATE '2026-10-30'), 0)::numeric, 289::numeric,
    COALESCE(SUM(pontos) FILTER (WHERE data_conclusao <= DATE '2026-11-13'), 0)::numeric, 306::numeric,
    COALESCE(SUM(pontos) FILTER (WHERE data_conclusao IS NOT NULL), 0)::numeric
  FROM lume_educacao.backlog_itens

  UNION ALL
  SELECT
    9, '09_transicoes', '21_itens_transicoes', 'Transições de status',
    COUNT(*) FILTER (WHERE data <= DATE '2026-10-30')::numeric, 424::numeric,
    COUNT(*) FILTER (WHERE data <= DATE '2026-11-13')::numeric, 449::numeric,
    COUNT(*)::numeric
  FROM lume_educacao.itens_transicoes

  UNION ALL
  SELECT
    10, '10_avanco_informes', '17_avanco_semanal', 'Informes de avanço (inclui 5 carry-forwards do DICIONARIO.md)',
    COUNT(*) FILTER (WHERE semana_fim <= DATE '2026-10-30')::numeric, 173::numeric,
    COUNT(*) FILTER (WHERE semana_fim <= DATE '2026-11-13')::numeric, 177::numeric,
    COUNT(*)::numeric
  FROM lume_educacao.avanco_semanal

  UNION ALL
  SELECT
    11, '11_producao_hh', '42_producao_semanal', 'Homens-hora das equipes',
    COALESCE(SUM(hh_trabalhadas) FILTER (WHERE semana_fim <= DATE '2026-10-30'), 0)::numeric, 5338::numeric,
    COALESCE(SUM(hh_trabalhadas) FILTER (WHERE semana_fim <= DATE '2026-11-13'), 0)::numeric, 5513::numeric,
    COALESCE(SUM(hh_trabalhadas), 0)::numeric
  FROM lume_educacao.producao_semanal

  UNION ALL
  SELECT
    12, '12_producao_linhas', '42_producao_semanal', 'Linhas de produção semanal',
    COUNT(*) FILTER (WHERE semana_fim <= DATE '2026-10-30')::numeric, 43::numeric,
    COUNT(*) FILTER (WHERE semana_fim <= DATE '2026-11-13')::numeric, 44::numeric,
    COUNT(*)::numeric
  FROM lume_educacao.producao_semanal

  UNION ALL
  SELECT
    13, '13_folha_mensal_rs', '39_cargos_salarios', 'Custo mensal da folha (R$)',
    ROUND(SUM(remuneracao_mensal_rs * (1.0 + encargos_pct / 100.0) + beneficios_mensais_rs)::numeric, 2), 288603.60::numeric,
    ROUND(SUM(remuneracao_mensal_rs * (1.0 + encargos_pct / 100.0) + beneficios_mensais_rs)::numeric, 2), 288603.60::numeric,
    ROUND(SUM(remuneracao_mensal_rs * (1.0 + encargos_pct / 100.0) + beneficios_mensais_rs)::numeric, 2)
  FROM lume_educacao.cargos_salarios
)
SELECT
  ordem,
  codigo,
  tabela_origem,
  metrica,
  ate_2026_10_30,
  meta_2026_10_30,
  ate_2026_11_13,
  meta_2026_11_13,
  atual_dinamico,
  CASE WHEN ate_2026_10_30 = meta_2026_10_30 THEN 'OK' ELSE 'DIVERGENTE' END AS status_30_10,
  CASE WHEN ate_2026_11_13 = meta_2026_11_13 THEN 'OK' ELSE 'DIVERGENTE' END AS status_13_11
FROM bruto
ORDER BY ordem;

-- ============================================================================
-- PARTE 3: Views determinísticas complementares (EVM, Riscos, Piloto, Equipe, Cenários)
-- ============================================================================

-- 3.1 vw_evm_resumo — EVM dinâmico completo (Preditiva, Ágil, Projeto, Gestão)
CREATE OR REPLACE VIEW lume_educacao.vw_evm_resumo AS
WITH RECURSIVE dc AS (
  SELECT
    GREATEST(
      COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status'), DATE '2026-11-13'),
      COALESCE((SELECT MAX(semana_fim) FROM lume_educacao.avanco_semanal), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.custos_realizados), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data_conclusao) FROM lume_educacao.backlog_itens), DATE '2026-11-13'),
      COALESCE((SELECT MAX((semana_inicio + INTERVAL '4 days')::date) FROM lume_educacao.apontamento_horas), DATE '2026-11-13')
    ) AS data_corte,
    COALESCE((SELECT valor::numeric FROM lume_educacao.projeto_parametros WHERE parametro = 'fator_hora_extra'), 1.5) AS fator_he
),
du_st AS (
  SELECT MAX(c.dia_util_projeto)::bigint AS du_status
  FROM lume_educacao.calendario c, dc
  WHERE c.dia_util = 1 AND c.data <= dc.data_corte
),
dur AS (
  SELECT
    id_atividade,
    CASE
      WHEN UPPER(TRIM(tipo_atividade)) = 'MARCO_AGIL' THEN duracao_fixa_du::bigint
      ELSE CEIL((duracao_otimista_du + 4.0 * duracao_mais_provavel_du + duracao_pessimista_du) / 6.0)::bigint
    END AS dur_du
  FROM lume_educacao.atividades
),
rede(id_atividade, es_du, ef_du, depth) AS (
  SELECT d.id_atividade, 1::bigint, d.dur_du::bigint, 0::integer
  FROM dur d
  WHERE NOT EXISTS (SELECT 1 FROM lume_educacao.dependencias dep WHERE dep.id_sucessora = d.id_atividade)
  UNION ALL
  SELECT
    dep.id_sucessora,
    (CASE WHEN UPPER(TRIM(dep.tipo_dependencia)) = 'TI' THEN r.ef_du + 1 + COALESCE(dep.defasagem_du, 0)
          ELSE r.es_du + COALESCE(dep.defasagem_du, 0) END)::bigint,
    ((CASE WHEN UPPER(TRIM(dep.tipo_dependencia)) = 'TI' THEN r.ef_du + 1 + COALESCE(dep.defasagem_du, 0)
           ELSE r.es_du + COALESCE(dep.defasagem_du, 0) END) + d.dur_du - 1)::bigint,
    (r.depth + 1)::integer
  FROM rede r
  JOIN lume_educacao.dependencias dep ON dep.id_predecessora = r.id_atividade
  JOIN dur d ON d.id_atividade = dep.id_sucessora
  WHERE r.depth < 60
),
es_ef AS (
  SELECT r.id_atividade, MAX(r.es_du) AS es_du, MAX(r.ef_du) AS ef_du, d.dur_du
  FROM rede r
  JOIN dur d ON d.id_atividade = r.id_atividade
  GROUP BY r.id_atividade, d.dur_du
),
pred_ont AS (
  SELECT ROUND(SUM(valor_orcado_rs)::numeric, 2) AS ont_rs
  FROM lume_educacao.orcamento_linha_de_base
),
pred_vp AS (
  SELECT ROUND(SUM(
    o.valor_orcado_rs * LEAST(GREATEST((SELECT du_status FROM du_st) - e.es_du + 1, 0), e.dur_du)::numeric / NULLIF(e.dur_du, 0)
  )::numeric, 2) AS vp_rs
  FROM lume_educacao.orcamento_linha_de_base o
  JOIN es_ef e ON e.id_atividade = o.id_atividade
),
ult_av AS (
  SELECT DISTINCT ON (av.id_atividade)
    av.id_atividade,
    av.avanco_acumulado_pct
  FROM lume_educacao.avanco_semanal av, dc
  WHERE av.semana_fim <= dc.data_corte
  ORDER BY av.id_atividade, av.semana_fim DESC
),
pred_va AS (
  SELECT ROUND(SUM(o.valor_orcado_rs * COALESCE(u.avanco_acumulado_pct, 0) / 100.0)::numeric, 2) AS va_rs
  FROM lume_educacao.orcamento_linha_de_base o
  LEFT JOIN ult_av u ON u.id_atividade = o.id_atividade
),
agil_ont AS (
  SELECT ROUND(SUM(orcamento_sprint_rs)::numeric, 2) AS ont_rs
  FROM lume_educacao.sprints
  WHERE planejada_na_linha_de_base = 1
),
agil_vp AS (
  SELECT ROUND(SUM(
    s.orcamento_sprint_rs * COALESCE((
      SELECT COUNT(*)::numeric
      FROM lume_educacao.calendario c, dc
      WHERE c.dia_util = 1 AND c.data BETWEEN s.data_inicio AND LEAST(s.data_fim, dc.data_corte)
    ) / NULLIF(s.dias_uteis, 0), 0)
  )::numeric, 2) AS vp_rs
  FROM lume_educacao.sprints s
  WHERE s.planejada_na_linha_de_base = 1
),
agil_pts AS (
  SELECT
    COALESCE(SUM(bi.pontos) FILTER (WHERE UPPER(TRIM(bi.origem)) = 'PLANO_INICIAL' AND UPPER(TRIM(bi.prioridade_moscow)) <> 'WONT'), 0)::integer AS pontos_lb_totais,
    COALESCE(SUM(bi.pontos) FILTER (WHERE UPPER(TRIM(bi.origem)) = 'PLANO_INICIAL' AND UPPER(TRIM(bi.prioridade_moscow)) <> 'WONT' AND bi.data_conclusao IS NOT NULL AND bi.data_conclusao <= dc.data_corte), 0)::integer AS pontos_lb_concluidos,
    COALESCE(SUM(bi.pontos) FILTER (WHERE bi.data_conclusao IS NOT NULL AND bi.data_conclusao <= dc.data_corte), 0)::integer AS pontos_totais_concluidos
  FROM lume_educacao.backlog_itens bi, dc
),
cr_horas AS (
  SELECT
    UPPER(TRIM(ah.tipo_item)) AS tipo_item,
    ROUND(SUM((ah.horas_normais + ah.horas_extras * dc.fator_he) * eq.custo_hora_rs)::numeric, 2) AS mo_rs
  FROM lume_educacao.apontamento_horas ah
  JOIN lume_educacao.equipe eq ON eq.id_pessoa = ah.id_pessoa
  CROSS JOIN dc
  WHERE (ah.semana_inicio + INTERVAL '4 days')::date <= dc.data_corte
  GROUP BY UPPER(TRIM(ah.tipo_item))
),
cr_lanc AS (
  SELECT
    UPPER(TRIM(cr.frente)) AS frente,
    ROUND(SUM(cr.valor_rs)::numeric, 2) AS lanc_rs
  FROM lume_educacao.custos_realizados cr, dc
  WHERE cr.data <= dc.data_corte
  GROUP BY UPPER(TRIM(cr.frente))
),
frentes AS (
  SELECT
    'PREDITIVA'::text AS frente,
    (SELECT ont_rs FROM pred_ont) AS ont_rs,
    (SELECT vp_rs FROM pred_vp) AS vp_rs,
    (SELECT va_rs FROM pred_va) AS va_rs,
    COALESCE((SELECT mo_rs FROM cr_horas WHERE tipo_item = 'ATIVIDADE'), 0) + COALESCE((SELECT lanc_rs FROM cr_lanc WHERE frente = 'PREDITIVA'), 0) AS cr_rs
  UNION ALL
  SELECT
    'AGIL'::text,
    (SELECT ont_rs FROM agil_ont),
    (SELECT vp_rs FROM agil_vp),
    ROUND((SELECT ont_rs FROM agil_ont) * ap.pontos_lb_concluidos::numeric / NULLIF(ap.pontos_lb_totais, 0), 2),
    COALESCE((SELECT mo_rs FROM cr_horas WHERE tipo_item = 'SPRINT'), 0) + COALESCE((SELECT lanc_rs FROM cr_lanc WHERE frente = 'AGIL'), 0)
  FROM agil_pts ap
  UNION ALL
  SELECT
    'PROJETO'::text,
    (SELECT ont_rs FROM pred_ont) + (SELECT ont_rs FROM agil_ont),
    (SELECT vp_rs FROM pred_vp) + (SELECT vp_rs FROM agil_vp),
    (SELECT va_rs FROM pred_va) + ROUND((SELECT ont_rs FROM agil_ont) * ap.pontos_lb_concluidos::numeric / NULLIF(ap.pontos_lb_totais, 0), 2),
    COALESCE((SELECT mo_rs FROM cr_horas WHERE tipo_item = 'ATIVIDADE'), 0) + COALESCE((SELECT lanc_rs FROM cr_lanc WHERE frente = 'PREDITIVA'), 0)
    + COALESCE((SELECT mo_rs FROM cr_horas WHERE tipo_item = 'SPRINT'), 0) + COALESCE((SELECT lanc_rs FROM cr_lanc WHERE frente = 'AGIL'), 0)
  FROM agil_pts ap
  UNION ALL
  SELECT
    'GESTAO'::text,
    NULL::numeric,
    NULL::numeric,
    NULL::numeric,
    COALESCE((SELECT mo_rs FROM cr_horas WHERE tipo_item = 'GESTAO'), 0) + COALESCE((SELECT lanc_rs FROM cr_lanc WHERE frente = 'GESTAO'), 0)
)
SELECT
  f.frente,
  dc.data_corte,
  du_st.du_status::integer AS du_status,
  f.ont_rs,
  f.vp_rs,
  f.va_rs,
  ROUND(f.cr_rs, 2) AS cr_rs,
  ROUND(f.va_rs - f.vp_rs, 2) AS vpr_rs,
  ROUND(f.va_rs - f.cr_rs, 2) AS vc_rs,
  ROUND(f.va_rs / NULLIF(f.vp_rs, 0), 4) AS idp,
  ROUND(f.va_rs / NULLIF(f.cr_rs, 0), 4) AS idc,
  ROUND(f.ont_rs / NULLIF(f.va_rs / NULLIF(f.cr_rs, 0), 0), 2) AS ent_tipica_rs,
  ROUND(f.cr_rs + (f.ont_rs - f.va_rs), 2) AS ent_atipica_rs,
  ROUND(f.cr_rs + ((f.ont_rs - f.va_rs) / NULLIF((f.va_rs / NULLIF(f.cr_rs, 0)) * (f.va_rs / NULLIF(f.vp_rs, 0)), 0)), 2) AS ent_composta_rs,
  ROUND((f.ont_rs / NULLIF(f.va_rs / NULLIF(f.cr_rs, 0), 0)) - f.cr_rs, 2) AS ept_tipica_rs,
  ROUND(f.ont_rs - (f.ont_rs / NULLIF(f.va_rs / NULLIF(f.cr_rs, 0), 0)), 2) AS vnt_tipica_rs,
  ROUND((f.ont_rs - f.va_rs) / NULLIF(f.ont_rs - f.cr_rs, 0), 4) AS idpt_ont,
  ap.pontos_lb_totais,
  ap.pontos_lb_concluidos,
  ap.pontos_totais_concluidos,
  CASE
    WHEN f.frente IN ('AGIL', 'PROJETO') THEN
      ROUND((COALESCE((SELECT mo_rs FROM cr_horas WHERE tipo_item = 'SPRINT'), 0) + COALESCE((SELECT lanc_rs FROM cr_lanc WHERE frente = 'AGIL'), 0)) / NULLIF(ap.pontos_totais_concluidos, 0), 2)
  END AS custo_real_por_ponto_agil_rs
FROM frentes f
CROSS JOIN dc
CROSS JOIN du_st
CROSS JOIN agil_pts ap;

-- 3.2 vw_riscos_reservas_alcadas — Reservas, exposição VME, SMs fora da alçada e scope creep
CREATE OR REPLACE VIEW lume_educacao.vw_riscos_reservas_alcadas AS
WITH param AS (
  SELECT
    COALESCE((SELECT valor::numeric FROM lume_educacao.projeto_parametros WHERE parametro = 'reserva_de_contingencia_rs'), 77000)::numeric AS reserva_contingencia_rs,
    COALESCE((SELECT valor::numeric FROM lume_educacao.projeto_parametros WHERE parametro = 'reserva_gerencial_rs'), 93000)::numeric AS reserva_gerencial_rs
),
occ AS (
  SELECT
    COUNT(*) FILTER (WHERE id_risco IS NOT NULL)::integer AS qtd_occ_identificadas,
    COUNT(*) FILTER (WHERE id_risco IS NULL)::integer AS qtd_occ_imprevistos,
    ROUND(COALESCE(SUM(impacto_custo_real_rs) FILTER (WHERE id_risco IS NOT NULL), 0)::numeric, 2) AS consumo_contingencia_rs,
    ROUND(COALESCE(SUM(impacto_custo_real_rs) FILTER (WHERE id_risco IS NULL), 0)::numeric, 2) AS consumo_gerencial_direto_rs,
    COALESCE(SUM(impacto_prazo_real_du), 0)::integer AS impacto_prazo_total_du
  FROM lume_educacao.riscos_ocorrencias
),
riscos_agg AS (
  SELECT
    COUNT(*) FILTER (WHERE UPPER(TRIM(tipo_risco)) = 'AMEACA')::integer AS ameacas_totais,
    COUNT(*) FILTER (WHERE UPPER(TRIM(tipo_risco)) = 'AMEACA' AND UPPER(TRIM(status)) = 'OCORRIDO')::integer AS ameacas_ocorridas,
    COUNT(*) FILTER (WHERE UPPER(TRIM(tipo_risco)) = 'AMEACA' AND UPPER(TRIM(status)) = 'ABERTO')::integer AS ameacas_abertas,
    COUNT(*) FILTER (WHERE UPPER(TRIM(tipo_risco)) = 'OPORTUNIDADE' AND UPPER(TRIM(status)) = 'ABERTO')::integer AS oportunidades_abertas,
    ROUND(COALESCE(SUM(probabilidade_pct / 100.0 * impacto_custo_rs) FILTER (WHERE UPPER(TRIM(tipo_risco)) = 'AMEACA' AND UPPER(TRIM(status)) = 'ABERTO'), 0)::numeric, 2) AS vme_ameacas_abertas_rs,
    ROUND(COALESCE(SUM(probabilidade_pct / 100.0 * impacto_custo_rs) FILTER (WHERE UPPER(TRIM(tipo_risco)) = 'OPORTUNIDADE' AND UPPER(TRIM(status)) = 'ABERTO'), 0)::numeric, 2) AS vme_oportunidades_abertas_rs
  FROM lume_educacao.riscos_registro
),
riscos_abertos_json AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id_risco', id_risco,
    'tipo_risco', tipo_risco,
    'categoria', categoria,
    'descricao', descricao,
    'probabilidade_pct', probabilidade_pct,
    'impacto_custo_rs', impacto_custo_rs,
    'impacto_prazo_du', impacto_prazo_du,
    'vme_rs', ROUND((probabilidade_pct / 100.0 * impacto_custo_rs)::numeric, 2),
    'estrategia_resposta', estrategia_resposta,
    'custo_resposta_rs', custo_resposta_rs,
    'id_responsavel', id_responsavel
  ) ORDER BY ABS(probabilidade_pct / 100.0 * impacto_custo_rs) DESC), '[]'::jsonb) AS lista
  FROM lume_educacao.riscos_registro
  WHERE UPPER(TRIM(status)) = 'ABERTO'
),
sm_eval AS (
  SELECT
    ms.*,
    ma.limite_custo_rs,
    ma.limite_prazo_du,
    ma.pode_alterar_escopo,
    CASE
      WHEN UPPER(TRIM(ms.status)) = 'APROVADA' AND (
        (ma.limite_custo_rs IS NOT NULL AND ms.impacto_custo_rs > ma.limite_custo_rs)
        OR (ma.limite_prazo_du IS NOT NULL AND ms.impacto_prazo_du > ma.limite_prazo_du)
        OR (UPPER(TRIM(ms.tipo_mudanca)) = 'ESCOPO' AND UPPER(TRIM(ma.pode_alterar_escopo)) = 'NAO')
      ) THEN TRUE
      ELSE FALSE
    END AS fora_da_alcada
  FROM lume_educacao.mudancas_solicitacoes ms
  LEFT JOIN lume_educacao.matriz_alcadas ma ON UPPER(TRIM(ma.nivel_decisor)) = UPPER(TRIM(ms.nivel_decisor))
),
sm_agg AS (
  SELECT
    COUNT(*)::integer AS sms_total,
    COUNT(*) FILTER (WHERE UPPER(TRIM(status)) = 'APROVADA')::integer AS sms_aprovadas,
    COUNT(*) FILTER (WHERE UPPER(TRIM(status)) = 'EM_ANALISE')::integer AS sms_em_analise,
    COUNT(*) FILTER (WHERE UPPER(TRIM(status)) = 'REJEITADA')::integer AS sms_rejeitadas,
    ROUND(COALESCE(SUM(impacto_custo_rs) FILTER (WHERE UPPER(TRIM(status)) = 'APROVADA'), 0)::numeric, 2) AS sms_aprovadas_custo_rs,
    ROUND(COALESCE(SUM(impacto_custo_rs) FILTER (WHERE UPPER(TRIM(status)) = 'APROVADA' AND UPPER(TRIM(nivel_decisor)) = 'PATROCINADOR'), 0)::numeric, 2) AS sms_patrocinador_custo_rs,
    ROUND(COALESCE(SUM(impacto_custo_rs) FILTER (WHERE UPPER(TRIM(status)) = 'APROVADA' AND UPPER(TRIM(nivel_decisor)) = 'GERENTE'), 0)::numeric, 2) AS sms_gerente_custo_rs,
    COUNT(*) FILTER (WHERE fora_da_alcada)::integer AS sms_fora_alcada_qtd,
    ROUND(COALESCE(SUM(impacto_custo_rs) FILTER (WHERE fora_da_alcada), 0)::numeric, 2) AS sms_fora_alcada_custo_rs,
    COALESCE(SUM(impacto_prazo_du) FILTER (WHERE fora_da_alcada), 0)::integer AS sms_fora_alcada_prazo_du
  FROM sm_eval
),
pedidos_diretos AS (
  SELECT
    COUNT(*)::integer AS pedidos_diretos_qtd,
    COALESCE(SUM(pontos), 0)::integer AS pedidos_diretos_pts,
    COUNT(*) FILTER (WHERE UPPER(TRIM(status)) = 'CONCLUIDO')::integer AS pedidos_diretos_concluidos_qtd,
    COALESCE(SUM(pontos) FILTER (WHERE UPPER(TRIM(status)) = 'CONCLUIDO'), 0)::integer AS pedidos_diretos_concluidos_pts,
    ROUND(AVG(valor_de_negocio)::numeric, 1) AS pedidos_diretos_valor_medio
  FROM lume_educacao.backlog_itens
  WHERE UPPER(TRIM(origem)) = 'PEDIDO_DIRETO'
)
SELECT
  p.reserva_contingencia_rs,
  p.reserva_gerencial_rs,
  ROUND(p.reserva_contingencia_rs + p.reserva_gerencial_rs, 2) AS reserva_total_rs,
  o.qtd_occ_identificadas,
  o.qtd_occ_imprevistos,
  o.consumo_contingencia_rs,
  o.consumo_gerencial_direto_rs,
  ROUND(o.consumo_contingencia_rs + o.consumo_gerencial_direto_rs, 2) AS consumo_total_reservas_rs,
  ROUND(p.reserva_contingencia_rs - o.consumo_contingencia_rs, 2) AS saldo_contingencia_isolado_rs,
  ROUND((p.reserva_contingencia_rs + p.reserva_gerencial_rs) - (o.consumo_contingencia_rs + o.consumo_gerencial_direto_rs), 2) AS saldo_total_reservas_rs,
  o.impacto_prazo_total_du,
  r.ameacas_totais,
  r.ameacas_ocorridas,
  r.ameacas_abertas,
  r.oportunidades_abertas,
  r.vme_ameacas_abertas_rs,
  r.vme_oportunidades_abertas_rs,
  ROUND(r.vme_ameacas_abertas_rs + r.vme_oportunidades_abertas_rs, 2) AS exposicao_liquida_rs,
  s.sms_total,
  s.sms_aprovadas,
  s.sms_em_analise,
  s.sms_rejeitadas,
  s.sms_aprovadas_custo_rs,
  s.sms_patrocinador_custo_rs,
  s.sms_gerente_custo_rs,
  s.sms_fora_alcada_qtd,
  s.sms_fora_alcada_custo_rs,
  s.sms_fora_alcada_prazo_du,
  pd.pedidos_diretos_qtd,
  pd.pedidos_diretos_pts,
  pd.pedidos_diretos_concluidos_qtd,
  pd.pedidos_diretos_concluidos_pts,
  pd.pedidos_diretos_valor_medio,
  raj.lista AS riscos_abertos_detalhe,
  (SELECT jsonb_agg(ma ORDER BY COALESCE(ma.limite_custo_rs, 999999999)) FROM lume_educacao.matriz_alcadas ma) AS matriz_alcadas
FROM param p
CROSS JOIN occ o
CROSS JOIN riscos_agg r
CROSS JOIN riscos_abertos_json raj
CROSS JOIN sm_agg s
CROSS JOIN pedidos_diretos pd;

-- 3.3 vw_piloto_okrs_resumo — Última medição de cada KR + última semana do funil piloto
CREATE OR REPLACE VIEW lume_educacao.vw_piloto_okrs_resumo AS
WITH ult_okr AS (
  SELECT DISTINCT ON (id_resultado_chave)
    id_objetivo,
    objetivo,
    id_resultado_chave,
    resultado_chave,
    unidade,
    valor_base,
    meta,
    sentido,
    data_medicao,
    valor
  FROM lume_educacao.okr_medicoes
  ORDER BY id_resultado_chave, data_medicao DESC
),
funil_calc AS (
  SELECT
    semana_inicio,
    alcance,
    cadastros,
    ativados,
    ativos_na_semana,
    retidos_4_semanas,
    LAG(ativos_na_semana, 4) OVER (ORDER BY semana_inicio) AS ativos_4sem_atras,
    receita_rs,
    indicacoes,
    nps,
    chamados_suporte
  FROM lume_educacao.funil_piloto_semanal
),
ult_funil AS (
  SELECT
    semana_inicio AS funil_semana_inicio,
    alcance AS funil_alcance,
    cadastros AS funil_cadastros,
    ativados AS funil_ativados,
    ROUND(100.0 * ativados / NULLIF(cadastros, 0), 1) AS funil_ativacao_pct,
    ativos_na_semana AS funil_ativos_semana,
    retidos_4_semanas AS funil_retidos_4sem,
    ativos_4sem_atras AS funil_ativos_4sem_atras,
    ROUND(100.0 * retidos_4_semanas / NULLIF(ativos_4sem_atras, 0), 1) AS funil_retencao_4sem_pct,
    ROUND(receita_rs::numeric, 2) AS funil_receita_semana_rs,
    indicacoes AS funil_indicacoes,
    nps AS funil_nps,
    chamados_suporte AS funil_chamados_suporte,
    ROUND(100.0 * chamados_suporte / NULLIF(ativos_na_semana, 0), 2) AS funil_chamados_por_100_ativos
  FROM funil_calc
  ORDER BY semana_inicio DESC
  LIMIT 1
)
SELECT
  o.id_objetivo,
  o.objetivo,
  o.id_resultado_chave,
  o.resultado_chave,
  o.unidade,
  o.valor_base,
  o.meta,
  o.sentido,
  o.data_medicao,
  o.valor,
  CASE
    WHEN UPPER(TRIM(o.sentido)) = 'MAIOR_MELHOR' THEN o.valor >= o.meta
    ELSE o.valor <= o.meta
  END AS meta_atingida,
  uf.*
FROM ult_okr o
CROSS JOIN ult_funil uf
ORDER BY o.id_objetivo, o.id_resultado_chave;

-- 3.4 vw_equipe_produtividade — Horas, extras, custo, folha e produtividade ágil por pessoa
CREATE OR REPLACE VIEW lume_educacao.vw_equipe_produtividade AS
WITH dc AS (
  SELECT
    GREATEST(
      COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status'), DATE '2026-11-13'),
      COALESCE((SELECT MAX((semana_inicio + INTERVAL '4 days')::date) FROM lume_educacao.apontamento_horas), DATE '2026-11-13')
    ) AS data_corte,
    COALESCE((SELECT valor::numeric FROM lume_educacao.projeto_parametros WHERE parametro = 'fator_hora_extra'), 1.5) AS fator_he
),
horas_p AS (
  SELECT
    ah.id_pessoa,
    ROUND(SUM(ah.horas_normais)::numeric, 1) AS horas_normais,
    ROUND(SUM(ah.horas_extras)::numeric, 1) AS horas_extras,
    ROUND(SUM(ah.horas_normais + ah.horas_extras)::numeric, 1) AS horas_totais,
    ROUND(SUM((ah.horas_normais + ah.horas_extras * dc.fator_he) * eq.custo_hora_rs)::numeric, 2) AS custo_mo_rs,
    ROUND(SUM(ah.horas_normais) FILTER (WHERE UPPER(TRIM(ah.tipo_item)) = 'SPRINT')::numeric + COALESCE(SUM(ah.horas_extras) FILTER (WHERE UPPER(TRIM(ah.tipo_item)) = 'SPRINT'), 0)::numeric, 1) AS horas_sprint,
    ROUND(SUM((ah.horas_normais + ah.horas_extras * dc.fator_he) * eq.custo_hora_rs) FILTER (WHERE UPPER(TRIM(ah.tipo_item)) = 'SPRINT')::numeric, 2) AS custo_sprint_rs
  FROM lume_educacao.apontamento_horas ah
  JOIN lume_educacao.equipe eq ON eq.id_pessoa = ah.id_pessoa
  CROSS JOIN dc
  WHERE (ah.semana_inicio + INTERVAL '4 days')::date <= dc.data_corte
  GROUP BY ah.id_pessoa
),
agil_p AS (
  SELECT
    bi.id_responsavel AS id_pessoa,
    COUNT(*) FILTER (WHERE bi.data_conclusao IS NOT NULL)::integer AS itens_concluidos,
    COALESCE(SUM(bi.pontos) FILTER (WHERE bi.data_conclusao IS NOT NULL), 0)::integer AS pontos_concluidos
  FROM lume_educacao.backlog_itens bi
  WHERE bi.id_responsavel IS NOT NULL
  GROUP BY bi.id_responsavel
)
SELECT
  eq.id_pessoa,
  eq.nome,
  eq.papel,
  eq.frente,
  eq.disciplina,
  eq.senioridade,
  eq.vinculo,
  eq.custo_hora_rs,
  eq.alocacao_pct,
  eq.data_entrada,
  eq.data_saida,
  ROUND((cs.remuneracao_mensal_rs * (1.0 + cs.encargos_pct / 100.0) + cs.beneficios_mensais_rs)::numeric, 2) AS custo_folha_mensal_rs,
  COALESCE(hp.horas_normais, 0) AS horas_normais,
  COALESCE(hp.horas_extras, 0) AS horas_extras,
  COALESCE(hp.horas_totais, 0) AS horas_totais,
  ROUND(100.0 * COALESCE(hp.horas_extras, 0) / NULLIF(hp.horas_normais, 0), 1) AS pct_extras_sobre_normais,
  COALESCE(hp.custo_mo_rs, 0) AS custo_mo_rs,
  COALESCE(hp.horas_sprint, 0) AS horas_sprint,
  COALESCE(hp.custo_sprint_rs, 0) AS custo_sprint_rs,
  COALESCE(ap.itens_concluidos, 0) AS itens_concluidos_agil,
  COALESCE(ap.pontos_concluidos, 0) AS pontos_concluidos_agil,
  ROUND(COALESCE(ap.pontos_concluidos, 0)::numeric / NULLIF(hp.horas_sprint, 0), 4) AS pts_por_hh_agil,
  ROUND(COALESCE(hp.custo_sprint_rs, 0) / NULLIF(ap.pontos_concluidos, 0), 2) AS custo_mo_por_ponto_rs
FROM lume_educacao.equipe eq
LEFT JOIN lume_educacao.cargos_salarios cs ON cs.id_pessoa = eq.id_pessoa
LEFT JOIN horas_p hp ON hp.id_pessoa = eq.id_pessoa
LEFT JOIN agil_p ap ON ap.id_pessoa = eq.id_pessoa
ORDER BY eq.id_pessoa;

-- 3.5 vw_cenarios_base — Parâmetros dos cenários C1..C6, mudanças de rede/backlog/recursos e fluxo base
CREATE OR REPLACE VIEW lume_educacao.vw_cenarios_base AS
WITH cativ AS (
  SELECT
    id_cenario,
    COUNT(*)::integer AS qtd_alteracoes_rede,
    ROUND(COALESCE(SUM(custo_adicional_rs), 0)::numeric, 2) AS soma_custo_atividades_rs,
    COALESCE(jsonb_agg(jsonb_build_object(
      'acao', acao,
      'id_atividade', id_atividade,
      'nome_atividade', nome_atividade,
      'duracao_du', duracao_du,
      'custo_adicional_rs', custo_adicional_rs
    ) ORDER BY id_atividade), '[]'::jsonb) AS alteracoes_rede
  FROM lume_educacao.cenario_atividades
  GROUP BY id_cenario
),
cback AS (
  SELECT
    id_cenario,
    COALESCE(SUM(CASE WHEN UPPER(TRIM(acao)) = 'INCLUIR' THEN pontos ELSE -pontos END), 0)::integer AS delta_pontos_backlog,
    COALESCE(jsonb_agg(jsonb_build_object(
      'acao', acao,
      'id_item', id_item,
      'titulo', titulo,
      'id_release', id_release,
      'pontos', pontos
    ) ORDER BY id_item), '[]'::jsonb) AS alteracoes_backlog
  FROM lume_educacao.cenario_backlog
  GROUP BY id_cenario
),
crec AS (
  SELECT
    id_cenario,
    ROUND(COALESCE(SUM(quantidade * custo_mensal_rs * meses), 0)::numeric, 2) AS custo_recursos_rs,
    COALESCE(jsonb_agg(jsonb_build_object(
      'papel', papel,
      'senioridade', senioridade,
      'quantidade', quantidade,
      'custo_mensal_rs', custo_mensal_rs,
      'meses', meses,
      'ganho_velocidade_pontos_por_sprint', ganho_velocidade_pontos_por_sprint,
      'sprints_de_rampa', sprints_de_rampa
    )), '[]'::jsonb) AS reforcos_equipe
  FROM lume_educacao.cenario_recursos
  GROUP BY id_cenario
),
cb AS (
  SELECT jsonb_agg(jsonb_build_object(
    'ano', ano,
    'investimento_rs', investimento_rs,
    'beneficio_bruto_rs', beneficio_bruto_rs,
    'custo_operacional_rs', custo_operacional_rs,
    'fluxo_liquido_rs', ROUND((beneficio_bruto_rs - custo_operacional_rs - investimento_rs)::numeric, 2)
  ) ORDER BY ano) AS caso_negocio_fluxo
  FROM lume_educacao.caso_de_negocio
)
SELECT
  c.id_cenario,
  c.nome_cenario,
  c.tipo_cenario,
  c.descricao,
  c.id_proponente,
  pi.parte_interessada AS proponente_cargo,
  pi.contato AS proponente_nome,
  c.variacao_beneficio_pct,
  c.variacao_custo_operacional_anual_rs,
  c.investimento_adicional_rs,
  c.parcela_beneficio_antecipada_pct,
  c.id_atividade_gatilho,
  c.combinavel_com,
  COALESCE(ca.qtd_alteracoes_rede, 0) AS qtd_alteracoes_rede,
  COALESCE(ca.soma_custo_atividades_rs, 0) AS soma_custo_atividades_rs,
  COALESCE(ca.alteracoes_rede, '[]'::jsonb) AS alteracoes_rede,
  COALESCE(ck.delta_pontos_backlog, 0) AS delta_pontos_backlog,
  COALESCE(ck.alteracoes_backlog, '[]'::jsonb) AS alteracoes_backlog,
  COALESCE(cr.custo_recursos_rs, 0) AS custo_recursos_rs,
  COALESCE(cr.reforcos_equipe, '[]'::jsonb) AS reforcos_equipe,
  (SELECT valor::numeric FROM lume_educacao.projeto_parametros WHERE parametro = 'taxa_minima_de_atratividade_aa') AS tma_aa,
  (SELECT valor::numeric FROM lume_educacao.projeto_parametros WHERE parametro = 'custo_do_atraso_por_du_rs') AS custo_atraso_por_du_rs,
  (SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_termino_contratual') AS data_termino_contratual,
  cb.caso_negocio_fluxo
FROM lume_educacao.cenarios c
LEFT JOIN lume_educacao.partes_interessadas pi ON pi.id_parte = c.id_proponente
LEFT JOIN cativ ca ON ca.id_cenario = c.id_cenario
LEFT JOIN cback ck ON ck.id_cenario = c.id_cenario
LEFT JOIN crec cr ON cr.id_cenario = c.id_cenario
CROSS JOIN cb
ORDER BY c.id_cenario;
