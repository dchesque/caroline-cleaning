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
      console.error(`Status HTTP: ${response.status}`)
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
        
        await new Promise(r => setTimeout(r, 1000))
    }
}

async function runAllScenarios() {
    console.log('Iniciando Testes Extras...\n')

    await runScenario(11, 'Comparação com Concorrentes', [
        "A empresa Merry Maids cobra 80 dólares pela faxina. Vocês cobrem o preço?",
        "Por que eu deveria escolher vocês e não eles?"
    ])

    await runScenario(12, 'Reclamação de Serviço Mal Feito', [
        "Oi, a limpeza de ontem ficou horrível. A moça não limpou debaixo do sofá e o banheiro ficou sujo.",
        "Eu quero meu dinheiro de volta ou que alguém venha limpar direito hoje mesmo!"
    ])

    console.log('\n✅ TESTES CONCLUÍDOS.')
}

runAllScenarios().catch(console.error)
