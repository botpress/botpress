import { mapValues } from 'radash'
import { z } from 'zod'

import { SchemaDefinition, schemaDefinitionToJsonSchema } from './schema'

const nonEmptyDict = <V extends z.ZodTypeAny>(v: V) => {
  const r = z.record(v)
  return {
    min: (n: number) =>
      r.refine((obj) => Object.keys(obj).length >= n, { message: `At least ${n} item(s) must be defined` }),
  }
}

export const schemaSchema = z.object({}).passthrough()

export const configurationDefinitionSchema = z.object({
  schema: schemaSchema,
})

export const eventDefinitionSchema = z.object({
  schema: schemaSchema,
})

export const actionDefinitionSchema = z.object({
  input: z.object({
    schema: schemaSchema,
  }),
  output: z.object({
    schema: schemaSchema,
  }),
})

export const messageDefinitionSchema = z.object({
  schema: schemaSchema,
})

export const tagsDefinitionSchema = z.object({
  conversations: z.array(z.string()).optional(),
  users: z.array(z.string()).optional(),
  messages: z.array(z.string()).optional(),
})

export const channelDefinitionSchema = z.object({
  tags: tagsDefinitionSchema.omit({ users: true }).optional(),
  messages: nonEmptyDict(messageDefinitionSchema).min(1),
  conversation: z
    .object({
      creation: z.object({
        enabled: z.boolean(),
        requiredTags: z.array(z.string()),
      }),
    })
    .optional(),
})

export const stateDefinitionSchema = z.object({
  type: z.union([z.literal('integration'), z.literal('conversation'), z.literal('user')]),
  schema: schemaSchema,
})

export const integrationDefinitionSchema = z.object({
  name: z.string(),
  version: z.string(),
  public: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  readme: z.string().optional(),
  tags: tagsDefinitionSchema.pick({ users: true }).optional(),
  configuration: configurationDefinitionSchema.optional(),
  events: z.record(eventDefinitionSchema).optional(),
  actions: z.record(actionDefinitionSchema).optional(),
  channels: z.record(channelDefinitionSchema).optional(),
  states: z.record(stateDefinitionSchema).optional(),
  user: z
    .object({
      creation: z.object({
        enabled: z.boolean(),
        requiredTags: z.array(z.string()),
      }),
    })
    .optional(),
  secrets: z.array(z.string()).optional(),
})

export type ConfigurationDefinition = z.infer<typeof configurationDefinitionSchema>
export type EventDefinition = z.infer<typeof eventDefinitionSchema>
export type TagDefinition = z.infer<typeof tagsDefinitionSchema>
export type ChannelDefinition = z.infer<typeof channelDefinitionSchema>
export type ActionDefinition = z.infer<typeof actionDefinitionSchema>
export type MessageDefinition = z.infer<typeof messageDefinitionSchema>
export type StateDefinition = z.infer<typeof stateDefinitionSchema>

type IntegrationDefinitionInput = z.input<typeof integrationDefinitionSchema>
type IntegrationDefinitionOutput = z.infer<typeof integrationDefinitionSchema>

type AnyZodObject = z.ZodObject<any>
type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
type Cast<T, U> = T extends U ? T : U

type BaseConfig = AnyZodObject
type BaseEvent = Record<string, AnyZodObject>
type BaseAction = Record<string, Record<'input' | 'output', AnyZodObject>>
type BaseChannel = Record<string, Record<string, AnyZodObject>>
type BaseState = Record<string, AnyZodObject>

const PUBLIC_VERSION = '0.2.0' as const
const PRIVATE_VERSION = '0.0.1' as const

// TODO: allow any versions
type IntegrationDefinitionVersion =
  | {
      public: true
      /** Only version 0.2.0 is supported for public integrations yet. This is temporary. */
      version: typeof PUBLIC_VERSION
    }
  | {
      public: false
      /** Only version 0.0.1 is supported for private integrations yet. This is temporary. */
      version: typeof PRIVATE_VERSION
    }

export type IntegrationDefinitionProps<
  TConfig extends BaseConfig,
  TEvent extends BaseEvent,
  TAction extends BaseAction,
  TChannel extends BaseChannel,
  TState extends BaseState
> = Omit<
  IntegrationDefinitionOutput,
  'public' | 'version' | 'configuration' | 'events' | 'actions' | 'channels' | 'states'
> &
  IntegrationDefinitionVersion & {
    configuration?: Merge<ConfigurationDefinition, SchemaDefinition<TConfig>>
    events?: { [K in keyof TEvent]: Merge<EventDefinition, SchemaDefinition<TEvent[K]>> }

    /**
     * TODO:
     * - remove the need to cast
     * - the type inference breaks when using keys "input" and "output" instead of keyof TAction[K]
     */
    actions?: {
      [K in keyof TAction]: Merge<
        ActionDefinition,
        {
          [L in keyof TAction[K]]: SchemaDefinition<Cast<TAction[K][L], AnyZodObject>>
        }
      >
    }

    channels?: {
      [K in keyof TChannel]: Merge<
        ChannelDefinition,
        {
          messages: {
            [L in keyof TChannel[K]]: Merge<MessageDefinition, SchemaDefinition<TChannel[K][L]>>
          }
        }
      >
    }

    states?: {
      [K in keyof TState]: Merge<StateDefinition, SchemaDefinition<TState[K]>>
    }
  }

function formatIntegrationDefinition(
  definition: IntegrationDefinitionProps<BaseConfig, BaseEvent, BaseAction, BaseChannel, BaseState>
): IntegrationDefinitionInput {
  return {
    ...definition,
    configuration: definition.configuration
      ? {
          ...definition.configuration,
          schema: schemaDefinitionToJsonSchema(definition.configuration),
        }
      : undefined,
    events: definition.events
      ? mapValues(definition.events, (event) => ({
          ...event,
          schema: schemaDefinitionToJsonSchema(event),
        }))
      : undefined,
    actions: definition.actions
      ? mapValues(definition.actions, (action) => ({
          ...action,
          input: {
            ...action.input,
            schema: schemaDefinitionToJsonSchema(action.input),
          },
          output: {
            ...action.output,
            schema: schemaDefinitionToJsonSchema(action.output),
          },
        }))
      : undefined,
    channels: definition.channels
      ? mapValues(definition.channels, (channel) => ({
          ...channel,
          messages: mapValues(channel.messages, (message) => ({
            ...message,
            schema: schemaDefinitionToJsonSchema(message),
          })),
        }))
      : undefined,
    states: definition.states
      ? mapValues(definition.states, (state) => ({
          ...state,
          schema: schemaDefinitionToJsonSchema(state),
        }))
      : undefined,
    user: definition.user,
  }
}

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
  TEvent extends BaseEvent = BaseEvent,
  TAction extends BaseAction = BaseAction,
  TChannel extends BaseChannel = BaseChannel,
  TState extends BaseState = BaseState
> {
  public readonly name: IntegrationDefinitionOutput['name']
  public readonly version: IntegrationDefinitionOutput['version']
  public readonly icon: IntegrationDefinitionOutput['icon']
  public readonly readme: IntegrationDefinitionOutput['readme']
  public readonly title: IntegrationDefinitionOutput['title']
  public readonly description: IntegrationDefinitionOutput['description']
  public readonly tags: IntegrationDefinitionOutput['tags']
  public readonly configuration: IntegrationDefinitionOutput['configuration']
  public readonly events: IntegrationDefinitionOutput['events']
  public readonly actions: IntegrationDefinitionOutput['actions']
  public readonly channels: IntegrationDefinitionOutput['channels']
  public readonly states: IntegrationDefinitionOutput['states']
  public readonly user: IntegrationDefinitionOutput['user']
  public readonly public: IntegrationDefinitionOutput['public']
  public readonly secrets: IntegrationDefinitionOutput['secrets']
  public constructor(props: IntegrationDefinitionProps<TConfig, TEvent, TAction, TChannel, TState>) {
    const integrationDefinitionInput = formatIntegrationDefinition(props)
    const parsed = integrationDefinitionSchema.parse(integrationDefinitionInput)

    if (parsed.public && parsed.version !== PUBLIC_VERSION) {
      throw new Error(`Public integrations must have version ${PUBLIC_VERSION}`)
    }
    if (!parsed.public && parsed.version !== PRIVATE_VERSION) {
      throw new Error(`Private integrations must have version ${PRIVATE_VERSION}`)
    }

    const {
      name,
      version,
      icon,
      readme,
      title,
      description,
      tags,
      configuration,
      events,
      actions,
      channels,
      states,
      user,
      public: isPublic,
      secrets,
    } = parsed
    this.name = name
    this.version = version
    this.icon = icon
    this.readme = readme
    this.title = title
    this.description = description
    this.tags = tags
    this.configuration = configuration
    this.events = events
    this.actions = actions
    this.channels = channels
    this.states = states
    this.user = user
    this.public = isPublic
    this.secrets = secrets
  }
}
