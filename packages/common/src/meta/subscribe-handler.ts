import { IntegrationProps } from '@botpress/sdk'

type IntegrationHandler = IntegrationProps['handler']
type IntegrationHandlerProps = Pick<Parameters<IntegrationHandler>[0], 'req'>

const handler = async (props: IntegrationHandlerProps & { verifyToken: string }) => {
  const { req } = props

  const queryParams = new URLSearchParams(req.query)
  const mode = queryParams.get('hub.mode')
  if (mode !== 'subscribe') {
    return { status: 400, body: "Mode should be set to 'subscribe'" }
  }

  const token = queryParams.get('hub.verify_token')
  const challenge = queryParams.get('hub.challenge')
  if (!token || !challenge) {
    return { status: 400, body: 'Missing required query parameters' }
  }

  if (token !== props.verifyToken) {
    return { status: 403, body: 'Invalid verify token' }
  }

  return {
    status: 200,
    body: challenge,
  }
}

export default handler
