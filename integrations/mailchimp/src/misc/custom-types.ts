import { z } from '@botpress/sdk'
import { HttpMethod, Link, Config, lists, ErrorResponse } from '@mailchimp/mailchimp_marketing'

import {
  addCustomerFullOutputSchema,
  getAllCampaignsInputSchema,
  getAllCampaignsOutputSchema,
  getAllListsInputSchema,
  getAllListsOutputSchema,
} from './custom-schemas'

export type Operation = {
  method: HttpMethod
  path: string
  params?: object
  body?: string
  operation_id?: string
}

export type BatchStatus = 'pending' | 'preprocessing' | 'started' | 'finalizing' | 'finished'
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
  setConfig: (config: Config) => void
  lists: {
    getAllLists: typeof lists.getAllLists
    addListMember: typeof lists.addListMember
    getListMember: typeof lists.getListMember
  }
  campaigns?: {
    get: (campaignId: string) => Promise<{ recipients: { list_id: string } }>
    list: (input: { count?: number }) => Promise<any>
  }

  batches?: {
    start: (batch: { operations: Operation[] }) => Promise<BatchResponse>
  }
}

export type addCustomerFullOutputType = z.infer<typeof addCustomerFullOutputSchema>

export type getAllListsInputType = z.infer<typeof getAllListsInputSchema>
export type getAllListsOutputType = z.infer<typeof getAllListsOutputSchema>

export type getAllCampaignsInputType = z.infer<typeof getAllCampaignsInputSchema>
export type getAllCampaignsOutputType = z.infer<typeof getAllCampaignsOutputSchema>

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
export type MailchimpAPIError = {
  status: number
  response: HTTPResponse<ErrorResponse>
}

type HTTPResponse<T> = {
  request: any
  req: any
  text: string
  body: T
  headers: Record<string, string>
  status: number
  clientError: boolean
  serverError: boolean
  accepted: boolean
  noContent: boolean
  badRequest: boolean
  unauthorized: boolean
  notAcceptable: boolean
  forbidden: boolean
  notFound: boolean
  type: string
  charset: string
  links: Record<string, string>
}
