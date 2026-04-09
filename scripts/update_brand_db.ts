
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Carregar .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateSettings() {
  console.log('🔄 Atualizando configurações de marca no Supabase...')

  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao buscar configurações:', error.message)
    return
  }

  const updatedMetadata = {
    ...data.metadata,
    business_name: "Chesque Premium Cleaning",
    seo_title: "Chesque Premium Cleaning | Quality Service You Can Trust",
    ai_greeting: "Olá! Eu sou a Carol, sua assistente virtual da Chesque Premium Cleaning. Como posso ajudar você hoje?",
    about_bio_p1: "Thayna founded Chesque Premium Cleaning with one mission: to bring the same care and attention to your home that she gives to her own. Originally from Brazil, she built this business on trust, dedication, and a passion for making people's lives easier.",
    signature_message: "Seu contrato/termo de serviço com a Chesque Premium Cleaning está pronto."
  }

  const { error: updateError } = await supabase
    .from('configuracoes')
    .update({ 
      metadata: updatedMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.id)

  if (updateError) {
    console.error('Erro ao atualizar configurações:', updateError.message)
  } else {
    console.log('✅ Configurações atualizadas com sucesso para Chesque Premium Cleaning!')
  }
}

updateSettings()
