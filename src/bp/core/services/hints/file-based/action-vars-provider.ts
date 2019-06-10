import { FileBasedHintProvider, Hint } from '..'

const REGEXES = [
  /event.state.(temp|session|user|bot).([A-Z0-9_]+?) =/gi, //
  /(temp|session|user|bot).([A-Z0-9_]+?) =/gi //
]

// We ignore automatically generated files from modules
// So we just index files created by the users
const IGNORE_CONTENT_PATTERN = /\/\/CHECKSUM:/i

export default class ActionVariablesProvider implements FileBasedHintProvider {
  readonly filePattern = ['bots/*/actions/**/*.js', 'global/actions/**/*.js']
  readonly readFile = true

  indexFile(filePath: string, content: string): Hint[] {
    if (IGNORE_CONTENT_PATTERN.test(content)) {
      return []
    }

    const hints: Hint[] = []

    for (const regex of REGEXES) {
      let matches: RegExpExecArray | null
      do {
        matches = regex.exec(content)
        if (matches && matches[2].length >= 3) {
          hints.push({
            category: 'VARIABLES',
            description: '',
            source: 'Extracted from action files',
            location: 'File: ' + filePath,
            parentObject: 'event.state',
            name: `${matches[1]}.${matches[2]}`,
            partial: false,
            scope: 'inputs'
          })
        }
      } while (matches)
    }

    return hints
  }
}
