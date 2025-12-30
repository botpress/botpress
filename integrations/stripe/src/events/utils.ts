import Stripe from 'stripe'
import * as bp from '.botpress'

export const isCustomerObject = (obj: any): obj is Stripe.Customer => {
  return obj && typeof obj === 'object' && 'id' in obj && typeof obj.id === 'string'
}

export const isDeletedCustomerObject = (obj: any): obj is Stripe.DeletedCustomer => {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    typeof obj.id === 'string' &&
    'deleted' in obj &&
    obj.deleted === true
  )
}

export const getOrCreateUserFromCustomer = async (
  client: bp.Client,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) => {
  if (isCustomerObject(customer)) {
    return await client.getOrCreateUser({ tags: { id: customer.id } })
  } else if (isDeletedCustomerObject(customer)) {
    return await client.getOrCreateUser({ tags: { id: customer.id } })
  } else if (typeof customer === 'string') {
    return await client.getOrCreateUser({ tags: { id: customer } })
  } else {
    return
  }
}
