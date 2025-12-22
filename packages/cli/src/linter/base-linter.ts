import { Spectral, Document, type ISpectralDiagnostic, type RulesetDefinition } from '@stoplight/spectral-core'
import { Json as JsonParser, type JsonParserResult } from '@stoplight/spectral-parsers'
import { type Logger } from '../logger'
import { TRUTHY_WITH_MESSAGE_ID } from './spectral-functions'

type ProblemSeverity = 0 | 1 | 2 | 3

const _injectLoggerIntoRulesetOptions = (ruleset: RulesetDefinition, logger?: Logger) => {
  // This is the most jankiest thing I've ever done but
  // Spectral was never designed to be extended at all
  if ('rules' in ruleset) {
    for (const ruleName in ruleset.rules) {
      const rule = ruleset.rules[ruleName]
      if (typeof rule !== 'object' || !('then' in rule)) {
        continue
      }

      const ruleThens = Array.isArray(rule.then) ? rule.then : [rule.then]
      for (const then of ruleThens) {
        if (then.function.name === TRUTHY_WITH_MESSAGE_ID) {
          const options = (then.functionOptions ?? {}) as Record<string, unknown>
          options.logger = logger
          then.functionOptions = options
        }
      }
    }
  }
}

export abstract class BaseLinter<TDefinition> {
  private readonly _spectral: Spectral
  private readonly _spectralDocument: Document<unknown, JsonParserResult<unknown>>
  private _results: ISpectralDiagnostic[] = []

  protected constructor(definition: TDefinition, ruleset: RulesetDefinition, logger?: Logger) {
    _injectLoggerIntoRulesetOptions(ruleset, logger)

    const json = JSON.stringify(definition)
    this._spectralDocument = new Document(json, JsonParser)
    this._spectral = new Spectral()
    this._spectral.setRuleset(ruleset)
  }

  public async lint(): Promise<void> {
    this._results = await this._spectral.run(this._spectralDocument)
  }

  public logResults(logger: Logger) {
    for (const result of this.getSortedResults()) {
      const resultPath = result.path.trim() || '{root}'
      const message = `${resultPath}: ${result.message}`

      this._logResultMessage(logger, message, result.severity)
    }
  }

  public getSortedResults() {
    return this._getResults().sort((a, b) => (a.path > b.path ? 1 : a.path < b.path ? -1 : 0))
  }

  public hasErrors() {
    return this._results.some((result) => result.severity === 0)
  }

  private _getResults() {
    return this._results.map((result) => ({
      message: result.message,
      path: this._simplifyPath(result.path),
      severity: result.severity as ProblemSeverity,
    }))
  }

  private _simplifyPath(path: (string | number)[]) {
    return path.join('.').replaceAll('.properties.', '.').replaceAll('.x-zui', '')
  }

  private _logResultMessage(logger: Logger, message: string, severity: ProblemSeverity) {
    const logLevelMapping = {
      0: logger.error,
      1: logger.warn,
      2: logger.log,
      3: logger.debug,
    } as const

    logLevelMapping[severity].call(logger, message)
  }
}
