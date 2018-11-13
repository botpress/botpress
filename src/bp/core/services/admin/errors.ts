import { BotpressEditions } from 'common/editions'
import { ResponseError } from 'core/routers/errors'

export class FeatureNotAvailableError extends ResponseError {
  constructor(edition: string) {
    super(`Feature not available in Botpress ${BotpressEditions[edition]} Edition.`, 401, 'BP_001')
  }

  type = 'FeatureNotAvailableError'
}
