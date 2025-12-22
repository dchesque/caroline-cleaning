# Changelog - Carolinas Premium Cleaning

Este arquivo registra todas as alterações notáveis feitas no projeto Carolinas Premium Cleaning.

## [Em Desenvolvimento] - 21/22 de Dezembro 2024
### Adicionado
- **Módulo de Configurações**:
  - Implementação das sub-páginas de Áreas de Atendimento (`/admin/configuracoes/areas`).
  - Implementação de Add-ons (`/admin/configuracoes/addons`).
  - Implementação de Gestão de Equipe (`/admin/configuracoes/equipe`).
  - Interface CRUD para Serviços.
- **Módulo Analytics**:
  - Implementação da página de Análise de Conversão com funil detalhado e métricas de leads.
  - Implementação da página de Satisfação do Cliente com distribuição de notas e histórico de feedbacks.
  - Implementação da página de Tendências e Projeções com métricas preditivas e insights automáticos.
  - Criação de novos componentes reutilizáveis: `KPICard`, `PeriodSelector`, `SatisfactionChart` e `TrendsChart`.
  - Refatoração do dashboard principal de Analytics para melhor integração e navegação.
- **Módulo Financeiro**:
  - Nova interface de Receitas com filtros avançados e listagem detalhada.
  - Estrutura inicial para Despesas e Relatórios.
  - Componentes de gráficos (Revenue Chart) e categorias de despesas.
  - Formulário interativo para transações.

### Modificado
- Refatoração de funções utilitárias em `lib/utils.ts`.
- Ajustes na navegação lateral do Admin para incluir as novas rotas de financeiro e configurações.

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
