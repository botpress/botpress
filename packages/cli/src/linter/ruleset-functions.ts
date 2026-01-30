import { RuleDefinition, RulesetDefinition as SpectralRulesetDefinition } from '@stoplight/spectral-core'
import { DiagnosticSeverity } from '@stoplight/types'
import { Ruleset } from './ruleset-tests/common'

type RulesetDefinition = SpectralRulesetDefinition & Ruleset

/** Applies build-time transformations to the ruleset. See remarks for details.
 *
 *  @remark Replaces "{{callToAction}}" placeholders with their corresponding words (e.g. "SHOULD" or "MUST") */
export const preprocessRuleset = (ruleset: RulesetDefinition): RulesetDefinition => {
  if ('rules' in ruleset) {
    for (const ruleName in ruleset.rules) {
      let rule = ruleset.rules[ruleName]
      if (typeof rule !== 'object') {
        continue
      }

      rule = _replaceCallToActionPlaceholders(rule)
      ruleset.rules[ruleName] = rule
    }
  }

  return ruleset
}

const _getCallToActionWord = (severity: Exclude<RuleDefinition['severity'], undefined>): string => {
  switch (severity) {
    case DiagnosticSeverity.Error:
    case 'error':
      return 'MUST'
    case DiagnosticSeverity.Warning:
    case 'warn':
      return 'SHOULD'
    case DiagnosticSeverity.Information:
    case 'info':
      return 'SHOULD'
    case DiagnosticSeverity.Hint:
    case 'hint':
      return 'SHOULD'
    default:
      return 'SHOULD'
  }
}

const _replaceCallToActionPlaceholders = (ruleDef: RuleDefinition): RuleDefinition => {
  const { severity } = ruleDef
  if (severity === undefined) {
    return ruleDef
  }

  const callToActionWord = _getCallToActionWord(severity)
  let { description, message } = ruleDef

  description = description?.replaceAll('{{callToAction}}', callToActionWord)
  message = message?.replaceAll('{{callToAction}}', callToActionWord)
  return {
    ...ruleDef,
    description,
    message,
  }
}
