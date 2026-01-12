# Carolinas Premium - Roadmap de Desenvolvimento

Este documento detalha o estado atual do módulo Admin e as funcionalidades planejadas para as próximas versões.

## 🚀 Em Progresso / Próximas Etapas

### 1. Gestão de Equipe & Permissões
- **Configurações de Equipe (`/admin/configuracoes/equipe`)**:
    - [ ] Interface para definição de níveis de acesso (Admin, Supervisor, Cleaner).
    - [ ] Gestão de escalas de trabalho e dias de folga.
    - [ ] Atribuição de cores de identificação para o calendário.
- **Performance**:
    - [ ] Dashboard de produtividade por membro da equipe.
    - [ ] Sistema de avaliações vinculadas aos agendamentos.

### 2. Analytics & Business Intelligence
- **Analytics de Clientes (`/admin/analytics/clientes`)**:
    - [ ] Cálculo automático de LTV (Lifetime Value).
    - [ ] Relatório de Churn (clientes que pararam de agendar).
    - [ ] Segmentação RFM (Recência, Frequência, Valor Monetário).
- **Relatórios Financeiros**:
    - [ ] Gráficos comparativos de receita mensal/anual.
    - [ ] Projeção de fluxo de caixa baseada em contratos recorrentes.

### 3. Automação & CRM
- **Mensageria**:
    - [ ] Templates de resposta rápida para a Carol (IA).
    - [ ] Integração nativa com WhatsApp via API (estilo Twilio/Green API).
    - [ ] Notificações automáticas de lembrete de agendamento (SMS/WhatsApp).
- **Leads**:
    - [ ] Fluxo de automação para conversão de leads frios.
    - [ ] Pontuação de leads baseada na interação com o ChatWidget.

### 4. Gestão Financeira (CRUDs Completos)
- **Faturamento**:
    - [ ] Emissão automática de invoices/boletos após conclusão do serviço.
    - [ ] Conciliação bancária simplificada.
- **Controle de Gastos**:
    - [ ] Upload de recibos e categorização de despesas operacionais.

## 🛠️ Manutenção Técnica & Infra
- **Melhorias de Tipagem**: Sincronização automática de tipos entre Supabase e `types/index.ts`.
- **Performance**: Implementação de cache (React Query ou Next.js Cache) para listagens pesadas.
- **Segurança**: Auditoria completa de RLS (Row Level Security) em todas as tabelas.

---

## 📋 Checklist de Páginas Incompletas (Placeholders atuais)
- [x] `/admin/equipe` (Linkado em Configurações)
- [x] `/admin/analytics/clientes` (Placeholder melhorado)
- [ ] `/admin/configuracoes/notificacoes` (Parcialmente implementado na página principal de configs)

---
*Atualizado em: 12 de Janeiro de 2026*
