import { FileBasedHintProvider, Hint } from '../hints-service'

const USER_VARIABLE_REGEX = [
  /event.state.(temp|session|user|bot).([A-Z0-9_]+?)\s?=/gi,
  /(temp|session|user|bot).([A-Z0-9_]+?)\s?=/gi
]

const MIN_VARIABLE_LENGTH = 3

// We ignore automatically generated files from modules
// So we just index files created by the users
const COPIED_FILE_REGEX = /\/\/CHECKSUM:/i

export default class ActionVariablesProvider implements FileBasedHintProvider {
  readonly filePattern = ['bots/*/actions/**/*.js', 'global/actions/**/*.js']
  readonly readFile = true

  indexFile(filePath: string, content: string): Hint[] {
    return this.extractUserDefinedVariables(content, filePath)
  }

  private extractUserDefinedVariables(content: string, filePath: string) {
    if (COPIED_FILE_REGEX.test(content)) {
      return []
    }

    const hints: Hint[] = []
    for (const regex of USER_VARIABLE_REGEX) {
      let matches: RegExpExecArray | null
      do {
        matches = regex.exec(content)
        if (matches && matches[2].length >= MIN_VARIABLE_LENGTH) {
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
