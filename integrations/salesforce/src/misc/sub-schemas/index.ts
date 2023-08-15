import z from 'zod'

const ErrorSchema = z
  .object({
    statusCode: z.string(),
    message: z.string(),
    fields: z.array(z.string()),
  })
  .optional()

export { ErrorSchema }
