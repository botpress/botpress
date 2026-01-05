import { TypeOf, ZodEnum, ZodString } from './types'

const AI_MODELS = [
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-4',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4-0125-preview',
  'gpt-4-turbo-preview',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-1106',
] as const

const variableType = ZodEnum.create([
  'any',
  'string',
  'number',
  'boolean',
  'object',
  'pattern',
  'date',
  'array',
  'target',
  'time',
  'enum',
])

export const variable = (opts?: { type?: TypeOf<typeof variableType>; params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'variable', params: { type: opts?.type || 'any', ...opts?.params } })

export const conversation = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'conversation', params: { ...opts?.params } })

export const user = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'user', params: { ...opts?.params } })

export const message = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'message', params: { ...opts?.params } })

export const agent = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'agent', params: { ...opts?.params } })

export const event = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'event', params: { ...opts?.params } })

export const table = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'table', params: { ...opts?.params } })

export const tablerow = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'tablerow', params: { ...opts?.params } })

export const intent = (opts?: { params?: { horizontal?: boolean } }) =>
  ZodString.create().displayAs<any>({ id: 'intent', params: { ...opts?.params } })

export const aimodel = () => ZodEnum.create(AI_MODELS).displayAs<any>({ id: 'dropdown', params: {} })

export const datasource = (opts?: { horizontal?: boolean }) =>
  ZodString.create().displayAs<any>({ id: 'datasource', params: { ...opts } })

export const knowledgebase = (opts?: { horizontal?: boolean }) =>
  ZodString.create().displayAs<any>({ id: 'knowledgebase', params: { ...opts } })
