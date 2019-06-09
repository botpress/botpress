import { FileBasedHintProvider, Hint } from '..'

export default class NLUProvider implements FileBasedHintProvider {
  readonly filePattern = 'bots/*/intents/*.json'
  readonly readFile = true

  indexFile(filePath: string, content: string): Hint[] {
    return []
  }
}
