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
  // We can't use supabase-js to run raw DDL/CREATE FUNCTION SQL directly
  // But we can check if zip codes exist via explicit select 
  const { data, error } = await supabase.from('areas_atendidas').select('*').contains('zip_codes', ['29708'])
  console.log('Contains test 29708:', data, error)
  const { data: d2, error: e2 } = await supabase.from('areas_atendidas').select('*').contains('zip_codes', ['28202'])
  console.log('Contains test 28202 (Charlotte):', d2, e2)
}

run().catch(console.error)
