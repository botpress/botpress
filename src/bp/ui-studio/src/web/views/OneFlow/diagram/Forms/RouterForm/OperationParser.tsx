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

  parseArgs(expression: string): string[] {
    // Matches (something, something)
    //         X--------------------X
    let argsSection = expression.match(/\(.*\)/gs)[0]
    argsSection = argsSection.substr(1, argsSection.length - 2)

    // Matches something, something, something
    //         ---------  ---------  ---------
    const args = []
    let startIndex = 0
    let inString = false
    let escaping = false

    const pushArg = (i: number) => {
      if (i - startIndex > 0) {
        args.push(argsSection.substr(startIndex, i - startIndex).trim())
      }
      startIndex = i + 1
    }

    for (let i = 0; i < argsSection.length; i++) {
      const c = argsSection[i]
      if (c === "'" && !escaping) {
        inString = !inString
      } else if (!inString && c === ',') {
        pushArg(i)
      }
      escaping = c === '\\'
    }
    pushArg(argsSection.length)

    for (let i = 0; i < args.length; i++) {
      let arg = args[i]
      // Matches 'val'
      //         X---X
      const harcodedMatch = arg.match(/'.*'/gs)?.[0]
      if (harcodedMatch) {
        arg = harcodedMatch.substr(1, harcodedMatch.length - 2).replace(/\\'/gs, "'")
      } else {
        // Matches $something
        //         ----------
        arg = arg.match(/\$[a-zA-Z][a-zA-Z0-9_-]*/g)[0]
      }

      args[i] = arg
    }

    return args
  }
}
