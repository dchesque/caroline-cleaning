# Changelog - v3.0.0 (2026-02-05)

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
