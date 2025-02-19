import * as definition from 'plugin.definition'
import * as bp from '.botpress'

const DEFAULT_HITL_HANDOFF_MESSAGE = definition.DEFAULT_HITL_HANDOFF_MESSAGE
const DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE = definition.DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE
const DEFAULT_HITL_STOPPED_MESSAGE = definition.DEFAULT_HITL_STOPPED_MESSAGE
const DEFAULT_USER_HITL_CANCELLED_MESSAGE = definition.DEFAULT_USER_HITL_CANCELLED_MESSAGE
const DEFAULT_INCOMPATIBLE_MSG_TYPE_MESSAGE = definition.DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE

type AnyHandlerProps =
  | bp.MessageHandlerProps
  | bp.EventHandlerProps
  | bp.ActionHandlerProps
  | bp.HookHandlerProps['before_incoming_message']

export const hitlHandoffMessage = (props: AnyHandlerProps): string => {
  return props.render(props.configuration.onHitlHandoffMessage ?? DEFAULT_HITL_HANDOFF_MESSAGE)
}
export const humanAgentAssignedMessage = (props: AnyHandlerProps): string => {
  return props.render(props.configuration.onHumanAgentAssignedMessage ?? DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE)
}
export const hitlStoppedMessage = (props: AnyHandlerProps): string => {
  return props.render(props.configuration.onHitlStoppedMessage ?? DEFAULT_HITL_STOPPED_MESSAGE)
}
export const userHitlCancelledMessage = (props: AnyHandlerProps): string => {
  return props.render(props.configuration.onUserHitlCancelledMessage ?? DEFAULT_USER_HITL_CANCELLED_MESSAGE)
}
export const incompatibleMsgTypeMessage = (props: AnyHandlerProps): string => {
  return props.render(props.configuration.onIncompatibleMsgTypeMessage ?? DEFAULT_INCOMPATIBLE_MSG_TYPE_MESSAGE)
}
