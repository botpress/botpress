import { bambooHrEmployeeWebhookEvent } from 'definitions'
import { validateBambooHrSignature } from './api/signing'
import { safeParseJson } from './api/utils'
import { BambooHRRuntimeError } from './error-handling'
import { handleEmployeeCreatedEvent, handleEmployeeDeletedEvent, handleEmployeeUpdatedEvent } from './events'
import { handler as oauthHandler } from './handlers/oauth'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path.startsWith('/oauth')

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req, logger } = props
  if (_isOauthRequest(props)) {
    return await oauthHandler(props).catch((thrown) => {
      const err = BambooHRRuntimeError.from(thrown, 'Error in OAuth creation flow')
      logger.forBot().error(err.message)
      return { status: 500, body: err.message }
    })
  }

  const { state } = await props.client.getState({
    name: 'webhook',
    type: 'integration',
    id: props.ctx.integrationId,
  })
  const privateKey = state.payload.privateKey
  if (!privateKey) {
    logger.forBot().error('No private key found for webhook state.')
    return
  }

  const signingResult = await validateBambooHrSignature(props.req, privateKey)
  if (!signingResult.success) {
    logger.forBot().error('HMAC signature validation failed: ' + signingResult.reason)
    return
  }

  const jsonParseResult = safeParseJson(req.body ?? '')
  if (!jsonParseResult.success) {
    logger.forBot().error('Error parsing request body: ' + jsonParseResult.error)
    return
  }

  const zodParseResult = bambooHrEmployeeWebhookEvent.safeParse(jsonParseResult.data)
  if (!zodParseResult.success) {
    logger.forBot().error('Error parsing request body: ' + zodParseResult.error.message)
    return
  }

  const event = zodParseResult.data

  await Promise.all(
    event.employees.map(async (employee) => {
      const { action, id, timestamp } = employee
      logger.forBot().info(`Sending employee ${action.toLowerCase()} event for ID ${id} at ${timestamp}`)

      switch (action) {
        case 'Created':
          await handleEmployeeCreatedEvent(props, employee)
          break
        case 'Deleted':
          await handleEmployeeDeletedEvent(props, employee)
          break
        case 'Updated':
          await handleEmployeeUpdatedEvent(props, employee)
          break
        default:
          logger.forBot().warn(`Unknown action type: ${action}`)
      }
    })
  )

  return { status: 200 }
}
