import * as bp from '.botpress'
import { orderMapper } from '@/mappers/order.mapper'
import { wrapUberAction } from '@/misc/action-wrapper'

const DEFAULT_PAGE_SIZE = 50

export const listStoreOrders: bp.IntegrationProps['actions']['listStoreOrders'] = wrapUberAction(
  async ({ uber, input }) => {
    const response = await uber.listStoreOrders({
      expand: input.expand,
      state: input.state?.join(','),
      status: input.status?.join(','),
      start_time: input.startTime,
      end_time: input.endTime,
      next_page_token: input.nextToken,
      page_size: input.pageSize ?? DEFAULT_PAGE_SIZE,
    })

    return orderMapper.toListStoreOrdersActionOutput(response.data)
  },
  'Failed to list Uber Eats store orders'
)
