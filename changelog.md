# Changelog - v3.2.0 (2026-02-06)

## [3.2.3] - 2026-02-07
### Fixed
- Correção no módulo de Mensagens Admin: as conversas com a Carol IA agora são exibidas corretamente através da view `v_conversas_recentes`.
- Recuperação de informações de leads (nome/telefone) a partir do contexto da sessão de chat.
- Diferenciação visual entre "Clientes Registrados" e "Leads/Visitantes" com badges e ações contextuais no admin.
- Atualização da view de banco de dados para incluir suporte a papéis e contexto estendido.

## [3.2.2] - 2026-02-07

### Added
- **Notificações Admin (WhatsApp)**: Implementação de alertas via WhatsApp para o proprietário sobre novos agendamentos e leads capturados.
- **Cron de Lembretes Nativo**: Novo sistema de cron via Supabase/Next.js que envia lembretes (WhatsApp/SMS) 1 hora antes de cada serviço.
- **Configurações de Segurança**: Proteção do endpoint de cron via `CRON_SECRET` e cabeçalhos de autorização.
- **Supabase pg_cron**: Migração SQL para agendamento automático de tarefas diretamente no banco de dados.

### Changed
- **Twilio Integration**: Extensão da biblioteca de comunicação para suportar mensagens via WhatsApp (prefixo `whatsapp:`).
- **Serviço de Webhooks**: Refatoração do `WebhookService` para priorizar notificações nativas Twilio, mantendo fallback opcional para N8N.

### Fixed
- **Erro de Build (Credentials)**: Correção do erro `Missing credentials` durante o build do Next.js. A rota `/api/chat` foi marcada como dinâmica e a inicialização do cliente OpenAI foi atrasada via Proxy para evitar execução prematura sem chaves de API.
- **Erro de Deploy (Types)**: Correção de erro de tipo no `app/(public)/chat/page.tsx` migrando para o hook `useCarolChat`.
- **Limpeza de Código**: Remoção de hooks (`useChat`, `useChatSession`) e utilitários (`chat-session.ts`) legados que não eram mais compatíveis com a Carol AI Nativa.
- **Resiliência SQL**: Correção no script de migração de cron para permitir re-execução segura (idempotência).

---

# Changelog - v3.1.0 (2026-02-05)

## [3.0.0] - 2026-02-05

### Added
- **Carol AI Nativa**: Implementação completa de motor de IA nativo usando OpenRouter (Claude 3.5 Sonnet).
- **Tool Calling Direct Integration**: Integração direta com Supabase para consultar agenda, calcular preços e criar leads/bookings.
- **Buffer de 1 Hora**: Lógica de agendamento que impede conflitos e garante intervalo de 60 minutos entre serviços.
- **Rate Limiting**: Controle de taxa de 30 req/min para a API de chat no Middleware.
- **Documentação Técnica**: Novo arquivo `docs/CAROL_AI.md` descrevendo a arquitetura.

### Changed
- **Arquitetura de Chat**: Substituição completa da integração legacy com n8n pela Carol AI Nativa.
- **Frontend Hook**: Migração do `useChat` para `useCarolChat`.
- **UI de Mensagens**: Atualização dos componentes de chat para suportar o novo formato de dados e metadados.

### Fixed
- **Latência de Resposta**: Respostas mais rápidas eliminando o intermediário n8n.
- **Precisão de Agendamento**: Re-validação de disponibilidade no momento do agendamento para evitar race conditions.

---
*Status: Operacional e pronto para produção.*
