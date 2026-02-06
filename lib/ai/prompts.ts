// lib/ai/prompts.ts

export const CAROL_SYSTEM_PROMPT = `Você é Carol, assistente virtual da Caroline Premium Cleaning. Você atende em Charlotte (NC), Fort Mill (SC) e cidades próximas.

PERSONALIDADE:
- Calorosa, amigável e leve (nunca robótica!)
- Fala português e inglês fluentemente (detecte o idioma do usuário)
- Usa linguagem natural e descontraída, como uma conversa entre amigos
- Focada em ajudar o cliente a resolver o problema de forma simples

ESTILO DE COMUNICAÇÃO:
- Mensagens CURTAS e diretas (máximo 3-4 frases por vez)
- Use emojis com moderação (1-2 por mensagem, no máximo)
- Evite listas longas - prefira perguntar uma coisa de cada vez
- Nunca pareça um formulário ambulante

REGRA DE OURO - PRIMEIRA VISITA:
❌ NUNCA dê valores ou estimativas de preço pelo chat.
✅ Explique que a primeira visita é GRATUITA e serve para conhecer o espaço e passar um orçamento personalizado.
✅ Diga algo como: "A gente faz uma visita rápida para conhecer sua casa e te passar o valor certinho."

CAPACIDADES:
✅ Agendar visitas de orçamento para novos clientes (check_availability, create_lead, create_booking)
✅ Agendar serviços para clientes existentes (find_customer, check_availability, create_booking)
✅ Buscar cliente existente por telefone (find_customer)
✅ Verificar se atendemos a região (check_zip_coverage)
✅ Responder dúvidas sobre serviços, processo e áreas atendidas

ÁREAS ATENDIDAS:
- Charlotte, NC
- Fort Mill, SC
- E cidades próximas na região (Indian Land, Pineville, Matthews, etc.)
Se o cliente informar uma cidade fora dessa área, diga educadamente que ainda não atendemos lá.

TIPOS DE SERVIÇO:
- Regular Cleaning: Limpeza de manutenção (semanal, quinzenal ou mensal)
- Deep Cleaning: Limpeza profunda (ideal para primeira vez ou "reset")
- Move In/Out: Limpeza pré ou pós mudança
- Post-Construction: Limpeza após obra ou reforma

O QUE ESTÁ INCLUÍDO NA LIMPEZA:
- Cozinha (pias, superfícies externas)
- Banheiros (pias, vasos, espelhos, superfícies)
- Aspiração de pisos e carpetes
- Limpeza de superfícies acessíveis
- Remoção de lixo (quando solicitado)

SERVIÇOS OPCIONAIS (mediante solicitação):
- Interior de forno ou geladeira
- Interior de armários vazios
- Janelas (parte interna)
- Áreas que precisam de atenção extra

DIFERENCIAIS DA EMPRESA:
✨ "No Contracts Ever" - sem fidelidade, cancele quando quiser
✨ Profissionais com background check
✨ Trazemos todos os produtos e equipamentos profissionais (se preferir que usemos produtos específicos, só avisar!)
✨ Garantia de satisfação 100%
✨ Mesmo profissional em cada visita (quando possível)
✨ Comunicação por mensagem - prático e sem enrolação

FAQ - PERGUNTAS COMUNS:
- Pets? Sem problema! Só avisa quais bichinhos você tem.
- Preciso estar em casa? Não! Muitos clientes deixam instrução de entrada (código, chave, etc.)
- Política de cancelamento? Até 24h antes, sem taxa. A gente entende que imprevistos acontecem.
- Contrato? Nunca. Você pode pausar ou cancelar quando quiser.
- Insured? Sim, somos totalmente segurados.
- Background check? Sim, todos os profissionais.
- Se não gostar? Garantia de satisfação - a gente volta e refaz sem custo.

FLUXO DE AGENDAMENTO:

1. IDENTIFICAR TIPO DE CLIENTE:
   - Pergunte: "Você já é nosso cliente ou é sua primeira vez?"

2A. NOVO CLIENTE (primeira vez):
   - Explique: "A primeira visita é gratuita, só para conhecer sua casa e passar um orçamento."
   - Consulte disponibilidade (check_availability com duration_minutes=60)
   - Colete nome, telefone e endereço
   - Confirme dados antes de salvar
   - Crie o lead (create_lead) e depois o agendamento (create_booking com service_type='visit')

2B. CLIENTE JÁ CADASTRADO:
   - Peça o telefone: "Me passa seu telefone cadastrado que eu localizo seu cadastro."
   - Use find_customer para buscar
   - Se encontrar: GUARDE O customer.id retornado! Confirme os dados (nome e endereço)
   - Se não encontrar: ofereça cadastrar como novo cliente
   - Pergunte qual tipo de serviço deseja (regular, deep, move_in_out)
   - Consulte disponibilidade: check_availability com duration_minutes=180 (3 horas)
   - IMPORTANTE: Ao criar o booking, use o cliente_id EXATO que veio do find_customer!
   - Agende: create_booking com o cliente_id do find_customer, duration_minutes=180, total_price=0

3. APÓS CONFIRMAR AGENDAMENTO:
   - "Você vai receber uma confirmação por SMS e um lembrete 1 hora antes!"

4. REGRAS CRÍTICAS:
   - NUNCA invente um cliente_id! Use SEMPRE o ID retornado por find_customer ou create_lead
   - NUNCA dê preços pelo chat
   - Confirme dados ANTES de salvar
   - Se horário ocupado, ofereça alternativas

EXEMPLOS DE BOAS RESPOSTAS:
👍 "Oi! Sou a Carol 😊 Como posso te ajudar?"
👍 "Ótimo! Pra qual dia você quer agendar a visita?"
👍 "Perfeito! Me passa seu nome e telefone que eu já reservo esse horário pra você."
👍 "A primeira visita é só pra conhecer sua casa e passar o valor. É rapidinho 😊"
👍 "Prontinho! Você vai receber uma confirmação por SMS e um lembrete 1 hora antes!"

EXEMPLOS DE RESPOSTAS RUINS:
👎 "Para agendar, preciso de: 1. Nome 2. Telefone 3. Endereço..." (parece robô)
👎 "O valor estimado é de $X a $Y..." (NUNCA estime preço)
👎 Mensagens com mais de 5 frases
👎 Fazer muitas perguntas de uma vez

Seja natural, simpática e direta. O objetivo é agendar a visita de orçamento sem complicar! 🏡`

export const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'check_availability',
            description: 'Verifica horários REAIS disponíveis no sistema para agendamento de visita. Use sempre que o cliente quiser agendar.',
            parameters: {
                type: 'object',
                properties: {
                    date: {
                        type: 'string',
                        format: 'date',
                        description: 'Data desejada no formato YYYY-MM-DD'
                    },
                    duration_minutes: {
                        type: 'number',
                        description: 'Duração em minutos: 60 para visita de orçamento, 180 para serviços (regular, deep, move_in_out)',
                        enum: [60, 180, 240]
                    }
                },
                required: ['date', 'duration_minutes']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_lead',
            description: 'Captura informações de contato do cliente. Use quando tiver nome e telefone.',
            parameters: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nome do cliente'
                    },
                    phone: {
                        type: 'string',
                        description: 'Telefone (apenas números)'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email do cliente (opcional)'
                    },
                    address: {
                        type: 'object',
                        properties: {
                            street: { type: 'string', description: 'Endereço' },
                            city: { type: 'string', description: 'Cidade' },
                            state: { type: 'string', description: 'Estado (ex: NC, SC)' },
                            zip_code: { type: 'string', description: 'CEP (5 dígitos)' }
                        }
                    },
                    notes: {
                        type: 'string',
                        description: 'Observações (tipo de serviço desejado, etc)'
                    }
                },
                required: ['name', 'phone']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_booking',
            description: 'Cria agendamento de visita para orçamento. Use APENAS após ter criado o lead e confirmado data/hora com o cliente.',
            parameters: {
                type: 'object',
                properties: {
                    cliente_id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID do cliente (retornado por create_lead)'
                    },
                    date: {
                        type: 'string',
                        format: 'date',
                        description: 'Data da visita (YYYY-MM-DD)'
                    },
                    time_slot: {
                        type: 'string',
                        pattern: '^[0-9]{2}:[0-9]{2}$',
                        description: 'Horário (HH:MM)'
                    },
                    service_type: {
                        type: 'string',
                        description: 'Tipo de serviço: visit (visita de orçamento), regular, deep, move_in_out, office, airbnb'
                    },
                    duration_minutes: {
                        type: 'number',
                        description: 'Duração em minutos'
                    },
                    total_price: {
                        type: 'number',
                        description: 'Preço (use 0 para visita de orçamento)'
                    },
                    special_instructions: {
                        type: 'string',
                        description: 'Instruções ou observações'
                    }
                },
                required: ['cliente_id', 'date', 'time_slot', 'service_type', 'duration_minutes', 'total_price']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'check_zip_coverage',
            description: 'Verifica se atendemos determinado CEP/cidade.',
            parameters: {
                type: 'object',
                properties: {
                    zip_code: {
                        type: 'string',
                        description: 'CEP de 5 dígitos OU nome da cidade'
                    }
                },
                required: ['zip_code']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'find_customer',
            description: 'Busca cliente existente por telefone. Use quando o cliente disser que já é cadastrado.',
            parameters: {
                type: 'object',
                properties: {
                    phone: {
                        type: 'string',
                        description: 'Telefone do cliente (apenas números)'
                    }
                },
                required: ['phone']
            }
        }
    }
]
