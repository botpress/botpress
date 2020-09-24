import { FlowView } from 'common/typings'

import { FileBasedHintProvider, Hint } from '..'

const USER_VARIABLE_REGEX = [
  /event.state.(temp|session|user|bot).([A-Z0-9_]+?)\s?=/gi,
  /(temp|session|user|bot).([A-Z0-9_]+?)\s?=/gi
]

const MIN_VARIABLE_LENGTH = 3

export default class ActionFlowVariablesProvider implements FileBasedHintProvider {
  readonly filePattern = ['bots/*/flows/**/*.flow.json']
  readonly readFile = true

  indexFile(filePath: string, content: string): Hint[] {
    return this.extractUserDefinedVariables(content, filePath)
  }

  private extractUserDefinedVariables(content: string, filePath: string) {
    const hints: Hint[] = []

    try {
      const flow: FlowView = JSON.parse(content)
      const nodes = flow.nodes.filter(x => x.type === 'execute' && x.execute && x.execute.code)

      nodes.forEach(node => {
        for (const regex of USER_VARIABLE_REGEX) {
          let matches: RegExpExecArray | null
          do {
            matches = regex.exec(node.execute!.code)
            if (matches && matches[2].length >= MIN_VARIABLE_LENGTH) {
              hints.push({
                category: 'VARIABLES',
                description: '',
                source: 'Extracted from execute node',
                location: 'File: ' + filePath,
                parentObject: 'event.state',
                name: `${matches[1]}.${matches[2]}`,
                partial: false,
                scope: 'inputs'
              })
            }
          } while (matches)
        }
      })
    } catch (err) {
      return []
    }

    return hints
  }
}
