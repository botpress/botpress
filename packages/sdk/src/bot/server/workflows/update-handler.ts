import { Response } from '../../../serve'
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
  rawProps: types.ServerProps,
  event: types.WorkflowUpdateEvent
): Promise<Response> => {
  if (rawProps.ctx.type !== 'workflow_update' || !WORKFLOW_UPDATE_TYPES.includes(event.payload.type)) {
    throw new Error('Unexpected event type')
  }

  const props = { ...rawProps, logger: _attachWorkflowContextToLogger(rawProps, event) }

  if (!event.payload.workflow.name) {
    props.logger.warn(
      'Received workflow update event without a workflow name. Assuming this workflow was not defined by the bot.',
      event.payload.workflow
    )
    return SUCCESS_RESPONSE
  }

  switch (event.payload.type) {
    case 'child_workflow_deleted':
    case 'child_workflow_finished':
      props.logger.info(
        `Received child workflow event "${event.payload.type}", but child workflows are not yet supported`
      )
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

const _attachWorkflowContextToLogger = (
  props: types.ServerProps,
  event: types.WorkflowUpdateEvent
): types.ServerProps['logger'] =>
  props.logger.with({
    eventId: event.id,
    workflowId: event.payload.workflow.id,
    conversationId: event.payload.conversation?.id,
    userId: event.payload.user?.id,
  })

const _handleWorkflowUpdate = async (props: types.ServerProps, event: types.WorkflowUpdateEvent): Promise<Response> => {
  const updateType = bridgeUpdateTypeToSnakeCase(event.payload.type)
  const handlers = props.self.workflowHandlers[updateType]?.[event.payload.workflow.name]

  if (!handlers || handlers.length === 0) {
    props.logger.warn(`No ${updateType} handler found for workflow "${event.payload.workflow.name}"`)
    return SUCCESS_RESPONSE
  }

  const { updatedWorkflow } = await _dispatchToHandlers(props, event)

  if (updatedWorkflow.status === 'pending') {
    props.logger.warn(
      `Workflow "${event.payload.workflow.name}" is still in pending status after processing "${updateType}" event. ` +
        'This may indicate that the workflow was not properly acknowledged or terminated by the handler. '
    )
  }

  return SUCCESS_RESPONSE
}

type WorkflowState = types.WorkflowUpdateEventPayload['workflow']

const _dispatchToHandlers = async (
  props: types.ServerProps,
  event: types.WorkflowUpdateEvent
): Promise<{ updatedWorkflow: WorkflowState }> => {
  const updateType = bridgeUpdateTypeToSnakeCase(event.payload.type)
  const handlers = props.self.workflowHandlers[updateType]?.[event.payload.workflow.name]

  let currentWorkflowState: WorkflowState = structuredClone(event.payload.workflow)

  for (const handler of handlers ?? []) {
    currentWorkflowState = await handler({
      ...props,
      event,
      conversation: event.payload.conversation,
      user: event.payload.user,
      workflow: currentWorkflowState,
    })
  }

  return { updatedWorkflow: currentWorkflowState }
}
