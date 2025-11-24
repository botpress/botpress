import { transformMarkdown, MarkdownHandlers, stripAllHandlers } from '@botpress/common'
import { TwilioChannel } from './types'

const messengerHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  code: (node, _visit) => `\`\`\`\n${node.value}\n\`\`\`\n`,
  delete: (node, visit) => `~${visit(node)}~`,
  emphasis: (node, visit) => `_${visit(node)}_`,
  inlineCode: (node, _visit) => `\`${node.value}\``,
  strong: (node, visit) => `*${visit(node)}*`,
}

const whatsappHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  code: (node, _visit) => `\`\`\`${node.value}\`\`\`\n`,
  delete: (node, visit) => `~${visit(node)}~`,
  emphasis: (node, visit) => `_${visit(node)}_`,
  inlineCode: (node, _visit) => `\`${node.value}\``,
  strong: (node, visit) => `*${visit(node)}*`,
}

const markdownHandlersByChannelType: Map<TwilioChannel, MarkdownHandlers> = new Map([
  ['rcs', stripAllHandlers],
  ['sms/mms', stripAllHandlers],
  ['messenger', messengerHandlers],
  ['whatsapp', whatsappHandlers],
])

export function transformMarkdownForTwilio(text: string, channel: TwilioChannel) {
  return transformMarkdown(text, markdownHandlersByChannelType.get(channel))
}
