import { AnyZodObject } from '../../type-utils'

export type BaseConfig = AnyZodObject
export type BaseConfigs = Record<string, BaseConfig>
export type BaseEvents = Record<string, AnyZodObject>
export type BaseActions = Record<string, AnyZodObject>
export type BaseMessages = Record<string, AnyZodObject>
export type BaseChannels = Record<string, BaseMessages>
export type BaseStates = Record<string, AnyZodObject>
export type BaseEntities = Record<string, AnyZodObject>
