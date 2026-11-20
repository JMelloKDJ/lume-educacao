-- Lume Educação (ENGN62 — Grupo 4)
-- Entrega LE-33 / EAP 2.7: Views SQL reativas de fluxo ágil, DORA e números de controle (M5 / D7 / D8 / R7 / R8)
-- Restrição: somente CREATE OR REPLACE VIEW no schema lume_educacao; nenhuma tabela base é alterada.
-- Regras consolidadas:
--   - DORA headline em vw_fluxo_agil_dora: escopo PRODUCAO + freq_prod_por_sem_ageis (vw_dora_qualidade expõe também TODOS e freq_prod_por_sem_pos_r1).
--   - Burndown padrão: pts_restantes_estatico (escopo total comprometido da sprint menos concluídos até o dia, conforme M5); pts_restantes_dinamico exposto em paralelo.
--   - Lead Time e Cycle Time: contagem inclusiva de dias úteis (calendario.dia_util = 1) em [data_criacao, data_conclusao] e [data_inicio, data_conclusao].

-- ============================================================================
-- 1. vw_numeros_controle — Reconciliação contínua dos 13 controles do Dossiê
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
    10, '10_avanco_informes', '17_avanco_semanal', 'Informes de avanço (sem carry-forward sintético)',
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
-- 2. vw_lead_cycle_time_itens — Métricas unitárias de fluxo, qualidade e bloqueios
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_lead_cycle_time_itens AS
WITH concl_sprint AS (
  SELECT DISTINCT ON (si.id_item)
    si.id_item,
    si.id_sprint AS id_sprint_conclusao,
    s.numero::integer AS num_sprint_conclusao
  FROM lume_educacao.sprint_itens si
  JOIN lume_educacao.sprints s ON s.id_sprint = si.id_sprint
  WHERE si.concluido_na_sprint = 1
  ORDER BY si.id_item, s.numero DESC
),
trans_agg AS (
  SELECT
    t.id_item,
    COUNT(*)::integer AS qtd_transicoes,
    COUNT(*) FILTER (
      WHERE UPPER(TRIM(t.status_origem)) = 'EM_TESTE'
        AND UPPER(TRIM(t.status_destino)) = 'EM_ANDAMENTO'
    )::integer AS reprovacoes_teste,
    MIN(t.data) FILTER (WHERE UPPER(TRIM(t.status_destino)) = 'EM_REVISAO') AS primeira_revisao_data
  FROM lume_educacao.itens_transicoes t
  GROUP BY t.id_item
),
imp_agg AS (
  SELECT
    i.id_item,
    COUNT(*)::integer AS qtd_impedimentos,
    COALESCE(SUM(i.dias_uteis_bloqueado), 0)::integer AS dias_uteis_impedido
  FROM lume_educacao.impedimentos i
  GROUP BY i.id_item
),
def_agg AS (
  SELECT
    d.id_item_origem AS id_item,
    COUNT(*)::integer AS defeitos_originados,
    COUNT(*) FILTER (WHERE UPPER(TRIM(d.ambiente_detectado)) = 'PRODUCAO')::integer AS defeitos_producao_originados
  FROM lume_educacao.defeitos d
  GROUP BY d.id_item_origem
),
base AS (
  SELECT
    bi.id_item,
    bi.id_epico,
    e.nome_epico,
    UPPER(TRIM(bi.tipo_item)) AS tipo_item,
    bi.titulo,
    bi.pontos::integer AS pontos,
    UPPER(TRIM(bi.prioridade_moscow)) AS prioridade_moscow,
    bi.id_release,
    UPPER(TRIM(bi.origem)) AS origem,
    bi.id_solicitante,
    UPPER(TRIM(bi.status)) AS status,
    bi.id_sprint_atual,
    cs.id_sprint_conclusao,
    cs.num_sprint_conclusao,
    bi.id_responsavel,
    bi.revisao_por_par::integer AS revisao_por_par,
    bi.data_criacao,
    bi.data_inicio,
    bi.data_conclusao,
    ta.primeira_revisao_data,
    CASE
      WHEN bi.data_inicio IS NOT NULL AND bi.data_conclusao IS NOT NULL THEN (
        SELECT COUNT(*)::integer
        FROM lume_educacao.calendario c
        WHERE c.dia_util = 1 AND c.data BETWEEN bi.data_inicio AND bi.data_conclusao
      )
    END AS cycle_time_du,
    CASE
      WHEN bi.data_criacao IS NOT NULL AND bi.data_conclusao IS NOT NULL THEN (
        SELECT COUNT(*)::integer
        FROM lume_educacao.calendario c
        WHERE c.dia_util = 1 AND c.data BETWEEN bi.data_criacao AND bi.data_conclusao
      )
    END AS lead_time_du,
    COALESCE(ta.qtd_transicoes, 0) AS qtd_transicoes,
    COALESCE(ta.reprovacoes_teste, 0) AS reprovacoes_teste,
    COALESCE(ia.qtd_impedimentos, 0) AS qtd_impedimentos,
    COALESCE(ia.dias_uteis_impedido, 0) AS dias_uteis_impedido,
    COALESCE(da.defeitos_originados, 0) AS defeitos_originados,
    COALESCE(da.defeitos_producao_originados, 0) AS defeitos_producao_originados
  FROM lume_educacao.backlog_itens bi
  LEFT JOIN lume_educacao.epicos e ON e.id_epico = bi.id_epico
  LEFT JOIN concl_sprint cs ON cs.id_item = bi.id_item
  LEFT JOIN trans_agg ta ON ta.id_item = bi.id_item
  LEFT JOIN imp_agg ia ON ia.id_item = bi.id_item
  LEFT JOIN def_agg da ON da.id_item = bi.id_item
)
SELECT
  id_item,
  id_epico,
  nome_epico,
  tipo_item,
  titulo,
  pontos,
  prioridade_moscow,
  id_release,
  origem,
  id_solicitante,
  status,
  id_sprint_atual,
  id_sprint_conclusao,
  num_sprint_conclusao,
  id_responsavel,
  revisao_por_par,
  data_criacao,
  data_inicio,
  data_conclusao,
  primeira_revisao_data,
  cycle_time_du,
  lead_time_du,
  CASE
    WHEN cycle_time_du IS NOT NULL AND lead_time_du IS NOT NULL
      THEN GREATEST(lead_time_du - cycle_time_du, 0)
  END AS tempo_fila_du,
  qtd_transicoes,
  reprovacoes_teste,
  qtd_impedimentos,
  dias_uteis_impedido,
  defeitos_originados,
  defeitos_producao_originados
FROM base;

-- ============================================================================
-- 3. vw_cfd_diario — Diagrama de Fluxo Cumulativo reconstruído por dia útil
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_cfd_diario AS
WITH limites AS (
  SELECT
    COALESCE(
      (SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_inicio_sprint_1'),
      DATE '2026-05-04'
    ) AS data_ini,
    GREATEST(
      COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status'), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.itens_transicoes), DATE '2026-05-04'),
      COALESCE((SELECT MAX(data_criacao) FROM lume_educacao.backlog_itens), DATE '2026-05-04'),
      COALESCE((
        SELECT MAX(s.data_fim)
        FROM lume_educacao.sprints s
        WHERE EXISTS (SELECT 1 FROM lume_educacao.sprint_itens si WHERE si.id_sprint = s.id_sprint)
           OR s.pessoas_dia_disponiveis IS NOT NULL
      ), DATE '2026-05-04')
    ) AS data_fim
),
dias_uteis AS (
  SELECT
    c.data,
    c.dia_semana,
    c.dia_util_projeto::integer AS dia_util_projeto,
    COALESCE(s.id_sprint, c.id_sprint) AS id_sprint,
    s.numero::integer AS num_sprint,
    COALESCE(
      s.id_sprint IS NOT NULL AND c.data = (
        SELECT MAX(c2.data)
        FROM lume_educacao.calendario c2
        WHERE c2.dia_util = 1 AND c2.data BETWEEN s.data_inicio AND s.data_fim
      ),
      FALSE
    ) AS is_fim_sprint
  FROM lume_educacao.calendario c
  CROSS JOIN limites l
  LEFT JOIN lume_educacao.sprints s ON c.data BETWEEN s.data_inicio AND s.data_fim
  WHERE c.dia_util = 1
    AND c.data BETWEEN l.data_ini AND l.data_fim
),
trans_fim_dia AS (
  -- Último movimento de cada item dentro do mesmo dia calendário
  SELECT DISTINCT ON (t.id_item, t.data)
    t.id_item,
    t.data AS data_efetiva,
    UPPER(TRIM(t.status_destino)) AS status_destino
  FROM lume_educacao.itens_transicoes t
  ORDER BY
    t.id_item,
    t.data,
    NULLIF(REGEXP_REPLACE(t.id_transicao, '[^0-9]', '', 'g'), '')::bigint DESC NULLS LAST,
    t.id_transicao DESC
),
intervalos_status AS (
  SELECT
    id_item,
    data_efetiva AS data_inicio_status,
    LEAD(data_efetiva) OVER (PARTITION BY id_item ORDER BY data_efetiva) AS data_prox_status,
    status_destino
  FROM trans_fim_dia
),
estado_diario AS (
  SELECT
    d.data,
    d.dia_semana,
    d.dia_util_projeto,
    d.id_sprint,
    d.num_sprint,
    d.is_fim_sprint,
    bi.id_item,
    bi.pontos,
    COALESCE(iv.status_destino, 'A_FAZER') AS status_no_dia,
    EXISTS (
      SELECT 1
      FROM lume_educacao.sprint_itens si
      JOIN lume_educacao.sprints s2 ON s2.id_sprint = si.id_sprint
      WHERE si.id_item = bi.id_item
        AND s2.data_inicio <= d.data
    ) AS entrou_em_sprint
  FROM dias_uteis d
  JOIN lume_educacao.backlog_itens bi ON bi.data_criacao <= d.data
  LEFT JOIN intervalos_status iv
    ON iv.id_item = bi.id_item
   AND d.data >= iv.data_inicio_status
   AND (iv.data_prox_status IS NULL OR d.data < iv.data_prox_status)
)
SELECT
  data,
  dia_semana,
  dia_util_projeto,
  id_sprint,
  num_sprint,
  is_fim_sprint,
  COUNT(*)::integer AS total_itens_backlog,
  COUNT(*) FILTER (WHERE status_no_dia = 'A_FAZER')::integer AS a_fazer_total,
  COUNT(*) FILTER (WHERE status_no_dia = 'A_FAZER' AND entrou_em_sprint)::integer AS a_fazer_em_sprint,
  COUNT(*) FILTER (WHERE status_no_dia = 'EM_ANDAMENTO')::integer AS em_andamento,
  COUNT(*) FILTER (WHERE status_no_dia = 'EM_REVISAO')::integer AS em_revisao,
  COUNT(*) FILTER (WHERE status_no_dia = 'EM_TESTE')::integer AS em_teste,
  COUNT(*) FILTER (WHERE status_no_dia = 'CONCLUIDO')::integer AS concluido,
  COUNT(*) FILTER (WHERE status_no_dia IN ('EM_ANDAMENTO', 'EM_REVISAO', 'EM_TESTE'))::integer AS wip_observado,
  COALESCE(SUM(pontos), 0)::integer AS pts_total_backlog,
  COALESCE(SUM(pontos) FILTER (WHERE status_no_dia = 'A_FAZER'), 0)::integer AS pts_a_fazer,
  COALESCE(SUM(pontos) FILTER (WHERE status_no_dia = 'EM_ANDAMENTO'), 0)::integer AS pts_em_andamento,
  COALESCE(SUM(pontos) FILTER (WHERE status_no_dia = 'EM_REVISAO'), 0)::integer AS pts_em_revisao,
  COALESCE(SUM(pontos) FILTER (WHERE status_no_dia = 'EM_TESTE'), 0)::integer AS pts_em_teste,
  COALESCE(SUM(pontos) FILTER (WHERE status_no_dia = 'CONCLUIDO'), 0)::integer AS pts_concluido,
  COALESCE(SUM(pontos) FILTER (WHERE status_no_dia IN ('EM_ANDAMENTO', 'EM_REVISAO', 'EM_TESTE')), 0)::integer AS pts_wip_observado
FROM estado_diario
GROUP BY data, dia_semana, dia_util_projeto, id_sprint, num_sprint, is_fim_sprint
ORDER BY data;

-- ============================================================================
-- 4. vw_burndown_diario — Burndown diário reativo por sprint (estático M5 + dinâmico)
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_burndown_diario AS
WITH sprint_days AS (
  SELECT
    s.id_sprint,
    s.numero::integer AS num_sprint,
    c.data,
    c.dia_semana,
    ROW_NUMBER() OVER (PARTITION BY s.id_sprint ORDER BY c.data)::integer AS dia_sprint,
    COUNT(*) OVER (PARTITION BY s.id_sprint)::integer AS total_du_sprint
  FROM lume_educacao.sprints s
  JOIN lume_educacao.calendario c
    ON c.dia_util = 1
   AND c.data BETWEEN s.data_inicio AND s.data_fim
  WHERE EXISTS (
    SELECT 1 FROM lume_educacao.sprint_itens si WHERE si.id_sprint = s.id_sprint
  )
),
sprint_totais AS (
  SELECT
    si.id_sprint,
    COALESCE(SUM(si.pontos), 0)::integer AS pts_comprometidos_totais,
    COALESCE(SUM(si.pontos) FILTER (WHERE UPPER(TRIM(si.origem_na_sprint)) <> 'ADICIONADO_DURANTE'), 0)::integer AS pts_comprometidos_iniciais
  FROM lume_educacao.sprint_itens si
  GROUP BY si.id_sprint
),
daily_burn AS (
  SELECT
    sd.id_sprint,
    sd.num_sprint,
    sd.dia_sprint,
    sd.total_du_sprint,
    sd.data,
    sd.dia_semana,
    st.pts_comprometidos_totais,
    st.pts_comprometidos_iniciais,
    COALESCE(SUM(si.pontos) FILTER (WHERE si.concluido_na_sprint = 1 AND bi.data_conclusao = sd.data), 0)::integer AS pts_concluidos_dia,
    COALESCE(SUM(si.pontos) FILTER (WHERE si.concluido_na_sprint = 1 AND bi.data_conclusao <= sd.data), 0)::integer AS pts_concluidos_acum,
    COALESCE(SUM(si.pontos) FILTER (
      WHERE UPPER(TRIM(si.origem_na_sprint)) <> 'ADICIONADO_DURANTE'
         OR bi.data_criacao <= sd.data
    ), 0)::integer AS pts_escopo_disponivel_dia,
    COALESCE(STRING_AGG(si.id_item || '(' || si.pontos || ')', ', ' ORDER BY si.id_item) FILTER (
      WHERE si.concluido_na_sprint = 1 AND bi.data_conclusao = sd.data
    ), '—') AS itens_concluidos_dia
  FROM sprint_days sd
  JOIN sprint_totais st ON st.id_sprint = sd.id_sprint
  JOIN lume_educacao.sprint_itens si ON si.id_sprint = sd.id_sprint
  JOIN lume_educacao.backlog_itens bi ON bi.id_item = si.id_item
  GROUP BY
    sd.id_sprint, sd.num_sprint, sd.dia_sprint, sd.total_du_sprint,
    sd.data, sd.dia_semana, st.pts_comprometidos_totais, st.pts_comprometidos_iniciais
)
SELECT
  db.id_sprint,
  db.num_sprint,
  db.dia_sprint,
  db.total_du_sprint,
  db.data,
  db.dia_semana,
  db.pts_comprometidos_totais,
  db.pts_comprometidos_iniciais,
  db.pts_concluidos_dia,
  db.pts_concluidos_acum,
  (db.pts_comprometidos_totais - db.pts_concluidos_acum)::integer AS pts_restantes_estatico,
  (db.pts_escopo_disponivel_dia - db.pts_concluidos_acum)::integer AS pts_restantes_dinamico,
  ROUND(db.pts_comprometidos_totais::numeric * (1.0 - db.dia_sprint::numeric / NULLIF(db.total_du_sprint, 0)), 2) AS linha_ideal_fim_dia,
  ROUND(
    (db.pts_comprometidos_totais - db.pts_concluidos_acum)::numeric
    - ROUND(db.pts_comprometidos_totais::numeric * (1.0 - db.dia_sprint::numeric / NULLIF(db.total_du_sprint, 0)), 2),
    2
  ) AS desvio_vs_ideal,
  db.itens_concluidos_dia,
  cfd.wip_observado AS wip_observado_dia
FROM daily_burn db
LEFT JOIN lume_educacao.vw_cfd_diario cfd ON cfd.data = db.data
ORDER BY db.num_sprint, db.dia_sprint;

-- ============================================================================
-- 5. vw_velocidade_sprints — Série histórica S01..Sn com MM5, fluxo e revisão por par
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_velocidade_sprints AS
WITH si_agg AS (
  SELECT
    si.id_sprint,
    COUNT(*)::integer AS qtd_itens_comprometidos,
    COALESCE(SUM(si.pontos), 0)::integer AS pts_comprometidos,
    COALESCE(SUM(si.pontos) FILTER (WHERE UPPER(TRIM(si.origem_na_sprint)) = 'PLANEJAMENTO'), 0)::integer AS pts_planejamento,
    COALESCE(SUM(si.pontos) FILTER (WHERE UPPER(TRIM(si.origem_na_sprint)) = 'TRANSBORDO'), 0)::integer AS pts_transbordo,
    COALESCE(SUM(si.pontos) FILTER (WHERE UPPER(TRIM(si.origem_na_sprint)) = 'ADICIONADO_DURANTE'), 0)::integer AS pts_adicionado_durante,
    COUNT(*) FILTER (WHERE si.concluido_na_sprint = 1)::integer AS itens_concluidos,
    COALESCE(SUM(si.pontos) FILTER (WHERE si.concluido_na_sprint = 1), 0)::integer AS velocidade_pts
  FROM lume_educacao.sprint_itens si
  GROUP BY si.id_sprint
),
lt_ct_agg AS (
  SELECT
    lct.id_sprint_conclusao AS id_sprint,
    ROUND(AVG(lct.cycle_time_du)::numeric, 2) AS cycle_time_medio_du,
    ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY lct.cycle_time_du))::numeric, 2) AS cycle_time_p50_du,
    ROUND((PERCENTILE_CONT(0.85) WITHIN GROUP (ORDER BY lct.cycle_time_du))::numeric, 2) AS cycle_time_p85_du,
    ROUND(AVG(lct.lead_time_du)::numeric, 2) AS lead_time_medio_du,
    ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY lct.lead_time_du))::numeric, 2) AS lead_time_p50_du,
    ROUND((PERCENTILE_CONT(0.85) WITHIN GROUP (ORDER BY lct.lead_time_du))::numeric, 2) AS lead_time_p85_du,
    COUNT(*) FILTER (WHERE lct.revisao_por_par = 1)::integer AS itens_concluidos_com_rev_par
  FROM lume_educacao.vw_lead_cycle_time_itens lct
  WHERE lct.id_sprint_conclusao IS NOT NULL
  GROUP BY lct.id_sprint_conclusao
),
cfd_agg AS (
  SELECT
    cfd.id_sprint,
    ROUND(AVG(cfd.wip_observado)::numeric, 2) AS wip_diario_medio_observado,
    MAX(cfd.wip_observado) FILTER (WHERE cfd.is_fim_sprint)::integer AS wip_fim_sprint
  FROM lume_educacao.vw_cfd_diario cfd
  WHERE cfd.id_sprint IS NOT NULL
  GROUP BY cfd.id_sprint
),
rev_agg AS (
  SELECT
    s.id_sprint,
    COUNT(DISTINCT t.id_item)::integer AS itens_em_revisao_sprint,
    COUNT(DISTINCT t.id_item) FILTER (WHERE bi.revisao_por_par = 1)::integer AS itens_revisados_por_par_sprint
  FROM lume_educacao.sprints s
  LEFT JOIN lume_educacao.itens_transicoes t
    ON UPPER(TRIM(t.status_destino)) = 'EM_REVISAO'
   AND t.data BETWEEN s.data_inicio AND s.data_fim
  LEFT JOIN lume_educacao.backlog_itens bi ON bi.id_item = t.id_item
  GROUP BY s.id_sprint
)
SELECT
  s.id_sprint,
  s.numero::integer AS numero,
  s.data_inicio,
  s.data_fim,
  s.dias_uteis::integer AS dias_uteis,
  s.id_release_alvo,
  s.pessoas_dia_disponiveis::integer AS pessoas_dia_disponiveis,
  s.horas_extras_autorizadas,
  s.meta_da_sprint,
  COALESCE(sa.qtd_itens_comprometidos, 0) AS qtd_itens_comprometidos,
  COALESCE(sa.pts_comprometidos, 0) AS pts_comprometidos,
  COALESCE(sa.pts_planejamento, 0) AS pts_planejamento,
  COALESCE(sa.pts_transbordo, 0) AS pts_transbordo,
  COALESCE(sa.pts_adicionado_durante, 0) AS pts_adicionado_durante,
  COALESCE(sa.itens_concluidos, 0) AS itens_concluidos,
  COALESCE(sa.velocidade_pts, 0) AS velocidade_pts,
  ROUND(100.0 * COALESCE(sa.velocidade_pts, 0)::numeric / NULLIF(sa.pts_comprometidos, 0), 1) AS taxa_conclusao_pct,
  SUM(COALESCE(sa.itens_concluidos, 0)) OVER (ORDER BY s.numero)::integer AS itens_concluidos_acum,
  SUM(COALESCE(sa.velocidade_pts, 0)) OVER (ORDER BY s.numero)::integer AS pts_concluidos_acum,
  ROUND(AVG(COALESCE(sa.velocidade_pts, 0)) OVER (ORDER BY s.numero ROWS BETWEEN 4 PRECEDING AND CURRENT ROW), 2) AS velocidade_media_5_ultimas,
  FIRST_VALUE(s.id_sprint) OVER (ORDER BY s.numero ROWS BETWEEN 4 PRECEDING AND CURRENT ROW) || '–' || s.id_sprint AS janela_mm5_sprints,
  ROUND(COALESCE(sa.itens_concluidos, 0)::numeric / NULLIF(s.dias_uteis, 0), 4) AS vazao_itens_por_du,
  ROUND((COALESCE(sa.itens_concluidos, 0)::numeric / NULLIF(s.dias_uteis, 0)) * 5.0, 2) AS vazao_itens_por_semana,
  la.cycle_time_medio_du,
  la.cycle_time_p50_du,
  la.cycle_time_p85_du,
  la.lead_time_medio_du,
  la.lead_time_p50_du,
  la.lead_time_p85_du,
  ROUND((COALESCE(sa.itens_concluidos, 0)::numeric / NULLIF(s.dias_uteis, 0)) * la.cycle_time_medio_du, 2) AS wip_medio_little,
  ca.wip_diario_medio_observado,
  ca.wip_fim_sprint,
  COALESCE(ra.itens_em_revisao_sprint, 0) AS itens_em_revisao_sprint,
  COALESCE(ra.itens_revisados_por_par_sprint, 0) AS itens_revisados_por_par_sprint,
  ROUND(100.0 * COALESCE(ra.itens_revisados_por_par_sprint, 0)::numeric / NULLIF(ra.itens_em_revisao_sprint, 0), 1) AS aderencia_revisao_par_pct,
  COALESCE(la.itens_concluidos_com_rev_par, 0) AS itens_concluidos_com_rev_par,
  ROUND(100.0 * COALESCE(la.itens_concluidos_com_rev_par, 0)::numeric / NULLIF(sa.itens_concluidos, 0), 1) AS aderencia_rev_par_concluidos_pct
FROM lume_educacao.sprints s
LEFT JOIN si_agg sa ON sa.id_sprint = s.id_sprint
LEFT JOIN lt_ct_agg la ON la.id_sprint = s.id_sprint
LEFT JOIN cfd_agg ca ON ca.id_sprint = s.id_sprint
LEFT JOIN rev_agg ra ON ra.id_sprint = s.id_sprint
WHERE sa.id_sprint IS NOT NULL
   OR s.pessoas_dia_disponiveis IS NOT NULL
ORDER BY s.numero;

-- ============================================================================
-- 6. vw_previsao_releases — Previsão dinâmica de R1–R3 pela Convenção 10
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_previsao_releases AS
WITH param AS (
  SELECT
    COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_inicio_sprint_1'), DATE '2026-05-04') AS data_inicio_s1,
    COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status'), DATE '2026-11-13') AS data_status_param
),
cortes AS (
  SELECT '2026-10-30'::text AS corte_codigo, DATE '2026-10-30' AS data_corte
  UNION ALL
  SELECT '2026-11-13'::text, DATE '2026-11-13'
  UNION ALL
  SELECT
    'ATUAL'::text,
    GREATEST(
      (SELECT data_status_param FROM param),
      COALESCE((SELECT MAX(data_fim) FROM lume_educacao.vw_velocidade_sprints), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.implantacoes), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data_abertura) FROM lume_educacao.defeitos), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.itens_transicoes), DATE '2026-11-13')
    )
),
releases_ord AS (
  SELECT
    r.*,
    CASE r.id_release
      WHEN 'R1' THEN 1
      WHEN 'R2' THEN 2
      WHEN 'R3' THEN 3
      ELSE NULLIF(REGEXP_REPLACE(r.id_release, '[^0-9]', '', 'g'), '')::integer
    END AS ordem_release,
    sp_plan.numero::integer AS num_sprint_planejada
  FROM lume_educacao.releases r
  LEFT JOIN lume_educacao.sprints sp_plan ON sp_plan.id_sprint = r.id_sprint_planejada
),
sprint_ref AS (
  SELECT DISTINCT ON (c.corte_codigo)
    c.corte_codigo,
    c.data_corte,
    vs.id_sprint AS id_sprint_ref,
    vs.numero AS num_sprint_ref,
    vs.velocidade_media_5_ultimas
  FROM cortes c
  JOIN lume_educacao.vw_velocidade_sprints vs ON vs.data_fim <= c.data_corte
  ORDER BY c.corte_codigo, vs.numero DESC
),
calc AS (
  SELECT
    sr.corte_codigo,
    sr.data_corte,
    ro.id_release,
    ro.nome_release,
    ro.ordem_release,
    ro.id_sprint_planejada,
    ro.num_sprint_planejada,
    ro.data_planejada,
    ro.data_real,
    sr.id_sprint_ref,
    sr.num_sprint_ref,
    sr.velocidade_media_5_ultimas,
    COALESCE((
      SELECT COUNT(*)::integer
      FROM lume_educacao.backlog_itens bi
      LEFT JOIN releases_ord ro_b ON ro_b.id_release = bi.id_release
      WHERE ro_b.ordem_release <= ro.ordem_release
        AND UPPER(TRIM(bi.prioridade_moscow)) <> 'WONT'
        AND bi.data_criacao <= sr.data_corte
        AND (bi.data_conclusao IS NULL OR bi.data_conclusao > sr.data_corte)
    ), 0) AS itens_restantes_acum,
    COALESCE((
      SELECT SUM(bi.pontos)::integer
      FROM lume_educacao.backlog_itens bi
      LEFT JOIN releases_ord ro_b ON ro_b.id_release = bi.id_release
      WHERE ro_b.ordem_release <= ro.ordem_release
        AND UPPER(TRIM(bi.prioridade_moscow)) <> 'WONT'
        AND bi.data_criacao <= sr.data_corte
        AND (bi.data_conclusao IS NULL OR bi.data_conclusao > sr.data_corte)
    ), 0) AS pontos_restantes_acum,
    COALESCE((
      SELECT SUM(bi.pontos)::integer
      FROM lume_educacao.backlog_itens bi
      WHERE bi.id_release = ro.id_release
        AND UPPER(TRIM(bi.prioridade_moscow)) <> 'WONT'
        AND bi.data_criacao <= sr.data_corte
        AND (bi.data_conclusao IS NULL OR bi.data_conclusao > sr.data_corte)
    ), 0) AS pontos_proprios_restantes
  FROM sprint_ref sr
  CROSS JOIN releases_ord ro
),
previsao AS (
  SELECT
    c.*,
    CASE
      WHEN c.data_real IS NOT NULL AND c.data_real <= c.data_corte THEN 'ENTREGUE'
      ELSE 'EM_ABERTO'
    END AS status_release,
    CASE
      WHEN c.data_real IS NOT NULL AND c.data_real <= c.data_corte THEN 0
      WHEN c.pontos_restantes_acum = 0 THEN 0
      ELSE CEIL(c.pontos_restantes_acum::numeric / NULLIF(c.velocidade_media_5_ultimas, 0))::integer
    END AS sprints_restantes,
    CASE
      WHEN c.data_real IS NOT NULL AND c.data_real <= c.data_corte THEN sp_real.numero::integer
      WHEN c.pontos_restantes_acum = 0 THEN c.num_sprint_ref
      ELSE (c.num_sprint_ref + CEIL(c.pontos_restantes_acum::numeric / NULLIF(c.velocidade_media_5_ultimas, 0))::integer)
    END AS num_sprint_prevista,
    sp_real.id_sprint AS id_sprint_real,
    sp_real.data_fim AS data_fim_sprint_real
  FROM calc c
  LEFT JOIN lume_educacao.sprints sp_real
    ON c.data_real IS NOT NULL AND c.data_real BETWEEN sp_real.data_inicio AND sp_real.data_fim
),
com_data AS (
  SELECT
    pv.corte_codigo,
    pv.data_corte,
    pv.id_release,
    pv.nome_release,
    pv.ordem_release,
    pv.status_release,
    pv.id_sprint_planejada,
    pv.data_planejada,
    pv.data_real,
    pv.id_sprint_ref,
    pv.velocidade_media_5_ultimas,
    pv.itens_restantes_acum,
    pv.pontos_restantes_acum,
    pv.pontos_proprios_restantes,
    pv.sprints_restantes,
    COALESCE(
      CASE WHEN pv.status_release = 'ENTREGUE' THEN pv.id_sprint_real ELSE sp_prev.id_sprint END,
      'S' || LPAD(pv.num_sprint_prevista::text, 2, '0')
    ) AS id_sprint_prevista,
    pv.num_sprint_prevista,
    (pv.num_sprint_prevista - pv.num_sprint_planejada)::integer AS desvio_sprints_vs_base,
    COALESCE(
      CASE WHEN pv.status_release = 'ENTREGUE' THEN pv.data_real ELSE sp_prev.data_fim END,
      ((SELECT data_inicio_s1 FROM param) + ((pv.num_sprint_prevista - 1) * 14 + 11) * INTERVAL '1 day')::date
    ) AS data_prevista_fim_sprint
  FROM previsao pv
  LEFT JOIN lume_educacao.sprints sp_prev ON sp_prev.numero = pv.num_sprint_prevista
)
SELECT
  cd.corte_codigo,
  cd.data_corte,
  cd.id_release,
  cd.nome_release,
  cd.status_release,
  cd.id_sprint_planejada,
  cd.data_planejada,
  cd.data_real,
  cd.id_sprint_ref,
  cd.velocidade_media_5_ultimas,
  cd.itens_restantes_acum,
  cd.pontos_restantes_acum,
  cd.pontos_proprios_restantes,
  cd.sprints_restantes,
  cd.id_sprint_prevista,
  cd.num_sprint_prevista,
  cd.desvio_sprints_vs_base,
  cd.data_prevista_fim_sprint,
  (
    SELECT MAX(cal.data)
    FROM lume_educacao.calendario cal
    WHERE cal.dia_util = 1 AND cal.data <= cd.data_prevista_fim_sprint
  ) AS ultimo_dia_util_previsto,
  (
    SELECT MAX(cal.dia_util_projeto)::integer
    FROM lume_educacao.calendario cal
    WHERE cal.dia_util = 1 AND cal.data <= cd.data_prevista_fim_sprint
  ) AS dia_util_projeto_previsto
FROM com_data cd
ORDER BY cd.corte_codigo, cd.ordem_release;

-- ============================================================================
-- 7. vw_dora_qualidade — 4 métricas DORA (Conv. 13) + defeitos + impedimentos
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_dora_qualidade AS
WITH cortes AS (
  SELECT '2026-10-30'::text AS corte_codigo, DATE '2026-10-30' AS data_corte
  UNION ALL
  SELECT '2026-11-13'::text, DATE '2026-11-13'
  UNION ALL
  SELECT
    'ATUAL'::text,
    GREATEST(
      COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status'), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data_fim) FROM lume_educacao.vw_velocidade_sprints), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.implantacoes), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data_abertura) FROM lume_educacao.defeitos), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.itens_transicoes), DATE '2026-11-13')
    )
),
ambientes AS (
  SELECT 'PRODUCAO'::text AS escopo_ambiente
  UNION ALL
  SELECT 'TODOS'::text
),
sprint_meta AS (
  SELECT
    c.corte_codigo,
    c.data_corte,
    COUNT(vs.*)::integer AS sprints_encerradas,
    (COUNT(vs.*) * 2)::integer AS semanas_ageis
  FROM cortes c
  LEFT JOIN lume_educacao.vw_velocidade_sprints vs ON vs.data_fim <= c.data_corte
  GROUP BY c.corte_codigo, c.data_corte
),
prod_base AS (
  SELECT
    c.corte_codigo,
    COUNT(*) FILTER (WHERE UPPER(TRIM(i.ambiente)) = 'PRODUCAO')::integer AS impl_producao_total,
    COUNT(*) FILTER (WHERE UPPER(TRIM(i.ambiente)) = 'HOMOLOGACAO')::integer AS impl_homologacao_total,
    MIN(i.data) FILTER (WHERE UPPER(TRIM(i.ambiente)) = 'PRODUCAO') AS primeira_prod_data
  FROM cortes c
  LEFT JOIN lume_educacao.implantacoes i ON i.data <= c.data_corte
  GROUP BY c.corte_codigo
),
dora_agg AS (
  SELECT
    c.corte_codigo,
    a.escopo_ambiente,
    COUNT(i.*)::integer AS impl_na_amostra,
    COUNT(i.*) FILTER (WHERE i.falhou = 1)::integer AS impl_falhas,
    ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY i.tempo_ate_producao_h))::numeric, 2) AS lead_time_mudancas_mediana_h,
    ROUND(AVG(i.tempo_ate_producao_h)::numeric, 2) AS lead_time_mudancas_media_h,
    ROUND(100.0 * COUNT(i.*) FILTER (WHERE i.falhou = 1)::numeric / NULLIF(COUNT(i.*), 0), 2) AS taxa_falha_mudancas_pct,
    ROUND((AVG(i.tempo_restauracao_h) FILTER (WHERE i.falhou = 1))::numeric, 2) AS mttr_media_h,
    ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY i.tempo_restauracao_h) FILTER (WHERE i.falhou = 1))::numeric, 2) AS mttr_mediana_h
  FROM cortes c
  CROSS JOIN ambientes a
  LEFT JOIN lume_educacao.implantacoes i
    ON i.data <= c.data_corte
   AND (a.escopo_ambiente = 'TODOS' OR UPPER(TRIM(i.ambiente)) = 'PRODUCAO')
  GROUP BY c.corte_codigo, a.escopo_ambiente
),
def_agg AS (
  SELECT
    c.corte_codigo,
    COUNT(d.*)::integer AS defeitos_totais,
    COUNT(d.*) FILTER (WHERE d.data_resolucao IS NOT NULL AND d.data_resolucao <= c.data_corte)::integer AS defeitos_resolvidos,
    COUNT(d.*) FILTER (WHERE d.data_resolucao IS NULL OR d.data_resolucao > c.data_corte)::integer AS defeitos_abertos,
    COUNT(d.*) FILTER (WHERE UPPER(TRIM(d.ambiente_detectado)) = 'PRODUCAO')::integer AS defeitos_producao,
    COUNT(d.*) FILTER (WHERE UPPER(TRIM(d.ambiente_detectado)) = 'HOMOLOGACAO')::integer AS defeitos_homologacao,
    COUNT(d.*) FILTER (WHERE UPPER(TRIM(d.ambiente_detectado)) = 'TESTE')::integer AS defeitos_teste,
    ROUND(100.0 * COUNT(d.*) FILTER (WHERE UPPER(TRIM(d.ambiente_detectado)) = 'PRODUCAO')::numeric / NULLIF(COUNT(d.*), 0), 1) AS taxa_escape_producao_pct,
    COUNT(d.*) FILTER (WHERE orig.revisao_por_par = 0)::integer AS defeitos_origem_sem_rev_par,
    COUNT(d.*) FILTER (WHERE orig.revisao_por_par = 1)::integer AS defeitos_origem_com_rev_par
  FROM cortes c
  LEFT JOIN lume_educacao.defeitos d ON d.data_abertura <= c.data_corte
  LEFT JOIN lume_educacao.backlog_itens orig ON orig.id_item = d.id_item_origem
  GROUP BY c.corte_codigo
),
imp_agg AS (
  SELECT
    c.corte_codigo,
    COUNT(imp.*)::integer AS impedimentos_totais,
    COUNT(imp.*) FILTER (WHERE imp.data_fechamento IS NULL OR imp.data_fechamento > c.data_corte)::integer AS impedimentos_abertos,
    COALESCE(SUM(imp.dias_uteis_bloqueado) FILTER (WHERE imp.data_fechamento IS NOT NULL AND imp.data_fechamento <= c.data_corte), 0)::integer AS dias_uteis_bloqueados_fechados
  FROM cortes c
  LEFT JOIN lume_educacao.impedimentos imp ON imp.data_abertura <= c.data_corte
  GROUP BY c.corte_codigo
)
SELECT
  sm.corte_codigo,
  sm.data_corte,
  da.escopo_ambiente,
  sm.sprints_encerradas,
  sm.semanas_ageis,
  ROUND(((sm.data_corte - pb.primeira_prod_data)::numeric / 7.0), 2) AS semanas_pos_primeira_prod,
  pb.impl_producao_total,
  pb.impl_homologacao_total,
  da.impl_na_amostra,
  da.impl_falhas,
  ROUND(pb.impl_producao_total::numeric / NULLIF(sm.semanas_ageis, 0), 3) AS freq_prod_por_sem_ageis,
  ROUND(pb.impl_producao_total::numeric / NULLIF((sm.data_corte - pb.primeira_prod_data)::numeric / 7.0, 0), 3) AS freq_prod_por_sem_pos_r1,
  da.lead_time_mudancas_mediana_h,
  da.lead_time_mudancas_media_h,
  da.taxa_falha_mudancas_pct,
  da.mttr_media_h,
  da.mttr_mediana_h,
  df.defeitos_totais,
  df.defeitos_resolvidos,
  df.defeitos_abertos,
  df.defeitos_producao,
  df.defeitos_homologacao,
  df.defeitos_teste,
  df.taxa_escape_producao_pct,
  df.defeitos_origem_sem_rev_par,
  df.defeitos_origem_com_rev_par,
  ia.impedimentos_totais,
  ia.impedimentos_abertos,
  ia.dias_uteis_bloqueados_fechados
FROM sprint_meta sm
JOIN prod_base pb ON pb.corte_codigo = sm.corte_codigo
JOIN dora_agg da ON da.corte_codigo = sm.corte_codigo
JOIN def_agg df ON df.corte_codigo = sm.corte_codigo
JOIN imp_agg ia ON ia.corte_codigo = sm.corte_codigo
ORDER BY sm.corte_codigo, da.escopo_ambiente;

-- ============================================================================
-- 8. vw_fluxo_agil_dora — Painel consolidado R7/R8 (cortes 30/10, 13/11, ATUAL)
-- ============================================================================
CREATE OR REPLACE VIEW lume_educacao.vw_fluxo_agil_dora AS
WITH cortes AS (
  SELECT '2026-10-30'::text AS corte_codigo, DATE '2026-10-30' AS data_corte
  UNION ALL
  SELECT '2026-11-13'::text, DATE '2026-11-13'
  UNION ALL
  SELECT
    'ATUAL'::text,
    GREATEST(
      COALESCE((SELECT valor::date FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status'), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data_fim) FROM lume_educacao.vw_velocidade_sprints), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.implantacoes), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data_abertura) FROM lume_educacao.defeitos), DATE '2026-11-13'),
      COALESCE((SELECT MAX(data) FROM lume_educacao.itens_transicoes), DATE '2026-11-13')
    )
),
ult_sprint AS (
  SELECT DISTINCT ON (c.corte_codigo)
    c.corte_codigo,
    c.data_corte,
    vs.*
  FROM cortes c
  JOIN lume_educacao.vw_velocidade_sprints vs ON vs.data_fim <= c.data_corte
  ORDER BY c.corte_codigo, vs.numero DESC
),
lt_ct_global AS (
  SELECT
    c.corte_codigo,
    COUNT(*) FILTER (WHERE lct.data_conclusao <= c.data_corte)::integer AS itens_concluidos_global,
    ROUND(AVG(lct.cycle_time_du) FILTER (WHERE lct.data_conclusao <= c.data_corte)::numeric, 2) AS ct_global_medio_du,
    ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY lct.cycle_time_du) FILTER (WHERE lct.data_conclusao <= c.data_corte))::numeric, 2) AS ct_global_p50_du,
    ROUND((PERCENTILE_CONT(0.85) WITHIN GROUP (ORDER BY lct.cycle_time_du) FILTER (WHERE lct.data_conclusao <= c.data_corte))::numeric, 2) AS ct_global_p85_du,
    ROUND(AVG(lct.lead_time_du) FILTER (WHERE lct.data_conclusao <= c.data_corte)::numeric, 2) AS lt_global_medio_du,
    ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY lct.lead_time_du) FILTER (WHERE lct.data_conclusao <= c.data_corte))::numeric, 2) AS lt_global_p50_du,
    ROUND((PERCENTILE_CONT(0.85) WITHIN GROUP (ORDER BY lct.lead_time_du) FILTER (WHERE lct.data_conclusao <= c.data_corte))::numeric, 2) AS lt_global_p85_du,
    COUNT(*) FILTER (WHERE lct.primeira_revisao_data <= c.data_corte)::integer AS itens_revisados_global,
    COUNT(*) FILTER (WHERE lct.primeira_revisao_data <= c.data_corte AND lct.revisao_por_par = 1)::integer AS itens_com_rev_par_global,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE lct.primeira_revisao_data <= c.data_corte AND lct.revisao_por_par = 1)::numeric
      / NULLIF(COUNT(*) FILTER (WHERE lct.primeira_revisao_data <= c.data_corte), 0),
      1
    ) AS aderencia_rev_par_global_pct
  FROM cortes c
  CROSS JOIN lume_educacao.vw_lead_cycle_time_itens lct
  GROUP BY c.corte_codigo
)
SELECT
  us.corte_codigo,
  us.data_corte,
  us.id_sprint AS sprint_referencia,
  us.numero AS num_sprint_referencia,
  us.pts_comprometidos AS pts_comprometidos_sprint,
  us.velocidade_pts AS velocidade_sprint_pts,
  us.itens_concluidos AS itens_concluidos_sprint,
  us.velocidade_media_5_ultimas,
  us.janela_mm5_sprints,
  us.pts_concluidos_acum,
  us.itens_concluidos_acum,
  us.vazao_itens_por_du AS vazao_sprint_itens_du,
  us.cycle_time_medio_du AS ct_sprint_medio_du,
  us.wip_medio_little AS wip_little_sprint,
  us.wip_diario_medio_observado AS wip_observado_medio_sprint,
  us.wip_fim_sprint,
  us.itens_em_revisao_sprint,
  us.itens_revisados_por_par_sprint,
  us.aderencia_revisao_par_pct AS aderencia_rev_par_sprint_pct,
  lg.ct_global_medio_du,
  lg.ct_global_p50_du,
  lg.ct_global_p85_du,
  lg.lt_global_medio_du,
  lg.lt_global_p50_du,
  lg.lt_global_p85_du,
  lg.itens_revisados_global,
  lg.itens_com_rev_par_global,
  lg.aderencia_rev_par_global_pct,
  r2.pontos_restantes_acum AS r2_pontos_restantes,
  r2.sprints_restantes AS r2_sprints_restantes,
  r2.id_sprint_prevista AS r2_sprint_prevista,
  r2.data_prevista_fim_sprint AS r2_data_prevista,
  r2.dia_util_projeto_previsto AS r2_du_projeto_previsto,
  r2.desvio_sprints_vs_base AS r2_desvio_sprints,
  r3.pontos_restantes_acum AS r3_pontos_restantes,
  r3.sprints_restantes AS r3_sprints_restantes,
  r3.id_sprint_prevista AS r3_sprint_prevista,
  r3.data_prevista_fim_sprint AS r3_data_prevista,
  r3.dia_util_projeto_previsto AS r3_du_projeto_previsto,
  r3.desvio_sprints_vs_base AS r3_desvio_sprints,
  cfd.total_itens_backlog AS cfd_total_backlog,
  cfd.a_fazer_total AS cfd_a_fazer,
  cfd.em_andamento AS cfd_em_andamento,
  cfd.em_revisao AS cfd_em_revisao,
  cfd.em_teste AS cfd_em_teste,
  cfd.concluido AS cfd_concluido,
  dq.escopo_ambiente AS dora_escopo_padrao,
  dq.freq_prod_por_sem_ageis AS dora_freq_prod_sem_ageis,
  dq.freq_prod_por_sem_pos_r1 AS dora_freq_prod_sem_pos_r1,
  dq.lead_time_mudancas_mediana_h AS dora_lead_time_mudancas_h,
  dq.taxa_falha_mudancas_pct AS dora_taxa_falha_pct,
  dq.mttr_media_h AS dora_mttr_h,
  dq.defeitos_totais,
  dq.defeitos_abertos,
  dq.defeitos_producao,
  dq.taxa_escape_producao_pct,
  dq.impedimentos_totais,
  dq.impedimentos_abertos
FROM ult_sprint us
JOIN lt_ct_global lg ON lg.corte_codigo = us.corte_codigo
LEFT JOIN lume_educacao.vw_previsao_releases r2
  ON r2.corte_codigo = us.corte_codigo AND r2.id_release = 'R2'
LEFT JOIN lume_educacao.vw_previsao_releases r3
  ON r3.corte_codigo = us.corte_codigo AND r3.id_release = 'R3'
LEFT JOIN LATERAL (
  SELECT *
  FROM lume_educacao.vw_cfd_diario cfd
  WHERE cfd.data <= us.data_corte
  ORDER BY cfd.data DESC
  LIMIT 1
) cfd ON TRUE
LEFT JOIN lume_educacao.vw_dora_qualidade dq
  ON dq.corte_codigo = us.corte_codigo AND dq.escopo_ambiente = 'PRODUCAO'
ORDER BY us.data_corte, us.corte_codigo;
