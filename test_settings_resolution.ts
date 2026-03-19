
import { getBusinessSettingsClient } from './lib/business-config'

async function test() {
  console.log('--- DIAGNÓSTICO DE CONFIGURAÇÕES ---')
  const settings = await getBusinessSettingsClient()
  console.log('hero_title_1:', settings.hero_title_1)
  console.log('hero_title_2:', settings.hero_title_2)
  console.log('hero_subtitle:', settings.hero_subtitle)
  console.log('business_description:', settings.business_description)
  console.log('------------------------------------')
}

test()
