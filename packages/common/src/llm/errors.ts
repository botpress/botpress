import { RuntimeError } from '@botpress/client'

const ERROR_SUBTYPE_UPSTREAM_PROVIDER_FAILED = 'UPSTREAM_PROVIDER_FAILED'

export function createUpstreamProviderFailedError(cause: Error, message?: string) {
  return new RuntimeError(message ?? cause.message, cause, undefined, {
    subtype: ERROR_SUBTYPE_UPSTREAM_PROVIDER_FAILED,
  })
}
