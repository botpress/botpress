export type ProfileAttributes = {
  email?: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  organization?: string
  title?: string
  locale?: string
  location?: Location
  properties?: Record<string, string | number | boolean>
}

export type Location = {
  address1?: string
  address2?: string
  city?: string
  country?: string
  region?: string
  zip?: string
}

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
