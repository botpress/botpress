import * as bp from '.botpress'

export const isWebhookVerificationRequest = (props: bp.HandlerProps) => {
  const searchParams = new URLSearchParams(props.req.query)

  return props.req.method === 'GET' && searchParams.has('challenge')
}

export const handleWebhookVerificationRequest: bp.IntegrationProps['handler'] = async ({ req }) => {
  const searchParams = new URLSearchParams(req.query)
  const challenge = searchParams.get('challenge')

  if (!challenge) {
    return
  }

  return {
    headers: { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' },
    status: 200,
    body: challenge,
  }
}
