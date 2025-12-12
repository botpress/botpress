import { wrapUberAction } from 'src/misc/action-wrapper'
import * as bp from '.botpress'

const DEFAULT_PAGE_SIZE = 50

export const listStoreOrders: bp.IntegrationProps['actions']['listStoreOrders'] = wrapUberAction(
  async ({ uber, ctx, input }) => {
    const raw = await uber.listStoreOrders({
      store_id: ctx.configuration.storeId,
      expand: input.expand,
      state: input.state,
      status: input.status,
      start_time: input.start_time,
      end_time: input.end_time,
      next_page_token: input.nextToken,
      page_size: input.pageSize ?? DEFAULT_PAGE_SIZE,
    })

    return {
      orders: raw.data,
      nextToken: raw.pagination_data?.next_page_token,
      pageSize: raw.pagination_data?.page_size,
    }
  },
  'Failed to list Uber Eats store orders'
)
