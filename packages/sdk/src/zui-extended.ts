import { z, UI, variableType } from './zui'

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

export const variable = (type: z.infer<typeof variableType> = 'any', opts?: { horizontal?: boolean }) =>
  z.string().displayAs<UI>({ id: 'variable', params: { type, ...opts } })

export const conversation = (opts?: { horizontal?: boolean }) =>
  z.string().displayAs<UI>({ id: 'conversation', params: { ...opts } })

export const user = (opts?: { horizontal?: boolean }) => z.string().displayAs<UI>({ id: 'user', params: { ...opts } })

export const message = (opts?: { horizontal?: boolean }) =>
  z.string().displayAs<UI>({ id: 'message', params: { ...opts } })

export const agent = (opts?: { horizontal?: boolean }) => z.string().displayAs<UI>({ id: 'agent', params: { ...opts } })

export const event = (opts?: { horizontal?: boolean }) => z.string().displayAs<UI>({ id: 'event', params: { ...opts } })

export const table = (opts?: { horizontal?: boolean }) => z.string().displayAs<UI>({ id: 'table', params: { ...opts } })

export const tablerow = (opts?: { horizontal?: boolean }) =>
  z.string().displayAs<UI>({ id: 'tablerow', params: { ...opts } })

export const intent = (opts?: { horizontal?: boolean }) =>
  z.string().displayAs<UI>({ id: 'intent', params: { ...opts } })

export const aimodel = () => z.enum(AI_MODELS)

export const datasource = (opts?: { horizontal?: boolean }) =>
  z.string().displayAs<UI>({ id: 'datasource', params: { ...opts } })

const extendedZ = Object.assign(z, {
  variable,
  conversation,
  user,
  message,
  agent,
  event,
  table,
})

export * from './zui'
export { extendedZ as z }
