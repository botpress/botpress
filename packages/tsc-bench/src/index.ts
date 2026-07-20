import ms from 'ms'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import tmp from 'tmp'

const DIR_PREFIX = 'tsc-bench-'
const TSC = require.resolve('typescript/bin/tsc')

export type CaseResult = {
  case: string | null
  types: number | null
  memoryUsed: string | null
  instantiations: number | null
  checkTime: number | null
  totalTime: number | null
}

export function measureCase(caseName: string, sourceCode: string, paths?: Record<string, string>): CaseResult {
  try {
    const output = _runTsc('--version')
    console.debug(`tsc version: ${output}`)
  } catch (thrown) {
    const errMessage = thrown instanceof Error ? thrown.message : String(thrown)
    throw new Error(
      `Failed to run tsc --version for ${caseName}. Make sure you have typescirpt installed and available: ${errMessage}`
    )
  }

  const dir = tmp.dirSync({ prefix: DIR_PREFIX, unsafeCleanup: true }).name

  const caseTsconfig = {
    compilerOptions: {
      lib: ['es2022', 'dom'],
      module: 'commonjs',
      target: 'es2022',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'node',
      allowUnusedLabels: false,
      allowUnreachableCode: false,
      noFallthroughCasesInSwitch: true,
      noImplicitReturns: true,
      noUncheckedIndexedAccess: true,
      noUnusedParameters: true,
      exactOptionalPropertyTypes: false,
      resolveJsonModule: true,
      noPropertyAccessFromIndexSignature: false,
      noUnusedLocals: false,
      noImplicitOverride: false,
      checkJs: false,
      noEmit: true,
      extendedDiagnostics: true,
      ...(paths ? { baseUrl: '.', paths: Object.fromEntries(Object.entries(paths).map(([k, v]) => [k, [v]])) } : {}),
    },
    files: ['index.ts'],
  }

  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(caseTsconfig, null, 2))
  writeFileSync(join(dir, 'index.ts'), sourceCode)

  const stdout = _runTsc('-p', dir)

  const typesStr = _parseMetric(stdout, 'Types')
  const instantiationsStr = _parseMetric(stdout, 'Instantiations')
  const memoryUsedStr = _parseMetric(stdout, 'Memory used')
  const checkTimeStr = _parseMetric(stdout, 'Check time')
  const totalTimeStr = _parseMetric(stdout, 'Total time')

  const result: CaseResult = {
    case: null,
    types: null,
    instantiations: null,
    memoryUsed: null,
    checkTime: null,
    totalTime: null,
  }

  if (typesStr) {
    const types = Number(typesStr.replace(/,/g, ''))
    if (!Number.isNaN(types)) result.types = types
  }

  if (instantiationsStr) {
    const instantiations = Number(instantiationsStr.replace(/,/g, ''))
    if (!Number.isNaN(instantiations)) result.instantiations = instantiations
  }

  if (memoryUsedStr) {
    result.memoryUsed = memoryUsedStr
  }

  if (checkTimeStr) {
    const checkTime = ms(checkTimeStr)
    if (!Number.isNaN(checkTime)) result.checkTime = checkTime
  }

  if (totalTimeStr) {
    const totalTime = ms(totalTimeStr)
    if (!Number.isNaN(totalTime)) result.totalTime = totalTime
  }

  return result
}

const _runTsc = (...args: string[]): string => execFileSync(process.execPath, [TSC, ...args], { encoding: 'utf8' })

const _parseMetric = (stdout: string, metric: string): string | null => {
  const m = stdout.match(new RegExp(`^${metric}:\\s+([\\d.,]+[a-zA-Z]*)`, 'm'))
  return m?.[1] ?? null
}
