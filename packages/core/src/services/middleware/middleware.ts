/**
 * @property {string} type - The type of the event, i.e. image, text, timeout, etc
 * @property {string} channel - The channel of communication, i.e web, messenger, twillio
 * @property {string} target - The target of the event for a specific plateform, i.e
 */
export type BotpressEvent = {
  type: string
  channel: string
  target: string
  direction: string
  text?: string
  raw?: string
}

export default () => {
  const stack: Function[] = []

  const use = (...fns: Function[]) => {
    let index = fns.length
    while (index--) {
      const fn = fns[index]
      if (Array.isArray(fn)) return use(...fn)
      stack.unshift(fn)
    }
  }

  const run = (args: any[], done: Function) => {
    let index = stack.length

    const next = (error?, fin?) => {
      if (error || fin || !index) {
        if ('function' === typeof done) done(error)
        return
      }
      stack[--index].apply(undefined, [...args, next])
    }
    next()
  }
  return { use, run }
}
