import { z } from '@botpress/sdk'
import * as uberApi from 'src/api/gen'
import { getOrderActionOutputSchema, listStoreOrdersActionOutputSchema } from 'src/definitions/actions'

type GetOrderActionOutput = z.infer<typeof getOrderActionOutputSchema>
type ListOrderActionOutput = z.infer<typeof listStoreOrdersActionOutputSchema>

export const orderMapper = {
  toGetOrderActionOutput(response: uberApi.GetOrder200): GetOrderActionOutput {
    const order = response.order

    return {
      order: {
        id: order?.id,
        displayId: order?.display_id,
        externalId: order?.external_id,
        state: order?.state,
        status: order?.status,
        storeId: order?.store?.id,
        createdAt: order?.created_time,
        scheduledOrderStartTime: order?.scheduled_order_target_delivery_time_range?.start_time,
        scheduledOrderEndTime: order?.scheduled_order_target_delivery_time_range?.end_time,
      },
    }
  },

  toListStoreOrdersActionOutput(response: uberApi.GetOrders200): ListOrderActionOutput {
    return {
      orders:
        response.data?.map((item) => {
          const order = item.order
          return {
            id: order?.id,
            displayId: order?.display_id,
            externalId: order?.external_id,
            state: order?.state,
            status: order?.status,
            storeId: order?.store?.id,
            createdAt: order?.created_time,
            scheduledOrderStartTime: order?.scheduled_order_target_delivery_time_range?.start_time,
            scheduledOrderEndTime: order?.scheduled_order_target_delivery_time_range?.end_time,
          }
        }) ?? [],
      nextToken: response.pagination_data?.next_page_token,
    }
  },
}
