import * as sdk from '@botpress/sdk'

const URL_VERIFICATION_SCHEMA = sdk.z.object({
  type: sdk.z.literal('url_verification'),
  challenge: sdk.z.string(),
})

export const isUrlVerificationRequest = (data: unknown): data is sdk.z.infer<typeof URL_VERIFICATION_SCHEMA> =>
  URL_VERIFICATION_SCHEMA.safeParse(data).success

export const handleUrlVerificationRequest = (data: sdk.z.infer<typeof URL_VERIFICATION_SCHEMA>) => ({
  body: JSON.stringify({ challenge: data.challenge }),
})
