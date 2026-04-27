// Test script to verify .contains() behavior with Supabase
import { createAdminClient } from '../lib/supabase/server'

const ZIPS_TO_TEST = ['29708', '07032', '28202', '29730']

async function testContains() {
  const supabase = createAdminClient()

  console.log('=== Testing .contains() method ===\n')

  for (const zip of ZIPS_TO_TEST) {
    console.log(`\nTesting ZIP: ${zip}`)

    // Method 1: .contains()
    const { data: containsData, error: containsError } = await supabase
      .from('areas_atendidas')
      .select('id, nome, cidade, zip_codes')
      .eq('ativo', true)
      .contains('zip_codes', [zip])
      .limit(1)

    console.log(`  .contains():`, {
      found: !!containsData && containsData.length > 0,
      error: containsError?.message,
      result: containsData?.[0] ?? null
    })

    // Method 2: RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_zip_code_coverage', { p_zip_code: zip })

    console.log(`  RPC:`, {
      found: !rpcError && rpcData && rpcData.length > 0,
      error: rpcError?.message,
      result: rpcData?.[0] ?? null
    })
  }
}

testContains().then(() => console.log('\nDone')).catch(console.error)
