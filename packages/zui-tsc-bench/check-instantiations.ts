// CI regression gate: measures zui's TypeScript instantiation count per scenario
// and fails if any scenario exceeds its ceiling in instantiation-thresholds.json.
//
// instantiation-thresholds.json is hand-maintained (not auto-generated): it pins
// the max acceptable count per scenario. This fails only when a scenario goes
// OVER its threshold — small fluctuations under the cap are fine. Raise a
// threshold intentionally by editing the file yourself.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SCENARIOS, runCase, pad, asNum } from './lib'

const ZUI_IMPORT = `import { z } from '@bpinternal/zui'`

const THRESHOLDS_FILE = join(ROOT, 'instantiation-thresholds.json')

if (!existsSync(THRESHOLDS_FILE)) {
  console.error(`Missing ${THRESHOLDS_FILE}.`)
  process.exit(1)
}

const thresholds: Record<string, number> = JSON.parse(readFileSync(THRESHOLDS_FILE, 'utf8'))

const results = Object.keys(SCENARIOS).map((scenario) => {
  process.stderr.write(`running zui / ${scenario}...\n`)
  return runCase('zui', ZUI_IMPORT, scenario)
})

let failed = false
console.log('\nzui instantiations vs threshold:')
for (const r of results) {
  const threshold = thresholds[r.scenario]
  const count = asNum(r['Instantiations'])
  if (threshold === undefined) {
    console.error(`  ${pad(r.scenario, 20)} no threshold set for this scenario`)
    failed = true
    continue
  }
  const over = count > threshold
  if (over) failed = true
  console.log(
    `  ${pad(r.scenario, 20)} ${pad(count.toLocaleString(), 12)} / ${pad(threshold.toLocaleString(), 12)}${over ? '  <-- OVER THRESHOLD' : ''}`
  )
}

if (failed) {
  console.error('\nType instantiation count exceeds threshold. See instantiation-thresholds.json.')
  process.exit(1)
}

console.log('\nOK - within thresholds.')
