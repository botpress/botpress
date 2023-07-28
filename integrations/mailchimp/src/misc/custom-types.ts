import type {
  Config,
  lists,
  ErrorResponse,
  HttpMethod,
  Link,
} from '@mailchimp/mailchimp_marketing'

export interface Operation {
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

export interface BatchResponse {
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

export interface MailchimpClient {
  setConfig: (config: Config) => void
  lists: {
    addListMember: typeof lists.addListMember
    getListMember: typeof lists.getListMember
  }
  campaigns?: {
    get: (campaignId: string) => Promise<{ recipients: { list_id: string } }>
  }
  batches?: {
    start: (batch: { operations: Operation[] }) => Promise<BatchResponse>
  }
}

// export interface MailchimpClient {
//   setConfig: (config: Config) => void
//   lists: {
//     addListMember: typeof lists.addListMember
//     getListMember: typeof lists.getListMember
//   }
//   campaigns?: {
//     get: (campaignId: string) => Promise<{ recipients: { list_id: string } }>
//   }
// }

export interface Customer {
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
