export type KlaviyoError = {
  id: string
  code: string
  title: string
  detail: string
  source: {
    pointer: string
    parameter: string
  }
}

export type KlaviyoApiError = {
  errors: KlaviyoError[]
}

export type ProfileSubscriptions = {
  email?: {
    marketing: {
      consent: 'SUBSCRIBED'
      consented_at?: string
    }
  }
  sms?: {
    marketing: {
      consent: 'SUBSCRIBED'
      consented_at?: string
    }
  }
}

export type GetProfilesOptions = {
  filter?: string
  pageSize?: number
  sort?:
    | 'created'
    | '-created'
    | 'email'
    | '-email'
    | 'id'
    | '-id'
    | 'subscriptions.email.marketing.list_suppressions.timestamp'
    | '-subscriptions.email.marketing.list_suppressions.timestamp'
    | 'subscriptions.email.marketing.suppression.timestamp'
    | '-subscriptions.email.marketing.suppression.timestamp'
    | 'updated'
    | '-updated'
}
