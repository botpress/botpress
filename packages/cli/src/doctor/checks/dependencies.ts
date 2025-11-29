import { exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import type { DiagnosticIssue } from '../types'
import { CATEGORY_DEPENDENCIES, _createIssue } from './commons'

const execAsync = promisify(exec)

/**
 * Runs all dependencies validation checks and collects diagnostic issues
 * @param workDir - The working directory to check
 * @returns Array of all diagnostic issues found across all dependencies checks
 */
export async function runDependenciesChecks(workDir: string): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = []

  const [outdatedIssues, auditIssues, duplicatesIssues, unusedIssues] = await Promise.all([
    _checkOutdatedPackages(workDir),
    _checkSecurityVulnerabilities(workDir),
    _checkDuplicateDependencies(workDir),
    _checkUnusedDependencies(workDir),
  ])

  issues.push(...outdatedIssues, ...auditIssues, ...duplicatesIssues, ...unusedIssues)

  return issues
}

async function _checkOutdatedPackages(workDir: string): Promise<DiagnosticIssue[]> {
  try {
    const { stdout } = await execAsync('pnpm outdated --format json', {
      cwd: workDir,
      timeout: 10000,
    })

    if (!stdout || stdout.trim() === '') {
      return [_createIssue('dependencies.outdated-ok', CATEGORY_DEPENDENCIES, 'ok', 'All dependencies are up to date')]
    }

    const outdated = JSON.parse(stdout)
    const outdatedCount = Object.keys(outdated).length

    if (outdatedCount === 0) {
      return [_createIssue('dependencies.outdated-ok', CATEGORY_DEPENDENCIES, 'ok', 'All dependencies are up to date')]
    }

    const majorUpdates = Object.entries(outdated).filter(([_, info]: [string, any]) => {
      const current = info.current?.split('.')[0]
      const latest = info.latest?.split('.')[0]
      return current !== latest
    })

    if (majorUpdates.length > 0) {
      return [
        _createIssue(
          'dependencies.outdated-major',
          CATEGORY_DEPENDENCIES,
          'warning',
          `${majorUpdates.length} dependencies have major updates available`,
          { packages: majorUpdates.map(([name]) => name) },
          'Run "pnpm outdated" to see details and "pnpm update" to update dependencies'
        ),
      ]
    }

    return [
      _createIssue(
        'dependencies.outdated-minor',
        CATEGORY_DEPENDENCIES,
        'warning',
        `${outdatedCount} dependencies have minor/patch updates available`,
        { count: outdatedCount },
        'Run "pnpm outdated" to see details and "pnpm update" to update dependencies'
      ),
    ]
  } catch (error: any) {
    if (error.stdout) {
      try {
        const outdated = JSON.parse(error.stdout)
        const outdatedCount = Object.keys(outdated).length

        if (outdatedCount > 0) {
          return [
            _createIssue(
              'dependencies.outdated-found',
              CATEGORY_DEPENDENCIES,
              'warning',
              `${outdatedCount} dependencies have updates available`,
              { count: outdatedCount },
              'Run "pnpm outdated" to see details and "pnpm update" to update dependencies'
            ),
          ]
        }
      } catch {}
    }

    return [
      _createIssue(
        'dependencies.outdated-check-failed',
        CATEGORY_DEPENDENCIES,
        'warning',
        'Could not check for outdated packages',
        { error: error.message },
        'Ensure pnpm is installed and run "pnpm outdated" manually'
      ),
    ]
  }
}

function _processAuditResult(auditResult: any): DiagnosticIssue[] | null {
  if (!auditResult.metadata?.vulnerabilities) {
    return null
  }

  const { vulnerabilities } = auditResult.metadata
  const criticalCount = vulnerabilities.critical || 0
  const highCount = vulnerabilities.high || 0
  const moderateCount = vulnerabilities.moderate || 0
  const lowCount = vulnerabilities.low || 0

  if (criticalCount > 0 || highCount > 0) {
    return [
      _createIssue(
        'dependencies.audit-critical',
        CATEGORY_DEPENDENCIES,
        'error',
        `Found ${criticalCount} critical and ${highCount} high severity vulnerabilities`,
        { critical: criticalCount, high: highCount, moderate: moderateCount, low: lowCount },
        'Run "pnpm audit" for details and "pnpm audit --fix" to fix vulnerabilities'
      ),
    ]
  }

  if (moderateCount > 0) {
    return [
      _createIssue(
        'dependencies.audit-moderate',
        CATEGORY_DEPENDENCIES,
        'warning',
        `Found ${moderateCount} moderate severity vulnerabilities`,
        { moderate: moderateCount, low: lowCount },
        'Run "pnpm audit" for details and "pnpm audit --fix" to fix vulnerabilities'
      ),
    ]
  }

  if (lowCount > 0) {
    return [
      _createIssue(
        'dependencies.audit-low',
        CATEGORY_DEPENDENCIES,
        'ok',
        `Found ${lowCount} low severity vulnerabilities (non-critical)`,
        { low: lowCount }
      ),
    ]
  }

  return null
}

async function _checkSecurityVulnerabilities(workDir: string): Promise<DiagnosticIssue[]> {
  try {
    const { stdout } = await execAsync('pnpm audit --json', {
      cwd: workDir,
      timeout: 15000,
    })

    const auditResult = JSON.parse(stdout)
    const processedResult = _processAuditResult(auditResult)

    if (processedResult) {
      return processedResult
    }

    return [_createIssue('dependencies.audit-ok', CATEGORY_DEPENDENCIES, 'ok', 'No security vulnerabilities found')]
  } catch (error: any) {
    // pnpm audit returns exit code 1 when vulnerabilities are found
    if (error.stdout) {
      try {
        const auditResult = JSON.parse(error.stdout)
        const processedResult = _processAuditResult(auditResult)
        if (processedResult) {
          return processedResult
        }
      } catch {
        // Fall through to error handling
      }
    }

    return [
      _createIssue(
        'dependencies.audit-check-failed',
        CATEGORY_DEPENDENCIES,
        'warning',
        'Could not check for security vulnerabilities',
        { error: error.message },
        'Ensure pnpm is installed and run "pnpm audit" manually'
      ),
    ]
  }
}

async function _checkDuplicateDependencies(workDir: string): Promise<DiagnosticIssue[]> {
  try {
    const { stdout } = await execAsync('pnpm list --depth=Infinity --json', {
      cwd: workDir,
      timeout: 15000,
    })

    const listResult = JSON.parse(stdout)

    const packageVersions = new Map<string, Set<string>>()

    function traverseDependencies(deps: any) {
      if (!deps) return

      for (const [name, info] of Object.entries(deps)) {
        const pkgInfo = info as any
        if (pkgInfo.version) {
          if (!packageVersions.has(name)) {
            packageVersions.set(name, new Set())
          }
          packageVersions.get(name)!.add(pkgInfo.version)
        }

        if (pkgInfo.dependencies) {
          traverseDependencies(pkgInfo.dependencies)
        }
      }
    }

    if (Array.isArray(listResult)) {
      for (const project of listResult) {
        traverseDependencies(project.dependencies)
        traverseDependencies(project.devDependencies)
      }
    } else {
      traverseDependencies(listResult.dependencies)
      traverseDependencies(listResult.devDependencies)
    }

    const duplicates = Array.from(packageVersions.entries())
      .filter(([_, versions]) => versions.size > 1)
      .map(([name, versions]) => ({ name, versions: Array.from(versions) }))

    if (duplicates.length === 0) {
      return [
        _createIssue('dependencies.no-duplicates', CATEGORY_DEPENDENCIES, 'ok', 'No duplicate dependencies found'),
      ]
    }

    return [
      _createIssue(
        'dependencies.duplicates-found',
        CATEGORY_DEPENDENCIES,
        'warning',
        `Found ${duplicates.length} packages with multiple versions`,
        { duplicates: duplicates.slice(0, 5) },
        'Run "pnpm dedupe" to remove duplicate dependencies and reduce bundle size'
      ),
    ]
  } catch (error: any) {
    return [
      _createIssue(
        'dependencies.duplicates-check-failed',
        CATEGORY_DEPENDENCIES,
        'warning',
        'Could not check for duplicate dependencies',
        { error: error.message },
        'Ensure pnpm is installed and try running "pnpm list" manually'
      ),
    ]
  }
}

async function _checkUnusedDependencies(workDir: string): Promise<DiagnosticIssue[]> {
  try {
    const packageJsonPath = path.join(workDir, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return [
        _createIssue(
          'dependencies.no-package-json',
          CATEGORY_DEPENDENCIES,
          'warning',
          'No package.json found, skipping unused dependencies check'
        ),
      ]
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    if (Object.keys(dependencies).length === 0) {
      return [_createIssue('dependencies.no-dependencies', CATEGORY_DEPENDENCIES, 'ok', 'No dependencies to check')]
    }

    try {
      await execAsync('which depcheck', { timeout: 2000 })
    } catch {
      return [
        _createIssue(
          'dependencies.depcheck-not-installed',
          CATEGORY_DEPENDENCIES,
          'ok',
          'Skipping unused dependencies check (depcheck not installed)',
          undefined,
          'Install depcheck globally with "npm install -g depcheck" for unused dependency detection'
        ),
      ]
    }

    const { stdout } = await execAsync('depcheck --json', {
      cwd: workDir,
      timeout: 20000,
    })

    const result = JSON.parse(stdout)
    const unusedDeps = result.dependencies || []

    if (unusedDeps.length === 0) {
      return [_createIssue('dependencies.no-unused', CATEGORY_DEPENDENCIES, 'ok', 'No unused dependencies found')]
    }

    return [
      _createIssue(
        'dependencies.unused-found',
        CATEGORY_DEPENDENCIES,
        'warning',
        `Found ${unusedDeps.length} unused dependencies`,
        { unused: unusedDeps.slice(0, 10) },
        'Review and remove unused dependencies to reduce bundle size. Run "depcheck" for full details'
      ),
    ]
  } catch (error: any) {
    return [
      _createIssue(
        'dependencies.unused-check-failed',
        CATEGORY_DEPENDENCIES,
        'warning',
        'Could not check for unused dependencies',
        { error: error.message },
        'Install depcheck globally with "npm install -g depcheck" and try again'
      ),
    ]
  }
}
