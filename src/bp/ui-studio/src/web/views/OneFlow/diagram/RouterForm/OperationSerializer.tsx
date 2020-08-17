import { Operation, OperationArgs } from './Operation'

export class OperationSerializer {
  serialize(operation: Operation): string {
    const argExpressions: any = {}
    for (const [key, value] of Object.entries(operation.args)) {
      argExpressions[key] = `$${operation.variable}.parseForOperator('${value}')`
    }

    let argsJsonText = JSON.stringify(argExpressions)
    argsJsonText = argsJsonText.replace(/"/g, '')

    return `$${operation.variable}.${operation.operator}(${argsJsonText})`
  }
}
