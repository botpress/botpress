import z from 'zod'

const partialCustomer = z
  .object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable().optional(),
    description: z.string().nullable(),
    phone: z.string().nullable().optional(),
    address: z.object({}).passthrough().nullable().optional(),
    created: z.number(),
    delinquent: z.boolean().nullable().optional(),
  })
  .passthrough()

export { partialCustomer }
