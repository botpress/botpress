import { cases } from './cases'
import { measureCase } from '@bpinternal/tsc-bench'
import pathlib from 'path'

const ROOT_DIR = pathlib.resolve(pathlib.join(import.meta.dirname, '..'))
const ZUI_DIST_DIR = pathlib.join(ROOT_DIR, 'dist')

const pad = (s: unknown, n: number) => String(s).padEnd(n)
const asNum = (s: unknown) => Number(String(s).replace(/[^\d]/g, ''))

let failed = false
for (const { sourceCode, name: caseName, instantiationThreshold } of cases) {
  console.info(`running ${caseName}...`)

  const result = measureCase(caseName, sourceCode, {
    '@bpinternal/zui': pathlib.join(ZUI_DIST_DIR, 'index.d.ts'),
  })

  console.info('instantiations vs threshold:')

  const count = asNum(result.instantiations)
  const over = count > instantiationThreshold
  if (over) failed = true
  console.info(
    `  ${pad(result.case, 20)} ${pad(count.toLocaleString(), 12)} / ${pad(instantiationThreshold.toLocaleString(), 12)}${over ? '  <-- OVER THRESHOLD' : ''}`
  )
  console.log('\n\n')
}

if (failed) {
  console.info('Type instantiation count exceeds threshold. See instantiation-thresholds.ts.')
  process.exit(1)
}

console.info('OK - within thresholds.')
