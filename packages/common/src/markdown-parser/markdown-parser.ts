import {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  Paragraph,
  Strong,
  Table,
  Text,
} from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { handleList, handleTable } from './handlers'
import { visitTree } from './tree-visitor'
import { MarkdownHandlers } from './types'

export const stripAllHandlers: MarkdownHandlers = {
  blockquote: (node, visit) => `Quote: “${visit(node as Blockquote)}”\n`,
  break: (_node, _visit) => '\n',
  code: (node, _visit) => `${(node as Code).value}\n`,
  delete: (node, visit) => `${visit(node as Delete)}`,
  emphasis: (node, visit) => visit(node as Emphasis),
  footnoteDefinition: (node, visit) =>
    `[${(node as FootnoteDefinition).identifier}] ${visit(node as FootnoteDefinition)}\n`,
  footnoteReference: (node, _visit) => `[${(node as FootnoteReference).identifier}]`,
  heading: (node, visit) => `${visit(node as Heading)}\n`,
  html: (_node, _visit) => '',
  image: (node, _visit) => (node as Image).url,
  inlineCode: (node, _visit) => (node as InlineCode).value,
  link: (node, _visit) => (node as Link).url,
  list: (node, _visit, parents, handlers) => handleList(node as List, handlers, parents),
  paragraph: (node, visit, parents) => `${visit(node as Paragraph)}${parents.at(-1)?.type === 'root' ? '\n' : ''}`,
  strong: (node, visit) => visit(node as Strong),
  table: (node, _visit, parents, handlers) => handleTable(node as Table, handlers, parents),
  text: (node, _visit) => (node as Text).value,
  thematicBreak: (_node, _visit) => '---\n',
}

export const parseMarkdown = (markdown: string, handlers: MarkdownHandlers = stripAllHandlers): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  return visitTree(tree, handlers, [])
}
