import { ResponseError } from 'core/errors'

export class FeatureNotAvailableError extends ResponseError {
  constructor(edition: string) {
    super(`This feature is not available in the ${edition} edition of Botpress.`, 401, 'BP_001')
  }

  type = 'FeatureNotAvailableError'
}
