import * as bp from '.botpress'

type SecretName = keyof typeof bp.secrets
const getSecret = (name: SecretName) => {
  const value = bp.secrets[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

export const clientId = getSecret('CLIENT_ID')
export const clientSecret = getSecret('CLIENT_SECRET')
export const webhookSigningSecret = getSecret('WEBHOOK_SIGNING_SECRET')
