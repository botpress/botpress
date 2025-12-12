import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

export const listStoreOrders: bp.IntegrationProps['actions']['listStoreOrders'] = wrapUberAction(
  async ({ uber, input, ctx }) => {
    const storeId = ctx.configuration.storeId

    return await uber.listStoreOrders(storeId, {
      state: input.state,
      status: input.status,
    })
  },
  'Failed to list Uber Eats store orders'
)
