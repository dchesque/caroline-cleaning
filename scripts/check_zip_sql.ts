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
  const { data, error } = await supabase.from('areas_atendidas').select('nome, zip_codes').eq('nome', 'Fort Mill')
  console.log('Fort Mill zip_codes raw data:', data)
  if (data && data.length > 0) {
    for (const z of data[0].zip_codes) {
        console.log(`Zip [${z}] Length: ${z.length} | CharCodes:`, [...z].map(c => c.charCodeAt(0)))
    }
  }
}
run().catch(console.error)
