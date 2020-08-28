import { Operation } from './Operation'

export const serializeOperation = (operation: Operation): string => {
  let args: string = ``
  let isFirst = true

  for (const arg of operation.args) {
    let expr: string = ''
    const value = arg || ''

    if (/^\$[a-zA-Z][a-zA-Z0-9_-]*$/g.test(value)) {
      expr = `${value}.value`
    } else {
      const escapedValue = value?.replace(/'/gs, "\\'") || ''
      expr = `$${operation.variable}.parse('${escapedValue}')`
    }

    args = `${args}${isFirst ? '' : ', '}${expr}`
    isFirst = false
  }

  return `${operation.negate ? '!' : ''}$${operation.variable}.${operation.operator}(${args})`
}
