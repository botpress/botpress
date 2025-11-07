import { parseMarkdown, MarkdownHandlers, stripAllHandlers } from '@botpress/common'
import { Code, Delete, Emphasis, InlineCode, Strong } from 'mdast'
import { TwilioChannel } from './types'

const messengerHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  code: (node, _visit) => `\`\`\`\n${(node as Code).value}\n\`\`\`\n`,
  delete: (node, visit) => `~${visit(node as Delete)}~`,
  emphasis: (node, visit) => `_${visit(node as Emphasis)}_`,
  inlineCode: (node, _visit) => `\`${(node as InlineCode).value}\``,
  strong: (node, visit) => `*${visit(node as Strong)}*`,
}

const whatsappHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  code: (node, _visit) => `\`\`\`${(node as Code).value}\`\`\`\n`,
  delete: (node, visit) => `~${visit(node as Delete)}~`,
  emphasis: (node, visit) => `_${visit(node as Emphasis)}_`,
  inlineCode: (node, _visit) => `\`${(node as InlineCode).value}\``,
  strong: (node, visit) => `*${visit(node as Strong)}*`,
}

const markdownHandlersByChannelType: Map<TwilioChannel, MarkdownHandlers> = new Map([
  ['rcs', stripAllHandlers],
  ['sms/mms', stripAllHandlers],
  ['messenger', messengerHandlers],
  ['whatsapp', whatsappHandlers],
])

export function parseMarkdownForTwilio(text: string, channel: TwilioChannel) {
  return parseMarkdown(text, markdownHandlersByChannelType.get(channel))
}
