
import { getBusinessSettingsByGrupo } from './lib/business-config'

async function audit() {
  console.log('--- AUDITORIA DE BANCO POR GRUPO ---')
  
  const lpData = await getBusinessSettingsByGrupo('pagina_inicial')
  console.log('GRUPO: pagina_inicial')
  console.log(JSON.stringify(lpData, null, 2))
  
  const empresaData = await getBusinessSettingsByGrupo('empresa')
  console.log('\nGRUPO: empresa')
  console.log(JSON.stringify(empresaData, null, 2))
  
  console.log('------------------------------------')
}

audit()
