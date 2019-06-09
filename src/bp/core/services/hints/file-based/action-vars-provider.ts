import { FileBasedHintProvider, Hint } from '..'

const REGEXES = [
  /event.state.(temp|session|user|bot).([A-Z0-9_]+?) =/gi, //
  /(temp|session|user|bot).([A-Z0-9_]+?) =/gi //
]

export default class ActionVariablesProvider implements FileBasedHintProvider {
  readonly filePattern = ['bots/*/actions/**/*.js', 'global/actions/**/*.js']
  readonly readFile = true

  indexFile(filePath: string, content: string): Hint[] {
    const hints: Hint[] = []

    for (const regex of REGEXES) {
      let matches: RegExpExecArray | null
      do {
        matches = regex.exec(content)
        if (matches) {
          hints.push({
            category: 'ACTION',
            description: 'Variable action, found in ' + filePath,
            name: `event.state.${matches[1]}.${matches[2]}`,
            partial: false,
            scope: 'inputs'
          })
        }
      } while (matches)
    }

    return hints
  }
}
