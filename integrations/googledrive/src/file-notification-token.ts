import { z } from '@botpress/sdk'
import * as jwt from 'jsonwebtoken'
import { fileTypesUnionSchema } from './schemas'

const tokenSchema = z.object({
  fileId: z.string().min(1),
  fileType: fileTypesUnionSchema,
})
export type Token = z.infer<typeof tokenSchema>

export const serializeToken = (token: Token, secret: string): string => {
  return jwt.sign(token, secret, {
    noTimestamp: true,
  })
}

export const deserializeToken = (serializedToken: string, secret: string): Token | undefined => {
  let object: any
  try {
    object = jwt.verify(serializedToken, secret)
  } catch {
    return undefined
  }
  const tokenParseResult = tokenSchema.safeParse(object)
  if (!tokenParseResult.success) {
    return undefined
  }
  return tokenParseResult.data
}
