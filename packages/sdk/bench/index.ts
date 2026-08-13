import pathlib from 'path'
import { cases } from './cases/index.js'
import * as consts from './paths.js'
import * as tsc from './run-tsc.js'

const main = async () => {
  const tscVersion = await tsc.getTscVersion()
  console.info(`Running tsc-bench with TypeScript ${tscVersion}`)

  let failed = false

  const results: { 'Test Name': string; 'Type Instantiations': string; Threshold: string; pass: '❌' | '✅' }[] = []

  for (const { sourceCode, name: caseName, instantiationThreshold } of cases) {
    console.info(`running ${caseName}...`)

    const result = await tsc.runTsc(sourceCode, {
      '@botpress/sdk': pathlib.join(consts.SDK_DIST_DIR, 'index.d.ts'),
      '@bpinternal/zui': pathlib.join(consts.ZUI_DIST_DIR, 'index.d.ts'),
    })

    const count = result.instantiations ?? Number.POSITIVE_INFINITY
    const over = count > instantiationThreshold
    if (over) {
      failed = true
    }

    const pass = over ? '❌' : '✅'
    results.push({
      'Test Name': caseName,
      'Type Instantiations': count.toLocaleString(),
      Threshold: instantiationThreshold.toLocaleString(),
      pass,
    })
  }

  console.info('Results:')
  console.table(results)

  if (failed) {
    throw new Error('Type instantiation count exceeds threshold.')
  }

  console.info('OK - within thresholds.')
}

try {
  await main()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
