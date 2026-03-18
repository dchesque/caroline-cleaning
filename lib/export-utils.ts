// lib/export-utils.ts

// Export to Excel (CSV format)
export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) return

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export to PDF (using browser print)
export function exportToPDF(options: {
  title: string
  period?: string
  summary?: any
  data?: any[]
}) {
  const { title, period, summary, data } = options

  // Create printable content
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          color: #333;
        }
        h1 { 
          color: #BE9982; 
          border-bottom: 2px solid #BE9982;
          padding-bottom: 10px;
        }
        .meta { 
          color: #666; 
          margin-bottom: 20px;
        }
        .summary { 
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          flex: 1;
        }
        .summary-card label {
          font-size: 12px;
          color: #666;
        }
        .summary-card value {
          display: block;
          font-size: 24px;
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background: #BE9982; 
          color: white;
        }
        tr:nth-child(even) { 
          background: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">
        Gerado em: ${new Date().toLocaleDateString('pt-BR')}
        ${period ? ` | Período: ${period}` : ''}
      </p>
      
      ${summary ? `
        <div class="summary">
          <div class="summary-card">
            <label>Total</label>
            <value>$${summary.total?.toFixed(2) || 0}</value>
          </div>
          <div class="summary-card">
            <label>Média</label>
            <value>$${summary.average?.toFixed(2) || 0}</value>
          </div>
          <div class="summary-card">
            <label>Transações</label>
            <value>${summary.count || 0}</value>
          </div>
        </div>
      ` : ''}
      
      ${data && data.length > 0 ? `
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.slice(0, 50).map(row => `
              <tr>
                ${Object.values(row).map(val => {
    if (typeof val === 'object' && val !== null) {
      return `<td>${(val as any).nome || JSON.stringify(val)}</td>`
    }
    return `<td>${val ?? '-'}</td>`
  }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.length > 50 ? `<p>... e mais ${data.length - 50} registros</p>` : ''}
      ` : ''}
      
      <div class="footer">
        <p>Chesque Premium Cleaning - Relatório Confidencial</p>
      </div>
    </body>
    </html>
  `

  // Open print window
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

// Export to Markdown
export function exportToMarkdown(messages: any[], leadInfo: any, filename: string) {
  if (!messages || messages.length === 0) return

  const dateStr = new Date().toLocaleDateString('pt-BR')

  let content = `# Relatório de Conversa - ${leadInfo?.nome || 'Visitante'}\n\n`
  content += `**Data do Relatório:** ${dateStr}\n`
  content += `**ID da Sessão:** ${messages[0]?.session_id || '-'}\n\n`

  content += `## Informações do Lead/Cliente\n`
  content += `- **Nome:** ${leadInfo?.nome || '-'}\n`
  content += `- **Telefone:** ${leadInfo?.telefone || '-'}\n`
  content += `- **E-mail:** ${leadInfo?.email || '-'}\n`
  if (leadInfo?.zip_code) content += `- **ZIP Code:** ${leadInfo.zip_code}\n`
  if (leadInfo?.servico_interesse) content += `- **Serviço de Interesse:** ${leadInfo.servico_interesse}\n`
  content += `\n---\n\n## Histórico da Conversa\n\n`

  messages.forEach(msg => {
    const role = msg.role === 'user' ? '**Usuário**' : '**Carol IA**'
    const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    content += `### [${time}] ${role}\n${msg.content}\n\n`
  })

  // Create blob and download
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.md`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
/**
 * Exporta logs técnicos da execução da IA para um arquivo .txt
 */
export function exportLogs(messages: any[], filename: string) {
  let content = `LOGS DE EXECUÇÃO TÉCNICA - CAROL IA\n`
  content += `==========================================\n\n`

  const messagesWithLogs = messages.filter(m => m.role === 'assistant' && m.execution_logs)

  if (messagesWithLogs.length === 0) {
    content += `Nenhum log técnico encontrado para esta conversa.`
  } else {
    messagesWithLogs.forEach((msg, index) => {
      const date = msg.created_at ? new Date(msg.created_at).toLocaleString('pt-BR') : 'Data n/a'
      content += `--- TURN ${index + 1} (${date}) ---\n`
      content += msg.execution_logs
      content += `\n\n`
    })
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-logs.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
