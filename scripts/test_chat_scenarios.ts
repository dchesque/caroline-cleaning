import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Define the port the app is running on
const API_URL = 'http://localhost:3000/api/chat'

async function sendMessage(sessionId: string, message: string) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages: [{ role: 'user', content: message }] })
    })

    if (!response.ok) {
      console.error(`Error HTTP ${response.status}:`, await response.text())
      return null
    }
    
    // Ler o Data Stream (a resposta vem encodada em fluxos do Vercel AI SDK)
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    
    if (reader) {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            // O Vercel AI SDK envia tokens no formato: 0:"Olá"
            const lines = chunk.split('\n')
            for (const line of lines) {
                if (line.startsWith('0:')) {
                    try {
                        const token = JSON.parse(line.substring(2))
                        fullText += token
                    } catch (e) { }
                }
            }
        }
    }
    return fullText
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

async function runScenario(name: string, messages: string[]) {
    const sessionId = 'test-session-' + Date.now() + Math.floor(Math.random() * 1000)
    console.log(`\n======================================================`)
    console.log(`🚀 INICIANDO CENÁRIO: ${name}`)
    console.log(`======================================================`)
    
    for (const msg of messages) {
        console.log(`\n[USUÁRIO]: ${msg}`)
        // Add a slight delay to simulate human interaction and avoid rate limits
        await new Promise(r => setTimeout(r, 1000))
        const response = await sendMessage(sessionId, msg)
        console.log(`[CAROL AI]: ${response}`)
    }
}

async function runAll() {
    // Check if server is running
    try {
        await fetch('http://localhost:3000')
    } catch (e) {
        console.error('❌ ERRO: O servidor Next.js não parece estar rodando em http://localhost:3000. Inicie com `npm run dev` primeiro.')
        return
    }

    // Cenários Fictícios
    await runScenario('CENÁRIO 1: Cliente Inelegível (CEP Fora da Área)', [
        "Oi, queria marcar uma faxina na minha casa.",
        "Meu nome é Marcos Silva e meu telefone é 5518889922",
        "Meu CEP é 90210" // Beverly Hills (não coberto)
    ])

    await runScenario('CENÁRIO 2: Cliente Recusando Visita (Insistência em Preço)', [
        "Oi, qual o valor de uma faxina simples para apt 2 quartos?",
        "Mas não tem como me dar pelo menos uma média? Não quero visita."
    ])

    await runScenario('CENÁRIO 3: Simulação Perfeita de Agendamento + Checklist', [
        "Boa tarde!",
        "Quero uma limpeza para a semana que vem, na segunda se possível.",
        "Luciana Ferraz, telefone 5512233445",
        "Meu endereço é 123 Main St, Fort Mill, SC 29708",
        "sim para segunda às 10h da manhã",
        "Tudo correto, prefiro SMS"
    ])
}

runAll()
