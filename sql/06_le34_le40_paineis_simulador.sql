-- Revisar em banco de teste antes de produção. Não altera tabelas originais.
BEGIN;
-- Funções de apoio: parâmetros, calendário em dias úteis, linha de base da rede (convenções 1 e 2)
-- Item 2.7–2.10 do plano: base comum das views de fluxo, capacidade, riscos e simulação.

create or replace function lume_educacao.le34_40_fn_param_num(p text) returns numeric
language sql stable as $$ select valor::numeric from lume_educacao.projeto_parametros where parametro = p $$;

create or replace function lume_educacao.le34_40_fn_param_data(p text) returns date
language sql stable as $$ select valor::date from lume_educacao.projeto_parametros where parametro = p $$;

create or replace function lume_educacao.le34_40_fn_data_status() returns date
language sql stable as $$ select lume_educacao.le34_40_fn_param_data('data_status') $$;

-- número do dia útil do projeto do último dia útil <= d (dia útil 1 = data_inicio_projeto)
create or replace function lume_educacao.le34_40_fn_du(d date) returns integer
language sql stable as $$
  select coalesce(max(dia_util_projeto), 0) from lume_educacao.calendario where dia_util = 1 and data <= d
$$;

-- data do dia útil n (extrapola em dias corridos de segunda a sexta além do fim do calendário)
create or replace function lume_educacao.le34_40_fn_data_du(n integer) returns date
language plpgsql stable as $$
declare d date; ultimo integer; k integer;
begin
  select data into d from lume_educacao.calendario where dia_util_projeto = n;
  if d is not null then return d; end if;
  select max(dia_util_projeto), max(data) into ultimo, d from lume_educacao.calendario where dia_util = 1;
  k := n - ultimo;
  while k > 0 loop
    d := d + 1;
    if extract(isodow from d) < 6 then k := k - 1; end if;
  end loop;
  return d;
end $$;

-- dias úteis entre duas datas, contando os dois extremos (convenção 9)
create or replace function lume_educacao.le34_40_fn_du_entre(d1 date, d2 date) returns integer
language sql stable as $$
  select count(*)::int from lume_educacao.calendario where dia_util = 1 and data between d1 and d2
$$;

-- último dia útil da sprint n (as sprints seguem a cadência de 2 semanas; além do calendário, extrapola)
create or replace function lume_educacao.le34_40_fn_fim_sprint(n integer) returns date
language plpgsql stable as $$
declare ultimo_num integer; ultimo_fim date; fim date;
begin
  select max(data) into fim from lume_educacao.calendario where id_sprint = 'S' || lpad(n::text, 2, '0');
  if fim is null then
    select max(substr(id_sprint, 2)::int) into ultimo_num from lume_educacao.calendario where id_sprint is not null;
    select max(data) into ultimo_fim from lume_educacao.calendario where id_sprint = 'S' || lpad(ultimo_num::text, 2, '0');
    fim := ultimo_fim + 14 * (n - ultimo_num);
  end if;
  -- se o último dia é feriado ou fim de semana, vale o dia útil anterior
  while exists (select 1 from lume_educacao.calendario c where c.data = fim and c.dia_util = 0)
        or extract(isodow from fim) > 5 loop
    fim := fim - 1;
  end loop;
  return fim;
end $$;

-- duração da linha de base (convenção 1)
create or replace view lume_educacao.le34_40_vw_atividades_duracao as
select a.id_atividade, a.codigo_eap, a.nome_atividade, a.disciplina, a.tipo_atividade, a.id_responsavel,
       case when a.tipo_atividade = 'MARCO_AGIL' then a.duracao_fixa_du
            else ceil((a.duracao_otimista_du + 4 * a.duracao_mais_provavel_du + a.duracao_pessimista_du) / 6.0)::int end as duracao_lb_du,
       case when a.tipo_atividade = 'MARCO_AGIL' then 0
            else round(((a.duracao_pessimista_du - a.duracao_otimista_du) / 6.0)::numeric, 3) end as desvio_padrao_du
from lume_educacao.atividades a;

-- vínculo entre marcos ágeis e releases (A40 -> R1, A41 -> R2, A42 -> R3)
create or replace view lume_educacao.le34_40_vw_marco_release as
with m as (select id_atividade, row_number() over (order by id_atividade) n from lume_educacao.atividades where tipo_atividade = 'MARCO_AGIL'),
     r as (select id_release, data_real, row_number() over (order by id_release) n from lume_educacao.releases)
select m.id_atividade, r.id_release, r.data_real, m.n::int as ordem from m join r using (n);

-- Linha de base da rede (convenção 2): datas mais cedo, a partir do dia útil 1
create or replace function lume_educacao.le34_40_fn_rede_linha_base()
returns table (id_atividade text, duracao_du integer, inicio_du integer, termino_du integer)
language plpgsql stable as $$
declare
  ids text[]; durs integer[]; es jsonb := '{}'; ef jsonb := '{}';
  feitos integer := 0; total integer; i integer; s integer; pronto boolean; dep record;
begin
  select array_agg(v.id_atividade order by v.id_atividade), array_agg(v.duracao_lb_du order by v.id_atividade)
    into ids, durs from lume_educacao.le34_40_vw_atividades_duracao v;
  total := coalesce(array_length(ids, 1), 0);
  while feitos < total loop
    pronto := false;
    for i in 1..total loop
      continue when es ? ids[i];
      s := 1;
      for dep in select d.id_predecessora p, d.tipo_dependencia t, d.defasagem_du l from lume_educacao.dependencias d where d.id_sucessora = ids[i] loop
        if not (es ? dep.p) then s := null; exit; end if;
        s := greatest(s, case when dep.t = 'TI' then (ef ->> dep.p)::int + 1 + dep.l else (es ->> dep.p)::int + dep.l end);
      end loop;
      continue when s is null;
      es := es || jsonb_build_object(ids[i], s);
      ef := ef || jsonb_build_object(ids[i], s + durs[i] - 1);
      feitos := feitos + 1; pronto := true;
    end loop;
    if not pronto then raise exception 'Rede com ciclo ou predecessora inexistente'; end if;
  end loop;
  return query select ids[k], durs[k], (es ->> ids[k])::int, (ef ->> ids[k])::int from generate_subscripts(ids, 1) k;
end $$;

create or replace view lume_educacao.le34_40_vw_linha_base as
select r.id_atividade, a.nome_atividade, a.codigo_eap, a.tipo_atividade, r.duracao_du, r.inicio_du, r.termino_du,
       lume_educacao.le34_40_fn_data_du(r.inicio_du) as inicio_lb, lume_educacao.le34_40_fn_data_du(r.termino_du) as termino_lb
from lume_educacao.le34_40_fn_rede_linha_base() r join lume_educacao.atividades a using (id_atividade);

-- Sprints necessárias para queimar p pontos (velocidade média + reforço depois da rampa)
create or replace function lume_educacao.le34_40_fn_sprints_necessarias(p_pontos numeric, p_vel numeric, p_ganho numeric, p_rampa integer)
returns integer language plpgsql immutable as $$
declare k integer := 0; acc numeric := 0;
begin
  if p_pontos <= 0 then return 0; end if;
  if p_vel <= 0 and p_ganho <= 0 then return null; end if;
  while acc < p_pontos - 1e-9 loop
    k := k + 1;
    acc := acc + p_vel + case when k > p_rampa then p_ganho else 0 end;
    exit when k > 200;
  end loop;
  return k;
end $$;


-- Valor agregado por frente em qualquer data (convenções 3 a 7).
-- Usado pelo dashboard (R11) e pela simulação de cenários (2.10: ENT atual e custo real por ponto).
-- Se o colega responsável pelo R5 já tiver uma view própria, basta apontar vw_valor_agregado_status para ela.

create or replace function lume_educacao.le34_40_fn_valor_agregado(p_data date)
returns table (frente text, ont numeric, vp numeric, va numeric, cr numeric,
               idp numeric, idc numeric, ent numeric, idpt numeric, vprazo numeric, vcusto numeric)
language sql stable as $$
with
p as (select lume_educacao.le34_40_fn_du(p_data) as du, lume_educacao.le34_40_fn_param_num('fator_hora_extra') as fhe),
orc as (select id_atividade, sum(valor_orcado_rs) v from lume_educacao.orcamento_linha_de_base group by id_atividade),
lb as (select * from lume_educacao.le34_40_fn_rede_linha_base()),
vp_pred as (
  select sum(orc.v * least(1.0, greatest(0, p.du - lb.inicio_du + 1)::numeric / nullif(lb.duracao_du, 0))) v
  from orc join lb using (id_atividade), p),
ult as (
  select distinct on (id_atividade) id_atividade, avanco_acumulado_pct
  from lume_educacao.avanco_semanal where semana_fim <= p_data order by id_atividade, semana_fim desc),
va_pred as (select coalesce(sum(orc.v * ult.avanco_acumulado_pct / 100.0), 0) v from orc join ult using (id_atividade)),
spr as (select * from lume_educacao.sprints where planejada_na_linha_de_base = 1),
ont_agil as (select sum(orcamento_sprint_rs) v from spr),
vp_agil as (
  select coalesce(sum(case when data_fim <= p_data then orcamento_sprint_rs
                           when data_inicio <= p_data then orcamento_sprint_rs * lume_educacao.le34_40_fn_du_entre(data_inicio, p_data)::numeric / dias_uteis
                           else 0 end), 0) v from spr),
escopo as (select * from lume_educacao.backlog_itens where origem = 'PLANO_INICIAL' and prioridade_moscow <> 'WONT'),
va_agil as (
  select (select v from ont_agil) * coalesce(sum(pontos) filter (where status = 'CONCLUIDO' and data_conclusao <= p_data), 0)::numeric
         / nullif(sum(pontos), 0) v from escopo),
horas as (
  select h.tipo_item, sum((h.horas_normais + h.horas_extras * p.fhe) * e.custo_hora_rs) v
  from lume_educacao.apontamento_horas h join lume_educacao.equipe e using (id_pessoa), p
  where h.semana_inicio + 4 <= p_data group by h.tipo_item),
custos as (select frente, sum(valor_rs) v from lume_educacao.custos_realizados where data <= p_data group by frente),
base as (
  select 'PREDITIVA'::text frente, (select sum(v) from orc) ont, (select v from vp_pred) vp, (select v from va_pred) va,
         coalesce((select v from custos where frente = 'PREDITIVA'), 0) + coalesce((select v from horas where tipo_item = 'ATIVIDADE'), 0) cr
  union all
  select 'AGIL', (select v from ont_agil), (select v from vp_agil), (select v from va_agil),
         coalesce((select v from custos where frente = 'AGIL'), 0) + coalesce((select v from horas where tipo_item = 'SPRINT'), 0)),
tudo as (select * from base union all select 'PROJETO', sum(ont), sum(vp), sum(va), sum(cr) from base)
select frente, round((ont)::numeric, 2), round((vp)::numeric, 2), round((va)::numeric, 2), round((cr)::numeric, 2),
       round((va / nullif(vp, 0))::numeric, 4), round((va / nullif(cr, 0))::numeric, 4), round((ont / nullif(va / nullif(cr, 0), 0))::numeric, 2),
       round(((ont - va) / nullif(ont - cr, 0))::numeric, 4), round((va - vp)::numeric, 2), round((va - cr)::numeric, 2)
from tudo
$$;

create or replace view lume_educacao.le34_40_vw_valor_agregado_status as
select v.*, lume_educacao.le34_40_fn_data_status() as data_status from lume_educacao.le34_40_fn_valor_agregado(lume_educacao.le34_40_fn_data_status()) v;

-- Curva S mensal (fim de cada mês até a data de status) — projeto
create or replace view lume_educacao.le34_40_vw_curva_s as
select m.data_ref, v.frente, v.vp, v.va, v.cr
from (select least((date_trunc('month', d) + interval '1 month - 1 day')::date, lume_educacao.le34_40_fn_data_status()) data_ref
      from generate_series(lume_educacao.le34_40_fn_param_data('data_inicio_projeto'), lume_educacao.le34_40_fn_data_status(), interval '1 month') d
      union select lume_educacao.le34_40_fn_data_status()) m
cross join lateral lume_educacao.le34_40_fn_valor_agregado(m.data_ref) v
order by m.data_ref, v.frente;

-- Item 2.8 — Capacidade × folha salarial (R14) e produtividade (R15)
-- Convenções 6, 17, 18, 19 e 20 do dicionário.

-- Folha por pessoa: custo mensal e custo por hora (convenção 17), conferido com a tabela 04
create or replace view lume_educacao.le34_40_vw_folha_pessoas as
select e.id_pessoa, e.nome, e.papel, e.frente, e.disciplina, e.senioridade, f.vinculo, e.alocacao_pct, e.data_entrada, e.data_saida,
       f.remuneracao_mensal_rs, f.encargos_pct, f.beneficios_mensais_rs, f.horas_mensais,
       round((f.remuneracao_mensal_rs * (1 + f.encargos_pct / 100.0) + f.beneficios_mensais_rs)::numeric, 2) as custo_mensal_rs,
       round((f.remuneracao_mensal_rs * (1 + f.encargos_pct / 100.0) + f.beneficios_mensais_rs) / f.horas_mensais) as custo_hora_calculado,
       e.custo_hora_rs as custo_hora_tabela04,
       round((f.remuneracao_mensal_rs * (1 + f.encargos_pct / 100.0) + f.beneficios_mensais_rs) / f.horas_mensais) = e.custo_hora_rs as custo_hora_confere,
       f.reajuste_previsto_pct, f.mes_do_reajuste,
       (e.data_saida is null or e.data_saida >= lume_educacao.le34_40_fn_data_status()) as ativo_na_data_status
from lume_educacao.equipe e join lume_educacao.cargos_salarios f using (id_pessoa);

-- Capacidade, planejado e apontado por pessoa e mês (convenção 18) + custo das horas (convenção 6)
create or replace view lume_educacao.le34_40_vw_capacidade_pessoa_mes as
with meses as (
  select generate_series(date_trunc('month', lume_educacao.le34_40_fn_param_data('data_inicio_projeto')), date_trunc('month', lume_educacao.le34_40_fn_data_status()), interval '1 month')::date as mes),
base as (
  select fp.*, m.mes,
         (select count(*) from lume_educacao.calendario c where c.dia_util = 1 and date_trunc('month', c.data) = m.mes
            and c.data >= fp.data_entrada and (fp.data_saida is null or c.data <= fp.data_saida)) as du_no_projeto,
         (select count(*) from lume_educacao.calendario c where c.dia_util = 1 and date_trunc('month', c.data) = m.mes) as du_mes
  from lume_educacao.le34_40_vw_folha_pessoas fp cross join meses m),
ap as (
  select id_pessoa, date_trunc('month', semana_inicio)::date as mes, sum(horas_normais) hn, sum(horas_extras) he
  from lume_educacao.apontamento_horas group by 1, 2)
select b.id_pessoa, b.nome, b.papel, b.frente, b.mes,
       (b.mes + interval '1 month' - interval '1 day')::date < lume_educacao.le34_40_fn_data_status() as mes_fechado,
       b.du_no_projeto,
       b.du_no_projeto * lume_educacao.le34_40_fn_param_num('horas_por_dia') * b.alocacao_pct / 100.0 as capacidade_h,
       al.horas_planejadas as horas_planejadas_h,
       coalesce(ap.hn, 0) as horas_normais_h, coalesce(ap.he, 0) as horas_extras_h,
       coalesce(ap.hn, 0) + coalesce(ap.he, 0) as horas_apontadas_h,
       round(((coalesce(ap.hn, 0) + coalesce(ap.he, 0)) / nullif(b.du_no_projeto * lume_educacao.le34_40_fn_param_num('horas_por_dia') * b.alocacao_pct / 100.0, 0) * 100)::numeric, 1) as utilizacao_pct,
       coalesce(ap.hn, 0) + coalesce(ap.he, 0) - al.horas_planejadas as desvio_alocacao_h,
       round(((coalesce(ap.hn, 0) + coalesce(ap.he, 0) - al.horas_planejadas) / nullif(al.horas_planejadas, 0) * 100)::numeric, 1) as desvio_alocacao_pct,
       case when al.horas_planejadas is null then null
            when al.horas_planejadas = 0 then (coalesce(ap.hn, 0) + coalesce(ap.he, 0)) > 0
            else abs(coalesce(ap.hn, 0) + coalesce(ap.he, 0) - al.horas_planejadas) / al.horas_planejadas > 0.20 end as alerta_desvio_20pct,
       round((coalesce(ap.hn, 0) * b.custo_hora_tabela04 + coalesce(ap.he, 0) * b.custo_hora_tabela04 * lume_educacao.le34_40_fn_param_num('fator_hora_extra'))::numeric, 2) as custo_horas_rs,
       round((b.custo_mensal_rs * b.du_no_projeto::numeric / nullif(b.du_mes, 0))::numeric, 2) as custo_folha_rs
from base b
left join lume_educacao.alocacao_planejada al on al.id_pessoa = b.id_pessoa and al.mes = b.mes
left join ap on ap.id_pessoa = b.id_pessoa and ap.mes = b.mes
where b.du_no_projeto > 0;

-- Capacidade × folha salarial por mês e frente
create or replace view lume_educacao.le34_40_vw_capacidade_folha_mensal as
select mes, frente, bool_and(mes_fechado) as mes_fechado, count(distinct id_pessoa) as pessoas,
       sum(capacidade_h) as capacidade_h, sum(horas_planejadas_h) as horas_planejadas_h, sum(horas_apontadas_h) as horas_apontadas_h,
       round((sum(horas_apontadas_h) / nullif(sum(capacidade_h), 0) * 100)::numeric, 1) as utilizacao_pct,
       sum(custo_folha_rs) as custo_folha_rs, sum(custo_horas_rs) as custo_horas_apontadas_rs,
       round((sum(custo_horas_rs) / nullif(sum(custo_folha_rs), 0) * 100)::numeric, 1) as folha_apropriada_pct,
       count(*) filter (where alerta_desvio_20pct and mes_fechado) as pessoas_com_desvio_20pct
from lume_educacao.le34_40_vw_capacidade_pessoa_mes group by mes, frente order by mes, frente;

-- Resumo por pessoa (meses fechados)
create or replace view lume_educacao.le34_40_vw_capacidade_pessoa_resumo as
select id_pessoa, nome, papel, frente,
       sum(capacidade_h) filter (where mes_fechado) as capacidade_h, sum(horas_planejadas_h) filter (where mes_fechado) as planejadas_h,
       sum(horas_apontadas_h) filter (where mes_fechado) as apontadas_h, sum(horas_extras_h) as horas_extras_h,
       round((sum(horas_apontadas_h) filter (where mes_fechado) / nullif(sum(capacidade_h) filter (where mes_fechado), 0) * 100)::numeric, 1) as utilizacao_pct,
       count(*) filter (where alerta_desvio_20pct and mes_fechado) as meses_com_desvio_20pct,
       sum(custo_horas_rs) as custo_horas_rs, sum(custo_folha_rs) as custo_folha_rs,
       case when sum(horas_apontadas_h) filter (where mes_fechado) > 1.2 * nullif(sum(horas_planejadas_h) filter (where mes_fechado), 0) then 'SOBRECARREGADO'
            when sum(horas_apontadas_h) filter (where mes_fechado) < 0.8 * nullif(sum(horas_planejadas_h) filter (where mes_fechado), 0) then 'ABAIXO_DO_PLANO'
            else 'DENTRO_DO_PLANO' end as situacao
from lume_educacao.le34_40_vw_capacidade_pessoa_mes group by id_pessoa, nome, papel, frente order by id_pessoa;

-- Produtividade das equipes de fornecedores (convenção 20)
create or replace view lume_educacao.le34_40_vw_produtividade_equipes as
with p as (
  select ps.*, row_number() over (partition by id_atividade order by semana_fim desc) r
  from lume_educacao.producao_semanal ps where semana_fim <= lume_educacao.le34_40_fn_data_status()),
acc as (
  select id_atividade, sum(quantidade_executada) executado, sum(hh_trabalhadas) hh,
         avg(efetivo_medio) filter (where r <= 3) efetivo_3s, max(semana_fim) ultima_semana
  from p group by id_atividade)
select r.id_atividade, a.nome_atividade, r.servico, r.unidade, r.quantidade_total, r.produtividade_planejada, r.equipe_planejada_pessoas,
       r.id_contrato, coalesce(acc.executado, 0) as executado, coalesce(acc.hh, 0) as hh_trabalhadas, acc.ultima_semana,
       round((acc.executado / nullif(acc.hh, 0))::numeric, 4) as produtividade_real,
       round((acc.executado / nullif(acc.hh, 0) / r.produtividade_planejada)::numeric, 3) as indice_produtividade,
       round((acc.efetivo_3s)::numeric, 2) as efetivo_medio_3_semanas,
       round((acc.efetivo_3s / r.equipe_planejada_pessoas)::numeric, 3) as indice_efetivo,
       greatest(0, r.quantidade_total - coalesce(acc.executado, 0)) as quantidade_restante,
       ceil(greatest(0, r.quantidade_total - coalesce(acc.executado, 0))
            / nullif(acc.executado / nullif(acc.hh, 0) * acc.efetivo_3s * lume_educacao.le34_40_fn_param_num('horas_por_dia'), 0))::int as duracao_restante_du,
       case when acc.hh is null then 'SEM_MEDICAO'
            when r.quantidade_total - acc.executado <= 0 then 'CONCLUIDA'
            when acc.executado / acc.hh / r.produtividade_planejada < 0.9 and acc.efetivo_3s / r.equipe_planejada_pessoas >= 0.9 then 'BAIXA_PRODUTIVIDADE'
            when acc.efetivo_3s / r.equipe_planejada_pessoas < 0.9 and acc.executado / acc.hh / r.produtividade_planejada >= 0.9 then 'FALTA_DE_GENTE'
            when acc.executado / acc.hh / r.produtividade_planejada < 0.9 then 'AMBOS'
            else 'NO_RITMO' end as diagnostico
from lume_educacao.produtividade_referencia r
join lume_educacao.atividades a using (id_atividade)
left join acc using (id_atividade)
order by r.id_atividade;

-- Produtividade do time ágil: pontos por hora e custo por ponto (convenção 20)
create or replace view lume_educacao.le34_40_vw_produtividade_time_agil as
with h as (select id_pessoa, sum(horas_normais + horas_extras) horas,
                  sum((horas_normais + horas_extras * lume_educacao.le34_40_fn_param_num('fator_hora_extra'))) horas_ponderadas
           from lume_educacao.apontamento_horas where tipo_item = 'SPRINT' group by id_pessoa),
pts as (select id_responsavel id_pessoa, sum(pontos) pontos, count(*) itens from lume_educacao.backlog_itens where status = 'CONCLUIDO' group by 1)
select fp.id_pessoa, fp.nome, fp.papel, fp.senioridade, fp.vinculo, fp.custo_hora_tabela04,
       coalesce(pts.pontos, 0) as pontos_concluidos, coalesce(pts.itens, 0) as itens_concluidos, coalesce(h.horas, 0) as horas_sprint,
       round((coalesce(pts.pontos, 0) / nullif(h.horas, 0))::numeric, 4) as pontos_por_hora,
       round((h.horas_ponderadas * fp.custo_hora_tabela04)::numeric, 2) as custo_horas_rs,
       round((h.horas_ponderadas * fp.custo_hora_tabela04 / nullif(pts.pontos, 0))::numeric, 2) as custo_por_ponto_rs
from lume_educacao.le34_40_vw_folha_pessoas fp left join h using (id_pessoa) left join pts using (id_pessoa)
where fp.frente = 'AGIL'
order by fp.id_pessoa;

-- Item 2.9 — Riscos e reservas (R7), mudanças (R8) e partes interessadas (R10)
-- Convenção 12 (VME) e faixas da folha M6 do dossiê.

create or replace view lume_educacao.le34_40_vw_ont_projeto as
select (select sum(valor_orcado_rs) from lume_educacao.orcamento_linha_de_base)
     + (select sum(orcamento_sprint_rs) from lume_educacao.sprints where planejada_na_linha_de_base = 1) as ont_projeto;

-- Mapa de riscos 5 × 5 com VME
create or replace view lume_educacao.le34_40_vw_riscos_mapa as
with o as (select ont_projeto from lume_educacao.le34_40_vw_ont_projeto),
ult as (select distinct on (id_atividade) id_atividade, situacao from lume_educacao.avanco_semanal
        where semana_fim <= lume_educacao.le34_40_fn_data_status() order by id_atividade, semana_fim desc)
select r.id_risco, r.tipo_risco, r.categoria, r.descricao, r.causa, r.frente, r.id_atividade, r.estrategia_resposta,
       r.custo_resposta_rs, r.id_responsavel, e.nome as responsavel, r.status, r.data_identificacao,
       r.probabilidade_pct, r.impacto_custo_rs, r.impacto_prazo_du,
       round((r.probabilidade_pct / 100.0 * r.impacto_custo_rs)::numeric, 2) as vme_rs,
       round((r.probabilidade_pct / 100.0 * r.impacto_prazo_du)::numeric, 2) as vme_prazo_du,
       case when r.probabilidade_pct <= 10 then 1 when r.probabilidade_pct <= 30 then 2 when r.probabilidade_pct <= 50 then 3
            when r.probabilidade_pct <= 70 then 4 else 5 end as faixa_probabilidade,
       case when abs(r.impacto_custo_rs) / o.ont_projeto < 0.0025 then 1 when abs(r.impacto_custo_rs) / o.ont_projeto < 0.005 then 2
            when abs(r.impacto_custo_rs) / o.ont_projeto < 0.01 then 3 when abs(r.impacto_custo_rs) / o.ont_projeto <= 0.02 then 4 else 5 end as faixa_impacto,
       round((abs(r.impacto_custo_rs) / o.ont_projeto * 100)::numeric, 3) as impacto_pct_ont,
       u.situacao as situacao_atividade,
       (r.status = 'ABERTO' and u.situacao = 'CONCLUIDA') as revisar_encerramento,
       (select count(*) from lume_educacao.riscos_ocorrencias oc where oc.id_risco = r.id_risco) as ocorrencias
from lume_educacao.riscos_registro r cross join o
left join lume_educacao.equipe e on e.id_pessoa = r.id_responsavel
left join ult u on u.id_atividade = r.id_atividade;

-- Reservas × exposição na data de status
create or replace view lume_educacao.le34_40_vw_reservas_exposicao as
with oc as (
  select coalesce(sum(impacto_custo_real_rs) filter (where id_risco is not null and data <= lume_educacao.le34_40_fn_data_status()), 0) as riscos_identificados,
         coalesce(sum(impacto_custo_real_rs) filter (where id_risco is null and data <= lume_educacao.le34_40_fn_data_status()), 0) as imprevistos,
         coalesce(sum(impacto_prazo_real_du) filter (where data <= lume_educacao.le34_40_fn_data_status()), 0) as atraso_ocorrencias_du,
         count(*) filter (where data <= lume_educacao.le34_40_fn_data_status()) as ocorrencias
  from lume_educacao.riscos_ocorrencias),
ex as (
  select coalesce(sum(vme_rs) filter (where tipo_risco = 'AMEACA' and status = 'ABERTO'), 0) as exposicao_ameacas,
         coalesce(sum(vme_rs) filter (where tipo_risco = 'OPORTUNIDADE' and status = 'ABERTO'), 0) as vme_oportunidades,
         coalesce(sum(custo_resposta_rs) filter (where status = 'ABERTO'), 0) as custo_respostas_abertas,
         coalesce(sum(vme_prazo_du) filter (where tipo_risco = 'AMEACA' and status = 'ABERTO'), 0) as exposicao_prazo_du,
         count(*) filter (where tipo_risco = 'AMEACA' and status = 'ABERTO') as ameacas_abertas,
         count(*) filter (where revisar_encerramento) as riscos_a_revisar
  from lume_educacao.le34_40_vw_riscos_mapa),
mud as (select coalesce(sum(impacto_custo_rs) filter (where status = 'APROVADA'), 0) as mudancas_aprovadas from lume_educacao.mudancas_solicitacoes
        where data_abertura <= lume_educacao.le34_40_fn_data_status())
select lume_educacao.le34_40_fn_param_num('reserva_de_contingencia_rs') as reserva_contingencia,
       oc.riscos_identificados as contingencia_consumida,
       lume_educacao.le34_40_fn_param_num('reserva_de_contingencia_rs') - oc.riscos_identificados as contingencia_saldo,
       lume_educacao.le34_40_fn_param_num('reserva_gerencial_rs') as reserva_gerencial,
       oc.imprevistos as gerencial_consumida,
       lume_educacao.le34_40_fn_param_num('reserva_gerencial_rs') - oc.imprevistos as gerencial_saldo,
       ex.exposicao_ameacas, ex.vme_oportunidades, ex.exposicao_ameacas + ex.vme_oportunidades as exposicao_liquida,
       ex.exposicao_prazo_du, ex.ameacas_abertas, ex.custo_respostas_abertas, ex.riscos_a_revisar,
       round(((lume_educacao.le34_40_fn_param_num('reserva_de_contingencia_rs') - oc.riscos_identificados) / nullif(ex.exposicao_ameacas, 0) * 100)::numeric, 1) as cobertura_saldo_pct,
       round((lume_educacao.le34_40_fn_param_num('reserva_de_contingencia_rs') / nullif(ex.exposicao_ameacas, 0) * 100)::numeric, 1) as cobertura_reserva_original_pct,
       (lume_educacao.le34_40_fn_param_num('reserva_de_contingencia_rs') - oc.riscos_identificados) >= ex.exposicao_ameacas as reserva_cobre_exposicao,
       oc.ocorrencias, oc.atraso_ocorrencias_du, mud.mudancas_aprovadas
from oc, ex, mud;

-- Mapa de calor 5 × 5 (contagem e VME por célula, só ameaças abertas)
create or replace view lume_educacao.le34_40_vw_riscos_matriz as
select p.faixa_probabilidade, i.faixa_impacto,
       count(r.id_risco) as riscos, coalesce(sum(r.vme_rs), 0) as vme_rs, string_agg(r.id_risco, ', ' order by r.id_risco) as ids
from generate_series(1, 5) p(faixa_probabilidade) cross join generate_series(1, 5) i(faixa_impacto)
left join lume_educacao.le34_40_vw_riscos_mapa r on r.faixa_probabilidade = p.faixa_probabilidade and r.faixa_impacto = i.faixa_impacto
      and r.tipo_risco = 'AMEACA' and r.status = 'ABERTO'
group by p.faixa_probabilidade, i.faixa_impacto order by 1 desc, 2;

-- R8 — mudanças conferidas contra a matriz de alçadas
create or replace view lume_educacao.le34_40_vw_mudancas_controle as
select m.*, a.limite_custo_rs, a.limite_prazo_du, a.pode_alterar_escopo,
       (a.limite_custo_rs is not null and m.impacto_custo_rs > a.limite_custo_rs) as excede_alcada_custo,
       (a.limite_prazo_du is not null and m.impacto_prazo_du > a.limite_prazo_du) as excede_alcada_prazo,
       (m.tipo_mudanca = 'ESCOPO' and a.pode_alterar_escopo = 'NAO') as escopo_sem_alcada,
       ((a.limite_custo_rs is not null and m.impacto_custo_rs > a.limite_custo_rs)
        or (a.limite_prazo_du is not null and m.impacto_prazo_du > a.limite_prazo_du)
        or (m.tipo_mudanca = 'ESCOPO' and a.pode_alterar_escopo = 'NAO')) as fora_da_alcada,
       (select string_agg(b.id_item, ', ') from lume_educacao.backlog_itens b where b.id_mudanca = m.id_mudanca) as itens_criados
from lume_educacao.mudancas_solicitacoes m left join lume_educacao.matriz_alcadas a on a.nivel_decisor = m.nivel_decisor;

-- R8 — escopo que entrou sem passar pelo controle de mudanças (PEDIDO_DIRETO)
create or replace view lume_educacao.le34_40_vw_escopo_sem_controle as
select b.id_solicitante, p.parte_interessada, count(*) as itens, sum(b.pontos) as pontos,
       count(*) filter (where b.status = 'CONCLUIDO') as itens_concluidos,
       sum(b.pontos) filter (where b.status = 'CONCLUIDO') as pontos_concluidos,
       round((sum(b.pontos) * (select avg(cpp) from (select (select cr from lume_educacao.le34_40_fn_valor_agregado(lume_educacao.le34_40_fn_data_status()) where frente = 'AGIL')
             / nullif((select sum(pontos) from lume_educacao.backlog_itens where status = 'CONCLUIDO'), 0) cpp) t))::numeric, 2) as custo_estimado_rs,
       string_agg(b.id_item, ', ' order by b.id_item) as itens_ids
from lume_educacao.backlog_itens b left join lume_educacao.partes_interessadas p on p.id_parte = b.id_solicitante
where b.origem = 'PEDIDO_DIRETO' group by b.id_solicitante, p.parte_interessada;

-- R10 — partes interessadas: poder × interesse e evolução do engajamento
create or replace view lume_educacao.le34_40_vw_partes_engajamento as
with niveis(n, ordem) as (values ('DESCONHECE',1),('RESISTENTE',2),('NEUTRO',3),('APOIA',4),('LIDERA',5)),
eng as (select *, row_number() over (partition by id_parte order by mes desc) r from lume_educacao.engajamento_mensal where mes <= lume_educacao.le34_40_fn_data_status())
select p.id_parte, p.parte_interessada, p.contato, p.papel_no_projeto, p.tipo, p.poder, p.interesse,
       case when p.poder >= 4 and p.interesse >= 4 then 'GERENCIAR_DE_PERTO' when p.poder >= 4 then 'MANTER_SATISFEITO'
            when p.interesse >= 4 then 'MANTER_INFORMADO' else 'MONITORAR' end as quadrante,
       p.engajamento_inicial, p.engajamento_desejado, a.nivel_engajamento as engajamento_atual, a.mes as mes_avaliacao,
       a.satisfacao as satisfacao_atual, ant.satisfacao as satisfacao_mes_anterior,
       round((a.satisfacao - ant.satisfacao)::numeric, 1) as variacao_satisfacao, a.interacoes_no_mes,
       nd.ordem - na.ordem as lacuna_engajamento,
       (nd.ordem - na.ordem) > 0 as abaixo_do_desejado
from lume_educacao.partes_interessadas p
left join eng a on a.id_parte = p.id_parte and a.r = 1
left join eng ant on ant.id_parte = p.id_parte and ant.r = 2
left join niveis na on na.n = a.nivel_engajamento
left join niveis nd on nd.n = p.engajamento_desejado
order by p.id_parte;

-- Item 2.10 — vw_simulacao_cenarios (R16)
-- Motor de cenários pelas convenções 10, 11, 21, 22 e 23 do dicionário.
-- fn_simular(array['C3']) calcula um cenário; fn_simular(array['C2','C3']) testa uma combinação.
-- Sem tabelas temporárias: funciona dentro da transação somente leitura do PostgREST (GET).

-- Gabaritos oficiais (dossiê, folha M7: "números de controle do simulador")
create table if not exists lume_educacao.le34_40_gabaritos_cenarios (
  id_cenario text primary key,
  termino_previsto date not null,
  dias_uteis_alem_contrato integer not null,
  meses_atraso numeric not null,
  estimativa_no_termino_rs numeric not null,
  variacao_beneficio_pct numeric not null,
  variacao_custo_operacional_rs numeric not null,
  fonte text not null default 'Dossiê do Grupo 4, seção 2, folha M7'
);
insert into lume_educacao.le34_40_gabaritos_cenarios values
  ('C1','2027-04-08',46,2.73,4168735,0.0,0,default),
  ('C3','2027-03-25',37,2.27,4070571,-1.4,0,default),
  ('C4','2027-04-23',56,3.22,4371552,6.0,58100,default)
on conflict (id_cenario) do update set termino_previsto = excluded.termino_previsto,
  dias_uteis_alem_contrato = excluded.dias_uteis_alem_contrato, meses_atraso = excluded.meses_atraso,
  estimativa_no_termino_rs = excluded.estimativa_no_termino_rs, variacao_beneficio_pct = excluded.variacao_beneficio_pct,
  variacao_custo_operacional_rs = excluded.variacao_custo_operacional_rs;

-- Previsão da rede (convenção 11) com as mudanças da tabela 44 (convenção 21)
create or replace function lume_educacao.le34_40_fn_previsao_rede(p_cenarios text[], p_rel2_du integer, p_rel3_du integer)
returns table (id_atividade text, duracao_du integer, inicio_du integer, termino_du integer, situacao text)
language plpgsql stable as $$
declare
  v_status date := lume_educacao.le34_40_fn_data_status();
  v_sdu integer := lume_educacao.le34_40_fn_du(v_status);
  ids text[] := '{}'; durs integer[] := '{}'; sits text[] := '{}'; inis date[] := '{}'; fims date[] := '{}';
  pcts numeric[] := '{}'; rels text[] := '{}'; reldt date[] := '{}';
  deps_p text[] := '{}'; deps_s text[] := '{}'; deps_t text[] := '{}'; deps_l integer[] := '{}';
  es jsonb := '{}'; ef jsonb := '{}'; r record; i integer; j integer; s integer; e integer; n integer; feitos integer := 0;
  pronto boolean; parte text; campos text[];
begin
  -- atividades da linha de base com a situação na data de status
  for r in
    select d.id_atividade, d.duracao_lb_du, u.situacao, u.data_inicio_real,
           (select max(x.data_termino_real) from lume_educacao.avanco_semanal x where x.id_atividade = d.id_atividade and x.semana_fim <= v_status) termino_real,
           u.avanco_acumulado_pct, mr.id_release, mr.data_real
    from lume_educacao.le34_40_vw_atividades_duracao d
    left join lateral (select * from lume_educacao.avanco_semanal a where a.id_atividade = d.id_atividade and a.semana_fim <= v_status
                       order by a.semana_fim desc limit 1) u on true
    left join lume_educacao.le34_40_vw_marco_release mr on mr.id_atividade = d.id_atividade
    order by d.id_atividade
  loop
    ids := ids || r.id_atividade; durs := durs || r.duracao_lb_du; sits := sits || coalesce(r.situacao, 'NAO_INICIADA');
    inis := inis || r.data_inicio_real; fims := fims || r.termino_real; pcts := pcts || coalesce(r.avanco_acumulado_pct, 0);
    rels := rels || r.id_release; reldt := reldt || r.data_real;
  end loop;
  for r in select * from lume_educacao.dependencias loop
    deps_p := deps_p || r.id_predecessora; deps_s := deps_s || r.id_sucessora; deps_t := deps_t || r.tipo_dependencia; deps_l := deps_l || r.defasagem_du;
  end loop;

  -- mudanças do cenário
  for r in select * from lume_educacao.cenario_atividades ca where ca.id_cenario = any(p_cenarios) order by ca.id_cenario, ca.id_atividade loop
    i := array_position(ids, r.id_atividade);
    if r.acao = 'INCLUIR' then
      ids := ids || r.id_atividade; durs := durs || r.duracao_du; sits := sits || 'NAO_INICIADA'::text;
      inis := inis || null::date; fims := fims || null::date; pcts := pcts || 0::numeric; rels := rels || null::text; reldt := reldt || null::date;
      foreach parte in array string_to_array(coalesce(r.predecessoras, ''), ';') loop
        continue when parte = '';
        campos := string_to_array(parte, ':');
        deps_p := deps_p || campos[1]; deps_s := deps_s || r.id_atividade; deps_t := deps_t || campos[2]; deps_l := deps_l || campos[3]::int;
      end loop;
      foreach parte in array string_to_array(coalesce(r.sucessoras, ''), ';') loop
        continue when parte = '';
        campos := string_to_array(parte, ':');
        deps_p := deps_p || r.id_atividade; deps_s := deps_s || campos[1]; deps_t := deps_t || campos[2]; deps_l := deps_l || campos[3]::int;
      end loop;
    elsif i is not null and r.acao = 'EXCLUIR' then
      durs[i] := 0;
      if sits[i] = 'EM_ANDAMENTO' then sits[i] := 'NAO_INICIADA'; end if;
    elsif i is not null and r.acao = 'ALTERAR_DURACAO' then
      if sits[i] = 'EM_ANDAMENTO' then
        -- em andamento: reduz a duração restante na mesma quantidade de dias, com mínimo de 1
        pcts[i] := -1 * greatest(1, ceil(durs[i] * (1 - pcts[i] / 100.0))::int - (durs[i] - r.duracao_du));
      else
        durs[i] := r.duracao_du;
      end if;
    end if;
  end loop;

  n := array_length(ids, 1);
  while feitos < n loop
    pronto := false;
    for i in 1..n loop
      continue when es ? ids[i];
      s := null;
      if sits[i] = 'CONCLUIDA' then
        s := lume_educacao.le34_40_fn_du(inis[i]); e := lume_educacao.le34_40_fn_du(fims[i]);
      else
        s := 1;
        for j in 1..coalesce(array_length(deps_s, 1), 0) loop
          continue when deps_s[j] <> ids[i];
          if not (es ? deps_p[j]) then s := null; exit; end if;
          s := greatest(s, case when deps_t[j] = 'TI' then (ef ->> deps_p[j])::int + 1 + deps_l[j] else (es ->> deps_p[j])::int + deps_l[j] end);
        end loop;
        continue when s is null;
        if rels[i] is not null then
          -- marco ágil: entregue (data real) ou previsto pela regra de release (convenção 10)
          e := case when reldt[i] is not null then lume_educacao.le34_40_fn_du(reldt[i])
                    when rels[i] = 'R2' then p_rel2_du when rels[i] = 'R3' then p_rel3_du else v_sdu end;
          if reldt[i] is null then e := greatest(e, v_sdu); end if;
        elsif sits[i] = 'EM_ANDAMENTO' then
          s := lume_educacao.le34_40_fn_du(inis[i]);
          e := v_sdu + case when pcts[i] < 0 then (-pcts[i])::int else ceil(durs[i] * (1 - pcts[i] / 100.0))::int end;
        else
          s := greatest(s, v_sdu + 1);
          e := s + durs[i] - 1;
        end if;
      end if;
      es := es || jsonb_build_object(ids[i], s);
      ef := ef || jsonb_build_object(ids[i], e);
      feitos := feitos + 1; pronto := true;
    end loop;
    if not pronto then raise exception 'Rede do cenário com ciclo ou predecessora inexistente'; end if;
  end loop;
  return query select ids[k], durs[k], (es ->> ids[k])::int, (ef ->> ids[k])::int, sits[k] from generate_subscripts(ids, 1) k;
end $$;

-- Simulação de um cenário ou de uma combinação de cenários
create or replace function lume_educacao.le34_40_fn_simular(p_cenarios text[])
returns table (
  cenarios text, nomes text, combinacao_valida boolean,
  velocidade_media numeric, ganho_velocidade numeric, pontos_restantes_r2 numeric, pontos_restantes_r3 numeric,
  sprints_r2 integer, sprints_r3 integer, data_release_2 date, data_release_3 date,
  entrada_operacao date, termino_previsto date, dias_uteis_alem_contrato integer, meses_atraso numeric,
  ent_atual numeric, custo_adicional_rede numeric, pontos_incluidos numeric, pontos_excluidos numeric,
  custo_real_por_ponto numeric, custo_recursos numeric, investimento_adicional numeric, ent_cenario numeric,
  variacao_beneficio_pct numeric, variacao_custo_operacional_rs numeric, parcela_antecipada_pct numeric,
  termino_gatilho date, meses_atraso_efetivo numeric,
  vpl numeric, payback_anos numeric, custo_atraso numeric, resultado numeric, beneficio_liquido_total numeric,
  fluxo_caixa jsonb)
language plpgsql stable as $$
declare
  cen text[] := coalesce(p_cenarios, '{}');
  v_status date := lume_educacao.le34_40_fn_data_status();
  v_sdu integer := lume_educacao.le34_40_fn_du(v_status);
  v_spr integer; v_vel numeric; v_ganho numeric; v_rampa integer; v_rec numeric;
  v_r2 numeric; v_r3 numeric; v_s2 integer; v_s3 integer; v_d2 date; v_d3 date;
  v_term_du integer; v_op_du integer; v_term date; v_lb_fim date; v_contrato date; v_du_alem integer; v_meses numeric;
  v_ent numeric; v_cra numeric; v_pc numeric; v_cpp numeric; v_add numeric; v_inc numeric; v_exc numeric; v_inv numeric; v_ont numeric;
  v_varb numeric; v_varc numeric; v_parc numeric; v_gat text; v_gat_du integer; v_gat_dt date; v_meses_ef numeric;
  v_tma numeric; v_vpl numeric := 0; v_acum numeric := 0; v_ant numeric; v_pay numeric; v_fluxo jsonb := '[]'; v_benef_tot numeric := 0;
  v_valida boolean := true; v_nomes text; f numeric; ano record; v_atraso numeric; a text; b text;
begin
  if array_length(cen, 1) is null then cen := array['C1']; end if;
  select string_agg(c.id_cenario || ' · ' || c.nome_cenario, ' + ' order by c.id_cenario) into v_nomes from lume_educacao.cenarios c where c.id_cenario = any(cen);
  -- combinação: cada par precisa constar em combinavel_com
  foreach a in array cen loop
    foreach b in array cen loop
      if a <> b and a <> 'C1' and b <> 'C1' and not exists (
        select 1 from lume_educacao.cenarios c where c.id_cenario = a and b = any(string_to_array(coalesce(c.combinavel_com, ''), ';'))) then
        v_valida := false;
      end if;
    end loop;
  end loop;

  -- velocidade média das cinco últimas sprints encerradas (convenção 8)
  select s.numero into v_spr from lume_educacao.sprints s where v_status between s.data_inicio and s.data_fim;
  if v_spr is null then select max(s.numero) into v_spr from lume_educacao.sprints s where s.data_fim <= v_status; end if;
  select avg(vel) into v_vel from (
    select coalesce(sum(si.pontos) filter (where si.concluido_na_sprint = 1), 0) vel
    from lume_educacao.sprints s left join lume_educacao.sprint_itens si using (id_sprint)
    where s.data_fim <= v_status group by s.numero order by s.numero desc limit 5) t;
  select coalesce(sum(r.quantidade * r.ganho_velocidade_pontos_por_sprint), 0), coalesce(max(r.sprints_de_rampa), 0),
         coalesce(sum(r.quantidade * r.custo_mensal_rs * r.meses), 0)
    into v_ganho, v_rampa, v_rec from lume_educacao.cenario_recursos r where r.id_cenario = any(cen);

  -- pontos restantes por release (convenção 10 + itens incluídos/excluídos do cenário)
  select coalesce(sum(case when b.id_release <= 'R2' then b.pontos end), 0), coalesce(sum(b.pontos), 0) into v_r2, v_r3
  from lume_educacao.backlog_itens b
  where b.status <> 'CONCLUIDO' and b.prioridade_moscow <> 'WONT'
    and not exists (select 1 from lume_educacao.cenario_backlog x where x.id_cenario = any(cen) and x.acao = 'EXCLUIR' and x.id_item = b.id_item);
  select v_r2 + coalesce(sum(case when x.id_release <= 'R2' then x.pontos end), 0), v_r3 + coalesce(sum(x.pontos), 0) into v_r2, v_r3
  from (select distinct id_item, id_release, pontos from lume_educacao.cenario_backlog where id_cenario = any(cen) and acao = 'INCLUIR') x;
  select coalesce(sum(pontos), 0) into v_inc from (select distinct id_item, pontos from lume_educacao.cenario_backlog where id_cenario = any(cen) and acao = 'INCLUIR') t;
  select coalesce(sum(pontos), 0) into v_exc from (select distinct id_item, pontos from lume_educacao.cenario_backlog where id_cenario = any(cen) and acao = 'EXCLUIR') t;

  v_s2 := lume_educacao.le34_40_fn_sprints_necessarias(v_r2, v_vel, v_ganho, v_rampa);
  v_s3 := lume_educacao.le34_40_fn_sprints_necessarias(v_r3, v_vel, v_ganho, v_rampa);
  v_d2 := lume_educacao.le34_40_fn_fim_sprint(v_spr + v_s2);
  v_d3 := lume_educacao.le34_40_fn_fim_sprint(v_spr + v_s3);

  -- rede prevista
  select max(p.termino_du), max(p.termino_du) filter (where p.id_atividade = 'A35') into v_term_du, v_op_du
  from lume_educacao.le34_40_fn_previsao_rede(cen, lume_educacao.le34_40_fn_du(v_d2), lume_educacao.le34_40_fn_du(v_d3)) p;
  v_term := lume_educacao.le34_40_fn_data_du(v_term_du);
  select max(lb.termino_du) into v_gat_du from lume_educacao.le34_40_fn_rede_linha_base() lb;
  v_lb_fim := lume_educacao.le34_40_fn_data_du(v_gat_du);
  v_contrato := lume_educacao.le34_40_fn_param_data('data_termino_contratual');
  v_du_alem := greatest(0, v_term_du - lume_educacao.le34_40_fn_du(v_contrato));
  v_meses := round((greatest(0, v_term - v_lb_fim) / 30.4)::numeric, 2);

  -- custo (convenção 22)
  select va.ent into v_ent from lume_educacao.le34_40_fn_valor_agregado(v_status) va where va.frente = 'PROJETO';
  select va.ont into v_ont from lume_educacao.le34_40_fn_valor_agregado(v_status) va where va.frente = 'PROJETO';
  select va.cr into v_cra from lume_educacao.le34_40_fn_valor_agregado(v_status) va where va.frente = 'AGIL';
  select coalesce(sum(b.pontos), 0) into v_pc from lume_educacao.backlog_itens b where b.status = 'CONCLUIDO';
  v_cpp := v_cra / nullif(v_pc, 0);
  select coalesce(sum(ca.custo_adicional_rs), 0) into v_add from lume_educacao.cenario_atividades ca where ca.id_cenario = any(cen);
  select coalesce(sum(c.investimento_adicional_rs), 0), coalesce(sum(c.variacao_beneficio_pct), 0),
         coalesce(sum(c.variacao_custo_operacional_anual_rs), 0), coalesce(max(c.parcela_beneficio_antecipada_pct), 0),
         max(c.id_atividade_gatilho)
    into v_inv, v_varb, v_varc, v_parc, v_gat from lume_educacao.cenarios c where c.id_cenario = any(cen);

  -- antecipação de benefício (C6): atraso efetivo = média ponderada entre o gatilho e o término
  v_meses_ef := v_meses;
  if v_parc > 0 and v_gat is not null then
    select p.termino_du into v_gat_du from lume_educacao.le34_40_fn_previsao_rede(cen, lume_educacao.le34_40_fn_du(v_d2), lume_educacao.le34_40_fn_du(v_d3)) p where p.id_atividade = v_gat;
    v_gat_dt := lume_educacao.le34_40_fn_data_du(v_gat_du);
    v_meses_ef := round((v_parc / 100.0 * ((v_gat_dt - v_lb_fim) / 30.4) + (1 - v_parc / 100.0) * v_meses)::numeric, 2);
  end if;

  -- valor (convenção 23)
  v_tma := lume_educacao.le34_40_fn_param_num('taxa_minima_de_atratividade_aa');
  for ano in select * from lume_educacao.caso_de_negocio order by ano loop
    f := ano.beneficio_bruto_rs * (1 + v_varb / 100.0)
         - (ano.custo_operacional_rs + case when ano.ano >= 1 then v_varc else 0 end)
         - (ano.investimento_rs + case when ano.ano = 0 then round((v_ent + v_add + (v_inc - v_exc) * v_cpp + v_rec + v_inv)::numeric, 2) - v_ont else 0 end);
    if ano.ano = 1 then
      v_atraso := f * v_meses_ef / 12.0;
      f := f - v_atraso;
    end if;
    v_ant := v_acum; v_acum := v_acum + f;
    if v_pay is null and ano.ano > 0 and v_acum >= 0 and v_ant < 0 then v_pay := (ano.ano - 1) + (-v_ant) / f; end if;
    v_vpl := v_vpl + f / power(1 + v_tma, ano.ano);
    v_benef_tot := v_benef_tot + f;
    v_fluxo := v_fluxo || jsonb_build_object('ano', ano.ano, 'fluxo', round((f)::numeric, 2), 'acumulado', round((v_acum)::numeric, 2),
                                             'descontado', round((f / power(1 + v_tma, ano.ano))::numeric, 2));
  end loop;

  return query select array_to_string(cen, '+'), v_nomes, v_valida,
    round((v_vel)::numeric, 2), v_ganho, v_r2, v_r3, v_s2, v_s3, v_d2, v_d3,
    lume_educacao.le34_40_fn_data_du(v_op_du), v_term, v_du_alem, v_meses,
    v_ent, v_add, v_inc, v_exc, round((v_cpp)::numeric, 2), v_rec, v_inv,
    round((v_ent + v_add + (v_inc - v_exc) * v_cpp + v_rec + v_inv)::numeric, 0),
    v_varb, v_varc, v_parc, v_gat_dt, v_meses_ef,
    round((v_vpl)::numeric, 2), round((v_pay)::numeric, 2), v_du_alem * lume_educacao.le34_40_fn_param_num('custo_do_atraso_por_du_rs'),
    round((v_vpl - v_du_alem * lume_educacao.le34_40_fn_param_num('custo_do_atraso_por_du_rs'))::numeric, 2), round((v_benef_tot)::numeric, 2), v_fluxo;
end $$;

create or replace view lume_educacao.vw_simulacao_cenarios as
select c.id_cenario, c.tipo_cenario, c.descricao, c.id_proponente, c.combinavel_com, s.*
from lume_educacao.cenarios c cross join lateral lume_educacao.le34_40_fn_simular(array[c.id_cenario]) s
order by c.id_cenario;

-- Conferência em tempo real contra os gabaritos oficiais (C1, C3, C4)
create or replace view lume_educacao.le34_40_vw_validacao_gabaritos as
select g.id_cenario,
       g.termino_previsto as termino_gabarito, s.termino_previsto as termino_calculado,
       g.dias_uteis_alem_contrato as du_gabarito, s.dias_uteis_alem_contrato as du_calculado,
       g.meses_atraso as meses_gabarito, s.meses_atraso as meses_calculado,
       g.estimativa_no_termino_rs as ent_gabarito, s.ent_cenario as ent_calculado,
       g.variacao_beneficio_pct as var_benef_gabarito, s.variacao_beneficio_pct as var_benef_calculado,
       g.variacao_custo_operacional_rs as var_custo_gabarito, s.variacao_custo_operacional_rs as var_custo_calculado,
       (g.termino_previsto = s.termino_previsto and g.dias_uteis_alem_contrato = s.dias_uteis_alem_contrato
        and abs(g.meses_atraso - s.meses_atraso) < 0.006 and abs(g.estimativa_no_termino_rs - s.ent_cenario) <= 1
        and g.variacao_beneficio_pct = s.variacao_beneficio_pct and g.variacao_custo_operacional_rs = s.variacao_custo_operacional_rs) as confere,
       g.fonte
from lume_educacao.le34_40_gabaritos_cenarios g join lume_educacao.vw_simulacao_cenarios s using (id_cenario)
order by g.id_cenario;

create or replace view lume_educacao.le34_40_vw_simulacao_fluxo_caixa as
select s.id_cenario, (e ->> 'ano')::int as ano, (e ->> 'fluxo')::numeric as fluxo,
       (e ->> 'acumulado')::numeric as acumulado, (e ->> 'descontado')::numeric as descontado
from lume_educacao.vw_simulacao_cenarios s cross join lateral jsonb_array_elements(s.fluxo_caixa) e;

COMMIT;
