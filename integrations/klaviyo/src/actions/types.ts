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
