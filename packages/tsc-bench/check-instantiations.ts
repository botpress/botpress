import { thresholds } from './instantiation-thresholds'
import { listBenchCases, readBenchCase, measureCase, pad, asNum, TS_VERSION } from './lib'

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
