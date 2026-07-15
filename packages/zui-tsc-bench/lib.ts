// TypeScript instantiation measurement engine: generates deterministic zui schema
// files and type-checks each in isolation with `tsc --extendedDiagnostics`.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const ROOT = __dirname
export const TSC = require.resolve('typescript/bin/tsc')

// --- deterministic schema generation ----------------------------------------

const keys = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}_k${i}: z.string(),`).join('\n  ')

/** Base object, then `depth` chained .extend() calls each adding `perLevel` new keys. */
const extendChain = (depth: number, perLevel = 5, baseKeys = 5): string => {
  const lines = [`export const s0 = z.object({\n  ${keys('s0', baseKeys)}\n})`]
  for (let i = 1; i <= depth; i++) {
    lines.push(`export const s${i} = s${i - 1}.extend({\n  ${keys(`s${i}`, perLevel)}\n})`)
  }
  lines.push(`export type Out = z.infer<typeof s${depth}>`)
  lines.push(`export type In = z.input<typeof s${depth}>`)
  return lines.join('\n\n')
}

/** Base object with `baseKeys` keys, then alternating .pick / .omit / .extend rounds.
 * Tracks which keys are still present so every mask is valid in all subjects. */
const pickOmitChain = (rounds: number, baseKeys = 20): string => {
  let live = Array.from({ length: baseKeys }, (_, i) => `s0_k${i}`)
  const lines = [`export const s0 = z.object({\n  ${keys('s0', baseKeys)}\n})`]
  for (let i = 1; i <= rounds; i++) {
    const op = i % 3
    if (op === 1) {
      // pick: keep everything except the last currently-present key
      live = live.slice(0, -1)
      const picked = live.map((k) => `${k}: true,`).join(' ')
      lines.push(`export const s${i} = s${i - 1}.pick({ ${picked} })`)
    } else if (op === 2) {
      // omit: drop the first currently-present key
      const [dropped, ...rest] = live
      live = rest
      lines.push(`export const s${i} = s${i - 1}.omit({ ${dropped}: true, })`)
    } else {
      const added = Array.from({ length: 3 }, (_, j) => `s${i}_k${j}`)
      live = live.concat(added)
      lines.push(`export const s${i} = s${i - 1}.extend({\n  ${keys(`s${i}`, 3)}\n})`)
    }
  }
  lines.push(`export type Out = z.infer<typeof s${rounds}>`)
  return lines.join('\n\n')
}

/** `n` independent objects of `keyCount` keys, each extended once, all inferred. */
const manyObjects = (n: number, keyCount = 10): string => {
  const lines: string[] = []
  for (let i = 0; i < n; i++) {
    lines.push(`export const o${i} = z.object({\n  ${keys(`o${i}`, keyCount)}\n})`)
    lines.push(`export const o${i}x = o${i}.extend({\n  ${keys(`o${i}x`, 3)}\n})`)
    lines.push(`export type O${i} = z.infer<typeof o${i}x>`)
  }
  return lines.join('\n\n')
}

export const SCENARIOS: Record<string, () => string> = {
  control: () => 'export const c = z.object({ a: z.string(), b: z.number() })\nexport type C = z.infer<typeof c>',
  'extend-chain-10': () => extendChain(10),
  'extend-chain-25': () => extendChain(25),
  'pick-omit-chain-10': () => pickOmitChain(10),
  'many-objects-50': () => manyObjects(50),
  // real production file (whatsapp integration): its check time ~= the per-keystroke
  // recheck latency you feel in the IDE while editing a schema-heavy file
  'real-whatsapp': () => readFileSync(join(ROOT, 'real', 'whatsapp-types.ts.txt'), 'utf8'),
}

// --- runner ------------------------------------------------------------------

const caseTsconfig = {
  extends: '../../tsconfig.json',
  compilerOptions: {
    noEmit: true,
    extendedDiagnostics: true,
  },
  files: ['index.ts'],
}

const METRICS = ['Types', 'Instantiations', 'Memory used', 'Check time', 'Total time'] as const

export type CaseResult = {
  subject: string
  scenario: string
  errors: number
  Types: string
  Instantiations: string
  'Memory used': string
  'Check time': string
  'Total time': string
}

const countErrors = (out: string) => (out.match(/error TS\d+/g) ?? []).length

export function runCase(subject: string, subjectImport: string, scenario: string): CaseResult {
  const generateScenario = SCENARIOS[scenario]
  if (!generateScenario) throw new Error(`Unknown scenario: ${scenario}`)

  const dir = join(ROOT, 'cases', `${subject}--${scenario}`)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.ts'), `${subjectImport}\n\n${generateScenario()}\n`)
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(caseTsconfig, null, 2))

  let stdout = ''
  let failed = false
  try {
    stdout = execFileSync(process.execPath, [TSC, '-p', dir], { encoding: 'utf8' })
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string }
    if (err.stdout === undefined) {
      throw new Error(`Failed to run tsc for ${subject}/${scenario}: ${(e as Error).message}`)
    }
    // tsc exits non-zero on type errors (e.g. TS2589) but still prints diagnostics
    stdout = (err.stdout ?? '') + (err.stderr ?? '')
    failed = true
  }

  const result = { subject, scenario, errors: failed ? countErrors(stdout) : 0 } as CaseResult
  for (const metric of METRICS) {
    const m = stdout.match(new RegExp(`^${metric}:\\s+([\\d.,]+[a-zA-Z]*)`, 'm'))
    result[metric] = m?.[1] ?? 'n/a'
  }

  if (result.Instantiations === 'n/a') {
    throw new Error(
      `Could not parse "Instantiations" from tsc's --extendedDiagnostics output for ${subject}/${scenario}. Raw output:\n${stdout}`
    )
  }

  return result
}

export const pad = (s: unknown, n: number) => String(s).padEnd(n)
export const asNum = (s: unknown) => Number(String(s).replace(/[^\d]/g, ''))
