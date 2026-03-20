import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { CarolAgent } from '../lib/ai/carol-agent'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Mock stream reader for direct test
async function readDirectStream(readable: ReadableStream) {
    const reader = readable.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
            if (line.startsWith('0:')) {
                try { text += JSON.parse(line.substring(2)) } catch (e) { }
            }
            if (line.startsWith('9:')) {
                try { 
                    const data = JSON.parse(line.substring(2))
                    if (data.type === 'tool_result' && data.toolName === 'create_booking') {
                        // Keep track of bookings to clean them up maybe, or just log
                    }
                } catch(e) {}
            }
        }
    }
    return text
}

async function runScenario(name: string, messages: string[]) {
    const sessionId = 'test-direct-' + Date.now() + Math.floor(Math.random() * 1000)
    console.log(`\n======================================================`)
    console.log(`🚀 CENÁRIO: ${name}`)
    console.log(`======================================================`)
    
    // We mock messages history locally
    const history = []
    
    for (const msg of messages) {
        console.log(`\n[USUÁRIO]: ${msg}`)
        
        history.push({ role: 'user', content: msg })
        
        const agent = new CarolAgent(sessionId)
        try {
            const result = await agent.chat(msg, history.length === 1)
            
            if (result instanceof Response && result.body) {
                const responseText = await readDirectStream(result.body as unknown as ReadableStream)
                console.log(`[CAROL AI]: ${responseText}`)
                history.push({ role: 'assistant', content: responseText })
            } else {
                console.log(`[CAROL AI (Non-Stream)]:`, result)
            }
        } catch (error) {
            console.error('[ERRO INTERNO]:', error)
        }
    }
}

async function runAll() {
    await runScenario('CENÁRIO 1: Cliente Inelegível (CEP Fora da Área)', [
        "Oi, queria marcar uma faxina na minha casa.",
        "Meu nome é Marcos Silva e meu telefone é 5518889922",
        "Meu CEP é 90210" 
    ])

    await runScenario('CENÁRIO 2: Simulação Completa de Agendamento + Checklist', [
        "Boa tarde!",
        "Luciana Ferraz, telefone 5512233445",
        "Meu endereço é 123 Main St, Fort Mill, SC 29708",
        "sim para quarta-feira que vem de tarde",
        "Tudo correto sim, prefiro SMS"
    ])
}

runAll().then(() => {
    console.log('\n✅ TESTES CONCLUÍDOS')
    process.exit(0)
}).catch(console.error)
