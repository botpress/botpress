import { reporting } from '@botpress/sdk-addons'
import { actions } from './actions'
import { getAdminId } from './auth'
import { channels } from './channels'
import { handler } from './handler'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async ({ client, ctx }) => {
    const adminId = ctx.configuration.adminId || (await getAdminId(ctx))

    await client.setState({
      id: ctx.integrationId,
      name: 'credentials',
      type: 'integration',
      payload: { adminId, accessToken: ctx.configuration.accessToken },
    })
    await client.updateUser({
      id: ctx.botUserId,
      tags: { id: adminId },
    })
  },
  unregister: async () => {},
  actions,
  channels,
  handler,
})

export default reporting.wrapIntegration(integration)
