import { ResponseError } from 'core/routers/errors'

export class FeatureNotAvailableError extends ResponseError {
  constructor() {
    super(`Feature not available in Botpress Community Edition.`, 401, 'BP_001')
  }

  type = 'FeatureNotAvailableError'
}
