import {
  HttpMethod,
  Link,
  Config,
  lists,
} from '@mailchimp/mailchimp_marketing'

import z from 'zod'

import { addCustomerFullOutputSchema, getAllListsOutputSchema } from './custom-schemas'

export type Operation = {
  method: HttpMethod
  path: string
  params?: object
  body?: string
  operation_id?: string
}

export type BatchStatus =
  | 'pending'
  | 'preprocessing'
  | 'started'
  | 'finalizing'
  | 'finished'

export type BatchResponse = {
  id: string
  status: BatchStatus
  total_operations: number
  finished_operations: number
  errored_operations: number
  submitted_at: string
  completed_at: string
  response_body_url: string
  _links: Link[]
}

export type MailchimpClient = {
  setConfig: (config: Config) => void // eslint-disable-line no-unused-vars
  lists: {
    getAllLists: typeof lists.getAllLists
    addListMember: typeof lists.addListMember
    getListMember: typeof lists.getListMember
  }
  campaigns?: {
    get: (campaignId: string) => Promise<{ recipients: { list_id: string } }> // eslint-disable-line no-unused-vars
  }
  batches?: {
    start: (batch: { operations: Operation[] }) => Promise<BatchResponse> // eslint-disable-line no-unused-vars
  }
}

export type AddCustomerFullOutputType = z.infer<
  typeof addCustomerFullOutputSchema
>

export type GetAllListsOutputType = z.infer<typeof getAllListsOutputSchema>

export type Customer = {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  birthday?: string
  language?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
}
