import * as fs from 'fs'
import * as path from 'path'
import type { DiagnosticIssue } from '../types'
import { CATEGORY_SECURITY, _createIssue } from './commons'

/**
 * Runs all security validation checks and collects diagnostic issues
 * @param workDir - The working directory to check
 * @returns Array of all diagnostic issues found across all security checks
 */
export async function runSecurityChecks(workDir: string): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = []

  const [envFileIssues, gitignoreIssues, hardcodedSecretsIssues, insecureDepsIssues] = await Promise.all([
    _checkEnvFileSecurity(workDir),
    _checkGitignoreSecurity(workDir),
    _checkHardcodedSecrets(workDir),
    _checkInsecureDependencies(workDir),
  ])

  issues.push(...envFileIssues, ...gitignoreIssues, ...hardcodedSecretsIssues, ...insecureDepsIssues)

  return issues
}

async function _checkEnvFileSecurity(workDir: string): Promise<DiagnosticIssue[]> {
  const envPath = path.join(workDir, '.env')
  const envExamplePath = path.join(workDir, '.env.example')

  if (!fs.existsSync(envPath)) {
    return [
      _createIssue(
        'security.no-env-file',
        CATEGORY_SECURITY,
        'ok',
        'No .env file found (secrets may be managed elsewhere)'
      ),
    ]
  }

  const issues: DiagnosticIssue[] = []

  try {
    const stats = fs.statSync(envPath)
    const mode = stats.mode & 0o777

    if (mode & 0o004) {
      issues.push(
        _createIssue(
          'security.env-world-readable',
          CATEGORY_SECURITY,
          'warning',
          '.env file is world-readable',
          { path: envPath, permissions: mode.toString(8) },
          'Run "chmod 600 .env" to restrict access to owner only'
        )
      )
    } else {
      issues.push(
        _createIssue('security.env-permissions-ok', CATEGORY_SECURITY, 'ok', '.env file has secure permissions', {
          path: envPath,
          permissions: mode.toString(8),
        })
      )
    }
  } catch (error: any) {
    issues.push(
      _createIssue(
        'security.env-permissions-check-failed',
        CATEGORY_SECURITY,
        'warning',
        'Could not check .env file permissions',
        { error: error.message }
      )
    )
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'))

    let hasRealSecrets = false
    for (const line of lines) {
      const value = line.split('=')[1]?.trim() || ''
      if (value && !_isPlaceholder(value)) {
        hasRealSecrets = true
        break
      }
    }

    if (hasRealSecrets && fs.existsSync(envExamplePath)) {
      issues.push(
        _createIssue(
          'security.env-example-exists',
          CATEGORY_SECURITY,
          'ok',
          '.env.example file exists for documentation',
          { envPath, envExamplePath }
        )
      )
    } else if (hasRealSecrets && !fs.existsSync(envExamplePath)) {
      issues.push(
        _createIssue(
          'security.env-example-missing',
          CATEGORY_SECURITY,
          'warning',
          '.env file contains secrets but .env.example is missing',
          { envPath },
          'Create a .env.example file with placeholder values for documentation'
        )
      )
    }
  } catch (error: any) {
    issues.push(
      _createIssue('security.env-read-failed', CATEGORY_SECURITY, 'warning', 'Could not read .env file', {
        error: error.message,
      })
    )
  }

  return issues
}

async function _checkGitignoreSecurity(workDir: string): Promise<DiagnosticIssue[]> {
  const gitignorePath = path.join(workDir, '.gitignore')

  if (!fs.existsSync(gitignorePath)) {
    return [
      _createIssue(
        'security.no-gitignore',
        CATEGORY_SECURITY,
        'warning',
        'No .gitignore file found',
        { workDir },
        'Create a .gitignore file to prevent committing sensitive files'
      ),
    ]
  }

  try {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8')
    const issues: DiagnosticIssue[] = []

    const sensitivePatterns = [
      { pattern: '.env', name: '.env files' },
      { pattern: 'node_modules', name: 'node_modules' },
      { pattern: '.botpress', name: '.botpress directory' },
      { pattern: 'dist', name: 'dist directory' },
    ]

    const missingPatterns: string[] = []

    for (const { pattern, name } of sensitivePatterns) {
      if (!gitignoreContent.includes(pattern)) {
        missingPatterns.push(name)
      }
    }

    if (missingPatterns.length === 0) {
      issues.push(
        _createIssue(
          'security.gitignore-complete',
          CATEGORY_SECURITY,
          'ok',
          '.gitignore includes all recommended patterns',
          { path: gitignorePath }
        )
      )
    } else {
      issues.push(
        _createIssue(
          'security.gitignore-incomplete',
          CATEGORY_SECURITY,
          'warning',
          `.gitignore is missing ${missingPatterns.length} recommended patterns`,
          { missing: missingPatterns, path: gitignorePath },
          `Add these patterns to .gitignore: ${missingPatterns.join(', ')}`
        )
      )
    }

    return issues
  } catch (error: any) {
    return [
      _createIssue('security.gitignore-check-failed', CATEGORY_SECURITY, 'warning', 'Could not check .gitignore file', {
        error: error.message,
      }),
    ]
  }
}

async function _checkHardcodedSecrets(workDir: string): Promise<DiagnosticIssue[]> {
  const filesToCheck = [
    'integration.definition.ts',
    'integration.definition.js',
    'bot.definition.ts',
    'bot.definition.js',
    'plugin.definition.ts',
    'plugin.definition.js',
  ]

  let checkedFile: string | null = null
  let content = ''

  for (const file of filesToCheck) {
    const filePath = path.join(workDir, file)
    if (fs.existsSync(filePath)) {
      try {
        content = fs.readFileSync(filePath, 'utf-8')
        checkedFile = file
        break
      } catch {
        continue
      }
    }
  }

  if (!checkedFile) {
    return [
      _createIssue(
        'security.no-definition-file',
        CATEGORY_SECURITY,
        'ok',
        'No definition file found to check for hardcoded secrets'
      ),
    ]
  }

  const suspiciousPatterns = [
    { regex: /['"]sk-[a-zA-Z0-9]{20,}['"]/, name: 'OpenAI API key' },
    { regex: /['"]xoxb-[0-9]{10,}['"]/, name: 'Slack bot token' },
    { regex: /['"]ghp_[a-zA-Z0-9]{36}['"]/, name: 'GitHub personal access token' },
    { regex: /['"][a-zA-Z0-9]{32}:[a-zA-Z0-9]{32}['"]/, name: 'AWS access key' },
    {
      regex: /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      name: 'hardcoded password',
    },
  ]

  const foundSecrets: string[] = []

  for (const { regex, name } of suspiciousPatterns) {
    if (regex.test(content)) {
      foundSecrets.push(name)
    }
  }

  if (foundSecrets.length > 0) {
    return [
      _createIssue(
        'security.hardcoded-secrets-found',
        CATEGORY_SECURITY,
        'error',
        `Potential hardcoded secrets found in ${checkedFile}`,
        { file: checkedFile, types: foundSecrets },
        'Remove hardcoded secrets and use environment variables instead'
      ),
    ]
  }

  return [
    _createIssue(
      'security.no-hardcoded-secrets',
      CATEGORY_SECURITY,
      'ok',
      'No obvious hardcoded secrets detected in definition file',
      { file: checkedFile }
    ),
  ]
}

async function _checkInsecureDependencies(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return [
      _createIssue(
        'security.no-package-json',
        CATEGORY_SECURITY,
        'ok',
        'No package.json found, skipping insecure dependencies check'
      ),
    ]
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    const issues: DiagnosticIssue[] = []

    const insecurePackages = [
      { name: 'request', replacement: 'axios or node-fetch' },
      { name: 'node-uuid', replacement: 'uuid' },
      { name: 'colors', replacement: 'chalk or picocolors' },
      { name: 'moment', replacement: 'date-fns or dayjs' },
    ]

    const foundInsecure: Array<{ name: string; replacement: string }> = []

    for (const { name, replacement } of insecurePackages) {
      if (allDeps[name]) {
        foundInsecure.push({ name, replacement })
      }
    }

    if (foundInsecure.length > 0) {
      issues.push(
        _createIssue(
          'security.deprecated-packages',
          CATEGORY_SECURITY,
          'warning',
          `Found ${foundInsecure.length} deprecated or insecure packages`,
          { packages: foundInsecure },
          'Replace deprecated packages with modern alternatives'
        )
      )
    } else {
      issues.push(
        _createIssue(
          'security.no-deprecated-packages',
          CATEGORY_SECURITY,
          'ok',
          'No known deprecated or insecure packages found'
        )
      )
    }

    const looseVersions: string[] = []

    for (const [name, version] of Object.entries(allDeps)) {
      const versionStr = version as string
      if (versionStr.startsWith('*') || versionStr.startsWith('x') || versionStr.startsWith('latest')) {
        looseVersions.push(name)
      }
    }

    if (looseVersions.length > 0) {
      issues.push(
        _createIssue(
          'security.loose-versions',
          CATEGORY_SECURITY,
          'warning',
          `Found ${looseVersions.length} dependencies with loose version constraints`,
          { packages: looseVersions.slice(0, 10) },
          'Use specific version numbers or version ranges to ensure reproducible builds'
        )
      )
    } else {
      issues.push(
        _createIssue(
          'security.versions-ok',
          CATEGORY_SECURITY,
          'ok',
          'All dependencies have specific version constraints'
        )
      )
    }

    return issues
  } catch (error: any) {
    return [
      _createIssue(
        'security.insecure-deps-check-failed',
        CATEGORY_SECURITY,
        'warning',
        'Could not check for insecure dependencies',
        { error: error.message }
      ),
    ]
  }
}

function _isPlaceholder(value: string): boolean {
  const placeholders = ['your_', 'replace_', 'changeme', 'todo', 'xxx', 'yyy', 'example', '<your', 'placeholder']

  const lowerValue = value.toLowerCase()
  return placeholders.some((placeholder) => lowerValue.includes(placeholder))
}
