# Carol AI - Documentação Técnica (Nativa)

Esta documentação descreve a implementação da Carol AI como um agente nativo no Next.js, substituindo a integração legada com n8n.

## Arquitetura

O sistema utiliza os seguintes componentes:

1.  **Next.js API Route (`/api/chat`)**: Endpoint principal que recebe mensagens do frontend.
2.  **CarolAgent (`lib/ai/carol-agent.ts`)**: Orquestrador da lógica de IA, responsável pelo loop de conversação e chamadas de ferramentas.
3.  **OpenRouter Client (`lib/ai/openrouter.ts`)**: Interface para interação com modelos LLM (atualmente Claude 3.5 Sonnet).
4.  **Supabase Integration**: Persistência direta de mensagens, sessões, leads e agendamentos.
5.  **React Hook (`hooks/use-carol-chat.ts`)**: Gerencia o estado do chat, persistência local e feedback visual.

## Ferramentas (Tools)

Carol possui acesso às seguintes capacidades dinâmicas:

-   `check_availability`: Consulta horários disponíveis via RPC `get_available_slots`.
-   `calculate_price`: Calcula orçamentos via RPC `calculate_service_price`.
-   `create_lead`: Registra informações de contato na tabela `clientes`.
-   `create_booking`: Cria agendamentos confirmados na tabela `agendamentos`.
-   `check_zip_coverage`: Valida cobertura de área via RPC `check_zip_code_coverage`.

## Configuração

### Variáveis de Ambiente
-   `OPENROUTER_API_KEY`: Chave de API para o OpenRouter.
-   `CAROL_DEFAULT_MODEL`: Modelo LLM utilizado (default: `anthropic/claude-3.5-sonnet`).

### Rate Limiting
Configurado no `middleware.ts` com limite de **30 requisições por minuto** por IP para a rota `/api/chat`.

## Fluxo de Mensagem

1.  Usuário envia mensagem via `ChatWidget`.
2.  `useCarolChat` faz update otimista na UI e envia POST para `/api/chat`.
3.  `CarolAgent` recupera histórico do Supabase e envia para o OpenRouter.
4.  Se a IA decidir chamar uma ferramenta, o `CarolAgent` executa a função localmente e envia o resultado de volta para a IA.
5.  A resposta final é salva no Supabase e retornada ao frontend.

## Logs e Observabilidade

Logs estruturados são gerados em cada etapa via `lib/logger.ts`, permitindo rastrear o uso de ferramentas e possíveis erros de integração.

---
*Gerado automaticamente em 05/02/2026*
