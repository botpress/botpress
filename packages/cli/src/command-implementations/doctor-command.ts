import * as config from '../config'
import { runEnvironmentChecks } from '../doctor/checks/environment'
import { runProjectChecks } from '../doctor/checks/project'
import { runSdkChecks } from '../doctor/checks/sdk'
import { formatHumanReadable } from '../doctor/formatter'
import type { DiagnosticIssue, DiagnosticResult } from '../doctor/types'
import * as errors from '../errors'
import type { CommandDefinition } from '../typings'
import { GlobalCommand } from './global-command'

export type DoctorCommandDefinition = CommandDefinition<typeof config.schemas.doctor>

export class DoctorCommand extends GlobalCommand<DoctorCommandDefinition> {
  public async run(): Promise<void> {
    const { workDir, json } = this.argv

    this.logger.log('Running diagnostic checks...', { prefix: '🩺' })
    this.logger.log('')

    const allIssues: DiagnosticIssue[] = []

    const [envIssues, projectIssues, sdkIssues] = await Promise.all([
      runEnvironmentChecks(workDir),
      runProjectChecks(workDir),
      runSdkChecks(workDir),
    ])
    allIssues.push(...envIssues, ...projectIssues, ...sdkIssues)

    const result = this._createResult(allIssues)

    if (json) {
      this.logger.json(result)
    } else {
      const formatted = formatHumanReadable(result)
      this.logger.log(formatted)
    }

    if (result.summary.errors > 0) {
      throw new errors.BotpressCLIError('Doctor found critical issues')
    }
  }

  private _createResult(issues: DiagnosticIssue[]): DiagnosticResult {
    const summary = {
      total: issues.length,
      ok: issues.filter((i) => i.status === 'ok').length,
      warnings: issues.filter((i) => i.status === 'warning').length,
      errors: issues.filter((i) => i.status === 'error').length,
    }

    return {
      issues,
      summary,
    }
  }
}
