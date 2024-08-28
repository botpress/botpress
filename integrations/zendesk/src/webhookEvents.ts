export type ZendeskEventType = 'zen:event-type:article.published' | 'zen:event-type:article.unpublished'

export type ZendeskEvent = {
  account_id: number
  detail: {
    brand_id: string
    id: string
  }
  event: Record<string, any>
  id: string
  subject: string
  time: string
  type: ZendeskEventType
  zendesk_event_version: string
}
