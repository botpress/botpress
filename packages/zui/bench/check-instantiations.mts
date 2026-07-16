import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { thresholds } from './instantiation-thresholds.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TSC_BENCH_DIR = join(__dirname, '..', '..', 'tsc-bench')
const MEASURE_CASE = join(TSC_BENCH_DIR, 'measure-case.ts')
const ZUI_DIST_INDEX = join(__dirname, '..', 'dist', 'index.d.ts')
const PATHS_JSON = JSON.stringify({ '@bpinternal/zui': ZUI_DIST_INDEX })

const pad = (s: unknown, n: number) => String(s).padEnd(n)
const asNum = (s: unknown) => Number(String(s).replace(/[^\d]/g, ''))

console.error(`TypeScript ${ts.version}`)

const results = Object.keys(thresholds).map((caseName) => {
  process.stderr.write(`running ${caseName}...\n`)
  const sourceCode = readFileSync(join(__dirname, `${caseName}.ts`), 'utf8')
  try {
    const stdout = execFileSync(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', MEASURE_CASE, caseName, PATHS_JSON],
      { cwd: TSC_BENCH_DIR, input: sourceCode, encoding: 'utf8' }
    )
    return JSON.parse(stdout)
  } catch (e) {
    console.error(`\n${(e as Error).message}`)
    process.exit(1)
  }
})

let failed = false
console.error('\ninstantiations vs threshold:')
for (const r of results) {
  const threshold = thresholds[r.case]!
  const count = asNum(r['Instantiations'])
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
