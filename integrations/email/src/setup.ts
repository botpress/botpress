import * as sdk from '@botpress/sdk'
import { getMessages } from './imap'
import * as locking from './locking'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async (props) => {
  const lock = new locking.LockHandler({ client: props.client, ctx: props.ctx })
  await lock.setLock(false)

  await props.client.setState({
    name: 'lastSyncTimestamp',
    id: props.ctx.integrationId,
    type: 'integration',
    payload: { lastSyncTimestamp: new Date().toISOString() },
  })

  try {
    await getMessages({ page: 0, perPage: 1 }, props)
  } catch (thrown: unknown) {
    const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
    throw new sdk.RuntimeError(
      `An error occured when registering the integration: ${err.message} Verify your configuration.`
    )
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}
