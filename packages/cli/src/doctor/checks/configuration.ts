import fs from 'fs'
import path from 'path'
import type { DiagnosticIssue } from '../types'
import { _createIssue, CATEGORY_CONFIGURATION } from './commons'

/**
 * Runs all configuration validation checks and collects diagnostic issues
 * @param workDir - The working directory to check
 * @returns Array of all diagnostic issues found across all configuration checks
 */
export async function runConfigurationChecks(workDir: string): Promise<DiagnosticIssue[]> {
  const definitionFile = _findDefinitionFile(workDir)

  if (!definitionFile) {
    return [
      _createIssue(
        'config.no-definition-file',
        CATEGORY_CONFIGURATION,
        'error',
        'No definition file found in project',
        { workDir, expectedFiles: ['integration.definition.ts', 'bot.definition.ts', 'plugin.definition.ts'] },
        'Create an integration.definition.ts, bot.definition.ts, or plugin.definition.ts file'
      ),
    ]
  }

  try {
    const content = await fs.promises.readFile(definitionFile.path, 'utf-8')
    const issues: DiagnosticIssue[] = []

    issues.push(
      _createIssue(
        'config.definition-file-exists',
        CATEGORY_CONFIGURATION,
        'ok',
        `Definition file found: ${definitionFile.file}`,
        {
          file: definitionFile.file,
          path: definitionFile.path,
        }
      )
    )

    issues.push(
      ..._checkDefinitionStructure(content, definitionFile),
      ..._checkConfigurationSchema(content, definitionFile.path),
      ..._checkNamingConventions(content, definitionFile.path)
    )

    return issues
  } catch (error: any) {
    return [
      _createIssue(
        'config.definition-parse-error',
        CATEGORY_CONFIGURATION,
        'error',
        `Failed to parse definition file: ${error.message}`,
        { path: definitionFile.path, error: error.message },
        'Check for syntax errors in your definition file'
      ),
    ]
  }
}

function _findDefinitionFile(
  workDir: string
): { file: string; path: string; type: 'integration' | 'bot' | 'plugin' } | null {
  const possibleFiles = [
    { file: 'integration.definition.ts', type: 'integration' as const },
    { file: 'bot.definition.ts', type: 'bot' as const },
    { file: 'plugin.definition.ts', type: 'plugin' as const },
  ]

  for (const { file, type } of possibleFiles) {
    const filePath = path.join(workDir, file)
    if (fs.existsSync(filePath)) {
      return { file, path: filePath, type }
    }
  }

  return null
}

function _checkDefinitionStructure(
  content: string,
  definitionFile: { path: string; type: 'integration' | 'bot' | 'plugin' }
): DiagnosticIssue[] {
  if (!content.includes('export default')) {
    return [
      _createIssue(
        'config.missing-default-export',
        CATEGORY_CONFIGURATION,
        'error',
        'Definition file must have a default export',
        { path: definitionFile.path },
        'Add "export default new IntegrationDefinition({ ... })" to your definition file'
      ),
    ]
  }

  if (definitionFile.type === 'integration' && !content.includes('IntegrationDefinition')) {
    return [
      _createIssue(
        'config.missing-integration-definition',
        CATEGORY_CONFIGURATION,
        'warning',
        'Definition file should use IntegrationDefinition class',
        { path: definitionFile.path },
        'Use "new IntegrationDefinition({ ... })" in your definition file'
      ),
    ]
  }

  if (definitionFile.type === 'bot' && !content.includes('BotDefinition')) {
    return [
      _createIssue(
        'config.missing-bot-definition',
        CATEGORY_CONFIGURATION,
        'warning',
        'Definition file should use BotDefinition class',
        { path: definitionFile.path },
        'Use "new BotDefinition({ ... })" in your definition file'
      ),
    ]
  }

  return [
    _createIssue('config.definition-structure-ok', CATEGORY_CONFIGURATION, 'ok', 'Definition file structure is valid', {
      type: definitionFile.type,
      path: definitionFile.path,
    }),
  ]
}

function _checkConfigurationSchema(content: string, defPath: string): DiagnosticIssue[] {
  const hasConfiguration = /configuration\s*:\s*\{/.test(content)
  const hasConfigurations = /configurations\s*:\s*\{/.test(content)

  if (!hasConfiguration && !hasConfigurations) {
    return [
      _createIssue(
        'config.no-configuration',
        CATEGORY_CONFIGURATION,
        'ok',
        'No configuration schema defined (optional)',
        { path: defPath }
      ),
    ]
  }

  const hasZodImport = content.includes("from '@botpress/sdk'") || content.includes('import { z }')
  if ((hasConfiguration || hasConfigurations) && !hasZodImport) {
    return [
      _createIssue(
        'config.missing-zod-schema',
        CATEGORY_CONFIGURATION,
        'warning',
        'Configuration schema should use Zod for validation',
        { path: defPath },
        "Import { z } from '@botpress/sdk' and use z.object() for your schema"
      ),
    ]
  }

  return [
    _createIssue('config.configuration-schema-ok', CATEGORY_CONFIGURATION, 'ok', 'Configuration schema is defined', {
      path: defPath,
      hasConfiguration,
      hasConfigurations,
    }),
  ]
}

function _checkNamingConventions(content: string, defPath: string): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = []

  const actionsMatch = content.match(/actions\s*:\s*\{([^}]+)\}/s)
  if (actionsMatch) {
    const actionsBlock = actionsMatch[1]
    const actionNames = actionsBlock?.match(/(\w+)\s*:/g)?.map((m) => m.replace(':', '').trim()) || []
    const invalidActions = actionNames.filter((name) => !_isCamelCase(name))

    if (invalidActions.length > 0) {
      issues.push(
        _createIssue(
          'config.invalid-action-names',
          CATEGORY_CONFIGURATION,
          'error',
          `Action names must be camelCase: ${invalidActions.join(', ')}`,
          { invalidActions },
          'Rename actions to use camelCase (e.g., "myAction" not "my_action" or "MyAction")'
        )
      )
    }
  }

  const eventsMatch = content.match(/events\s*:\s*\{([^}]+)\}/s)
  if (eventsMatch) {
    const eventsBlock = eventsMatch[1]
    const eventNames = eventsBlock?.match(/(\w+)\s*:/g)?.map((m) => m.replace(':', '').trim()) || []
    const invalidEvents = eventNames.filter((name) => !_isCamelCase(name))

    if (invalidEvents.length > 0) {
      issues.push(
        _createIssue(
          'config.invalid-event-names',
          CATEGORY_CONFIGURATION,
          'error',
          `Event names must be camelCase: ${invalidEvents.join(', ')}`,
          { invalidEvents },
          'Rename events to use camelCase (e.g., "messageReceived" not "message_received")'
        )
      )
    }
  }

  const channelsMatch = content.match(/channels\s*:\s*\{([^}]+)\}/s)
  if (channelsMatch) {
    const channelsBlock = channelsMatch[1]
    const channelNames = channelsBlock?.match(/(\w+)\s*:/g)?.map((m) => m.replace(':', '').trim()) || []
    const invalidChannels = channelNames.filter((name) => !_isCamelCase(name))

    if (invalidChannels.length > 0) {
      issues.push(
        _createIssue(
          'config.invalid-channel-names',
          CATEGORY_CONFIGURATION,
          'error',
          `Channel names must be camelCase: ${invalidChannels.join(', ')}`,
          { invalidChannels },
          'Rename channels to use camelCase (e.g., "slack" not "Slack" or "slack_channel")'
        )
      )
    }
  }

  if (issues.length === 0) {
    return [
      _createIssue('config.naming-conventions-ok', CATEGORY_CONFIGURATION, 'ok', 'Naming conventions are correct', {
        path: defPath,
      }),
    ]
  }

  return issues
}

function _isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str)
}
