import fs from 'fs'
import path from 'path'
import type { DiagnosticIssue } from '../types'
import { _createIssue, CATEGORY_SDK } from './commons'

/**
 * Runs all SDK and versioning checks in parallel and collects diagnostic issues
 * @param workDir - The working directory to run checks against
 * @returns Array of all diagnostic issues found across all SDK checks
 */
export async function runSdkChecks(workDir: string): Promise<DiagnosticIssue[]> {
  const results = await Promise.all([
    _checkSdkPresence(workDir),
    _checkSdkVersionMatch(workDir),
    _checkSdkVersionFormat(workDir),
    _checkSdkPeerDeps(workDir),
  ])

  return results.flat()
}

async function _checkSdkPresence(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const isIntegration =
    fs.existsSync(path.join(workDir, 'integration.definition.ts')) ||
    fs.existsSync(path.join(workDir, 'integration.definition.js'))

  if (!isIntegration) {
    return []
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(content)

    const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
    const hasSdk = '@botpress/sdk' in dependencies

    if (!hasSdk) {
      return [
        _createIssue(
          'sdk.not-installed',
          CATEGORY_SDK,
          'warning',
          '@botpress/sdk is not installed',
          { workDir },
          'Install @botpress/sdk: npm install @botpress/sdk or pnpm add @botpress/sdk'
        ),
      ]
    }

    return [
      _createIssue('sdk.installed', CATEGORY_SDK, 'ok', '@botpress/sdk is installed', {
        version: dependencies['@botpress/sdk'],
      }),
    ]
  } catch {
    return []
  }
}

async function _checkSdkVersionMatch(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const isIntegration =
    fs.existsSync(path.join(workDir, 'integration.definition.ts')) ||
    fs.existsSync(path.join(workDir, 'integration.definition.js'))

  if (!isIntegration) {
    return []
  }

  try {
    const projectContent = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const projectPkg = JSON.parse(projectContent)

    const dependencies = { ...(projectPkg.dependencies || {}), ...(projectPkg.devDependencies || {}) }
    const sdkVersion = dependencies['@botpress/sdk']

    if (!sdkVersion) {
      return []
    }

    const cliPackageJsonPath = path.join(__dirname, '../../../package.json')
    const cliContent = await fs.promises.readFile(cliPackageJsonPath, 'utf-8')
    const cliPkg = JSON.parse(cliContent)
    const cliVersion = cliPkg.version

    const sdkMajor = _extractMajorVersion(sdkVersion)
    const cliMajor = _extractMajorVersion(cliVersion)

    const details = {
      cliVersion,
      sdkVersion,
      cliMajor,
      sdkMajor,
    }

    if (sdkMajor !== cliMajor) {
      return [
        _createIssue(
          'sdk.major-mismatch',
          CATEGORY_SDK,
          'warning',
          `SDK major version (${sdkMajor}) does not match CLI major version (${cliMajor})`,
          details,
          `Update @botpress/sdk to match CLI version: npm install @botpress/sdk@^${cliMajor} or pnpm add @botpress/sdk@^${cliMajor}`
        ),
      ]
    }

    return [_createIssue('sdk.major-match', CATEGORY_SDK, 'ok', 'SDK major version matches CLI version', details)]
  } catch (error) {
    return [
      _createIssue('sdk.version-check-failed', CATEGORY_SDK, 'warning', 'Failed to check SDK version compatibility', {
        error: error instanceof Error ? error.message : String(error),
      }),
    ]
  }
}

async function _checkSdkVersionFormat(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const isIntegration =
    fs.existsSync(path.join(workDir, 'integration.definition.ts')) ||
    fs.existsSync(path.join(workDir, 'integration.definition.js'))

  if (!isIntegration) {
    return []
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(content)

    const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
    const sdkVersion = dependencies['@botpress/sdk']

    if (!sdkVersion) {
      return []
    }

    if (!_isValidSemver(sdkVersion)) {
      return [
        _createIssue(
          'sdk.invalid-version-format',
          CATEGORY_SDK,
          'warning',
          'SDK version format is invalid',
          { sdkVersion },
          'Ensure @botpress/sdk version follows semver format (e.g., ^1.0.0, ~2.1.3, 3.0.0)'
        ),
      ]
    }

    return [_createIssue('sdk.version-format', CATEGORY_SDK, 'ok', 'SDK version format is valid', { sdkVersion })]
  } catch {
    return []
  }
}

async function _checkSdkPeerDeps(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  const isIntegration =
    fs.existsSync(path.join(workDir, 'integration.definition.ts')) ||
    fs.existsSync(path.join(workDir, 'integration.definition.js'))

  if (!isIntegration) {
    return []
  }

  try {
    const projectContent = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const projectPkg = JSON.parse(projectContent)

    const dependencies = { ...(projectPkg.dependencies || {}), ...(projectPkg.devDependencies || {}) }

    if (!('@botpress/sdk' in dependencies)) {
      return []
    }

    const sdkPackageJsonPath = path.join(workDir, 'node_modules/@botpress/sdk/package.json')

    if (!fs.existsSync(sdkPackageJsonPath)) {
      return []
    }

    const sdkContent = await fs.promises.readFile(sdkPackageJsonPath, 'utf-8')
    const sdkPkg = JSON.parse(sdkContent)

    const peerDeps = sdkPkg.peerDependencies || {}
    const peerDepKeys = Object.keys(peerDeps)

    if (peerDepKeys.length === 0) {
      return [
        _createIssue('sdk.peer-deps', CATEGORY_SDK, 'ok', 'No peer dependencies required', {
          peerDeps: 'none',
        }),
      ]
    }

    const issues: DiagnosticIssue[] = []
    const missingPeers: string[] = []

    for (const peerName of peerDepKeys) {
      if (!(peerName in dependencies)) {
        missingPeers.push(peerName)
        issues.push(
          _createIssue(
            'sdk.peer-missing',
            CATEGORY_SDK,
            'warning',
            `Missing peer dependency: ${peerName}`,
            {
              peer: peerName,
              requiredVersion: peerDeps[peerName],
            },
            `Install ${peerName}: npm install ${peerName}@${peerDeps[peerName]} or pnpm add ${peerName}@${peerDeps[peerName]}`
          )
        )
      }
    }

    if (missingPeers.length === 0) {
      issues.push(
        _createIssue('sdk.peer-deps', CATEGORY_SDK, 'ok', 'All peer dependencies are installed', {
          peerDeps: peerDepKeys,
        })
      )
    }

    return issues
  } catch {
    return []
  }
}

function _extractMajorVersion(version: string): number {
  const cleaned = version.replace(/^[\^~>=<]/, '')
  const parts = cleaned.split('.')
  return parseInt(parts[0] ?? '0', 10)
}

function _isValidSemver(version: string): boolean {
  const semverRegex = /^[~^>=<]?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
  const cleaned = version.replace(/^[\^~>=<]+/, '')
  return semverRegex.test(cleaned)
}
