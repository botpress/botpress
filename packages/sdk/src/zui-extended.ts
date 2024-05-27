import { z as zui, UI, variableType } from './zui'

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

export const variable = (type?: zui.infer<typeof variableType>, opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'variable', params: { type: type || 'any', ...opts } })

export const conversation = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'conversation', params: { ...opts } })

export const user = (opts?: { horizontal?: boolean }) => zui.string().displayAs<UI>({ id: 'user', params: { ...opts } })

export const message = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'message', params: { ...opts } })

export const agent = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'agent', params: { ...opts } })

export const event = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'event', params: { ...opts } })

export const table = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'table', params: { ...opts } })

export const tablerow = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'tablerow', params: { ...opts } })

export const intent = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'intent', params: { ...opts } })

export const aimodel = () => zui.enum(AI_MODELS)

export const datasource = (opts?: { horizontal?: boolean }) =>
  zui.string().displayAs<UI>({ id: 'datasource', params: { ...opts } })

export const extensions = {
  variable,
  conversation,
  user,
  message,
  agent,
  event,
  table,
  tablerow,
  intent,
  aimodel,
  datasource,
}

declare module '@bpinternal/zui' {
  export namespace z {
    function variable(type?: zui.infer<typeof variableType>, opts?: { horizontal?: boolean }): zui.ZodString
    function conversation(opts?: { horizontal?: boolean }): zui.ZodString
    function user(opts?: { horizontal?: boolean }): zui.ZodString
    function message(opts?: { horizontal?: boolean }): zui.ZodString
    function agent(opts?: { horizontal?: boolean }): zui.ZodString
    function event(opts?: { horizontal?: boolean }): zui.ZodString
    function table(opts?: { horizontal?: boolean }): zui.ZodString
    function tablerow(opts?: { horizontal?: boolean }): zui.ZodString
    function intent(opts?: { horizontal?: boolean }): zui.ZodString
    function aimodel(): ReturnType<typeof extensions.aimodel>
    function datasource(opts?: { horizontal?: boolean }): zui.ZodString
  }
}


export * from './zui'
