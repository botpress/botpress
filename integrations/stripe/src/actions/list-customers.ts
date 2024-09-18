import type { Customer } from 'src/misc/custom-types'
import { getClient } from '../client'
import { listCustomersInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'

export const listCustomers: IntegrationProps['actions']['listCustomers'] = async ({ ctx, logger, input }) => {
  const validatedInput = listCustomersInputSchema.parse(input)
  const StripeClient = getClient(ctx.configuration)
  let response
  try {
    const customers = await StripeClient.listAllCustomerBasic(validatedInput.email || undefined)

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
