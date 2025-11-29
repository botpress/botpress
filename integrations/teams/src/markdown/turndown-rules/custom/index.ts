import TurndownService from 'turndown'
import { codeBlockWithLanguage } from './code-block-with-language'
import { stripUnderline } from './underline'

export const customPlugin = (turndownService: TurndownService) => {
  turndownService.use([stripUnderline, codeBlockWithLanguage])
}
