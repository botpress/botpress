import fs from 'fs'
import path from 'path'
import type { DiagnosticIssue } from '../types'
import { _createIssue, CATEGORY_SECRETS } from './commons'

const PLACEHOLDER_VALUES = ['YOUR_API_KEY', 'REPLACE_ME', 'changeme', 'CHANGE_ME', 'your-secret', 'xxx', 'placeholder']

/**
 * Runs all secrets validation checks and collects diagnostic issues
 * @param workDir - The working directory to check
 * @returns Array of all diagnostic issues found across all secrets checks
 */
export async function runSecretsChecks(workDir: string): Promise<DiagnosticIssue[]> {
  const requiredSecrets = await _getRequiredSecrets(workDir)

  if (!requiredSecrets || requiredSecrets.length === 0) {
    return [
      _createIssue(
        'secrets.no-required-list',
        CATEGORY_SECRETS,
        'ok',
        'No required secrets configuration found for this project',
        { workDir }
      ),
    ]
  }

  const results = await Promise.all([
    _checkSecretsInEnvironment(requiredSecrets),
    _checkEnvFile(workDir, requiredSecrets),
    _checkEnvExample(workDir, requiredSecrets),
  ])

  return results.flat()
}

async function _getRequiredSecrets(workDir: string): Promise<string[] | null> {
  const definitionFiles = [path.join(workDir, 'integration.definition.ts')]

  for (const defFile of definitionFiles) {
    if (!fs.existsSync(defFile)) {
      continue
    }

    try {
      const content = await fs.promises.readFile(defFile, 'utf-8')

      const secretsMatch = content.match(/secrets\s*:\s*\{([^}]*)\}/s)
      if (!secretsMatch) {
        continue
      }

      const secretsBlock = secretsMatch[1]
      if (!secretsBlock) {
        continue
      }

      const secretNames: string[] = []
      const secretNameRegex = /([A-Z_][A-Z0-9_]*)\s*:/g
      let match

      while ((match = secretNameRegex.exec(secretsBlock)) !== null) {
        const secretName = match[1]
        if (secretName && !secretNames.includes(secretName)) {
          secretNames.push(secretName)
        }
      }

      if (secretNames.length > 0) {
        return secretNames
      }
    } catch {
      continue
    }
  }

  return null
}

async function _checkSecretsInEnvironment(requiredSecrets: string[]): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = []
  const missingSecrets: string[] = []
  const emptySecrets: string[] = []
  const placeholderSecrets: string[] = []
  const validSecrets: string[] = []

  for (const secretName of requiredSecrets) {
    const value = process.env[secretName]

    if (value === undefined) {
      missingSecrets.push(secretName)
      issues.push(
        _createIssue(
          'secrets.missing',
          CATEGORY_SECRETS,
          'warning',
          `Required secret "${secretName}" is not set in environment`,
          { secretName },
          `Set the ${secretName} environment variable or add it to your .env file`
        )
      )
      continue
    }

    if (value.trim().length === 0) {
      emptySecrets.push(secretName)
      issues.push(
        _createIssue(
          'secrets.empty',
          CATEGORY_SECRETS,
          'error',
          `Secret "${secretName}" is empty or contains only whitespace`,
          { secretName },
          `Provide a valid value for ${secretName}`
        )
      )
      continue
    }

    const valueUpper = value.toUpperCase()
    const isPlaceholder = PLACEHOLDER_VALUES.some((placeholder) => valueUpper.includes(placeholder.toUpperCase()))

    if (isPlaceholder) {
      placeholderSecrets.push(secretName)
      issues.push(
        _createIssue(
          'secrets.placeholder',
          CATEGORY_SECRETS,
          'warning',
          `Secret "${secretName}" appears to be a placeholder value`,
          { secretName, valuePreview: value.substring(0, 15) + '...' },
          `Replace ${secretName} with a real value`
        )
      )
      continue
    }

    validSecrets.push(secretName)
  }

  if (validSecrets.length === requiredSecrets.length) {
    issues.push(
      _createIssue('secrets.all-configured', CATEGORY_SECRETS, 'ok', 'All required secrets are properly configured', {
        secretCount: requiredSecrets.length,
        secrets: requiredSecrets,
      })
    )
  } else if (validSecrets.length > 0) {
    issues.push(
      _createIssue(
        'secrets.some-configured',
        CATEGORY_SECRETS,
        'ok',
        `${validSecrets.length} out of ${requiredSecrets.length} secrets are configured`,
        {
          validSecrets,
          configured: validSecrets.length,
          total: requiredSecrets.length,
        }
      )
    )
  }

  return issues
}

async function _checkEnvFile(workDir: string, requiredSecrets: string[]): Promise<DiagnosticIssue[]> {
  const envPath = path.join(workDir, '.env')

  if (!fs.existsSync(envPath)) {
    return [
      _createIssue(
        'secrets.no-env-file',
        CATEGORY_SECRETS,
        'warning',
        '.env file not found',
        {
          workDir,
          requiredSecretsCount: requiredSecrets.length,
        },
        'Create a .env file to store your secret values locally'
      ),
    ]
  }

  try {
    const content = await fs.promises.readFile(envPath, 'utf-8')
    const lines = content.split('\n')
    const envVars = new Set<string>()

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/)
        if (match && match[1]) {
          envVars.add(match[1])
        }
      }
    }

    return [
      _createIssue('secrets.env-file-exists', CATEGORY_SECRETS, 'ok', '.env file found', {
        path: envPath,
        variablesCount: envVars.size,
      }),
    ]
  } catch {
    return []
  }
}

async function _checkEnvExample(workDir: string, requiredSecrets: string[]): Promise<DiagnosticIssue[]> {
  const envExamplePath = path.join(workDir, '.env.example')

  if (!fs.existsSync(envExamplePath)) {
    return [
      _createIssue(
        'secrets.no-env-example',
        CATEGORY_SECRETS,
        'warning',
        '.env.example file not found',
        {
          workDir,
          requiredSecretsCount: requiredSecrets.length,
        },
        'Create a .env.example file listing all required secrets to facilitate project onboarding'
      ),
    ]
  }

  try {
    const content = await fs.promises.readFile(envExamplePath, 'utf-8')
    const lines = content.split('\n')
    const exampleVars = new Set<string>()

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/)
        if (match && match[1]) {
          exampleVars.add(match[1])
        }
      }
    }

    const missingInExample: string[] = []
    const issues: DiagnosticIssue[] = []

    for (const secretName of requiredSecrets) {
      if (!exampleVars.has(secretName)) {
        missingInExample.push(secretName)
        issues.push(
          _createIssue(
            'secrets.missing-in-env-example',
            CATEGORY_SECRETS,
            'warning',
            `Required secret "${secretName}" is not listed in .env.example`,
            { secretName, path: envExamplePath },
            `Add ${secretName} to .env.example`
          )
        )
      }
    }

    if (missingInExample.length === 0) {
      issues.push(
        _createIssue(
          'secrets.env-example-complete',
          CATEGORY_SECRETS,
          'ok',
          'All required secrets are documented in .env.example',
          {
            path: envExamplePath,
            secretsCount: requiredSecrets.length,
          }
        )
      )
    }

    return issues
  } catch {
    return []
  }
}
