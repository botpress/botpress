import { z } from '@botpress/sdk'
import { fileTypesUnionSchema } from './schemas'

const tokenSchema = z.object({
  fileId: z.string().min(1),
  fileType: fileTypesUnionSchema,
})
export type Token = z.infer<typeof tokenSchema>

export const serializeToken = (token: Token) => {
  return JSON.stringify(token)
}

export const deserializeToken = (serializedToken: string): Token | undefined => {
  let parsedObject: any
  try {
    parsedObject = JSON.parse(serializedToken)
  } catch (err) {
    return undefined
  }
  const tokenParseResult = tokenSchema.safeParse(parsedObject)
  if (!tokenParseResult.success) {
    return undefined
  }
  return tokenParseResult.data
}
