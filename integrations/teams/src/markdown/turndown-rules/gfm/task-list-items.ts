import TurndownService from 'turndown'
import { isElementOfType } from '../common'

export const taskListItems = (turndownService: TurndownService) => {
  turndownService.addRule('taskListItems', {
    filter(node: HTMLElement): boolean {
      return isElementOfType(node, 'input') && node.type === 'checkbox' && node.parentNode?.nodeName === 'LI'
    },
    replacement(_content: string, node: HTMLElement) {
      if (!isElementOfType(node, 'input')) {
        return ''
      }

      return `${node.checked ? '[x]' : '[ ]'} `
    },
  })
}
