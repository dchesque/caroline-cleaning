# Changelog - v3.5.25 (2026-04-21)

## [3.5.25] - 2026-04-21
### Fixed
- **Tracking (Admin Persistence)**: Pixels and scripts saved in `/admin/configuracoes/trackeamento` are now actually persisted and take effect on the public site. Resolved a `grupo` mismatch in `CONFIG_METADATA` that caused every save to silently drop all tracking keys, and the corresponding load filter that always returned `DEFAULT_SETTINGS`. Migrated 18 `tracking_*` rows from `grupo='empresa'` to `grupo='trackeamento'`.
- **Tracking (UTMify Key Inconsistency)**: Standardized on `tracking_utmify_*` across UI, defaults, seed migration, and DB (was split between `utmfy` and `utmify`, so UTMify never activated even with a pixel saved).
- **Tracking (JSONB Parsing)**: `mapSupabaseConfigToTracking` and the Meta CAPI handler no longer crash when reading JSONB boolean/number values from `configuracoes`. Rewritten to accept `boolean | number | string | null`.
- **Tracking (RLS Public Read)**: Extended the anon read policy on `configuracoes` to include `tracking_%` keys, excluding any containing `access_token`, `secret`, `api_key`, or `private`. `/api/tracking/config` was previously returning an empty array for all public visitors.
- **Tracking (Server-Side CAPI Auth)**: `/api/tracking/event` no longer returns 401 to anonymous landing visitors (the primary use case). Replaced the session-auth gate with an IP-based rate limit (120 req/min). Internal bearer (`CRON_SECRET`) still bypasses the limit for server-to-server calls.
- **Tracking (Access Token Visibility)**: The event route now uses `createAdminClient()` (service role) to read `tracking_meta_access_token` server-side. The token never leaves the server; it is used only in the Meta Graph API call URL.
- **Tracking (Custom Scripts Execution)**: Replaced `<Script dangerouslySetInnerHTML>` + `<div dangerouslySetInnerHTML>` wrappers with a new `RawHtmlInjector` that clones each `<script>` node via `document.createElement` so user-pasted snippets (including full `<script>…</script>` tags) actually execute in the browser.

### Changed
- **Rate Limits**: Added dedicated `tracking` rate limit bucket (120 req/min/IP) in `lib/rate-limit.ts`.

# Changelog - v3.5.24 (2026-03-19)

## [3.5.24] - 2026-03-19
### Fixed
- **AI Agent (Phone Confirmation):** Carol now always repeats the client's phone number back to them for confirmation before proceeding. The phone is the sole reliable contact link.
- **AI Agent (Date Parsing):** "Next [weekday]" (e.g., "next Friday") is now always interpreted as the following calendar week. Confirmed dates are now shown in (mm/dd) format alongside the weekday name.

# Changelog - v3.5.23 (2026-03-19)

## [3.5.23] - 2026-03-19
### Changed
- **AI Agent (Legal/Insurance Policy):** Completely banned the AI from using the words "seguro" or "insurance" and from promising direct monetary reimbursement due to strict US regulations. The AI now defers any damage accidents to the manager (Thayna) for personal evaluation.

# Changelog - v3.5.22 (2026-03-19)

## [3.5.22] - 2026-03-19
### Changed
- **AI Agent (Company Policies Updated):**
  - Updated damaged item policy: clients have 24h to report, and Chesque Cleaning pays upon professional evaluation.
  - Allowed AI to inform that cleaning products can be fully provided upon special agreement.
  - Specified staff identity: Thayna does visits, and Thayna + 1 or 2 helpers perform cleanings.

# Changelog - v3.5.21 (2026-03-19)

## [3.5.21] - 2026-03-19
### Changed
- **AI Agent:** Refined system prompt to reflect strict company policies:
  - Ensured AI never mentions the company being "fully insured" and relies on background checks for trust.
  - Clarified that the company provides equipment (vacuums, buckets, mops) but the client provides specific cleaning products.
  - Instructed AI to inquire specifically about allergy causes when mentioned and capture them in booking notes.

# Changelog - v3.5.20 (2026-03-19)

## [3.5.20] - 2026-03-19
### Added
- **Carol AI (Checklist de Confirmação)**: Adicionada regra rigorosa no Sistema de Prompt para que a IA sempre envie um checklist resumido amigável (Nome, Telefone, Endereço e Horário) solicitando a conferência do cliente assim que um agendamento for concluído no banco de dados.

# Changelog - v3.5.19 (2026-03-19)

## [3.5.19] - 2026-03-19
### Fixed
- **Carol AI (Consulta de Área Atendida - CEPs)**: Resolvido um problema silencioso onde a IA rejeitava áreas cobertas de Fort Mill ou Charlotte porque o banco de dados falhava internamente no método `ANY(zip_codes)` durante o PL/pgSQL do Postgres. A validação de proximidade pelo chat bot migrou para um método determinístico em Node.js usando `select().contains()` pelo Supabase, garantindo que nenhum ZIP Code mapeado previamente fique de fora do escopo.

# Changelog - v3.5.18 (2026-03-19)

## [3.5.18] - 2026-03-19
### Fixed
- **Carol AI (Prevenção de Alucinação de Tools)**: Adicionada injeção de contexto na memória da IA (`agendamento_confirmado`) informando-a ativamente sobre agendamentos já confirmados no banco de dados na sessão atual. Isso impede que a IA alucine tentando usar a ferramenta `create_booking` novamente em turnos subsequentes devido à ausência de histórico de execução de ferramentas no banco de dados do Supabase.

# Changelog - v3.5.17 (2026-03-19)

## [3.5.17] - 2026-03-19
### Fixed
- **Carol AI (Duplicidade de Agendamento)**: Correção do loop onde a IA tentava usar a ferramenta `create_booking` logo após já ter criado um agendamento com sucesso, apenas para salvar a preferência de notificação (SMS/WhatsApp). Foi criada a nova ferramenta `update_communication_preference` garantindo que o slot não seja reportado como ocupado indevidamente.
- **Carol AI (Agendamentos Existentes)**: Atualizada a inteligência de identificação de cliente (`find_customer`) para que, ao buscar pelo telefone, a IA também acesse e leia os até 5 próximos agendamentos confirmados do cliente. Evita sobreposições e alerta o cliente caso tente marcar algo no mesmo horário ou dia de uma visita já programada.

### Added
- **Ferramenta de IA (`update_communication_preference`)**: Nova action nativa da IA para atualizar a preferência de canal de notificação sem conflitar com `create_booking`.

# Changelog - v3.5.16 (2026-03-19)

## [3.5.16] - 2026-03-19
### Added
- **Agenda / Calendário**: Adicionado campo de "Frequência" (Semanal, Quinzenal, Mensal, Avulso) no modal "Novo Agendamento" da tela de Agenda. Agora é possível criar planos recorrentes diretos pelo calendário sem precisar navegar até a página do Cliente ou Contratos. Ao salvar, as recorrências futuras são populadas imediatamente no calendário.

# Changelog - v3.5.15 (2026-03-19)

## [3.5.15] - 2026-03-19
### Fixed
- **Recorrências (Agendamentos)**: Refatoração integral da lógica do cron `/api/cron/recurrences` para respeitar os intervalos exatos das frequências (Quinzenal saltando 14 dias, Mensal saltando 28 dias). Antes o sistema replicava qualquer recorrência como se fosse semanal.
- **UX da Agenda**: Agendamentos futuros agora são gerados e exibidos *imediatamente* na agenda após a criação ou edição de um plano recorrente ou contrato, sem precisar aguardar a execução automatizada da madrugada.
- **Segurança da API**: Endpoint do cron agora permite gatilhos manuais via sessões administrativas já autenticadas, mitigando o retorno 401 para instâncias geradas no frontend.

# Changelog - v3.5.14 (2026-03-19)

## [3.5.14] - 2026-03-19
### Fixed
- **Carol AI (Agendamentos)**: Correção do cálculo de fuso horário que impedia agendamentos no período da tarde ao interpretar o horário UTC como horário local.
- **Carol AI (Endereço)**: Inclusão de passo de confirmação de endereço no fluxo de clientes existentes para evitar deslocamentos errados.
- **Carol AI (Prevenção de Conflitos)**: Implementação de travas no prompt do sistema para evitar chamadas duplicadas da ferramenta `create_booking` na mesma interação (Double Booking).

# Changelog - v3.5.13 (2026-03-19)

## [3.5.13] - 2026-03-19
### Fixed
- **Build**: Adicionadas dependências `dotenv` e `@types/dotenv` para corrigir erro de tipo no script `update_brand_db.ts` durante o deploy no Easypanel.

# Changelog - v3.5.12 (2026-03-19)

## [3.5.12] - 2026-03-19
### Fixed
- **Admin**: Corrigido um erro de "check constraint (configuracoes_categoria_check)" ao salvar as configurações da empresa/página inicial. O mapeamento interno das categorias agora respeita estritamente os valores permitidos no banco de dados (`geral`, `integracao`, `precos`, etc).
- **Infraestrutura**: Corrigido o nome do pacote do servidor MCP do Supabase para `@supabase/mcp-server-supabase` em `.antigravity/mcp.json`.
- **Verificação**: Validada a conexão com o banco de dados e listagem de 35 tabelas/views via API REST utilizando as mesmas credenciais do MCP.

# Changelog - v3.5.11 (2026-03-19)

## [3.5.11] - 2026-03-19
### Added
- **Infraestrutura**: Configuração do servidor MCP do Supabase em `.antigravity/mcp.json` utilizando o modo de comando (`npx @supabase/mcp-server`).
- **Segurança**: Integração da `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` no ambiente do MCP para permitir que agentes executem queries e acessem recursos do banco de dados com permissões adequadas.

# Changelog - v3.5.10 (2026-03-19)

## [3.5.10] - 2026-03-19
### Changed
- **Linguagem Natural**: Substituição global de travessões (—) por vírgulas em todos os textos da plataforma e banco de dados para uma comunicação mais fluida e menos formal.
- **Carol AI**: Atualização do prompt do sistema com instrução explícita para evitar o uso de travessões em respostas geradas por IA.
- **Configuração**: Refatoração de `DEFAULT_SETTINGS` e migrações SQL para alinhar com o novo padrão de pontuação.

# Changelog - v3.5.9 (2026-03-19)


## [3.5.9] - 2026-03-19
### Fixed
- **Restauração de Emergência**: Reversão total da seção Hero para o estado original da imagem 1239 ("Premium Cleaning for Homes & Office").
- **Identidade Preservada**: Restabelecido o nome oficial "Chesque Premium Cleaning" em cabeçalhos e metadados, removendo abreviações indevidas.

# Changelog - v3.5.8 (2026-03-19)

## [3.5.8] - 2026-03-19
### Fixed
- **Slogan do Hero**: Atualizado para a versão completa: "Premium Cleaning for Homes & Offices" na segunda linha.
- **Correção de Cor**: Restaurado o padrão escuro para a primeira linha ("Chesque") visando melhor legibilidade.

# Changelog - v3.5.7 (2026-03-19)

## [3.5.7] - 2026-03-19
### Fixed
- **Limpeza de Branding**: Chaves órfãs e redundantes removidas do Supabase.
- **Restauração de Conteúdo**: Subtítulo original recuperado no Hero e cor preta restaurada para melhor visibilidade.

# Changelog - v3.5.3 (2026-03-18)

## [3.5.3] - 2026-03-18
### Fixed
- **Estilo de Marca (Hero)**: Ajuste fino na hierarquia visual do cabeçalho. "Chesque" em destaque na primeira linha e "Premium Cleaning" na segunda linha com a cor da marca (nude), removendo repetições.

# Changelog - v3.5.2 (2026-03-18)

## [3.5.2] - 2026-03-18
### Fixed
- **Headline Sincronizada (Hero)**: Reestruturação completa dos títulos padrão e fallbacks para garantir que a marca e o slogan sejam exibidos sem redundâncias ("Chesque Premium Cleaning" + "Expert Home & Office Care").

# Changelog - v3.5.1 (2026-03-18)

## [3.5.1] - 2026-03-18
### Fixed
- **Redundância Visual (Hero)**: Corrigida a duplicação do termo "Premium Cleaning" no cabeçalho da página inicial, ajustando fallbacks e valores padrão para uma leitura mais fluida.

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
