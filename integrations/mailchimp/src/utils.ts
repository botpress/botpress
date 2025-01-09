import { ZodError, RuntimeError } from '@botpress/sdk'
import { MailchimpApi } from './client'
import { Customer, MailchimpAPIError } from './misc/custom-types'
import { Logger } from './misc/types'
import * as bp from '.botpress'

export const getMailchimpClient = (config: bp.configuration.Configuration, logger?: Logger) =>
  new MailchimpApi(config.apiKey, config.serverPrefix, logger)

export const getValidCustomer = (validatedInput: Customer) => ({
  email: validatedInput.email,
  firstName: validatedInput.firstName,
  lastName: validatedInput.lastName,
  company: validatedInput.company,
  birthday: validatedInput.birthday,
  language: validatedInput.language,
  address1: validatedInput.address1,
  address2: validatedInput.address2,
  city: validatedInput.city,
  state: validatedInput.state,
  zip: validatedInput.zip,
  country: validatedInput.country,
  phone: validatedInput.phone,
})

export const isMailchimpError = (error: any): error is MailchimpAPIError => {
  return 'status' in error && 'response' in error && 'body' in error.response
}

export const isZodError = (error: any): error is ZodError => {
  return error && typeof error === 'object' && error instanceof ZodError && 'errors' in error
}

export const parseError = (error: any): RuntimeError => {
  if (isMailchimpError(error)) {
    return new RuntimeError(
      `Mailchimp API errored with ${error.response.body.status} status code: ${error.response.body.detail}`,
      {
        name: error.response.body.title,
        message: error.response.body.detail,
      }
    )
  }
  if (isZodError(error)) {
    return new RuntimeError(`Output does not conform to expected schema: ${error.message}`, error)
  }
  return new RuntimeError(`Unexpected error: ${error.message}`, error)
}
