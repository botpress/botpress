import { types as t, type PluginObj } from '@babel/core'

/**
 * This plugin converts simple HTML tags in JSX text to markdown equivalents.
 * Only handles basic formatting tags without attributes (except href/src).
 *
 * Supported conversions:
 * - <strong>text</strong> -> **text**
 * - <b>text</b> -> **text**
 * - <em>text</em> -> *text*
 * - <i>text</i> -> *text*
 * - <u>text</u> -> __text__
 * - <a href="url">text</a> -> [text](url)
 * - <ul><li>item</li></ul> -> - item
 * - <ol><li>item</li></ol> -> 1. item
 * - <br>, <br/>, <br /> -> \n
 * - <p>text</p> -> text\n\n
 *
 * Only converts tags that have no attributes (except href for links).
 * Preserves complex HTML that can't be represented in simple markdown.
 */
export function htmlToMarkdownPlugin(): PluginObj {
  return {
    name: 'html-to-markdown',
    visitor: {
      JSXElement(path) {
        const { openingElement } = path.node
        const tagName = t.isJSXIdentifier(openingElement.name) ? openingElement.name.name : null

        if (!tagName) return

        // Convert based on tag type
        const lowerTagName = tagName.toLowerCase()

        if (lowerTagName === 'strong' || lowerTagName === 'b') {
          convertToMarkdown(path, '**', '**')
        } else if (lowerTagName === 'em' || lowerTagName === 'i') {
          convertToMarkdown(path, '*', '*')
        } else if (lowerTagName === 'u') {
          convertToMarkdown(path, '__', '__')
        } else if (lowerTagName === 'a') {
          convertLinkToMarkdown(path)
        } else if (lowerTagName === 'br') {
          convertBrToNewline(path)
        } else if (lowerTagName === 'p') {
          convertParagraphToMarkdown(path)
        } else if (lowerTagName === 'ul') {
          convertUnorderedListToMarkdown(path)
        } else if (lowerTagName === 'ol') {
          convertOrderedListToMarkdown(path)
        }
        // List items (li) are handled by their parent ul/ol
      },
    },
  }
}

function hasOnlyTextChildren(children: any[]): boolean {
  return children.every(
    (child) =>
      t.isJSXText(child) ||
      (t.isJSXExpressionContainer(child) && !t.isJSXElement(child.expression)) ||
      (t.isJSXElement(child) && canConvertToMarkdown(child))
  )
}

function canConvertToMarkdown(element: t.JSXElement): boolean {
  const { openingElement } = element
  const tagName = t.isJSXIdentifier(openingElement.name) ? openingElement.name.name.toLowerCase() : null

  if (!tagName) return false

  // Only convert if no attributes (except href for links)
  const allowedTags = ['strong', 'b', 'em', 'i', 'u', 'br', 'p', 'a', 'li', 'ul', 'ol']
  if (!allowedTags.includes(tagName)) return false

  if (tagName === 'a') {
    // For links, only href is allowed
    return (
      openingElement.attributes.length === 1 &&
      t.isJSXAttribute(openingElement.attributes[0]) &&
      t.isJSXIdentifier(openingElement.attributes[0].name) &&
      openingElement.attributes[0].name.name === 'href'
    )
  }

  if (tagName === 'br') {
    // <br> can have no attributes or be self-closing
    return openingElement.attributes.length === 0
  }

  // Other tags must have no attributes
  return openingElement.attributes.length === 0
}

function convertToMarkdown(path: any, prefix: string, suffix: string) {
  const element = path.node
  if (!canConvertToMarkdown(element)) return

  const children = element.children
  if (!hasOnlyTextChildren(children)) return

  // Extract text content
  const textContent = extractTextContent(children)
  if (!textContent) return

  // Replace the JSX element with markdown text
  const markdownText = `${prefix}${textContent}${suffix}`
  path.replaceWith(t.jsxText(markdownText))
}

function convertLinkToMarkdown(path: any) {
  const element = path.node
  if (!canConvertToMarkdown(element)) return

  const children = element.children
  if (!hasOnlyTextChildren(children)) return

  // Get href attribute
  const hrefAttr = element.openingElement.attributes.find(
    (attr: any) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'href'
  )

  if (!hrefAttr || !t.isJSXAttribute(hrefAttr)) return

  let href = ''
  if (t.isStringLiteral(hrefAttr.value)) {
    href = hrefAttr.value.value
  } else if (t.isJSXExpressionContainer(hrefAttr.value) && t.isStringLiteral(hrefAttr.value.expression)) {
    href = hrefAttr.value.expression.value
  } else {
    // Complex href expression, don't convert
    return
  }

  const textContent = extractTextContent(children)
  if (!textContent) return

  const markdownText = `[${textContent}](${href})`
  path.replaceWith(t.jsxText(markdownText))
}

function convertBrToNewline(path: any) {
  const element = path.node
  if (!canConvertToMarkdown(element)) return

  path.replaceWith(t.jsxText('\n'))
}

function convertParagraphToMarkdown(path: any) {
  const element = path.node
  if (!canConvertToMarkdown(element)) return

  const children = element.children
  if (!hasOnlyTextChildren(children)) return

  const textContent = extractTextContent(children)
  if (!textContent) return

  // Add double newline after paragraph
  const markdownText = `${textContent}\n\n`
  path.replaceWith(t.jsxText(markdownText))
}

function convertUnorderedListToMarkdown(path: any) {
  const element = path.node
  if (element.openingElement.attributes.length > 0) return

  const children = element.children
  const listItems: string[] = []

  for (const child of children) {
    if (t.isJSXElement(child)) {
      const tagName = t.isJSXIdentifier(child.openingElement.name) ? child.openingElement.name.name : null
      if (tagName?.toLowerCase() === 'li' && canConvertToMarkdown(child)) {
        const itemText = extractTextContent(child.children)
        if (itemText) {
          listItems.push(`- ${itemText}`)
        }
      } else {
        // Complex list item, don't convert
        return
      }
    } else if (t.isJSXText(child) && child.value.trim()) {
      // Non-whitespace text node, don't convert
      return
    }
  }

  if (listItems.length === 0) return

  const markdownText = listItems.join('\n') + '\n'
  path.replaceWith(t.jsxText(markdownText))
}

function convertOrderedListToMarkdown(path: any) {
  const element = path.node
  if (element.openingElement.attributes.length > 0) return

  const children = element.children
  const listItems: string[] = []

  for (const child of children) {
    if (t.isJSXElement(child)) {
      const tagName = t.isJSXIdentifier(child.openingElement.name) ? child.openingElement.name.name : null
      if (tagName?.toLowerCase() === 'li' && canConvertToMarkdown(child)) {
        const itemText = extractTextContent(child.children)
        if (itemText) {
          listItems.push(`${listItems.length + 1}. ${itemText}`)
        }
      } else {
        // Complex list item, don't convert
        return
      }
    } else if (t.isJSXText(child) && child.value.trim()) {
      // Non-whitespace text node, don't convert
      return
    }
  }

  if (listItems.length === 0) return

  const markdownText = listItems.join('\n') + '\n'
  path.replaceWith(t.jsxText(markdownText))
}

function extractTextContent(children: any[]): string {
  let text = ''

  for (const child of children) {
    if (t.isJSXText(child)) {
      text += child.value
    } else if (t.isJSXExpressionContainer(child)) {
      // For expressions, we can't extract text at compile time
      // This prevents conversion if there are dynamic expressions
      return ''
    } else if (t.isJSXElement(child)) {
      // Recursively handle nested elements
      const nestedText = extractTextContent(child.children)
      if (!nestedText) return ''

      const tagName = t.isJSXIdentifier(child.openingElement.name) ? child.openingElement.name.name.toLowerCase() : null

      // Handle nested formatting
      switch (tagName) {
        case 'strong':
        case 'b':
          text += `**${nestedText}**`
          break
        case 'em':
        case 'i':
          text += `*${nestedText}*`
          break
        case 'u':
          text += `__${nestedText}__`
          break
        case 'br':
          text += '\n'
          break
        default:
          // Complex nested element, don't convert
          return ''
      }
    }
  }

  return text
}
