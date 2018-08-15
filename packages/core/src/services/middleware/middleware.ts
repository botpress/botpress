import _ from 'lodash'

export const MiddlewareManager = () => {
  const stack: Function[] = []

  const use = (fn: Function) => {
    stack.unshift(fn)
  }

  const run = (args: any[], done: Function) => {
    let index = stack.length

    const next = (error?) => {
      if (!index) {
        done(error)
        return
      }

      const fn = stack[--index]
      fn(args)
      next()
    }
    next()
  }

  return { use, run }
}
