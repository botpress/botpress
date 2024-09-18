import { Spectral, Document, ISpectralDiagnostic } from '@stoplight/spectral-core'
import { Json as JsonParser, JsonParserResult } from '@stoplight/spectral-parsers'
import { Logger } from '../logger'

export abstract class BaseLinter {
  protected readonly spectral: Spectral
  private readonly spectralDocument: Document<unknown, JsonParserResult<unknown>>
  private results: ISpectralDiagnostic[] = []

  protected constructor(definition: unknown) {
    const json = JSON.stringify(definition).replaceAll('"$ref":', '"_$ref":')
    this.spectralDocument = new Document(json, JsonParser)
    this.spectral = new Spectral()
  }

  public async lint(): Promise<void> {
    this.results = await this.spectral.run(this.spectralDocument)
  }

  public getResults() {
    return this.results.map((result) => ({
      message: result.message,
      path: this.simplifyPath(result.path),
      severity: +result.severity,
    }))
  }

  public logResults(logger: Logger) {
    this.getResults().forEach((result) => {
      const message = `${result.path}: ${result.message}`

      this.logResultMessage(logger, message, +result.severity)
    })
  }

  private logResultMessage(logger: Logger, message: string, severity: number) {
    switch (severity) {
      case 0:
        logger.error(message)
        break
      case 1:
        logger.warn(message)
        break
      case 2:
        logger.log(message)
        break
      default:
        logger.debug(message)
    }
  }

  private simplifyPath(path: (string | number)[]) {
    return path.join('.').replaceAll('.properties.', '.').replaceAll('.x-zui', '')
  }
}
