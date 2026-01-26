import { transformMarkdown, MarkdownHandlers, stripAllHandlers } from '@botpress/common'

/** 'En space' yields better results for indentation */
const FIXED_SIZE_SPACE_CHAR = '\u2002'

/**
 * Slack mrkdwn format handlers
 * @see https://docs.slack.dev/messaging/formatting-message-text/
 */
const slackHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  emphasis: (node, visit) => `_${visit(node)}_`,
  delete: (node, visit) => `~${visit(node)}~`,
  strong: (node, visit) => `*${visit(node)}*`,
  break: () => '\n',
  blockquote: (node, visit) => {
    const content = visit(node).trim()
    return (
      content
        .split('\n')
        .map((line) => `>${line}`)
        .join('\n') + '\n'
    )
  },
  inlineCode: (node) => `\`${node.value}\``,
  code: (node) => `\`\`\`\n${node.value}\n\`\`\`\n`,
  list: (node, visit) => {
    return `${node.listLevel !== 1 ? '\n' : ''}${visit(node)}`
  },
  listItem: (node, visit) => {
    const { itemCount, checked, ownerList } = node
    let prefix = FIXED_SIZE_SPACE_CHAR.repeat((ownerList.listLevel - 1) * 2)

    if (checked !== null) {
      prefix += checked ? '☑︎ ' : '☐ '
    } else {
      prefix += ownerList.ordered === true ? `${itemCount}. ` : '- '
    }

    const shouldBreak = ownerList.listLevel === 1 || itemCount < ownerList.children.length
    return `${prefix}${visit(node)}${shouldBreak ? '\n' : ''}`
  },
  link: (node, visit) => {
    const text = visit(node)
    return text ? `<${node.url}|${text}>` : `<${node.url}>`
  },
  paragraph: (node, visit) => `${visit(node)}\n`,
}

export function transformMarkdownForSlack(text: string): string {
  return transformMarkdown(text, slackHandlers)
}
