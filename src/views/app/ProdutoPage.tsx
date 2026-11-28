'use client';

import { KpiCard } from '@/components/ui/kpi-card';
import { ProductCoverflowShowcase } from '@/components/produto/ProductCoverflowShowcase';

export function ProdutoPage() {
  return (
    <div className="space-y-4">
      <ProductCoverflowShowcase />

      {/* KPIs compactos do Produto */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Telas Homologadas"
          value="15 telas"
          badgeText="06 fluxos no palco"
          badgeTone="positive"
          insight="Protótipo navegável R12 / D17 (Web e Android)"
        />
        <KpiCard
          title="Consumo Médio Offline"
          value="16,4 MB"
          badgeText="-72% dados"
          badgeTone="neutral"
          insight="Compatível com redes 3G no interior"
        />
        <KpiCard
          title="Nota Média de Satisfação"
          value="4,8 / 5,0"
          badgeText="18,4 mil alunos"
          badgeTone="gold"
          insight="Avaliação direta nas turmas piloto"
        />
      </div>
    </div>
  );
}
