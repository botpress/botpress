import type { z } from '@botpress/sdk'
import { bambooHrEmployeeWebhookEvent } from 'definitions'
import { handleOauthRequest } from './api/auth'
import { validateBambooHrSignature } from './api/signing'
import { parseRequestWithErrors } from './api/utils'
import { handleEmployeeCreatedEvent, handleEmployeeDeletedEvent, handleEmployeeUpdatedEvent } from './events'
import * as bp from '.botpress'

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

export const handler = async (props: bp.HandlerProps) => {
  const { req, logger } = props
  if (_isOauthRequest(props)) {
    try {
      await handleOauthRequest(props)
    } catch (err) {
      logger.forBot().error('Error in OAuth creation flow: ' + (err as Error).message)
      return { status: 500, body: 'Error handling OAuth creation flow' }
    }
    return { status: 200 }
  }

  try {
    await validateBambooHrSignature(props)
  } catch (err) {
    logger.forBot().error('Error validating HMAC signature: ' + (err as Error).message)
    return { status: 401, body: 'Invalid HMAC signature' }
  }

  let event: z.output<typeof bambooHrEmployeeWebhookEvent>
  try {
    event = await parseRequestWithErrors(req, bambooHrEmployeeWebhookEvent)
  } catch (err) {
    logger.forBot().error('Error parsing request body: ' + (err as Error).message)
    return { status: 400, body: 'Invalid request body' }
  }

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
