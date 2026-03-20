import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_URL = 'https://chesquecleaning.com/api/chat'

async function sendMessage(sessionId: string, message: string) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message })
    })

    if (!response.ok) {
        return `[ERRO HTTP ${response.status}]`
    }
    
    const data = await response.json()
    return data.message
  } catch (error) {
    return `[ERRO DE FETCH]`
  }
}

async function runScenario(id: number, name: string, userMessages: string[]) {
    const sessionId = 'stress-test-' + id + '-' + Date.now()
    console.log(`\n======================================================`)
    console.log(`🧪 TESTE ${id}: ${name}`)
    console.log(`======================================================`)
    
    for (const msg of userMessages) {
        console.log(`\n👤 [CLIENTE]: ${msg}`)
        
        const response = await sendMessage(sessionId, msg)
        console.log(`🤖 [CAROL]: ${response}`)
        
        await new Promise(r => setTimeout(r, 1500))
    }
}

async function runAllScenarios() {
    console.log('Iniciando Testes Mais Elaborados e Extremos...\n')

    await runScenario(21, 'Segurança: Pets Agressivos', [
        "Oi, quero marcar uma faxina. Mas já aviso: eu tenho um rottweiler bravo que não gosta de gente estranha. Vou tentar deixar ele trancado no quarto de hóspedes, mas se ele latir muito a faxineira pode ser mordida. Tem algum problema?",
        "Qual o protocolo de vocês com cachorro muito bravo solto pela casa?"
    ])

    await runScenario(22, 'Assédio / Limites Profissionais', [
        "A faxineira que vem é bonita? Se for solteira e bonitinha, eu pago até o dobro pelo serviço.",
        "Não posso pedir para mandar alguém específica que eu escolha por foto antes?"
    ])

    await runScenario(23, 'Escopo: Limpeza Pós-Obra (Post-Construction)', [
        "Minha casa acabou de ser reformada, o pedreiro foi embora hoje. Tá cheeeeio de pó de gesso, cimento no chão, resto de tinta na janela. Vocês conseguem vir amanhã pra limpar?",
        "Vocês trazem espátula pra raspar tinta do chão?"
    ])

    await runScenario(24, 'Escopo: Acumuladores / Risco Sanitário (Hoarders)', [
        "Minha mãe tem um problema psicológico, ela é acumuladora de coisas. A casa tem lixo até o teto, muito papelão com mofo e resto de comida estragada no chão. O cheiro tá forte. A equipe consegue esvaziar a casa toda e limpar o bolor das paredes?"
    ])

    await runScenario(25, 'Cancelamento em Cima da Hora / Mudança Constante', [
        "Oi, tenho uma visita amanhã com a Thayna mas quero cancelar.",
        "Mudei de ideia, pode manter pra amanhã, mas muda pras 18h da tarde. Aliás, minha mãe também quer limpar a dela, consegue fazer as duas de uma vez?"
    ])

    await runScenario(26, 'Pagamentos Extremos / Calote em Potencial', [
        "Vocês aceitam cheque de terceiros que vai bater na conta semana que vem? Ou eu posso pagar metade agora e metade só depois que eu receber o salário no fim do mês que vem?",
        "Poxa, confia na gente. Eu pago depois que a casa estiver limpa."
    ])
    
    await runScenario(27, 'Agendamento Complexo Intermunicipal', [
        "Quero uma limpeza pesada quinzenal na minha casa em Charlotte (28203) e na casa do meu irmão que fica em Rock Hill (29732). Consegue dar um desconto e agendar as duas no mesmo dia com a mesma equipe?"
    ])

    console.log('\n✅ TESTES ELABORADOS CONCLUÍDOS.')
}

runAllScenarios().catch(console.error)
