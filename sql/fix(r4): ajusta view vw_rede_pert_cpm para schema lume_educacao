-- ============================================================================
-- Ticket 2.3 M1 / R4 — View SQL Reativa: lume_educacao.vw_rede_pert_cpm
-- Projeto: Lume Educacao (Grupo 4) | Responsavel: Nara Pereira Sousa
-- ============================================================================

CREATE OR REPLACE VIEW lume_educacao.vw_rede_pert_cpm AS
WITH RECURSIVE
base AS (
  SELECT
    a.id_atividade,
    a.codigo_eap,
    a.nome_atividade,
    a.disciplina,
    a.tipo_atividade,
    CASE
      WHEN UPPER(TRIM(a.tipo_atividade)) = 'MARCO_AGIL' OR a.duracao_fixa_du IS NOT NULL
        THEN a.duracao_fixa_du::INTEGER
      ELSE CEIL((a.duracao_otimista_du + 4.0 * a.duracao_mais_provavel_du + a.duracao_pessimista_du) / 6.0)::INTEGER
    END AS duracao_du,
    CASE
      WHEN UPPER(TRIM(a.tipo_atividade)) = 'MARCO_AGIL' OR a.duracao_fixa_du IS NOT NULL
        THEN 0.0::NUMERIC
      ELSE ROUND(((a.duracao_pessimista_du - a.duracao_otimista_du) / 6.0)::NUMERIC, 4)
    END AS desvio_padrao_du
  FROM lume_educacao.atividades a
),
ida_caminhos AS (
  SELECT
    b.id_atividade,
    1::INTEGER AS es,
    b.duracao_du::INTEGER AS ef,
    0::INTEGER AS depth
  FROM base b
  WHERE NOT EXISTS (
    SELECT 1 FROM lume_educacao.dependencias d WHERE d.id_sucessora = b.id_atividade
  )
  UNION ALL
  SELECT
    b.id_atividade,
    (CASE
      WHEN UPPER(TRIM(d.tipo_dependencia)) = 'TI' THEN c.ef + 1 + COALESCE(d.defasagem_du, 0)
      ELSE c.es + COALESCE(d.defasagem_du, 0)
    END)::INTEGER AS es,
    ((CASE
      WHEN UPPER(TRIM(d.tipo_dependencia)) = 'TI' THEN c.ef + 1 + COALESCE(d.defasagem_du, 0)
      ELSE c.es + COALESCE(d.defasagem_du, 0)
    END) + b.duracao_du - 1)::INTEGER AS ef,
    (c.depth + 1)::INTEGER AS depth
  FROM ida_caminhos c
  JOIN lume_educacao.dependencias d ON d.id_predecessora = c.id_atividade
  JOIN base b ON b.id_atividade = d.id_sucessora
  WHERE c.depth < 60
),
ida AS (
  SELECT
    b.id_atividade,
    b.codigo_eap,
    b.nome_atividade,
    b.disciplina,
    b.tipo_atividade,
    b.duracao_du,
    b.desvio_padrao_du,
    MAX(c.es) AS es,
    MAX(c.ef) AS ef
  FROM base b
  JOIN ida_caminhos c ON c.id_atividade = b.id_atividade
  GROUP BY b.id_atividade, b.codigo_eap, b.nome_atividade, b.disciplina, b.tipo_atividade, b.duracao_du, b.desvio_padrao_du
),
prazo AS (
  SELECT MAX(ef) AS prazo_total_du FROM ida
),
volta_caminhos AS (
  SELECT
    i.id_atividade,
    (p.prazo_total_du - i.duracao_du + 1)::INTEGER AS ls,
    p.prazo_total_du::INTEGER AS lf,
    0::INTEGER AS depth
  FROM ida i
  CROSS JOIN prazo p
  WHERE NOT EXISTS (
    SELECT 1 FROM lume_educacao.dependencias d WHERE d.id_predecessora = i.id_atividade
  )
  UNION ALL
  SELECT
    i.id_atividade,
    (CASE
      WHEN UPPER(TRIM(d.tipo_dependencia)) = 'TI' THEN (v.ls - 1 - COALESCE(d.defasagem_du, 0)) - i.duracao_du + 1
      ELSE v.ls - COALESCE(d.defasagem_du, 0)
    END)::INTEGER AS ls,
    ((CASE
      WHEN UPPER(TRIM(d.tipo_dependencia)) = 'TI' THEN (v.ls - 1 - COALESCE(d.defasagem_du, 0)) - i.duracao_du + 1
      ELSE v.ls - COALESCE(d.defasagem_du, 0)
    END) + i.duracao_du - 1)::INTEGER AS lf,
    (v.depth + 1)::INTEGER AS depth
  FROM volta_caminhos v
  JOIN lume_educacao.dependencias d ON d.id_sucessora = v.id_atividade
  JOIN ida i ON i.id_atividade = d.id_predecessora
  WHERE v.depth < 60
),
volta AS (
  SELECT
    id_atividade,
    MIN(ls) AS ls,
    MIN(lf) AS lf
  FROM volta_caminhos
  GROUP BY id_atividade
),
folga_livre AS (
  SELECT
    i.id_atividade,
    GREATEST(
      0,
      COALESCE(
        MIN(
          CASE
            WHEN UPPER(TRIM(d.tipo_dependencia)) = 'TI' THEN s.es - 1 - COALESCE(d.defasagem_du, 0) - i.ef
            ELSE s.es - COALESCE(d.defasagem_du, 0) - i.es
          END
        ),
        p.prazo_total_du - i.ef
      )
    )::INTEGER AS fl
  FROM ida i
  CROSS JOIN prazo p
  LEFT JOIN lume_educacao.dependencias d ON d.id_predecessora = i.id_atividade
  LEFT JOIN ida s ON s.id_atividade = d.id_sucessora
  GROUP BY i.id_atividade, i.ef, p.prazo_total_du
)
SELECT
  i.id_atividade,
  i.codigo_eap,
  i.nome_atividade,
  i.disciplina,
  i.tipo_atividade,
  i.duracao_du,
  i.desvio_padrao_du,
  i.es,
  i.ef,
  v.ls,
  v.lf,
  (v.ls - i.es) AS ft,
  fl.fl,
  ((v.ls - i.es) = 0) AS e_critica,
  p.prazo_total_du
FROM ida i
JOIN volta v ON v.id_atividade = i.id_atividade
JOIN folga_livre fl ON fl.id_atividade = i.id_atividade
CROSS JOIN prazo p
ORDER BY i.id_atividade;
