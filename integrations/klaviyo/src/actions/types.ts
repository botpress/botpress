export type ProfileAttributes = {
  email?: string
  phone_number?: string
  first_name?: string
  last_name?: string
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
