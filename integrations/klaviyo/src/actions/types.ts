export type ProfileAttributes = {
  email?: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  organization?: string
  title?: string
  locale?: string
  location?: Location
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
