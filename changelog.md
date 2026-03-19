# Changelog - v3.5.0 (2026-03-18)

## [3.5.0] - 2026-03-18
### Added
- **Automação de Recorrência**: Implementado endpoint de cron e lógica no banco de dados para geração automática de agendamentos futuros a partir de planos recorrentes ativos.
- **Controles de Precificação**: Adicionados campos de Desconto (Weekly, Bi-weekly, Monthly) e Buffer de Deslocamento no painel administrativo.
- **RPC Integration**: Integração completa da Carol AI com as funções nativas do banco de dados para cálculos de preço e disponibilidade.

### Changed
- **Carol AI 2.0**: Refatoração profunda do motor de consultas para usar o schema de banco de dados atualizado (`servicos_tipos`) e evitar falhas de orçamentos.
- **Rebranding Final**: Remoção total e definitiva de qualquer referência residual à marca antiga ("Carolina/Caroline"), consolidando a identidade **Chesque Premium Cleaning**.

### Fixed
- **Estabilidade Admin**: Correção crítica no mapeamento de grupos de configuração que impedia o salvamento correto de dados na aba de Empresa e Home.
- **Prevenção de Overbooking**: Nova lógica de detecção de conflitos que considera a duração estimada do serviço, impedindo sobreposições na agenda.

# Changelog - v3.4.2 (2026-03-18)

## [3.4.2] - 2026-03-18
### Fixed
- **Persistência Admin**: Corrigido bug onde configurações eram "resetadas" ao salvar abas diferentes no Admin.
- **Mapeamento de Metadados**: Mapeamento completo de todas as chaves de configuração para garantir que pertençam aos grupos corretos (`empresa`, `pagina_inicial`).
- **Segurança de Salvamento**: Implementada filtragem rigorosa no `saveBusinessSettings` para evitar que chaves de um grupo sejam sobrescritas acidentalmente por outro.
- **Migração de Dados**: Realinhamento de 39 chaves no Supabase para consistência com o novo mapeamento de código.

# Changelog - v3.4.1 (2026-03-18)

## [3.4.1] - 2026-03-18
### Fixed
- **Rebranding Residual**: Limpeza total de referências à marca "Caroline" em arquivos de infraestrutura (`.env`, `Dockerfile`, `next.config.ts`), documentação (`README.md`, `roadmap.md`) e componentes de contratos.
- **Geografia Preservada**: Garantia de que referências aos estados "North Carolina" e "South Carolina" em documentos legais não foram alteradas.

# Changelog - v3.4.0 (2026-03-18)

## [3.4.0] - 2026-03-18
### Added
- **Rebranding Core**: Transição completa da identidade visual e textual de "Caroline Premium Cleaning" para "Chesque Premium Cleaning".
- **Novas Docs**: Atualização de PRD, Design System, Flowcharts e Schemas para refletir a nova marca Chesque.
- **Configuração de Metadados**: Implementação do `CONFIG_METADATA` em `lib/business-config.ts` para melhor organização de grupos de configuração (Empresa, Página Inicial, Sistema).

### Changed
- **Páginas Administrativas e Públicas**: Atualização de todos os títulos SEO, descrições e textos fixos para a nova marca.
- **Package name**: De `caroline-cleaning` para `chesque-cleaning`.

# Changelog - v3.3.6 (2026-03-12)

## [3.3.6] - 2026-03-12
### Changed
- **Configurações Admin**: Remoção completa da aba e página de configurações de Webhooks, que não será mais utilizada.

### Fixed
- **Seletor de Idioma**: Substituição dos emojis de bandeira por SVGs nativos para garantir renderização correta em sistemas OS Windows.

# Changelog - v3.3.5 (2026-03-12)

## [3.3.5] - 2026-03-12
### Changed
- **Landing Page Copy**: Atualização completa de todos os textos da Landing Page para aplicar técnicas de Direct Response Copywriting, visando maior conversão.
- Modificados os componentes `hero.tsx`, `services.tsx`, e `testimonials.tsx` para refletirem as novas chamadas, estruturas e depoimentos agrupados.
- Atualização das configurações padrão em `lib/business-config.ts` para alinhar com o documento aprovado.

# Changelog - v3.3.4 (2026-03-06)

## [3.3.4] - 2026-03-06
### Fixed
- **Carol AI**: Corrigida a inicialização do `adminSupabase` e leituras de configurações do banco (`configuracoes`).
- **Tools Carol AI**: Implementado normalização de telefone, fallback para orçamentos (remoção de cálculo direto) e alinhamento de parâmetros entre schema e executor da IA.
- **Segurança e Estabilidade**: Endpoint `/api/slots` agora utiliza funções persistentes no banco de dados. Limite de loops lógicos incluído no agente.

# Changelog - v3.3.3 (2026-02-25)
## [3.3.3] - 2026-02-25
### Fixed
- **Performance do Middleware**: Otimização radical do middleware para reduzir latência de login/navegação em >3s, ignorando assets e executando `getUser` apenas sob demanda.
- **Bloqueio Admin**: Correção do erro "Bloqueado" ao acessar `/admin`, causado por conflitos de headers RSC e redirecionamentos ineficientes.

# Changelog - v3.3.2 (2026-02-07)

## [3.3.2] - 2026-02-07
### Added
- **Logs Persistentes**: Alteração no banco de dados para salvar os logs técnicos de execução da Carol IA em cada mensagem da assistente.
- **Botão "Baixar Logs"**: Adicionado botão no painel de administração para baixar o arquivo `.txt` com o tracing técnico da IA.

# Changelog - v3.3.1 (2026-02-07)

## [3.3.1] - 2026-02-07
### Added
- **Logs de Depuração**: Implementação de logs detalhados na rota `/api/chat` e na classe `CarolAgent` para facilitar o rastreamento de erros e chamadas de ferramentas.
- **Guardrails de Segurança**: Adição de proteções no sistema de prompt contra injeção de prompt (prompt injection), tentativas de jailbreak e fuga de escopo.

# Changelog - v3.3.0 (2026-02-07)

## [3.3.0] - 2026-02-07
### Added
- **Exportação de Conversa**: Novo botão na página de detalhes da mensagem (`/admin/mensagens/[sessionId]`) que permite exportar o histórico completo em formato Markdown (`.md`).
- **Markdown Utility**: Função `exportToMarkdown` em `lib/export-utils.ts` para geração de relatórios de chat.

# Changelog - v3.2.4 (2026-02-07)

## [3.2.4] - 2026-02-07
### Fixed
- **Correção Geral de Build**: Reescrita integral das páginas de `Despesas` e `Receitas` para eliminar erros de sintaxe JSX e nomes de variáveis inconsistentes.
- **Internacionalização (i18n)**: Correção de erro de tipagem no `AdminI18nProvider` que bloqueava a compilação global.
- **Módulo Financeiro**: Remoção de chaves de tradução dinâmicas inexistentes em `CategoryManager` e páginas financeiras, substituindo por fallbacks seguros.

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
