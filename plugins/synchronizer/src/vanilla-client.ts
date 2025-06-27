import * as client from '@botpress/client'
import * as bp from '.botpress'

export * from '@botpress/client'
export const clientFrom = (client: bp.Client): client.Client => {
  return client._inner
}
