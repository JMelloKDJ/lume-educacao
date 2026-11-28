import { NextResponse } from 'next/server';
import { queryReadOnly } from '@/lib/db';
export const dynamic = 'force-dynamic';
const views: Record<string,string> = {"fluxo": "vw_fluxo_agil_dora", "burndown": "vw_burndown_diario", "cfd": "vw_cfd_diario", "velocidade": "vw_velocidade_sprints", "releases": "vw_previsao_releases", "capacidade": "le34_40_vw_capacidade_folha_mensal", "produtividade": "le34_40_vw_produtividade_equipes", "riscos": "le34_40_vw_riscos_matriz", "reservas": "le34_40_vw_reservas_exposicao", "mudancas": "le34_40_vw_mudancas_controle", "cenarios": "vw_simulacao_cenarios", "validacao": "le34_40_vw_validacao_gabaritos"};
export async function GET(request: Request) {
 const key = new URL(request.url).searchParams.get('painel') || '';
 if (!Object.prototype.hasOwnProperty.call(views,key)) return NextResponse.json({error:'Painel inválido'}, {status:400});
 try {
  const rows = await queryReadOnly(`SELECT * FROM lume_educacao.${views[key]} LIMIT 2000`);
  return NextResponse.json({rows}, {headers:{'Cache-Control':'no-store'}});
 } catch { return NextResponse.json({error:'View indisponível. Verifique a configuração e a migração SQL.'},{status:503}); }
}
