import type { Parent } from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { escapeAndSanitizeHtml, isNaughtyUrl, sanitizeHtml } from './sanitize-utils'
import type {
  DefinedLinkReference,
  DefinitionNodeData,
  MarkdownHandlers,
  NodeHandler,
  TableCellWithHeaderInfo,
} from './types'

export const defaultHandlers: MarkdownHandlers = {
  blockquote: (node, visit) => `<blockquote>\n\n${visit(node)}\n</blockquote>`,
  break: () => '<br />\n',
  code: (node) => `<pre${node.lang ? ` class="language-${node.lang}"` : ''}><code>${node.value}\n</code></pre>`,
  delete: (node, visit) => `<s>${visit(node)}</s>`,
  emphasis: (node, visit) => `<em>${visit(node)}</em>`,
  footnoteDefinition: (node, visit) => `[${node.identifier}] ${visit(node)}\n`,
  footnoteReference: (node) => `[${node.identifier}]`,
  heading: (node, visit) => {
    // This approach of using font-size with bold is more
    // consistent cross-platform than using <h1>, <h2>, <h3>.
    // Also, the h1-h3 don't render correctly on Teams Desktop app.
    const nodeContent = visit(node)
    switch (node.depth) {
      case 1:
        return `<p class="h1"><span style="font-size:1.7em"><b>${nodeContent}</b></span></p>\n`
      case 2:
        return `<p class="h2"><span style="font-size:1.42em"><b>${nodeContent}</b></span></p>\n`
      case 3:
        return `<p class="h3"><span style="font-size:1.13em"><b>${nodeContent}</b></span></p>\n`
      default:
        return `${nodeContent}\n`
    }
  },
  html: (node) => escapeAndSanitizeHtml(node.value),
  image: (node) => _createSanitizedImage(node),
  inlineCode: (node) => `<code>${node.value}</code>`,
  link: (node, visit) => _createSanitizedHyperlink(node, visit(node)),
  linkReference: (node, visit) => {
    const { linkDefinition } = node
    const nodeContent = visit(node)
    if (!linkDefinition) {
      return nodeContent
    }
    return _createSanitizedHyperlink(linkDefinition, nodeContent)
  },
  list: (node, visit) => {
    const tag = node.ordered ? 'ol' : 'ul'
    return `<${tag}>\n${visit(node)}</${tag}>\n`
  },
  listItem: (node, visit) => {
    let checkbox = ''
    const isChecked = node.checked ?? null
    if (isChecked !== null) {
      checkbox = isChecked ? '☑︎ ' : '☐ '
    }

    return `<li>\n${checkbox}${visit(node)}\n</li>\n`
  },
  paragraph: (node, visit, parents) => `${visit(node)}${parents.at(-1)?.type === 'root' ? '\n' : ''}`,
  strong: (node, visit) => `<strong>${visit(node)}</strong>`,
  table: (node, visit) => {
    const headerRow = node.children[0]
    headerRow?.children.forEach((cell: TableCellWithHeaderInfo) => {
      cell.isHeader = true
    })

    return `<table>\n${visit(node)}</table>`
  },
  tableRow: (node, visit) => `<tr>\n${visit(node)}</tr>\n`,
  tableCell: (node, visit) => {
    const tag = node.isHeader === true ? 'th' : 'td'
    return `<${tag}>${visit(node)}</${tag}>\n`
  },
  text: (node) => node.value,
  thematicBreak: () => '<hr />\n',
  definition: (_node) => '',
}

type HyperlinkProps = {
  url: string
  title?: string | null
}

const _createSanitizedHyperlink = (props: HyperlinkProps, content: string): string => {
  const { url, title } = props
  if (isNaughtyUrl('a', url)) {
    return content
  }

  return `<a href="${url}"${title ? ` title="${title}"` : ''}>${content}</a>`
}

type ImageProps = {
  url: string
  alt?: string | null
  title?: string | null
}

const _createSanitizedImage = (props: ImageProps): string => {
  const { url, alt: altText, title } = props
  const optionalAttrs = `${altText ? ` alt="${altText}"` : ''}${title ? ` title="${title}"` : ''}`
  if (isNaughtyUrl('img', url)) {
    return `<img${optionalAttrs} />`
  }

  return `<img src="${url}"${optionalAttrs} />`
}

const _isNodeType = (s: string, handlers: MarkdownHandlers): s is keyof MarkdownHandlers => s in handlers

const _extractDefinitions = (parentNode: Parent): Record<string, DefinitionNodeData> => {
  let definitions: Record<string, DefinitionNodeData> = {}
  for (const node of parentNode.children) {
    if ('children' in node) {
      const extractedDefs = _extractDefinitions(node)

      definitions = { ...definitions, ...extractedDefs }
    }

    if (node.type === 'definition') {
      definitions[node.identifier] = {
        identifier: node.identifier,
        label: node.label,
        url: node.url,
        title: node.title,
      }
    }
  }

  return definitions
}

const _visitTree = (
  tree: Parent,
  handlers: MarkdownHandlers,
  parents: Parent[],
  definitions: Record<string, DefinitionNodeData>
): string => {
  let tmp = ''
  let footnoteTmp = ''
  parents.push(tree)

  for (const node of tree.children) {
    if (!_isNodeType(node.type, handlers)) {
      throw new Error(`The Markdown node type [${node.type}] is not supported`)
    }

    const handler = handlers[node.type] as NodeHandler

    if (node.type === 'linkReference') {
      const linkReferenceNode = node as DefinedLinkReference
      const def = definitions[node.identifier]
      linkReferenceNode.linkDefinition = def

      tmp += handler(
        linkReferenceNode,
        (n) => _visitTree(n, handlers, parents, definitions),
        parents,
        handlers,
        definitions
      )
      continue
    }

    if (node.type === 'footnoteDefinition') {
      footnoteTmp += handler(node, (n) => _visitTree(n, handlers, parents, definitions), parents, handlers, definitions)
      continue
    }
    tmp += handler(node, (n) => _visitTree(n, handlers, parents, definitions), parents, handlers, definitions)
  }
  parents.pop()
  return `${tmp}${footnoteTmp}`
}

export const transformMarkdownToTeamsXml = (markdown: string, handlers: MarkdownHandlers = defaultHandlers): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  const definitions = _extractDefinitions(tree)
  let html = _visitTree(tree, handlers, [], definitions).trim()
  _replacers.forEach((replacer) => {
    html = replacer(html)
  })
  return sanitizeHtml(html)
}

// ==== Replacer functions ====
function ellipses(input: string): string {
  return input.replace(/\.{3}/gim, '…')
}

function copyright(input: string): string {
  return input.replace(/\(c\)/gi, '©')
}

function registeredTrademark(input: string): string {
  return input.replace(/\(r\)/gi, '®')
}

function trademark(input: string): string {
  return input.replace(/\(tm\)/gi, '™')
}

function plusOrMinus(input: string): string {
  return input.replace(/\+-/gi, '±')
}

function enDash(input: string): string {
  return input.replace(/(?<!-)-{2}(?!-)/gi, '–')
}

function emDash(input: string): string {
  return input.replace(/(?<!-)-{3}(?!-)/gi, '—')
}

const _replacers = [ellipses, copyright, registeredTrademark, trademark, plusOrMinus, enDash, emDash]
