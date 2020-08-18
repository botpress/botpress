import { Operation } from './Operation'

export class OperationParser {
  parse(expression: string): Operation {
    return {
      variable: this.parseVariable(expression),
      operator: this.parseOperator(expression),
      args: this.parseArgs(expression),
      negate: expression.startsWith('!')
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

  parseArgs(expression: string): { [key: string]: any } {
    // Matches ({ something : something })
    //         X-------------------------X
    let argsSection = expression.match(/\(.*\)/gs)[0]
    argsSection = argsSection.substr(1, argsSection.length - 2)

    const statementsStart = argsSection.indexOf('{')
    const statementsEnd = argsSection.lastIndexOf('}')
    const statementsSection = argsSection.substring(statementsStart + 1, statementsEnd)

    // Matches { something: something, something: something }
    //           ---------  ---------  ---------  ---------
    const statements = []
    let startIndex = 0
    let inString = false
    let escaping = false

    const pushStatement = (i: number) => {
      if (i - startIndex > 0) {
        statements.push(statementsSection.substr(startIndex, i - startIndex).trim())
      }
      startIndex = i + 1
    }

    for (let i = 0; i < statementsSection.length; i++) {
      const c = statementsSection[i]
      if (c === "'" && !escaping) {
        inString = !inString
      } else if (!inString && (c === ',' || c === ':')) {
        pushStatement(i)
      }
      escaping = c === '\\'
    }
    pushStatement(statementsSection.length)

    for (const statement of statements) {
      let escaped = JSON.stringify([statement])
      escaped = escaped.substr(2, escaped.length - 4)
      argsSection = argsSection.replace(statement, `"${escaped}"`)
    }

    const args = JSON.parse(argsSection) as { [key: string]: any }

    for (let [key, value] of Object.entries(args)) {
      // Matches operator('val')
      //                  X---X
      const harcodedMatch = value.match(/'.*'/gs)?.[0]
      if (harcodedMatch) {
        value = harcodedMatch.substr(1, harcodedMatch.length - 2).replace(/\\'/gs, "'")
      } else {
        // Matches $something
        //         ----------
        value = value.match(/\$[a-zA-Z][a-zA-Z0-9_-]*/g)[0]
      }

      args[key] = value
    }

    return args
  }
}
