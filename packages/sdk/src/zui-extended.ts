import { z, UI, variableType } from './zui'

export const variable = (type: z.infer<typeof variableType> = 'any', opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'variable', params: { type, ...opts } });

export const conversation = (opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'conversation', params: { ...opts } });

export const user = (opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'user', params: { ...opts } });

export const message = (opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'message', params: { ...opts } });

export const agent = (opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'agent', params: { ...opts } });

export const event = (opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'event', params: { ...opts } });

export const table = (opts?: { horizontal?: boolean }) =>
    z.string().displayAs<UI>({ id: 'table', params: { ...opts } });

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
