import type { Customer } from 'src/misc/custom-types'
import { listCustomersInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { StripeClient } from '../stripe-api/stripe-client'

export const listCustomers: IntegrationProps['actions']['listCustomers'] = async ({ ctx, client, logger, input }) => {
  const validatedInput = listCustomersInputSchema.parse(input)
  const stripeClient = await StripeClient.createFromStates({ client, ctx, logger })
  let response
  try {
    const customers = await stripeClient.listAllCustomerBasic(validatedInput.email || undefined)

    const customerByEmails: Record<string, Customer[]> = {}

    for (const customer of customers) {
      const emailKey = customer.email || 'null_email'
      if (customerByEmails[emailKey]) {
        customerByEmails[emailKey]?.push(customer)
      } else {
        customerByEmails[emailKey] = [customer]
      }
    }

    response = {
      customers: customerByEmails,
    }
    logger.forBot().info('Successful - List Customers')
  } catch (error) {
    response = {}
    logger.forBot().debug(`'List Customers' exception ${JSON.stringify(error)}`)
  }

  return response
}
