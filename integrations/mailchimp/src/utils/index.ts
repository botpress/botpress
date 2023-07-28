// import { IntegrationContext } from '@botpress/sdk'
import type { Config } from '../misc/types'

import { MailchimpApi } from '../client'

import { Customer } from '../misc/custom-types'

export const getMailchimpClient = (config: Config) =>
  new MailchimpApi(config.apiKey, config.serverPrefix)

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
