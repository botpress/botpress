import { Response } from '../../../serve'
import { proxyWorkflows, wrapWorkflowInstance } from '../../workflow-proxy'
import { SUCCESS_RESPONSE } from '../responses'
import * as types from '../types'
import { bridgeUpdateTypeToSnakeCase } from './update-type-conv'

const WORKFLOW_UPDATE_TYPES = [
  'child_workflow_deleted',
  'child_workflow_finished',
  'workflow_timedout',
  'workflow_started',
  'workflow_continued',
] as const

export const handleWorkflowUpdateEvent = async (
  props: types.ServerProps,
  event: types.WorkflowUpdateEvent
): Promise<Response> => {
  if (props.ctx.type !== 'workflow_update' || !WORKFLOW_UPDATE_TYPES.includes(event.payload.type)) {
    throw new Error('Unexpected event type')
  }

  if (!event.payload.workflow.name) {
    props.logger
      .withWorkflowId(event.payload.workflow.id)
      .warn(
        'Received workflow update event without a workflow name. Assuming this workflow was not defined by the bot.',
        event.payload.workflow
      )
    return SUCCESS_RESPONSE
  }

  switch (event.payload.type) {
    case 'child_workflow_deleted':
    case 'child_workflow_finished':
      props.logger
        .withWorkflowId(event.payload.workflow.id)
        .info(`Received child workflow event "${event.payload.type}", but child workflows are not yet supported`)
      break
    case 'workflow_timedout':
    case 'workflow_started':
    case 'workflow_continued':
      return await _handleWorkflowUpdate(props, event)
    default:
      event.payload.type satisfies never
  }

  return SUCCESS_RESPONSE
}

const _handleWorkflowUpdate = async (props: types.ServerProps, event: types.WorkflowUpdateEvent): Promise<Response> => {
  const updateType = bridgeUpdateTypeToSnakeCase(event.payload.type)
  const handlers = props.self.workflowHandlers[updateType]?.[event.payload.workflow.name]

  if (!handlers || handlers.length === 0) {
    props.logger
      .withWorkflowId(event.payload.workflow.id)
      .warn(`No ${updateType} handler found for workflow "${event.payload.workflow.name}"`)
    return SUCCESS_RESPONSE
  }

  await _acknowledgeWorkflowStart(props, event)
  await _dispatchToHandlers(props, event)

  return SUCCESS_RESPONSE
}

const _acknowledgeWorkflowStart = async (props: types.ServerProps, event: types.WorkflowUpdateEvent): Promise<void> => {
  if (event.payload.workflow.status !== 'pending') {
    return
  }

  // Acknowledge start of workflow processing:
  await props.client.updateWorkflow({ id: event.payload.workflow.id, status: 'in_progress', eventId: event.id })
}

const _dispatchToHandlers = async (props: types.ServerProps, event: types.WorkflowUpdateEvent): Promise<void> => {
  const updateType = bridgeUpdateTypeToSnakeCase(event.payload.type)
  const handlers = props.self.workflowHandlers[updateType]?.[event.payload.workflow.name]

  for (const handler of handlers!) {
    await handler({
      ...props,
      conversation: event.payload.conversation,
      user: event.payload.user,
      workflow: wrapWorkflowInstance({ ...props, workflow: event.payload.workflow }),
      workflows: proxyWorkflows(props.client),
    })
  }
}
