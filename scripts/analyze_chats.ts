import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return console.error('Error fetching sessions:', error)

  for (const session of sessions) {
      console.log('\n--- SESSION ---')
      console.log(`ID: ${session.id} | NAME: ${session.cliente_nome} | PHONE: ${session.cliente_telefone} | CREATED: ${session.created_at}`)
      
      const { data: msgs, error: msgErr } = await supabase
        .from('mensagens_chat')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (msgErr) {
        console.error('Error fetching msgs:', msgErr)
        continue
      }
      
      for (const m of msgs) {
        console.log(`[${m.role}]: ${m.content}`)
        if (m.execution_logs && m.execution_logs.includes('zip')) {
          console.log(`  > ZIP LOGS: ${m.execution_logs.split('\n').filter((l: string) => l.includes('zip')).join(' | ')}`)
        }
        if (m.execution_logs && m.execution_logs.includes('check_zip_coverage')) {
            console.log(`  > TOOL CALL: ${m.execution_logs.split('\n').filter((l: string) => l.includes('check_zip_coverage')).join(' | ')}`)
        }
      }
  }
}

run().catch(console.error)
