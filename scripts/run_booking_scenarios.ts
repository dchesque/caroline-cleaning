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

    if (!response.ok) { return `[ERRO HTTP ${response.status}]` }
    const data = await response.json()
    return data.message
  } catch (error) { return `[ERRO DE FETCH]` }
}

async function runScenario(id: number, name: string, userMessages: string[]) {
    const sessionId = 'booking-test-' + id + '-' + Date.now()
    console.log(`\n======================================================`)
    console.log(`📅 TESTE ${id}: ${name}`)
    console.log(`======================================================`)
    
    for (const msg of userMessages) {
        console.log(`\n👤 [CLIENTE]: ${msg}`)
        const response = await sendMessage(sessionId, msg)
        console.log(`🤖 [CAROL]: ${response}`)
        await new Promise(r => setTimeout(r, 1500))
    }
}

async function runAllScenarios() {
    console.log('Iniciando Testes Extremistas de Agendamento...\n')

    await runScenario(28, 'Agendamento Duplo (Mesmo dia, mesma casa)', [
        "Oi, eu quero agendar uma faxina para terça-feira que vem de manhã.",
        "Marcos, 5519888877, 123 Main St 29708",
        "Pode confirmar.",
        "Tudo certo, WhatsApp. Olha, eu esqueci de falar, mas eu também quero agendar pra terça-feira à tarde pra limpar os banheiros denovo. Pode marcar pro mesmo dia às 15h?"
    ])

    await runScenario(29, 'Agendamento 6 Meses no Futuro', [
        "Quero marcar minha faxina pro dia 12 de Outubro, que é meu aniversário. Vocês conseguem deixar já na agenda garantido pra daqui a 6 meses?",
        "Joana, telefone 5515554321, CEP 28202."
    ])

    await runScenario(30, 'Recorrência Direta no Chat', [
        "Oi, queria marcar uma faxina recorrente quinzenal, começando segunda que vem, por favor.",
        "Fernando, telefone 5513332211, Fort Mill 29715",
        "E como fica a cobrança se for quinzenal? Vocês já debitam no cartão todas as quinzenas automaticamente?"
    ])

    console.log('\n✅ TESTES DE AGENDAMENTO CONCLUÍDOS.')
}

runAllScenarios().catch(console.error)
