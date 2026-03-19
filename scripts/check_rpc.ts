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
  const { data, error } = await supabase.rpc('check_zip_code_coverage', { p_zip_code: '29708' })
  console.log('RPC check_zip_code_coverage:', data, error)

  const { data: q1 } = await supabase.from('areas_atendidas').select('nome, zip_codes, ativo')
  console.log('All areas:', JSON.stringify(q1, null, 2))
}
run().catch(console.error)
