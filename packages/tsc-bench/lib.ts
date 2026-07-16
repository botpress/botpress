import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const ROOT = __dirname
export const TSC = require.resolve('typescript/bin/tsc')
export const TS_VERSION: string = require('typescript/package.json').version

const METRICS = ['Types', 'Instantiations', 'Memory used', 'Check time', 'Total time'] as const

export type CaseResult = {
  case: string
  errors: number
  Types: string
  Instantiations: string
  'Memory used': string
  'Check time': string
  'Total time': string
}

const countErrors = (out: string) => (out.match(/error TS\d+/g) ?? []).length

export function measureCase(caseName: string, sourceCode: string, paths?: Record<string, string>): CaseResult {
  const dir = join(ROOT, 'cases', caseName)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.ts'), sourceCode)

  const caseTsconfig = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      noEmit: true,
      extendedDiagnostics: true,
      ...(paths ? { baseUrl: '.', paths: Object.fromEntries(Object.entries(paths).map(([k, v]) => [k, [v]])) } : {}),
    },
    files: ['index.ts'],
  }
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(caseTsconfig, null, 2))

  let stdout = ''
  let failed = false
  try {
    stdout = execFileSync(process.execPath, [TSC, '-p', dir], { encoding: 'utf8' })
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string }
    if (err.stdout === undefined) {
      throw new Error(`Failed to run tsc for ${caseName}: ${(e as Error).message}`)
    }
    stdout = (err.stdout ?? '') + (err.stderr ?? '')
    failed = true
  }

  const result = { case: caseName, errors: failed ? countErrors(stdout) : 0 } as CaseResult
  for (const metric of METRICS) {
    const m = stdout.match(new RegExp(`^${metric}:\\s+([\\d.,]+[a-zA-Z]*)`, 'm'))
    result[metric] = m?.[1] ?? 'n/a'
  }

  if (result.Instantiations === 'n/a') {
    throw new Error(
      `Could not parse "Instantiations" from tsc's --extendedDiagnostics output for ${caseName}. Raw output:\n${stdout}`
    )
  }

  return result
}

export const pad = (s: unknown, n: number) => String(s).padEnd(n)
export const asNum = (s: unknown) => Number(String(s).replace(/[^\d]/g, ''))
