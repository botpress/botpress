import { Operation, OperationArgs } from './Operation'

export class OperationParser {
  parse(expression: string): Operation {
    return {
      variable: this.parseVariable(expression),
      operator: this.parseOperator(expression),
      args: this.parseArgs(expression)
    }
  }

  parseVariable(expression: string): string {
    // Matches $something
    //         X---------
    const match = expression.match(/\$[a-zA-Z][a-zA-Z0-9_-]*/g)[0]
    return match.replace('$', '')
  }

  parseOperator(expression: string): string {
    // Matches .something(
    //         X---------X
    const match = expression.match(/\.[a-zA-Z][a-zA-Z0-9_-]*\(/g)[0]
    return match.replace('.', '').replace('(', '')
  }

  parseArgs(expression: string): OperationArgs {
    // Matches ({ something : something })
    //         X-------------------------X
    let argsSection = expression.match(/\(.*\)/g)[0]
    argsSection = argsSection.substr(1, argsSection.length - 2)

    // Matches { something: something, something: something }
    //           ---------  ---------  ---------  ---------
    const statementMatches = argsSection.match(/[^:{}, ]+/g) || []
    for (const statement of statementMatches) {
      // Puts " around statements to allow JSON parsing
      argsSection = argsSection.replace(statement, `"${statement}"`)
    }

    const args = JSON.parse(argsSection) as OperationArgs

    for (let [key, value] of Object.entries(args)) {
      // Matches operator('val')
      //                  X---X
      value = (value as string).match(/'.+'/g)[0]
      value = value.substr(1, value.length - 2)

      args[key] = value
    }

    return args
  }
}
