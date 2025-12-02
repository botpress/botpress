import type TurndownService from 'turndown'

const highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/

export const highlightedCodeBlock = (turndownService: TurndownService) => {
  turndownService.addRule('highlightedCodeBlock', {
    filter(node: HTMLElement): boolean {
      const firstChild = node.firstChild
      return (
        node.nodeName === 'DIV' &&
        highlightRegExp.test(node.className) &&
        firstChild !== null &&
        firstChild.nodeName === 'PRE'
      )
    },
    replacement(_, node, options) {
      const className = node.className || ''
      const language = (className.match(highlightRegExp) || [null, ''])[1]

      return '\n\n' + options.fence + language + '\n' + node.firstChild?.textContent + '\n' + options.fence + '\n\n'
    },
  })
}
