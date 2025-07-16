import type { PluginObj } from '@babel/core'
import { type NodePath } from '@babel/traverse'
import {
  type JSXClosingElement,
  type JSXOpeningElement,
  type JSXText,
  isJSXIdentifier,
  jsxIdentifier,
  jsxText,
} from '@babel/types'

const preserveJSXNewLines: PluginObj = {
  visitor: {
    JSXText(path: NodePath<JSXText>) {
      const rawText = path.node.value

      // Add special character (\u200B) before each newline
      const modifiedText = rawText.replace(/\n/g, '\n\u200B')

      // Replace the JSXText node with the modified text
      if (rawText !== modifiedText) {
        path.replaceWith(jsxText(modifiedText))

        // Skip further processing on this path to avoid infinite loops
        path.skip()
      }
    },

    JSXOpeningElement(path: NodePath<JSXOpeningElement>) {
      // If it's an identifier (uppercase or lowercase), turn it into a string literal
      if (isJSXIdentifier(path.node.name)) {
        path.node.name = jsxIdentifier(path.node.name.name.toLowerCase())
      }
    },

    JSXClosingElement(path: NodePath<JSXClosingElement>) {
      // Same logic for closing elements
      if (isJSXIdentifier(path.node.name)) {
        path.node.name = jsxIdentifier(path.node.name.name.toLowerCase())
      }
    },
  },
}

const postProcessing = (code: string) => {
  // Replace the special character with a newline
  return code.replaceAll('\\u200B', '\\n')
}

export const JSXNewLines = {
  babelPlugin: preserveJSXNewLines,
  postProcessing,
}
