type Product = {
  name: string
  prices: Array<{
    unit_amount: number | null
    currency: string
    recurring?: object | null
  }>
}

type Address = {
  city: string | null
  country: string | null
  line1: string | null
  line2: string | null
  postal_code: string | null
  state: string | null
}

type Customer = {
  id: string
  email: string | null
  name?: string | null
  description: string | null
  phone?: string | null
  address?: Address | null
  created: number
  delinquent?: boolean | null
}

export { Product, Customer }
