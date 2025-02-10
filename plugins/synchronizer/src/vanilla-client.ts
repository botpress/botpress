import * as client from '@botpress/client'
import * as bp from '.botpress'

export * from '@botpress/client'
export const clientFrom = (client: bp.Client): client.Client => {
  // TODO: add table methods on vanilla client
  return (client as any)._client
}
