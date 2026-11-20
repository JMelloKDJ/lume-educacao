-- Lume Educação (ENGN62 — Grupo 4)
-- Fechamento da quinzena de campo: 03/11/2026 a 13/11/2026 (Boletins B1 a B10)
-- Uso: executar somente após aprovação explícita do Ponto de Aprovação 2.
-- Observações de rastreabilidade (sem invenção de dados):
--   1. B5 não informa valor_de_negocio nem ordem_no_backlog para LU-235..LU-241 -> gravados como NULL.
--   2. B5 traz títulos truncados com "…" nos 5 BUGs -> reconstruídos pelo título exato do item de origem (LU-148, LU-225, LU-150), sem inventar sufixo de sintoma.
--   3. B9 traz 2 medições por KR (12 linhas): 1ª linha de cada par = 2026-10-31 (comprovada por funil_piloto_semanal de out/26: 974 ativos, NPS 52, ativação 48,0%, 6,6 chamados/100); 2ª linha = 2026-11-13 (1.085 ativos, NPS 46, ativação 56,5%, 4,7 chamados/100).

BEGIN;

-- ============================================================================
-- B1. avanco_semanal (+4 linhas: 173 -> 177)
-- ============================================================================
INSERT INTO lume_educacao.avanco_semanal
  (semana_fim, id_atividade, avanco_acumulado_pct, situacao, data_inicio_real, data_termino_real, id_responsavel)
VALUES
  (DATE '2026-11-06', 'A18', 100, 'CONCLUIDA',    DATE '2026-09-22', DATE '2026-11-05', 'P07'),
  (DATE '2026-11-06', 'A27',  95, 'EM_ANDAMENTO', DATE '2026-08-10', NULL,              'P09'),
  (DATE '2026-11-13', 'A19',  80, 'EM_ANDAMENTO', DATE '2026-11-10', NULL,              'P07'),
  (DATE '2026-11-13', 'A27', 100, 'CONCLUIDA',    DATE '2026-08-10', DATE '2026-11-13', 'P09');

-- ============================================================================
-- B2. apontamento_horas (+22 linhas: 425 -> 447 | +733,5 h: 12.359,0 -> 13.092,5 h)
-- ============================================================================
INSERT INTO lume_educacao.apontamento_horas
  (semana_inicio, id_pessoa, tipo_item, id_item, horas_normais, horas_extras)
VALUES
  -- Semana de 02/11/2026 (324,0 h)
  (DATE '2026-11-02', 'P01', 'GESTAO',    'GESTAO', 32.0, 0.0),
  (DATE '2026-11-02', 'P02', 'GESTAO',    'GESTAO', 32.0, 0.0),
  (DATE '2026-11-02', 'P07', 'ATIVIDADE', 'A18',    12.5, 0.0),
  (DATE '2026-11-02', 'P09', 'ATIVIDADE', 'A27',    23.5, 0.0),
  (DATE '2026-11-02', 'P11', 'SPRINT',    'S14',    32.0, 0.0),
  (DATE '2026-11-02', 'P12', 'SPRINT',    'S14',    32.0, 0.0),
  (DATE '2026-11-02', 'P13', 'SPRINT',    'S14',    32.0, 0.0),
  (DATE '2026-11-02', 'P15', 'SPRINT',    'S14',    32.0, 0.0),
  (DATE '2026-11-02', 'P16', 'SPRINT',    'S14',    32.0, 0.0),
  (DATE '2026-11-02', 'P17', 'SPRINT',    'S14',    32.0, 0.0),
  (DATE '2026-11-02', 'P18', 'SPRINT',    'S14',    32.0, 0.0),
  -- Semana de 09/11/2026 (409,5 h)
  (DATE '2026-11-09', 'P01', 'GESTAO',    'GESTAO', 40.0, 0.0),
  (DATE '2026-11-09', 'P02', 'GESTAO',    'GESTAO', 40.0, 0.0),
  (DATE '2026-11-09', 'P07', 'ATIVIDADE', 'A19',    20.0, 0.0),
  (DATE '2026-11-09', 'P09', 'ATIVIDADE', 'A27',    29.5, 0.0),
  (DATE '2026-11-09', 'P11', 'SPRINT',    'S14',    40.0, 0.0),
  (DATE '2026-11-09', 'P12', 'SPRINT',    'S14',    40.0, 0.0),
  (DATE '2026-11-09', 'P13', 'SPRINT',    'S14',    40.0, 0.0),
  (DATE '2026-11-09', 'P15', 'SPRINT',    'S14',    40.0, 0.0),
  (DATE '2026-11-09', 'P16', 'SPRINT',    'S14',    40.0, 0.0),
  (DATE '2026-11-09', 'P17', 'SPRINT',    'S14',    40.0, 0.0),
  (DATE '2026-11-09', 'P18', 'SPRINT',    'S14',    40.0, 0.0);

-- ============================================================================
-- B3. contratos_medicoes (+1 linha: 55 -> 56) e custos_realizados (+5 linhas: 118 -> 123)
-- ============================================================================
INSERT INTO lume_educacao.contratos_medicoes
  (id_medicao, id_contrato, id_atividade, descricao_marco, data_prevista, valor_previsto_rs, data_real, valor_pago_rs, aceite, nao_conformidades)
VALUES
  ('MED-CT06-04', 'CT06', 'A18', 'Medição de 11/2026 — Distribuir e instalar nos pontos', DATE '2026-11-05', 4871.51, DATE '2026-11-05', 5151.77, 'APROVADO', 0);

INSERT INTO lume_educacao.custos_realizados
  (id_lancamento, data, frente, categoria_custo, id_atividade, codigo_eap, id_contrato, id_fornecedor, documento, descricao, valor_rs)
VALUES
  ('L00119', DATE '2026-11-05', 'PREDITIVA', 'SERVICO_CONTRATADO', 'A18', '1.3.2', 'CT06', 'F06', 'MED-CT06-04',    'Medição de 11/2026 — Distribuir e instalar nos pontos',                  5151.77),
  ('L00120', DATE '2026-11-05', 'GESTAO',    'INDIRETO',           NULL,  NULL,    NULL,   NULL,  'NF-GES-2611-45', 'Escritório do projeto, veículos e comunicação',                          8408.09),
  ('L00121', DATE '2026-11-10', 'PREDITIVA', 'OUTROS',             'A19', '1.3.2', NULL,   NULL,  'NF-A19-001',     'Taxas, viagens e despesas — Testar os pontos instalados por amostragem', 2377.93),
  ('L00122', DATE '2026-11-10', 'AGIL',      'LICENCAS_E_NUVEM',   NULL,  NULL,    'CT02', 'F02', 'NF-NUV-2611',    'Nuvem, licenças e ferramentas do time',                                 44597.25),
  ('L00123', DATE '2026-11-12', 'GESTAO',    'INDIRETO',           NULL,  NULL,    NULL,   NULL,  'NF-GES-2611-30', 'Seguros, taxas e auditorias',                                            5845.96);

-- ============================================================================
-- B4. inspecoes_aceite (+2 linhas: 70 -> 72)
-- ============================================================================
INSERT INTO lume_educacao.inspecoes_aceite
  (id_inspecao, data, id_atividade, tipo_inspecao, itens_verificados, itens_nao_conformes, resultado, id_fornecedor, horas_retrabalho, custo_retrabalho_rs)
VALUES
  ('IN-071', DATE '2026-11-03', 'A18', 'LISTA_DE_VERIFICACAO', 29, 1, 'APROVADO',              'F06',  3.2,  360.39),
  ('IN-072', DATE '2026-11-11', 'A27', 'LISTA_DE_VERIFICACAO', 35, 3, 'APROVADO_COM_RESSALVA', NULL,  22.9, 3018.74);

-- ============================================================================
-- B5. sprints (1 UPDATE em S14), backlog_itens (+7 INSERTs: 134 -> 141),
--     sprint_itens (+13 INSERTs), defeitos (+5 INSERTs + 1 UPDATE em DF-032)
-- ============================================================================
UPDATE lume_educacao.sprints
SET
  pessoas_dia_disponiveis  = 27,
  horas_extras_autorizadas = 'NAO',
  meta_da_sprint           = 'Avançar o épico Tutor com IA'
WHERE id_sprint = 'S14';

-- 7 novos itens do backlog (estado final em 13/11/2026 já consolidado com B6)
INSERT INTO lume_educacao.backlog_itens
  (id_item, id_epico, tipo_item, titulo, historia_de_usuario, pontos, prioridade_moscow, valor_de_negocio, ordem_no_backlog, id_release, origem, id_mudanca, id_solicitante, data_criacao, status, id_sprint_atual, id_responsavel, revisao_por_par, data_inicio, data_conclusao)
VALUES
  ('LU-235', 'EP05', 'HISTORIA', 'Criar uma tela de novidades do mês',                                                          NULL, 3, 'SHOULD', NULL, NULL, 'R2', 'PEDIDO_DIRETO', NULL, 'PI02', DATE '2026-11-03', 'CONCLUIDO',    'S14', 'P15', 1,    DATE '2026-11-03', DATE '2026-11-06'),
  ('LU-236', 'EP05', 'BUG',      'Corrigir a falha em: Configurar o monitoramento e os registros: Trilhas e gamificação',        NULL, 1, 'MUST',   NULL, NULL, 'R2', 'DEFEITO',       NULL, NULL,   DATE '2026-11-03', 'A_FAZER',      NULL,  NULL,  NULL, NULL,              NULL),
  ('LU-237', 'EP05', 'BUG',      'Corrigir a falha em: Configurar o monitoramento e os registros: Trilhas e gamificação',        NULL, 2, 'MUST',   NULL, NULL, 'R2', 'DEFEITO',       NULL, NULL,   DATE '2026-11-03', 'A_FAZER',      NULL,  NULL,  NULL, NULL,              NULL),
  ('LU-238', 'EP05', 'BUG',      'Corrigir a falha em: Configurar o monitoramento e os registros: Trilhas e gamificação',        NULL, 1, 'MUST',   NULL, NULL, 'R2', 'DEFEITO',       NULL, NULL,   DATE '2026-11-03', 'A_FAZER',      NULL,  NULL,  NULL, NULL,              NULL),
  ('LU-239', 'EP02', 'HISTORIA', 'Personalizar as cores para um cliente grande',                                                 NULL, 8, 'SHOULD', NULL, NULL, 'R2', 'PEDIDO_DIRETO', NULL, 'PI02', DATE '2026-11-05', 'EM_ANDAMENTO', 'S14', 'P15', NULL, DATE '2026-11-06', NULL),
  ('LU-240', 'EP01', 'BUG',      'Corrigir a falha em: Adicionar exportação para o sistema contábil',                            NULL, 1, 'MUST',   NULL, NULL, 'R2', 'DEFEITO',       NULL, NULL,   DATE '2026-11-11', 'A_FAZER',      NULL,  NULL,  NULL, NULL,              NULL),
  ('LU-241', 'EP04', 'BUG',      'Corrigir a falha em: Automatizar os testes: Correção de redação',                              NULL, 1, 'MUST',   NULL, NULL, 'R2', 'DEFEITO',       NULL, NULL,   DATE '2026-11-11', 'A_FAZER',      NULL,  NULL,  NULL, NULL,              NULL);

-- 13 itens na Sprint S14 (5 concluídos = 17 pontos: LU-152, LU-153, LU-233, LU-234, LU-235)
INSERT INTO lume_educacao.sprint_itens
  (id_sprint, id_item, pontos, origem_na_sprint, concluido_na_sprint)
VALUES
  ('S14', 'LU-152', 5, 'TRANSBORDO',         1),
  ('S14', 'LU-153', 3, 'TRANSBORDO',         1),
  ('S14', 'LU-233', 5, 'TRANSBORDO',         1),
  ('S14', 'LU-234', 1, 'PLANEJAMENTO',       1),
  ('S14', 'LU-154', 5, 'PLANEJAMENTO',       0),
  ('S14', 'LU-155', 3, 'PLANEJAMENTO',       0),
  ('S14', 'LU-156', 3, 'PLANEJAMENTO',       0),
  ('S14', 'LU-157', 2, 'PLANEJAMENTO',       0),
  ('S14', 'LU-158', 3, 'PLANEJAMENTO',       0),
  ('S14', 'LU-159', 8, 'PLANEJAMENTO',       0),
  ('S14', 'LU-160', 3, 'PLANEJAMENTO',       0),
  ('S14', 'LU-235', 3, 'ADICIONADO_DURANTE', 1),
  ('S14', 'LU-239', 8, 'ADICIONADO_DURANTE', 0);

-- 5 novos defeitos + encerramento de DF-032 (LU-234 concluído em 05/11/2026)
INSERT INTO lume_educacao.defeitos
  (id_defeito, id_item_defeito, id_item_origem, severidade, ambiente_detectado, data_abertura, data_resolucao)
VALUES
  ('DF-033', 'LU-236', 'LU-148', 'MEDIA', 'TESTE',    DATE '2026-11-03', NULL),
  ('DF-034', 'LU-237', 'LU-148', 'MEDIA', 'PRODUCAO', DATE '2026-11-03', NULL),
  ('DF-035', 'LU-238', 'LU-148', 'MEDIA', 'TESTE',    DATE '2026-11-03', NULL),
  ('DF-036', 'LU-240', 'LU-225', 'BAIXA', 'TESTE',    DATE '2026-11-11', NULL),
  ('DF-037', 'LU-241', 'LU-150', 'MEDIA', 'TESTE',    DATE '2026-11-11', NULL);

UPDATE lume_educacao.defeitos
SET data_resolucao = DATE '2026-11-05'
WHERE id_defeito = 'DF-032' AND id_item_defeito = 'LU-234';

-- ============================================================================
-- B6. itens_transicoes (+25 linhas: 424 -> 449) + UPDATE nos itens pré-existentes da S14 em backlog_itens
-- ============================================================================
INSERT INTO lume_educacao.itens_transicoes
  (id_transicao, id_item, data, status_origem, status_destino, id_pessoa)
VALUES
  ('T00425', 'LU-235', DATE '2026-11-03', 'A_FAZER',      'EM_ANDAMENTO', 'P15'),
  ('T00426', 'LU-234', DATE '2026-11-03', 'A_FAZER',      'EM_ANDAMENTO', 'P16'),
  ('T00427', 'LU-234', DATE '2026-11-03', 'EM_ANDAMENTO', 'EM_REVISAO',   'P16'),
  ('T00428', 'LU-153', DATE '2026-11-03', 'EM_ANDAMENTO', 'EM_REVISAO',   'P18'),
  ('T00429', 'LU-153', DATE '2026-11-03', 'EM_REVISAO',   'EM_TESTE',     'P18'),
  ('T00430', 'LU-234', DATE '2026-11-03', 'EM_REVISAO',   'EM_TESTE',     'P16'),
  ('T00431', 'LU-154', DATE '2026-11-04', 'A_FAZER',      'EM_ANDAMENTO', 'P16'),
  ('T00432', 'LU-155', DATE '2026-11-04', 'A_FAZER',      'EM_ANDAMENTO', 'P18'),
  ('T00433', 'LU-233', DATE '2026-11-04', 'EM_TESTE',     'CONCLUIDO',    'P17'),
  ('T00434', 'LU-235', DATE '2026-11-05', 'EM_ANDAMENTO', 'EM_REVISAO',   'P15'),
  ('T00435', 'LU-153', DATE '2026-11-05', 'EM_TESTE',     'CONCLUIDO',    'P17'),
  ('T00436', 'LU-234', DATE '2026-11-05', 'EM_TESTE',     'CONCLUIDO',    'P17'),
  ('T00437', 'LU-239', DATE '2026-11-06', 'A_FAZER',      'EM_ANDAMENTO', 'P15'),
  ('T00438', 'LU-156', DATE '2026-11-06', 'A_FAZER',      'EM_ANDAMENTO', 'P16'),
  ('T00439', 'LU-235', DATE '2026-11-06', 'EM_REVISAO',   'EM_TESTE',     'P15'),
  ('T00440', 'LU-235', DATE '2026-11-06', 'EM_TESTE',     'CONCLUIDO',    'P17'),
  ('T00441', 'LU-152', DATE '2026-11-09', 'EM_ANDAMENTO', 'EM_REVISAO',   'P18'),
  ('T00442', 'LU-152', DATE '2026-11-09', 'EM_REVISAO',   'EM_TESTE',     'P18'),
  ('T00443', 'LU-157', DATE '2026-11-10', 'A_FAZER',      'EM_ANDAMENTO', 'P18'),
  ('T00444', 'LU-152', DATE '2026-11-11', 'EM_TESTE',     'CONCLUIDO',    'P17'),
  ('T00445', 'LU-157', DATE '2026-11-12', 'EM_ANDAMENTO', 'EM_REVISAO',   'P18'),
  ('T00446', 'LU-157', DATE '2026-11-12', 'EM_REVISAO',   'EM_TESTE',     'P18'),
  ('T00447', 'LU-157', DATE '2026-11-12', 'EM_TESTE',     'EM_ANDAMENTO', 'P17'),
  ('T00448', 'LU-156', DATE '2026-11-13', 'EM_ANDAMENTO', 'EM_REVISAO',   'P16'),
  ('T00449', 'LU-156', DATE '2026-11-13', 'EM_REVISAO',   'EM_TESTE',     'P16');

-- Atualização dos 11 itens pré-existentes que entraram na S14
UPDATE lume_educacao.backlog_itens
SET status = 'CONCLUIDO', id_sprint_atual = 'S14', id_responsavel = 'P18', revisao_por_par = 0, data_conclusao = DATE '2026-11-11'
WHERE id_item = 'LU-152';

UPDATE lume_educacao.backlog_itens
SET status = 'CONCLUIDO', id_sprint_atual = 'S14', id_responsavel = 'P18', revisao_por_par = 0, data_conclusao = DATE '2026-11-05'
WHERE id_item = 'LU-153';

UPDATE lume_educacao.backlog_itens
SET status = 'CONCLUIDO', id_sprint_atual = 'S14', data_conclusao = DATE '2026-11-04'
WHERE id_item = 'LU-233';

UPDATE lume_educacao.backlog_itens
SET status = 'CONCLUIDO', id_sprint_atual = 'S14', id_responsavel = 'P16', revisao_por_par = 0, data_inicio = DATE '2026-11-03', data_conclusao = DATE '2026-11-05'
WHERE id_item = 'LU-234';

UPDATE lume_educacao.backlog_itens
SET status = 'EM_ANDAMENTO', id_sprint_atual = 'S14', id_responsavel = 'P16', data_inicio = DATE '2026-11-04'
WHERE id_item = 'LU-154';

UPDATE lume_educacao.backlog_itens
SET status = 'EM_ANDAMENTO', id_sprint_atual = 'S14', id_responsavel = 'P18', data_inicio = DATE '2026-11-04'
WHERE id_item = 'LU-155';

UPDATE lume_educacao.backlog_itens
SET status = 'EM_TESTE', id_sprint_atual = 'S14', id_responsavel = 'P16', revisao_por_par = 0, data_inicio = DATE '2026-11-06'
WHERE id_item = 'LU-156';

UPDATE lume_educacao.backlog_itens
SET status = 'EM_ANDAMENTO', id_sprint_atual = 'S14', id_responsavel = 'P18', revisao_por_par = 0, data_inicio = DATE '2026-11-10'
WHERE id_item = 'LU-157';

UPDATE lume_educacao.backlog_itens
SET id_sprint_atual = 'S14'
WHERE id_item IN ('LU-158', 'LU-159', 'LU-160');

-- ============================================================================
-- B7. impedimentos (+2 INSERTs + 1 UPDATE em IP-010) e implantacoes (+5 INSERTs)
-- ============================================================================
INSERT INTO lume_educacao.impedimentos
  (id_impedimento, id_item, data_abertura, data_fechamento, tipo_impedimento, dias_uteis_bloqueado, id_pessoa)
VALUES
  ('IP-011', 'LU-155', DATE '2026-11-04', DATE '2026-11-12', 'DEPENDENCIA_EXTERNA',   6, 'P18'),
  ('IP-012', 'LU-154', DATE '2026-11-05', DATE '2026-11-13', 'AMBIENTE_INDISPONIVEL', 6, 'P16');

UPDATE lume_educacao.impedimentos
SET data_fechamento = DATE '2026-11-05', dias_uteis_bloqueado = 7
WHERE id_impedimento = 'IP-010' AND id_item = 'LU-152';

INSERT INTO lume_educacao.implantacoes
  (id_implantacao, data, id_sprint, ambiente, versao, itens_implantados, tempo_ate_producao_h, falhou, tempo_restauracao_h)
VALUES
  ('IMP-051', DATE '2026-11-04', 'S14', 'HOMOLOGACAO', '1.51', 1, 26.5, 1, 2.9),
  ('IMP-052', DATE '2026-11-06', 'S14', 'HOMOLOGACAO', '1.52', 3, 35.3, 1, 0.7),
  ('IMP-053', DATE '2026-11-09', 'S14', 'HOMOLOGACAO', '1.53', 3, 17.4, 0, NULL),
  ('IMP-054', DATE '2026-11-09', 'S14', 'HOMOLOGACAO', '1.54', 4, 62.5, 0, NULL),
  ('IMP-055', DATE '2026-11-12', 'S14', 'PRODUCAO',    '1.55', 1, 38.4, 1, 2.6);

-- ============================================================================
-- B8. Riscos e mudanças: 0 registros na quinzena (confirmado pelo boletim)
-- ============================================================================

-- ============================================================================
-- B9. reunioes (+6), engajamento_mensal (+13), pulso_equipe (+1), okr_medicoes (+12)
-- ============================================================================
INSERT INTO lume_educacao.reunioes
  (id_reuniao, data, tipo_reuniao, duracao_min, convidados, presentes, patrocinador_presente, decisoes_tomadas, pendencias_abertas, ata_publicada)
VALUES
  ('RE-081', DATE '2026-11-03', 'PLANEJAMENTO_DA_SPRINT', 120,  8,  8, 0, 1, 0, 1),
  ('RE-082', DATE '2026-11-03', 'STATUS_SEMANAL',          60,  9,  8, 0, 3, 4, 1),
  ('RE-083', DATE '2026-11-10', 'STATUS_SEMANAL',          60, 10,  8, 0, 2, 5, 1),
  ('RE-084', DATE '2026-11-12', 'COMITE_DIRETOR',         120,  7,  5, 0, 2, 7, 1),
  ('RE-085', DATE '2026-11-13', 'RETROSPECTIVA',           60,  8,  8, 0, 2, 1, 1),
  ('RE-086', DATE '2026-11-13', 'REVISAO_DA_SPRINT',       60, 11, 10, 0, 1, 2, 1);

INSERT INTO lume_educacao.engajamento_mensal
  (mes, id_parte, nivel_engajamento, satisfacao, interacoes_no_mes)
VALUES
  (DATE '2026-11-01', 'PI01', 'NEUTRO',     5.4, 1),
  (DATE '2026-11-01', 'PI02', 'RESISTENTE', 4.1, 2),
  (DATE '2026-11-01', 'PI03', 'APOIA',      7.9, 4),
  (DATE '2026-11-01', 'PI04', 'LIDERA',     8.6, 3),
  (DATE '2026-11-01', 'PI05', 'APOIA',      8.7, 3),
  (DATE '2026-11-01', 'PI06', 'NEUTRO',     6.0, 5),
  (DATE '2026-11-01', 'PI07', 'APOIA',      8.1, 3),
  (DATE '2026-11-01', 'PI08', 'APOIA',      7.1, 4),
  (DATE '2026-11-01', 'PI09', 'APOIA',      7.7, 4),
  (DATE '2026-11-01', 'PI10', 'APOIA',      7.4, 3),
  (DATE '2026-11-01', 'PI11', 'NEUTRO',     6.5, 5),
  (DATE '2026-11-01', 'PI12', 'APOIA',      7.6, 5),
  (DATE '2026-11-01', 'PI13', 'APOIA',      8.8, 3);

INSERT INTO lume_educacao.pulso_equipe
  (id_sprint, satisfacao_media, respostas)
VALUES
  ('S14', 4.12, 5);

INSERT INTO lume_educacao.okr_medicoes
  (id_objetivo, objetivo, id_resultado_chave, resultado_chave, unidade, valor_base, meta, sentido, data_medicao, valor)
VALUES
  -- Fechamento de outubro (2026-10-31)
  ('O1', 'Validar o produto com usuários reais',        'KR1', 'Usuários ativos na última semana do mês (piloto)',      'usuários',  0,    1200, 'MAIOR_MELHOR', DATE '2026-10-31',  974.0),
  ('O1', 'Validar o produto com usuários reais',        'KR2', 'NPS do piloto na última semana do mês',                 'pontos',    0,      50, 'MAIOR_MELHOR', DATE '2026-10-31',   52.0),
  ('O1', 'Validar o produto com usuários reais',        'KR3', 'Taxa de ativação dos cadastrados no mês',               '%',         0,      60, 'MAIOR_MELHOR', DATE '2026-10-31',   48.0),
  ('O2', 'Entregar com qualidade e previsibilidade',    'KR4', 'Disponibilidade da plataforma',                         '%',        98,    99.5, 'MAIOR_MELHOR', DATE '2026-10-31',   96.8),
  ('O2', 'Entregar com qualidade e previsibilidade',    'KR5', 'Itens do padrão de segurança atendidos',                '%',        35,     100, 'MAIOR_MELHOR', DATE '2026-10-31',   79.6),
  ('O2', 'Entregar com qualidade e previsibilidade',    'KR6', 'Chamados de suporte por 100 usuários ativos no mês',    'chamados', 30,       8, 'MENOR_MELHOR', DATE '2026-10-31',    6.6),
  -- Data de status (2026-11-13)
  ('O1', 'Validar o produto com usuários reais',        'KR1', 'Usuários ativos na última semana do mês (piloto)',      'usuários',  0,    1200, 'MAIOR_MELHOR', DATE '2026-11-13', 1085.0),
  ('O1', 'Validar o produto com usuários reais',        'KR2', 'NPS do piloto na última semana do mês',                 'pontos',    0,      50, 'MAIOR_MELHOR', DATE '2026-11-13',   46.0),
  ('O1', 'Validar o produto com usuários reais',        'KR3', 'Taxa de ativação dos cadastrados no mês',               '%',         0,      60, 'MAIOR_MELHOR', DATE '2026-11-13',   56.5),
  ('O2', 'Entregar com qualidade e previsibilidade',    'KR4', 'Disponibilidade da plataforma',                         '%',        98,    99.5, 'MAIOR_MELHOR', DATE '2026-11-13',   96.2),
  ('O2', 'Entregar com qualidade e previsibilidade',    'KR5', 'Itens do padrão de segurança atendidos',                '%',        35,     100, 'MAIOR_MELHOR', DATE '2026-11-13',   89.0),
  ('O2', 'Entregar com qualidade e previsibilidade',    'KR6', 'Chamados de suporte por 100 usuários ativos no mês',    'chamados', 30,       8, 'MENOR_MELHOR', DATE '2026-11-13',    4.7);

-- ============================================================================
-- B10. producao_semanal (+1 linha: 43 -> 44 | +175 Hh: 5.338 -> 5.513) e funil_piloto_semanal (+2 linhas: 12 -> 14)
-- ============================================================================
INSERT INTO lume_educacao.producao_semanal
  (semana_fim, id_atividade, quantidade_executada, hh_trabalhadas, efetivo_medio)
VALUES
  (DATE '2026-11-06', 'A18', 81.0, 175, 7.3);

INSERT INTO lume_educacao.funil_piloto_semanal
  (semana_inicio, alcance, cadastros, ativados, ativos_na_semana, retidos_4_semanas, receita_rs, indicacoes, nps, chamados_suporte)
VALUES
  (DATE '2026-11-02', 2190, 354, 178,  982, 281, 46891.11, 18, 56, 42),
  (DATE '2026-11-09', 2685, 581, 350, 1085, 308, 52718.45, 32, 46, 56);

COMMIT;
