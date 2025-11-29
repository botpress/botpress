import TurndownService from 'turndown'

export const stripUnderline = (turndownService: TurndownService) => {
  turndownService.addRule('underline', {
    filter: ['u'],
    replacement(content) {
      return content
    },
  })
}
