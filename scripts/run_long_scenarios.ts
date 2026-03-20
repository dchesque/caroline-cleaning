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
    console.log('Iniciando Testes Longos...\n')

    await runScenario(13, 'Dúvidas sobre Produtos e Alergias', [
        "Oi, eu queria saber se vocês usam produtos muito fortes nas limpezas.",
        "Eu tenho dois cachorros em casa e sou um pouco alérgica a cheiros fortes. Quais marcas vocês costumam usar? São seguras para pets?",
        "E eu preciso fornecer alguma coisa? Vassoura, balde, sei lá.",
        "Entendi, obrigada. Então vamos marcar uma visita para dar uma olhada, por favor."
    ])

    await runScenario(14, 'Identidade da Equipe e Segurança', [
        "Oi, se eu agendar uma visita com vocês, quem vem na minha casa olhar?",
        "E para a limpeza em si? Quem é a pessoa que vai vir fazer o serviço? Vai ser sempre a mesma faxineira que vem se eu fechar semanal?",
        "Entendi, eu fico com medo de colocar pessoas desconhecidas em casa. Como vocês garantem que a pessoa é confiável?",
        "Perfeito. Meu nome é Joana Ribeiro, meu telefone é 5519876543, posso agendar para a semana que vem no Fort Mill 29708?"
    ])

    await runScenario(15, 'Tiroteio de Perguntas (Escopo Detalhado)', [
        "Oi, quero fazer uma deep cleaning na minha casa.",
        "Antes de dar os dados, me tira umas dúvidas: vocês limpam janela pelo lado de fora?",
        "E dentro da geladeira e do forno, tá incluso na limpeza profunda?",
        "Se a faxineira quebrar um vaso meu sem querer durante a limpeza, o que acontece?",
        "Última pergunta: eu sou obrigada a sair de casa enquanto vocês limpam ou posso ficar no home office trabalhando?",
        "Perfeito, me convenceu. Meu cep é 28203, me chama de Fernando, tel: 5512223333"
    ])

    console.log('\n✅ TESTES LONGOS CONCLUÍDOS.')
}

runAllScenarios().catch(console.error)
