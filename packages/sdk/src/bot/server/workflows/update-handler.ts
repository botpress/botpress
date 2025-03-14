import * as client from '@botpress/client'
import { log } from '../../../log'
import { retryConfig } from '../../../retry'
import { Request, Response, parseBody } from '../../../serve'
import * as utils from '../../../utils'
import { BotLogger } from '../../bot-logger'
import { BotSpecificClient } from '../../client'
import * as common from '../../common'
import { extractContext } from './../context'
import * as types from '../types'
import { SUCCESS_RESPONSE } from '../responses'

const WORKFLOW_UPDATE_TYPES = [
  'child_workflow_deleted',
  'child_workflow_finished',
  'workflow_timedout',
  'workflow_started',
  'workflow_continued',
] as const

export const handleWorkflowUpdateEvent = async (
  props: types.ServerProps,
  payload: types.WorkflowUpdateEventPayload
): Promise<Response> => {
  if (props.ctx.type !== 'workflow_update' || !WORKFLOW_UPDATE_TYPES.includes(payload.type)) {
    throw new Error('Unexpected event type')
  }

  if (!payload.workflow.name) {
    props.logger
      .withWorkflowId(payload.workflow.id)
      .warn(
        'Received workflow update event without a workflow name. Assuming this workflow was not defined by the bot.',
        payload.workflow
      )
    return SUCCESS_RESPONSE
  }

  switch (payload.type) {
    case 'child_workflow_deleted':
    case 'child_workflow_finished':
      props.logger
        .withWorkflowId(payload.workflow.id)
        .info(`Received child workflow event "${payload.type}", but child workflows are not yet supported`)
      break
    case 'workflow_timedout':
    case 'workflow_started':
    case 'workflow_continued':
      return await _handleWorkflowUpdate(props, payload)
    default:
      payload.type satisfies never
  }

  return SUCCESS_RESPONSE
}

const _handleWorkflowUpdate = async (
  props: types.ServerProps,
  payload: types.WorkflowUpdateEventPayload
): Promise<Response> => {
  const handlers = props.self.workflowHandlers[payload.type]?.[payload.workflow.name]

  if (!handlers || handlers.length === 0) {
    props.logger
      .withWorkflowId(payload.workflow.id)
      .warn(`No ${payload.type} handler found for workflow "${payload.workflow.name}"`)
    return SUCCESS_RESPONSE
  }

  for (const handler of handlers) {
    await handler({ ...props, rawEventPayload: payload })
  }

  return SUCCESS_RESPONSE
}
