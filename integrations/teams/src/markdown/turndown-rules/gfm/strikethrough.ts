import TurndownService from 'turndown'

export const strikethrough = (turndownService: TurndownService) => {
  turndownService.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement(content) {
      return `~~${content}~~`
    },
  })
}
