import TurndownService from 'turndown'
import { isElementOfType } from '../common'

const languageRegExp = /language-(\w+)/

// The "turndown-plugin-gfm" package did not support parsing code blocks with language classes.
export const codeBlockWithLanguage = (turndownService: TurndownService) => {
  turndownService.addRule('codeBlockWithLanguage', {
    filter: (node: HTMLElement): boolean => {
      const firstChild = node.firstElementChild
      return isElementOfType(node, 'pre') && firstChild !== null && isElementOfType(firstChild, 'code')
    },
    replacement(_: string, node: HTMLElement, options: TurndownService.Options) {
      const className = node.className ?? ''
      const language = className.match(languageRegExp)?.[1] ?? ''
      return options.fence + language + '\n' + node.textContent + '\n' + options.fence
    },
  })
}
