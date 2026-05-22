export type ErrMessage = string | { message?: string }
export const errToObj = (message?: ErrMessage) => (typeof message === 'string' ? { message } : message || {})
export const toString = (message?: ErrMessage): string | undefined =>
  typeof message === 'string' ? message : message?.message

export const prependPathSegment = (e: Error, segment: string): void => {
  e.message = e.message.startsWith('#') ? '#' + segment + e.message.slice(1) : `#${segment} : ${e.message}`
}
