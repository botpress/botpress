// CI regression gate: measures the TypeScript instantiation count of each bench
// case (packages/zui/bench/*.ts) and fails if any case exceeds its ceiling in
// instantiation-thresholds.ts.
//
// instantiation-thresholds.ts is hand-maintained (not auto-generated): it pins
// the max acceptable count per case. This fails only when a case goes OVER its
// threshold — small fluctuations under the cap are fine. Raise a threshold
// intentionally by editing the file yourself.

import { listBenchCases, readBenchCase, measureCase, pad, asNum, TS_VERSION } from './lib'
import { thresholds } from './instantiation-thresholds'

console.error(`TypeScript ${TS_VERSION}`)

const results = listBenchCases().map((caseName) => {
  process.stderr.write(`running ${caseName}...\n`)
  try {
    return measureCase(caseName, readBenchCase(caseName))
  } catch (e) {
    console.error(`\n${(e as Error).message}`)
    process.exit(1)
  }
})

let failed = false
console.error('\ninstantiations vs threshold:')
for (const r of results) {
  const threshold = thresholds[r.case]
  const count = asNum(r['Instantiations'])
  if (threshold === undefined) {
    console.error(`  ${pad(r.case, 20)} no threshold set for this case`)
    failed = true
    continue
  }
  const over = count > threshold
  if (over) failed = true
  console.error(
    `  ${pad(r.case, 20)} ${pad(count.toLocaleString(), 12)} / ${pad(threshold.toLocaleString(), 12)}${over ? '  <-- OVER THRESHOLD' : ''}`
  )
}

if (failed) {
  console.error('\nType instantiation count exceeds threshold. See instantiation-thresholds.ts.')
  process.exit(1)
}

console.error('\nOK - within thresholds.')
