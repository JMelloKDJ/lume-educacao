# Integração LE-34, LE-40 e LE-18

Base: snapshot oficial de 28/11/2026. Preservados backend, IA, protótipo e configurações.

## Instalação e aceite
- Revisar a exposição dos dados gerenciais e exigir autorização no endpoint antes de produção pública.
- Aplicar `sql/06_le34_le40_paineis_simulador.sql` primeiro em cópia do banco oficial; verificar tipos, dependências e permissões.
- Executar `npm ci` e `npm run build` no repositório oficial.
- Abrir Painel Geral e Cenários; testar todas as abas e lançar boletim pelo CRUD existente; verificar atualização em até 10 segundos.
- Conferir C1/C3/C4 com a view de validação e D16; não aceitar divergências sem investigação.
- C2/C5/C6 são estimativas; C6 depende da interpretação da antecipação.

## Limites
Painéis complementares em tabela e gráfico selecionável; não substituem o quadro Scrum nem implementam arrastar cartões. Atualização por polling, não Supabase Realtime. O simulador apresenta seis cenários individuais, sem interface para combinações. Não houve execução contra o banco oficial nem build completo neste ambiente.

## LE-18
Preservar documentos existentes. Conferir D1–D17, ficha do grupo, caderno, Gantt, diário de prompts de três pessoas, relatório e comprovante de submissão. Não declarar submissão realizada.
