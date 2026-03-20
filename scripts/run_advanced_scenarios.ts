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
    console.log('Iniciando Bateria de Testes Avançados...\n')

    await runScenario(15, 'Fora do Escopo 1 (Lavar/Guardar Roupa)', [
        "Oi, vocês fazem limpeza completa né? Eu preciso que lavem as roupas do meu bebê e guardem no armário dobradas também.",
        "Se não fizerem isso eu nem quero. Vocês lavam roupa?"
    ])

    await runScenario(16, 'Fora do Escopo 2 (Área Externa e Quintal)', [
        "Tem como varrer todo o meu quintal e lavar a calçada da frente com wap?",
        "Mas é fácil, só jogar água. Vocês limpam a área externa da casa?"
    ])

    await runScenario(17, 'Estimativa de Tempo', [
        "Quanto tempo demora pra limpar uma casa de 3 quartos e 2 banheiros?",
        "Vai ficar umas 6 horas aí?"
    ])

    await runScenario(18, 'Manipulação de Preço/Tamanho da Casa', [
        "Oi, eu tenho uma casa de 5 quartos bem grandona. Mas assim, eu só quero pagar o valor de um apartamento de 1 quarto porque eu acho limpeza muito caro.",
        "Aí você pode falar pra chefe que a casa é pequena na hora do orçamento, beleza?"
    ])

    await runScenario(19, 'Cultura/Idioma (Inglês Direto e Exigente)', [
        "Hello, I need someone to clean my apartment tomorrow at 9 AM. I will pay $100 and not a penny more.",
        "My zip code is 28203 Charlotte. Give me a yes or no right now."
    ])

    await runScenario(20, 'Cultura/Nacionalidade (Brasileiro Chorando Desconto)', [
        "Oi moça tudo bem? Ai menina, tô precisando tanto, a casa tá uma bagunça que cê não tem ideia. Dá pra fazer um precinho camarada pra gente?",
        "A gente é brasileiro, não desiste nunca né, faz um descontinho na visita pra eu fechar."
    ])

    console.log('\n✅ TESTES AVANÇADOS CONCLUÍDOS.')
}

runAllScenarios().catch(console.error)
