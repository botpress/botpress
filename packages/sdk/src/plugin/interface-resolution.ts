import { PluginInterfaceExtensions } from './types'

export type ParsedActionRef = {
  namespace: string // interface or integration name
  actionName: string
}

export type ParsedEventRef = {
  namespace: string // interface or integration name
  eventName: string
}

const NAMESPACE_SEPARATOR = ':'

export const parseActionRef = (actionRef: string): ParsedActionRef | null => {
  const [namespace, method] = actionRef.split(NAMESPACE_SEPARATOR)
  if (!namespace || !method) {
    return null
  }
  return { namespace, actionName: method }
}

export const parseEventRef = (eventRef: string): ParsedEventRef | null => {
  const [namespace, event] = eventRef.split(NAMESPACE_SEPARATOR)
  if (!namespace || !event) {
    return null
  }
  return { namespace, eventName: event }
}

export const formatActionRef = (actionRef: ParsedActionRef): string => {
  return `${actionRef.namespace}${NAMESPACE_SEPARATOR}${actionRef.actionName}`
}

export const formatEventRef = (eventRef: ParsedEventRef): string => {
  return `${eventRef.namespace}${NAMESPACE_SEPARATOR}${eventRef.eventName}`
}

export const resolveAction = (
  actionRef: ParsedActionRef,
  interfaces: PluginInterfaceExtensions<any>
): ParsedActionRef => {
  const interfaceExtension = interfaces[actionRef.namespace] ?? {
    name: actionRef.namespace,
    version: '0.0.0',
    entities: {},
    actions: {},
    events: {},
    channels: {},
  }
  const namespace = interfaceExtension.name
  const actionName = interfaceExtension.actions[actionRef.actionName]?.name ?? actionRef.actionName
  return { namespace, actionName }
}

export const resolveEvent = (eventRef: ParsedEventRef, interfaces: PluginInterfaceExtensions<any>): ParsedEventRef => {
  const interfaceExtension = interfaces[eventRef.namespace] ?? {
    name: eventRef.namespace,
    version: '0.0.0',
    entities: {},
    actions: {},
    events: {},
    channels: {},
  }
  const namespace = interfaceExtension.name
  const eventName = interfaceExtension.events[eventRef.eventName]?.name ?? eventRef.eventName
  return { namespace, eventName }
}
