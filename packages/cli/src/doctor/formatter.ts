import chalk from 'chalk'
import type { DiagnosticIssue, DiagnosticResult, DiagnosticStatus } from './types'

function getStatusEmoji(status: DiagnosticStatus): string {
  switch (status) {
    case 'ok':
      return '✅'
    case 'warning':
      return '⚠️'
    case 'error':
      return '❌'
    default:
      return '❓'
  }
}

function getStatusColor(status: DiagnosticStatus): (text: string) => string {
  switch (status) {
    case 'ok':
      return chalk.green
    case 'warning':
      return chalk.yellow
    case 'error':
      return chalk.red
    default:
      return chalk.gray
  }
}

function formatIssue(issue: DiagnosticIssue): string {
  const emoji = getStatusEmoji(issue.status)
  const color = getStatusColor(issue.status)
  const statusText = color(issue.status.toUpperCase())

  let output = `${emoji} [${statusText}] ${issue.message}`

  if (issue.suggestion && issue.status !== 'ok') {
    output += `\n  ${chalk.dim('→')} ${chalk.italic(issue.suggestion)}`
  }

  if (issue.details && Object.keys(issue.details).length > 0) {
    const detailsStr = Object.entries(issue.details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
    output += `\n  ${chalk.dim(detailsStr)}`
  }

  return output
}

export function formatHumanReadable(result: DiagnosticResult): string {
  const lines: string[] = []

  lines.push('')
  lines.push(chalk.bold.cyan('🩺 Botpress Doctor - Diagnostic Report'))
  lines.push('')

  const categorizedIssues: Record<string, DiagnosticIssue[]> = {}
  for (const issue of result.issues) {
    if (!categorizedIssues[issue.category]) {
      categorizedIssues[issue.category] = []
    }
    categorizedIssues[issue.category]!.push(issue)
  }

  const categoryNames: Record<string, string> = {
    env: 'ENVIRONMENT CHECKS',
    project: 'PROJECT CHECKS',
    sdk: 'SDK & VERSIONING CHECKS',
    auth: 'AUTHENTICATION & PROFILE CHECKS',
    network: 'NETWORK CHECKS',
    secrets: 'SECRETS CHECKS',
    dependencies: 'DEPENDENCY CHECKS',
  }

  for (const [category, issues] of Object.entries(categorizedIssues)) {
    const categoryName = categoryNames[category] ?? category.toUpperCase()
    lines.push(chalk.bold.underline(categoryName))
    lines.push('')

    for (const issue of issues) {
      lines.push(formatIssue(issue))
      lines.push('')
    }
  }

  lines.push(chalk.bold.underline('SUMMARY'))
  lines.push('')
  lines.push(`Total checks: ${result.summary.total}`)
  lines.push(chalk.green(`✅ Passed: ${result.summary.ok}`))
  if (result.summary.warnings > 0) {
    lines.push(chalk.yellow(`⚠️  Warnings: ${result.summary.warnings}`))
  }
  if (result.summary.errors > 0) {
    lines.push(chalk.red(`❌ Errors: ${result.summary.errors}`))
  }
  lines.push('')

  if (result.summary.errors > 0) {
    lines.push(chalk.red.bold('❌ Some critical issues were found. Please fix them before proceeding.'))
  } else if (result.summary.warnings > 0) {
    lines.push(chalk.yellow.bold('⚠️  Some warnings were found. Consider addressing them.'))
  } else {
    lines.push(chalk.green.bold('✅ All checks passed! Your environment is ready.'))
  }
  lines.push('')

  return lines.join('\n')
}
