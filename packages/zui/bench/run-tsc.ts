import childProcess from 'child_process'
import fs from 'fs/promises'
import ms from 'ms'
import path from 'path'
import tmp from 'tmp'
import url from 'url'

const DIR_PREFIX = 'tsc-bench-'
const TSC = url.fileURLToPath(import.meta.resolve('typescript/bin/tsc'))

export type CaseResult = {
  types: number | null
  memoryUsed: string | null
  instantiations: number | null
  checkTime: number | null
  totalTime: number | null
}

export async function runTsc(
  caseName: string,
  sourceCode: string,
  paths?: Record<string, string>
): Promise<CaseResult> {
  const { stdout: versionStdout } = await _runTsc('--version').catch((thrown) => {
    const errMessage = thrown instanceof Error ? thrown.message : String(thrown)
    throw new Error(
      `Failed to run tsc --version for ${caseName}. Make sure you have typescirpt installed and available: ${errMessage}`
    )
  })

  console.log(`Running tsc --version for ${caseName}: ${versionStdout.trim()}`)

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

  await fs.writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify(caseTsconfig, null, 2))
  await fs.writeFile(path.join(dir, 'index.ts'), sourceCode)

  const { stdout: checkStdOut } = await _runTsc('-p', dir)

  const typesStr = _parseMetric(checkStdOut, 'Types')
  const instantiationsStr = _parseMetric(checkStdOut, 'Instantiations')
  const memoryUsedStr = _parseMetric(checkStdOut, 'Memory used')
  const checkTimeStr = _parseMetric(checkStdOut, 'Check time')
  const totalTimeStr = _parseMetric(checkStdOut, 'Total time')

  const result: CaseResult = {
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

const _runTsc = async (
  ...args: string[]
): Promise<{
  stdout: string
  stderr: string
}> => {
  const child = childProcess.execFile(process.execPath, [TSC, ...args], { encoding: 'utf8' })
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data
    })

    child.stderr?.on('data', (data) => {
      stderr += data
    })

    child.on('error', (err) => {
      reject(err)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          stdout,
          stderr,
        })
      } else {
        reject(new Error(`tsc exited with code ${code}. Stderr: ${stderr}`))
      }
    })
  })
}

const _parseMetric = (stdout: string, metric: string): string | null => {
  const m = stdout.match(new RegExp(`^${metric}:\\s+([\\d.,]+[a-zA-Z]*)`, 'm'))
  return m?.[1] ?? null
}
