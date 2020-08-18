import { Operation, OperationArgs } from './Operation'

export class OperationSerializer {
  serialize(operation: Operation): string {
    let args: string = `{`
    let isFirst = true

    for (const [key, value] of Object.entries(operation.args)) {
      let expr: string = ''
      const strValue = `${value}`

      if (/^\$[a-zA-Z][a-zA-Z0-9_-]*$/g.test(strValue)) {
        expr = `${strValue}.value`
      } else {
        const escapedValue = strValue?.replace(/'/gs, "\\'") || ''
        expr = `$${operation.variable}.parseForOperator('${escapedValue}')`
      }

      args = `${args}${isFirst ? '' : ','}${key}:${expr}`
      isFirst = false
    }

    args = `${args}}`

    return `${operation.negate ? '!' : ''}$${operation.variable}.${operation.operator}(${args})`
  }
}
