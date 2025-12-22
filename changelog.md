# Changelog - Carolinas Premium Cleaning

Este arquivo registra todas as alterações notáveis feitas no projeto Carolinas Premium Cleaning.



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
