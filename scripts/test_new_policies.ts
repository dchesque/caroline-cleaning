import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_URL = 'http://localhost:3002/api/chat'

async function runTest() {
    console.log('🧪 Iniciando Teste de Validação das Novas Políticas (Localhost)\n')
    const sessionId = 'test-policies-' + Date.now()

    const msgs = [
        "Oi! Meu cachorro morou lá fora e eu tenho alergia severa. Quais produtos você usa? Vocês trazem o produto e os equipamentos todos?",
        "E outra coisa, eu tenho medo de colocar gente na minha casa. Se a faxineira quebrar uma tv, a empresa de vocês tem seguro pra cobrir?"
    ]

    for (const msg of msgs) {
        console.log(`\n👤 [CLIENTE]: ${msg}`)
        
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: msg })
            })
            const data = await res.json()
            console.log(`🤖 [CAROL]: ${data.message}`)
        } catch (e) {
            console.log('Erro ao chamar API local', e)
        }
        await new Promise(r => setTimeout(r, 1000))
    }

    console.log('\n✅ TESTE CONCLUÍDO.')
}

runTest().catch(console.error)
