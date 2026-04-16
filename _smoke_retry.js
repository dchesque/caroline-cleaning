// Re-run of 3 failing scenarios with corrected expectations/inputs.
const BASE = 'http://localhost:3000/api/chat'
const DELAY_MS = 3500
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function send(message, sessionId) {
  await sleep(DELAY_MS)
  const r = await fetch(BASE, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  })
  return r.json()
}

async function runScenario(name, steps, expectFinalState) {
  const sid = 'smoke-r-' + name + '-' + Date.now()
  const trace = []
  let last = null
  for (const msg of steps) {
    const j = await send(msg, sid)
    last = j
    const carol = (j.message || '').replace(/\s+/g, ' ').slice(0, 95)
    trace.push(`  ${JSON.stringify(msg).padEnd(42)} [${j.state_before}=>${j.state}] ${carol}`)
    if (!j.success) {
      console.log(`\n✗ ${name}`)
      console.log(trace.join('\n'))
      console.log(`  !! ${JSON.stringify(j).slice(0, 200)}`)
      return { name, pass: false }
    }
  }
  const expected = Array.isArray(expectFinalState) ? expectFinalState : [expectFinalState]
  const ok = expected.includes(last.state)
  console.log(`\n${ok ? '✓' : '✗'} ${name}  (final: ${last.state}, expected: ${expected.join('|')})`)
  if (!ok) console.log(trace.join('\n'))
  return { name, pass: ok, final: last.state, expected }
}

;(async () => {
  const results = []

  // visit-evaluation only — other two already passed
  results.push(await runScenario('visit-evaluation', [
    'hi', '7045550205', 'yes', 'Carol Davis',
    '300 Maple Rd Fort Mill SC 29708',
    'I want the free evaluation visit',
    'next monday', '10am',
    'yes', 'sms',
  ], 'DONE'))

  const passed = results.filter(r => r.pass).length
  console.log('\n' + '='.repeat(60))
  console.log(`RETRY SUMMARY: ${passed}/${results.length} passed`)
  for (const r of results) {
    console.log(`${r.pass ? '✓' : '✗'} ${r.name.padEnd(25)} final=${r.final || '-'}`)
  }
})().catch(e => { console.error('FATAL:', e); process.exit(1) })
