import fs from 'fs'
import net from 'net'
import path from 'path'
import * as consts from '../../consts'
import type { DiagnosticIssue, DiagnosticStatus, DiagnosticCategory } from '../types'

const MIN_NODE_VERSION = 18
const DEFAULT_DEV_PORT = 3000
const CATEGORY_ENV: DiagnosticCategory = 'env'

/**
 * Runs all environment checks in parallel and collects diagnostic issues
 * @param workDir - The working directory to run checks against
 * @returns Array of all diagnostic issues found across all environment checks
 */
export async function runEnvironmentChecks(workDir: string): Promise<DiagnosticIssue[]> {
  // Run all checks in parallel for better performance
  const results = await Promise.all([
    _checkNodeVersion(),
    _checkLockfiles(workDir),
    _checkProjectPermissions(workDir),
    _checkDevPort(),
  ])

  return results.flat()
}

async function _checkNodeVersion(): Promise<DiagnosticIssue[]> {
  const currentVersion = process.version
  const majorVersion = _parseNodeMajorVersion(currentVersion)
  const details = {
    current: currentVersion,
    minimum: `${MIN_NODE_VERSION}.0.0`,
  }

  if (majorVersion < MIN_NODE_VERSION) {
    return [
      _createIssue(
        'node-version-too-old',
        'error',
        `Node.js version ${currentVersion} is not supported`,
        details,
        `Please upgrade to Node.js ${MIN_NODE_VERSION} or higher. Visit https://nodejs.org/`
      ),
    ]
  }

  return [_createIssue('node-version', 'ok', `Node.js version ${currentVersion} is supported`, details)]
}

async function _checkLockfiles(workDir: string): Promise<DiagnosticIssue[]> {
  const lockfiles = [
    { name: 'pnpm-lock.yaml', manager: 'pnpm' },
    { name: 'yarn.lock', manager: 'yarn' },
    { name: 'package-lock.json', manager: 'npm' },
  ]

  const foundLockfiles = lockfiles
    .filter((lockfile) => fs.existsSync(path.join(workDir, lockfile.name)))
    .map((lockfile) => lockfile.manager)

  if (foundLockfiles.length === 0) {
    return [
      _createIssue(
        'lockfile-missing',
        'warning',
        'No lockfile detected',
        { workDir },
        'Consider using a package manager (pnpm, yarn, or npm) to generate a lockfile for consistent dependencies'
      ),
    ]
  }

  if (foundLockfiles.length > 1) {
    return [
      _createIssue(
        'lockfile-multiple',
        'warning',
        'Multiple lockfiles detected',
        { lockfiles: foundLockfiles, workDir },
        `Remove unused lockfiles. Keep only one: ${foundLockfiles.join(', ')}`
      ),
    ]
  }

  return [
    _createIssue('lockfile', 'ok', `Lockfile found: ${foundLockfiles[0]}`, { manager: foundLockfiles[0], workDir }),
  ]
}

async function _checkProjectPermissions(workDir: string): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = []

  try {
    await fs.promises.access(workDir, fs.constants.R_OK | fs.constants.W_OK)
    issues.push(_createIssue('workdir-permissions', 'ok', 'Work directory is readable and writable', { workDir }))
  } catch (error) {
    return [
      _createIssue(
        'workdir-permissions',
        'error',
        'Work directory is not accessible',
        {
          workDir,
          error: error instanceof Error ? error.message : String(error),
        },
        'Ensure you have read/write permissions on the project directory'
      ),
    ]
  }

  const botpressDir = path.join(workDir, consts.fromWorkDir.outDir)
  const botpressCheck = await _checkDirectoryWritable(botpressDir)
  if (botpressCheck.writable) {
    issues.push(
      _createIssue('botpress-dir-permissions', 'ok', '.botpress/ directory is writable', { path: botpressDir })
    )
  } else {
    issues.push(
      _createIssue(
        'botpress-dir-permissions',
        'error',
        '.botpress/ directory is not writable',
        { path: botpressDir, error: botpressCheck.error },
        'Ensure you have write permissions on the .botpress/ directory'
      )
    )
  }

  const distDir = path.join(workDir, consts.fromWorkDir.distDir)
  const distCheck = await _checkDirectoryWritable(distDir)
  if (distCheck.writable) {
    issues.push(_createIssue('dist-dir-permissions', 'ok', 'dist/ directory is writable', { path: distDir }))
  } else {
    issues.push(
      _createIssue(
        'dist-dir-permissions',
        'error',
        'dist/ directory is not writable',
        { path: distDir, error: distCheck.error },
        'Ensure you have write permissions on the dist/ directory'
      )
    )
  }

  return issues
}

async function _checkDevPort(port: number = DEFAULT_DEV_PORT): Promise<DiagnosticIssue[]> {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve([
          _createIssue(
            'dev-port-in-use',
            'warning',
            `Default development port ${port} is already in use`,
            { port },
            `Use a different port with the --port flag or stop the process using port ${port}`
          ),
        ])
      } else {
        resolve([])
      }
    })

    server.once('listening', () => {
      server.close()
      resolve([_createIssue('dev-port', 'ok', `Default development port ${port} is available`, { port })])
    })

    server.listen(port)
  })
}

function _createIssue(
  id: string,
  status: DiagnosticStatus,
  message: string,
  details?: Record<string, any>,
  suggestion?: string
): DiagnosticIssue {
  return {
    id,
    category: CATEGORY_ENV,
    status,
    message,
    details,
    suggestion,
  }
}

function _parseNodeMajorVersion(version: string): number {
  return parseInt(version.slice(1).split('.')[0] ?? '0', 10)
}

async function _checkDirectoryWritable(dirPath: string): Promise<{ writable: boolean; error?: string }> {
  try {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true })
    }

    const testFile = path.join(dirPath, '.write-test')
    await fs.promises.writeFile(testFile, 'test')
    await fs.promises.unlink(testFile)

    return { writable: true }
  } catch (error) {
    return {
      writable: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
