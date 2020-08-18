import { Operation, OperationArgs } from './Operation'

export class OperationSerializer {
  serialize(operation: Operation): string {
    let args: string = '{'
    let isFirst = true
    for (const [key, value] of Object.entries(operation.args)) {
      let expr: string = ''
      if (typeof value === 'string' && /^\$[a-zA-Z][a-zA-Z0-9_-]*$/g.test(value)) {
        expr = `${value}.value`
      } else {
        expr = `$${operation.variable}.parseForOperator('${value?.replace(/'/gs, "\\'")}')`
      }

      args = `${args}${isFirst ? '' : ','}${key}:${expr}`
      isFirst = false
    }
    args = `${args}}`

    return `$${operation.variable}.${operation.operator}(${args})`
  }
}
