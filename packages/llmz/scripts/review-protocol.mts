import { mkdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ReviewScenario } from './protocol-review/capture.js'
import { formatIndex, formatScenario } from './protocol-review/report.js'
import { scenarios } from './protocol-review/scenarios.js'

const { values } = parseArgs({
  options: {
    output: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (values.help) {
  console.info('Usage: pnpm review:protocol [--output <directory>]')
  console.info('Runs offline scenarios and writes full prompts.txt, individual scenario files, and captures.json.')
  process.exit(0)
}

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = values.output ? resolve(values.output) : resolve(packageRoot, '.prompt-review')
const captures: ReviewScenario[] = []

for (const runScenario of scenarios) {
  const scenario = await runScenario()
  captures.push(scenario)
  console.info(`Captured ${scenario.name}`)
}

// Write only after every scenario passes, so failed captures cannot look complete.
await mkdir(outputDirectory, { recursive: true })

const index = formatIndex(captures)
const reports = captures.map(formatScenario)

await writeFile(resolve(outputDirectory, 'index.txt'), index)
await writeFile(resolve(outputDirectory, 'prompts.txt'), [index, ...reports].join('\n\n'))
await writeFile(resolve(outputDirectory, 'captures.json'), JSON.stringify(captures, null, 2) + '\n')

for (const [index, scenario] of captures.entries()) {
  await writeFile(resolve(outputDirectory, `${scenario.name}.txt`), reports[index]!)
}

console.info(`Review ${resolve(outputDirectory, 'prompts.txt')}`)
