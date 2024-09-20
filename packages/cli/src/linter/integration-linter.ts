import { Spectral, Document, ISpectralDiagnostic } from '@stoplight/spectral-core'
import { Json as JsonParser, JsonParserResult } from '@stoplight/spectral-parsers'
import { Logger } from '../logger'
import { CreateIntegrationBody } from '../api/integration-body'
import { INTEGRATION_RULSESET } from './rulesets/integration.ruleset'

type ProblemSeverity = 0 | 1 | 2 | 3

export class IntegrationLinter {
  private readonly spectral: Spectral
  private readonly spectralDocument: Document<unknown, JsonParserResult<unknown>>
  private results: ISpectralDiagnostic[] = []

  public constructor(definition: CreateIntegrationBody) {
    const json = JSON.stringify(definition).replaceAll('"$ref":', '"_$ref":')
    this.spectralDocument = new Document(json, JsonParser)
    this.spectral = new Spectral()

    this.spectral.setRuleset(INTEGRATION_RULSESET)
  }

  public async lint(): Promise<void> {
    this.results = await this.spectral.run(this.spectralDocument)
  }

  public logResults(logger: Logger) {
    for (const result of this.getSortedResults()) {
      const message = `${result.path}: ${result.message}`

      this.logResultMessage(logger, message, result.severity)
    }
  }

  private getSortedResults() {
    return this.getResults().sort((a, b) => (a.path > b.path ? 1 : a.path < b.path ? -1 : 0))
  }

  private getResults() {
    return this.results.map((result) => ({
      message: result.message,
      path: this.simplifyPath(result.path),
      severity: result.severity as ProblemSeverity,
    }))
  }

  private simplifyPath(path: (string | number)[]) {
    return path.join('.').replaceAll('.properties.', '.').replaceAll('.x-zui', '')
  }

  private logResultMessage(logger: Logger, message: string, severity: ProblemSeverity) {
    const logLevelMapping = {
      0: logger.error,
      1: logger.warn,
      2: logger.log,
      3: logger.debug,
    } as const

    logLevelMapping[severity](message)
  }
}
