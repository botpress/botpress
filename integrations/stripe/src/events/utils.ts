import Stripe from 'stripe'
import * as bp from '.botpress'

const NO_USER_ID = 'no user'
type Customer = string | Stripe.Customer | Stripe.DeletedCustomer | null

const isCustomerObject = (obj: unknown): obj is Stripe.Customer => {
  return obj !== null && typeof obj === 'object' && 'id' in obj && typeof obj.id === 'string'
}

const isDeletedCustomerObject = (obj: unknown): obj is Stripe.DeletedCustomer => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    typeof obj.id === 'string' &&
    'deleted' in obj &&
    obj.deleted === true
  )
}

const getOrCreateUserFromCustomer = async (client: bp.Client, customer: Customer) => {
  if (isDeletedCustomerObject(customer)) {
    return await client.getOrCreateUser({ tags: { id: customer.id } })
  } else if (isCustomerObject(customer)) {
    return await client.getOrCreateUser({ tags: { id: customer.id } })
  } else if (typeof customer === 'string') {
    return await client.getOrCreateUser({ tags: { id: customer } })
  } else {
    return
  }
}

export const getUserIdFromCustomer = async (client: bp.Client, customer: Customer): Promise<string> => {
  const userResponse = await getOrCreateUserFromCustomer(client, customer)
  return userResponse?.user.id ?? NO_USER_ID
}
