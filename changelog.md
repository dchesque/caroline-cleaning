# Changelog - Carolinas Premium Cleaning

Este arquivo registra todas as alterações notáveis feitas no projeto Carolinas Premium Cleaning.











## [1.7.1] - 2026-01-14
### Corrigido
- **Admin (Dashboard)**: Adicionada diretiva `'use client'` que causava erro de execução ao usar hooks de internacionalização no servidor.

## [1.7.0] - 2026-01-14
### Adicionado
- **Admin (Internacionalização)**:
  - Tradução completa das páginas: Serviços, Mensagem, Analytics e Configurações.
  - Implementação de suporte multi-idioma para métricas dinâmicas e modais complexos de add-ons.
  - Conversão da página de Analytics para Client Component para suporte total a i18n.
  - Tradução de todos os diálogos de configuração de horários, notificações e regras de agendamento.

### Corrigido
- **Admin (Serviços)**: 
  - Correção de bug no toggle de status de serviço (uso correto de `servico.id`).
  - Ajuste de tradução nas métricas de multiplicador e duração nos cards de serviço.

## [1.6.0] - 2026-01-14
### Adicionado
- **Admin (Internacionalização)**:
  - Sistema bi-língue (Português-BR e Inglês-USA) para o painel administrativo.
  - Seletor de idioma no header com bandeiras (Brasil e EUA) e persistência em `localStorage`.
  - `AdminI18nProvider` com suporte a dicionário dinâmico e hook `useAdminI18n`.
  - Tradução completa da barra lateral (Sidebar) e do cabeçalho (Header).

## [1.5.0] - 2026-01-14
### Adicionado
- **Admin (Agenda)**:
  - **Indicador de Hora Atual (Current Time Line)**: Linha vermelha horizontal mostrando a hora atual em tempo real nas visualizações Diária e Semanal, com atualização automática a cada minuto.
  - **Detecção de Conflitos de Horário**: Agendamentos simultâneos agora são posicionados lado a lado (estilo Google Calendar), com cálculo automático de largura baseado no número de sobreposições.
  - **Tooltips Ricos ao Hover**: Preview detalhado ao passar o mouse sobre agendamentos (nas visualizações Diária e Semanal), exibindo cliente, telefone, endereço, valor, serviços e observações.
  - **Layout Compacto para Visualização Mensal**: Cards otimizados mostrando intervalo de horário completo (10:00-12:00) e nome do cliente em formato horizontal.

### Melhorado
- **Admin (Agenda)**:
  - Sistema de posicionamento inteligente de tooltips (aparecem abaixo do card, centralizados, com seta decorativa).
  - Cards responsivos com ocultação automática de elementos secundários em espaços estreitos.
  - Variantes de layout (normal/compact) para otimização de espaço em diferentes visualizações.
  - Borda lateral colorida nos cards compactos indicando status do agendamento.

### Corrigido
- **Admin (Agenda)**:
  - Correção de overflow na visualização mensal para permitir exibição completa de tooltips.
  - Ajuste de z-index para garantir que tooltips apareçam acima de todos os elementos do calendário.
  - Resolução de problemas de badge sendo cortado na visualização semanal.

## [1.4.0] - 2026-01-14
### Adicionado
- **Admin (Agenda)**:
  - Novo modal de detalhes de agendamento (`AppointmentDetailModal`) com visualização completa de dados, cliente, serviços e addons.
  - Funcionalidade de exclusão de agendamentos com diálogo de confirmação.
  - Suporte total à edição de agendamentos existentes, reaproveitando o formulário de criação com carregamento dinâmico de dados.

### Melhorado
- **Admin (Agenda)**:
  - Refatoração visual do `AppointmentCard` para um design premium (fundo claro, tipografia Sans-Serif moderna e layout estruturado conforme solicitado).
  - Sincronização automática entre as visualizações de Mês, Semana e Dia.
  - Melhoria na legibilidade com fontes aumentadas e uso das cores institucionais (#C48B7F).
  - Formatação de horários nos cards e modais para remover segundos e melhorar a clareza visual.

### Corrigido
- **Admin (Agenda)**:
  - Correção crítica do bug de "deslocamento de data" causado por fuso horário: a agenda agora utiliza comparação direta de strings de data (`YYYY-MM-DD`).
  - Ajuste no posicionamento e dimensionamento dos cards nas visualizações de Dia e Semana para refletir com precisão o horário de início e duração.
  - Resolução de erro de importação ausente (`cn`) no componente de detalhes.

## [1.3.20] - 2026-01-14
### Corrigido
- **Admin (Agenda)**:
  - Resolução do erro "Maximum update depth exceeded" ao selecionar serviços adicionais no modal de agendamento.
  - Estabilização do cliente Supabase no hook `useAppointmentForm` utilizando `useMemo`.
  - Refatoração do componente `AddonSection` para evitar disparos duplicados de eventos de clique e atualização de estado.
  - Melhoria na robustez da lógica de toggle de addons para prevenir duplicidade de itens no estado.
  - Correção de erro na criação de agendamento: removido o envio manual do campo `valor_final` (coluna gerada automaticamente pelo banco).

## [1.3.19] - 2026-01-12
### Melhorado
- **Admin (Agenda)**:
  - Refatoração completa do Modal de Novo Agendamento para maior modularidade e manutenibilidade.
  - Componentização das seções (Cliente, Serviço, Addons, Valores, Resumo).
  - Isolamento da lógica de negócios em hook customizado `useAppointmentForm`.

## [1.3.18] - 2026-01-12
### Corrigido
- **Interface (UI)**:
  - Resolução definitiva de erros de "Maximum update depth exceeded" e incompatibilidade com React 19:
    - Retorno às versões mais recentes do Radix UI (compatíveis com React 19).
    - Refatoração de `Dialog`, `Select`, `Checkbox`, `Label` para usar `forwardRef`.
    - Desabilitação do `reactStrictMode` temporariamente para evitar double-invocation loops conhecidos em bibliotecas de terceiros no Next.js 15.

## [1.3.17] - 2026-01-12
### Corrigido
- **Financeiro**:
  - Correção de erro crítico ao salvar transações (constraint violation para valor nulo).
- **Clientes**:
  - Correção de erro na atualização de recorrências (falha PGRST204 no Supabase).
- **Build**:
  - Resolução de dependências ausentes (@radix-ui/react-alert-dialog) e assets (noise.png).

## [1.3.16] - 2026-01-12
### Adicionado
- **Admin (Financeiro)**:
  - Sistema completo de gerenciamento de categorias de receitas e despesas.
  - Nova página de gestão centralizada em `/admin/financeiro/categorias`.
  - Botão de criação rápida (+) integrado nos formulários de lançamento de transações.
  - API REST para CRUD de categorias.
### Melhorado
- **Admin (Financeiro)**:
  - Filtros de categoria nas páginas de Despesas e Receitas agora carregam dados dinâmicos do banco de dados.
  - Dashboard financeiro atualizado com botão de acesso direto ao gerenciador de categorias.

## [1.3.15] - 2026-01-12
### Adicionado
- **Admin (Equipe)**: 
  - Funcionalidade de exclusão permanente com diálogo de confirmação premium.
  - Diálogos de confirmação customizados para ativação e desativação de membros.
### Melhorado
- **Admin (Equipe)**:
  - Melhoria visual nos cards de membros inativos com badge de status e opacidade reduzida.
  - Refinamento do menu de ações com cores semânticas e feedbacks visuais no hover.

## [1.3.14] - 2026-01-12
### Alterado
- **Admin (Configurações)**:
  - O link do card "Equipe" agora aponta diretamente para `/admin/equipe`, facilitando o acesso ao módulo de gestão de membros.

## [1.3.13] - 2026-01-12
### Adicionado
- **Admin**:
  - Nova página de placeholder para Configurações de Equipe (`/admin/configuracoes/equipe`).
  - Criação do arquivo `roadmap.md` na raiz do projeto, detalhando o plano de desenvolvimento futuro.
### Melhorado
- **Admin (Analytics)**:
  - Placeholder de Analytics de Clientes (`/admin/analytics/clientes`) atualizado com design premium e informações sobre funcionalidades planejadas.

## [1.3.12] - 2026-01-12
### Alterado
- **Landing Page (About Us)**:
  - Alteração do título da seção de "Commitment to Quality & Trust" para "A Cleaning Team You Can Trust".

## [1.3.11] - 2026-01-12
### Alterado
- **Global**:
  - Padronização de todos os botões de CTA residuais: alteração de "Request a Quote" para "Schedule Visit Now" nos componentes `Services`, `Testimonials` e `Pricing`.

## [1.3.10] - 2026-01-12
### Alterado
- **Landing Page (Services)**:
  - Alteração do label do botão no card "Need a Custom Quote?" de "Request a Quote" para "Schedule Visit Now".

## [1.3.9] - 2026-01-12
### Alterado
- **Landing Page (Services)**:
  - Alteração de texto no bloco "Need a Custom Quote?" de "Get a quote today." para "Get a quote now."

## [1.3.8] - 2026-01-12
### Alterado
- **Landing Page (Header)**:
  - Simplificação do bloco de contato no desktop: remoção do prefixo "Text to:" e do link extra.
  - Atualização do texto do botão principal para "Schedule Visit Now".

## [1.3.7] - 2026-01-12
### Alterado
- **Landing Page (Header)**:
  - Refinamento do contato: ícone de SMS (`MessageSquare`) adicionado entre o prefixo "Text to:" e o número.
  - Inversão das labels: o gatilho de texto agora é "Schedule Visit now" e o botão de chat é "Talk to Carol".

## [1.3.6] - 2026-01-12
### Alterado
- **Landing Page (Header)**:
  - Alteração do link do telefone para `sms:`.
  - Adição do prefixo "text " ao número de telefone.
  - Transformação do "Talk to Carol" em um gatilho para o chat.

## [1.3.5] - 2026-01-12
### Alterado
- **Landing Page (Hero)**:
  - Uniformização do design de avaliações na Hero Section para corresponder ao formato horizontal e clicável da seção de depoimentos.

## [1.3.4] - 2025-12-22
### Corrigido
- **Gestão de Mensagens**:
  - Remoção de código morto: exclusão da pasta obsoleta `app/(admin)/admin/mensagens/[id]` (conflitante com `[sessionId]`).

## [1.3.3] - 2025-12-22
### Corrigido
- **Dependências (UI)**:
  - Downgrade temporário de pacotes Radix UI para estabilizar componentes:
    - `@radix-ui/react-select` -> `2.2.4`
    - `@radix-ui/react-dialog` -> `1.1.10`

## [1.3.2] - 2025-12-22
### Corrigido
- **Modal de Agendamento**:
  - Correção de possível loop infinito no `useEffect` removendo `serviceTypes` das dependências e tratando a inicialização do tipo de serviço.

## [1.3.1] - 2025-12-22
### Corrigido
- **Dependências (UI)**:
  - Atualização dos pacotes `@radix-ui/react-presence` e `@radix-ui/react-compose-refs` para resolver problemas de recursão infinita (Maximum update depth exceeded) em componentes de diálogo e modal.

## [1.3.0] - 2025-12-22
### Adicionado
- **Modal de Agendamento (Refatoração)**:
  - Integração com tabelas `servicos_tipos` e `addons` para carregamento dinâmico.
  - Seleção de múltiplos addons com definição de quantidade individual.
  - Cálculo automático e em tempo real de valores (Base, Addons, Desconto, Total) e duração do serviço.
  - Salvamento aprimorado de dados com persistência de addons em JSONB na tabela `agendamentos`.
  - Busca de clientes otimizada com debounce e visualização detalhada.

## [1.2.3] - 2025-12-22
### Melhorado
- **Ficha do Cliente (Tab Info)**:
  - Adicionada exibição visual dos serviços adicionais (addons) contratados.
  - Correção de tipagem na redução de mapas de serviços e addons.
- **Modal de Clientes**:
  - Correção crítica no cadastro de recorrência: Inclusão de campos obrigatórios (`horario_preferido`, `valor_base`) que impediam o salvamento.
  - Melhoria no sistema de logs de erro.

## [1.2.2] - 2025-12-22
### Modificado
- **Modal de Clientes**:
  - Implementação de validações robustas (Telefone, Email, Zip Code) usando `lib/formatters`.
  - Integração dinâmica com tabela de Serviços e Addons.
  - Melhoria na UX com preenchimento automático de endereço via CEP.
  - Suporte completo a seleção de serviços adicionais (addons) no cadastro.

## [1.2.1] - 2025-12-22
### Modificado
- **Página de Serviços**:
  - Refatoração completa de `/admin/servicos` para utilizar novos componentes UI e biblioteca de formatação.
  - Melhoria na validação de inputs e feedback visual ao usuário.

## [1.2.0] - 2025-12-22
### Adicionado
- **Módulo de Equipe**:
  - Nova seção administrativa exclusiva para gestão de membros (`/admin/equipe`).
  - CRUD completo com suporte a cadastro de cores, cargos e status.
  - Soft-delete para preservação de histórico.
- **Módulo de Clientes**:
  - Busca automática de endereço via ZIP Code (integração Zippopotam.us).
  - Modal de Cliente Atualizado: Suporte a múltiplos dias da semana com serviços distintos (ex: Segunda: Deep / Quarta: Office).
  - Dropdown avançado: Ações rápidas (Editar, SMS, WhatsApp), alteração de status e exclusão segura.
  - Header da Ficha do Cliente: Botões diretos para SMS/WhatsApp/Ligar, alteração de status via badge e navegação otimizada.
  - Abas da Ficha do Cliente: 
    - Agendamentos: KPIs, separação Próximos/Histórico, novo agendamento rápido.
    - Financeiro: Indicadores de receita, pendências e tabela de histórico.
    - Contratos: Visualização do contrato ativo, recorrência e histórico completo.
- **Módulo de Contratos**:
  - Sistema completo de gestão de contratos (`/admin/contratos`) com suporte a rascunhos e envio.
  - Página de criação (`/admin/contratos/novo`) com seleção de clientes e cálculo automático.
- **Gestão de Chat e Histórico**:
  - Nova página de detalhes da conversa com histórico completo (`/admin/mensagens/[id]`).
  - Correção na persistência e identificação de mensagens do assistente.
- **Agendamento Avançado**:
  - Atualização do modal de agendamento para suportar seleção de equipe.
  - Suporte a recorrências complexas (multi-dia, multi-serviço).
- **Integração Frontend**:
  - Criação de API Pública de Configurações (`/api/config/public`).
  - Rodapé (Footer) consumindo dados dinâmicos do banco.
- **Módulo de Configurações**:
  - Implementação de Áreas de Atendimento, Add-ons e CRUD de Serviços.
- **Módulo Analytics**:
  - Páginas de Conversão, Satisfação e Tendências com novos gráficos e KPIs.
- **Módulo Financeiro**:
  - Interface de Receitas e estrutura para Despesas/Relatórios.
- **Módulo de Equipe**:
  - Nova página de gestão de equipe (`/admin/equipe`) com CRUD completo, badges de cargo e soft-delete.
- **Utilitários**:
  - Biblioteca centralizada de formatação e validação ('lib/formatters.ts') com suporte a telefones, moedas, ZIP Codes e validações comuns.

### Modificado
- Atualização da navegação lateral (Sidebar) para incluir 'Equipe'.
- Refatoração de componentes utilitários e rotas de API.
- **Limpeza de Código**:
  - Remoção de arquivo duplicado/placeholder de equipe em `configuracoes/equipe`.
- **Refatoração do Modal de Cliente (Step 4)**:
  - Implementação rigorosa de regras de frequência: Apenas 'Semanal' permite múltiplos dias/serviços.
  - Bloqueio automático e feedback visual para frequências quinzenais/mensais/avulsas.
  - Interface otimizada para seleção de dias e serviços com validação dinâmica.
- **Refatoração da Tab Informações (Ficha do Cliente)**:
  - Layout modernizado com cards organizados (Dados Pessoais, Endereço, Residência, Acesso).
  - Exibição inteligente de recorrências complexas (multi-dias/multi-serviços).
  - Integração visual com novos badges de status e ícones.
- **Refatoração da Tab Agendamentos (Ficha do Cliente)**:
  - Dashboard integrado com 4 KPIs principais e gráficos de resumo.
  - Separação clara entre "Próximos Agendamentos" (ativos) e "Histórico" (concluídos/cancelados).
  - Ações rápidas no dropdown: Confirmar, Concluir, Lançar Fatura (Financeiro) e Cancelar.
  - Integração direta com o Modal de Novo Agendamento.
- **Refatoração da Tab Financeiro (Ficha do Cliente)**:
  - Dashboard financeiro pessoal com Totais Recebidos, Pendentes e Último Pagamento.
  - Destaque automático para Faturas Pendentes no topo da lista.
  - Tabela histórica completa com ações contextuais: Editar, Marcar como Pago, Cancelar, Reverter e Excluir.
  - Lógica de atualização de status com tratamento de data de pagamento.
- **Refatoração da Tab Contratos (Ficha do Cliente)**:
  - Listagem limpa e objetiva de contratos ativos e históricos.
  - Status visual com cores semânticas (Pendente, Assinado, Expirado).
  - Modal placeholder informativo para preparar a próxima fase de desenvolvimento.
- **Refatoração da Tab Notas (Ficha do Cliente)**:
  - Separação clara entre Notas Internas (Privadas/Equipe) e Notas Gerais (Públicas).
  - Edição inline com botões dinâmicos (Editar/Salvar/Cancelar).
  - Feedback visual e tags de privacidade para cada seção.

### Corrigido
- **Compatibilidade de Banco de Dados (Crítico)**:
  - Correção no mapeamento de colunas no cadastro de Clientes (`bedrooms`, `bathrooms`, `square_feet`).
  - Ajuste na lógica de pets (separação entre booleano e text).
  - Correção no payload de criação de Agendamentos (conversão para minutos e cálculo de horário final).
  - Implementação da gravação correta de recorrências ao criar Contratos.
  - Atualização integral do modal de clientes (client-modal.tsx) para garantir compatibilidade com schema do banco.
  - Atualização do modal de agendamentos (appointment-modal.tsx) para alinhar campos como datas, horários e duração com o banco.

---

## [1.1.0] - 2025-12-21
### Adicionado
- **Painel Administrativo**:
  - Gestão de Clientes e Agendamentos.
  - Dashboard principal com métricas.
  - Sistema de Gestão de Leads.
- **Landing Page (Pública)**:
  - Desenvolvimento completo da página inicial com seções: Hero, Sobre Nós, Depoimentos (Testimonials), Selos de Confiança (Trust Badges), FAQ e Como Funciona.
  - Calculadora de preços integrada.
  - Formulário de contato dinâmico.
  - Header responsivo com navegação suave.
  - Páginas Legais (Termos de Uso e Política de Privacidade).
- **Personalização**:
  - Ajustes de "Persona" (Sarah Mitchell) focando em transparência e agilidade.
  - Integração de mini-chat dinâmico com notificações sonoras.

### Corrigido
- Ajuste de sobreposição entre a barra de anúncios e o cabeçalho.
- Padronização da exibição de localizações nos depoimentos.
- Limpeza de retornos duplicados no build.
- Correção de busca na coluna de endereço (`endereco_rua` para `endereco_completo`).

---

## [1.0.0] - 2025-12-18
### Adicionado
- **Arquitetura**:
  - Implementação de Webhooks centralizados com integração n8n.
  - Estabilização da arquitetura Mobile-First (responsividade total).
  - Sistema de notificação por balão de chat (mini-chat bubble).
- **SEO & Performance**:
  - Otimização de imagens e metadados.

---

## [0.9.0] - 2025-12-17
### Adicionado
- Endpoint de Health Check para monitoramento de saúde da API e banco de dados.
- Validação de variáveis de ambiente em tempo de execução.

### Modificado
- **Docker & Deploy**:
  - Otimização do Dockerfile para melhor compatibilidade com Easypanel.
  - Downgrade estratégico para Next.js 15.5.7 visando estabilidade em ambiente de produção.
  - Ajustes de memória e heap limit no health check.

---

## [0.5.0] - 2025-12-15
### Adicionado
- Estrutura inicial de Autenticação (Login e estilos globais).
- Infraestrutura de API e integração com Supabase.
- Dashboard administrativo básico com Analytics e agendamentos.

### Documentação
- Atualização abrangente do README.md com guias de instalação e variáveis de ambiente.

---

## [0.1.0] - 2025-12-11
### Adicionado
- Commit Inicial: Estrutura base utilizando Next.js App Router.
- Configuração de bibliotecas UI (Shadcn/UI, Tailwind CSS).
