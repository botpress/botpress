import * as sdk from '@botpress/sdk'
import _ from 'lodash'
import * as utils from '../utils'

type InterfaceInstance = NonNullable<sdk.IntegrationDefinition['interfaces']>[number]
type ResolvedInterface = {
  actions: Record<string, sdk.ActionDefinition>
  events: Record<string, sdk.EventDefinition>
  channels: Record<string, sdk.ChannelDefinition>
}
type InterfaceImplStatement = {
  id?: string
  name: string
  version: string
  entities: Record<string, { name: string }>
  actions: Record<string, { name: string }>
  events: Record<string, { name: string }>
  channels: Record<string, { name: string }>
}

export const resolveInterfaces = <I extends sdk.IntegrationDefinition | sdk.IntegrationPackage['definition']>(
  integration: I
): I => {
  const self = integration as utils.types.Writable<I>
  if (!self.interfaces) {
    return integration
  }

  for (const intrface of Object.values(self.interfaces)) {
    const { resolved } = _resolveInterface(intrface)

    /**
     * If an action is defined both in the integration and the interface; we merge both.
     * This allows setting more specific properties in the integration, while staying compatible with the interface.
     * Same goes for channels and events.
     */

    self.actions = utils.records.mergeRecords(self.actions ?? {}, resolved.actions, _mergeActions)
    self.channels = utils.records.mergeRecords(self.channels ?? {}, resolved.channels, _mergeChannels)
    self.events = utils.records.mergeRecords(self.events ?? {}, resolved.events, _mergeEvents)
  }

  return self
}

export const getImplementationStatements = (
  integration: sdk.IntegrationDefinition
): Record<string, InterfaceImplStatement> => {
  const self = integration as utils.types.Writable<sdk.IntegrationDefinition>
  if (!self.props.interfaces) {
    return {}
  }

  const statements: Record<string, InterfaceImplStatement> = {}
  for (const [interfaceKey, intrface] of Object.entries(self.props.interfaces)) {
    const { statement } = _resolveInterface(intrface)
    statements[interfaceKey] = statement
  }

  return statements
}

const _mergeActions = (a: sdk.ActionDefinition, b: sdk.ActionDefinition): sdk.ActionDefinition => {
  return {
    ...a,
    ...b,
    input: {
      schema: a.input.schema.merge(b.input.schema),
    },
    output: {
      schema: a.output.schema.merge(b.output.schema),
    },
  }
}

const _mergeEvents = (a: sdk.EventDefinition, b: sdk.EventDefinition): sdk.EventDefinition => {
  return {
    ...a,
    ...b,
    schema: a.schema.merge(b.schema),
  }
}

const _mergeChannels = (a: sdk.ChannelDefinition, b: sdk.ChannelDefinition): sdk.ChannelDefinition => {
  const messages = utils.records.mergeRecords(a.messages, b.messages, _mergeMessage)
  return {
    ...a,
    ...b,
    messages,
  }
}

const _mergeMessage = (a: sdk.MessageDefinition, b: sdk.MessageDefinition): sdk.MessageDefinition => {
  return {
    schema: a.schema.merge(b.schema),
  }
}

const _resolveInterface = (
  intrface: InterfaceInstance
): { resolved: ResolvedInterface; statement: InterfaceImplStatement } => {
  const id = 'id' in intrface ? intrface.id : undefined
  const {
    definition: { name, version },
  } = intrface

  const resolved: ResolvedInterface = { actions: {}, events: {}, channels: {} }
  const statement: InterfaceImplStatement = {
    id,
    name,
    version,
    entities: _.mapValues(intrface.entities, (entity) => ({ name: entity.name })), // { item: { name: 'issue' } },
    actions: {},
    events: {},
    channels: {},
  }

  const entitySchemas = _.mapValues(intrface.entities, (entity) => entity.schema)

  // dereference actions
  for (const [actionName, action] of Object.entries(intrface.definition.actions ?? {})) {
    const resolvedInputSchema = action.input.schema.dereference(entitySchemas) as sdk.z.AnyZodObject
    const resolvedOutputSchema = action.output.schema.dereference(entitySchemas) as sdk.z.AnyZodObject

    const newActionName = _rename(intrface, actionName)
    resolved.actions[newActionName] = {
      ...action,
      input: { schema: resolvedInputSchema },
      output: { schema: resolvedOutputSchema },
    }
    statement.actions[actionName] = { name: newActionName }
  }

  // dereference events
  for (const [eventName, event] of Object.entries(intrface.definition.events ?? {})) {
    const resolvedEventSchema = event.schema.dereference(entitySchemas) as sdk.z.AnyZodObject
    const newEventName = _rename(intrface, eventName)
    resolved.events[newEventName] = { ...event, schema: resolvedEventSchema }
    statement.events[eventName] = { name: newEventName }
  }

  // dereference channels
  for (const [channelName, channel] of Object.entries(intrface.definition.channels ?? {})) {
    const messages: Record<string, { schema: sdk.z.AnyZodObject }> = {}
    for (const [messageName, message] of Object.entries(channel.messages)) {
      const resolvedMessageSchema = message.schema.dereference(entitySchemas) as sdk.z.AnyZodObject
      // no renaming for messages as they are already contained within a channel that acts as a namespace
      messages[messageName] = { ...message, schema: resolvedMessageSchema }
    }
    const newChannelName = _rename(intrface, channelName)
    resolved.channels[newChannelName] = { ...channel, messages }
    statement.channels[channelName] = { name: newChannelName }
  }

  return { resolved, statement }
}

const _rename = (intrface: InterfaceInstance, name: string) => {
  if (!intrface.definition.templateName) {
    return name
  }
  const { entities } = intrface
  const templateProps = _.mapValues(entities, (entity) => entity.name)
  return utils.template.formatHandleBars(intrface.definition.templateName, { ...templateProps, name })
}
