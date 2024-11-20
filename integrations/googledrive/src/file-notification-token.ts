import { z } from '@botpress/sdk'
import { fileTypesUnionSchema } from './schemas'

const tokenSchema = z.object({
  fileId: z.string().min(1),
  fileType: fileTypesUnionSchema,
  signature: z.string().min(1),
})
export type Token = z.infer<typeof tokenSchema>
export type TokenInfos = Omit<Token, 'signature'>

export const serializeToken = (tokenInfos: TokenInfos, _secret: string) => {
  return JSON.stringify({
    ...tokenInfos,
    signature: 'signature', // TODO: Sign file ID
  })
}

export const deserializeToken = (serializedToken: string, _secret: string): Token | undefined => {
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
  // TODO: Verify signature
  return tokenParseResult.data
}
