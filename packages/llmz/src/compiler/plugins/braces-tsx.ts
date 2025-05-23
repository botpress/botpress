import { parse } from '@babel/parser'

function fixTSXUntilNoErrors(rawCode: string, maxAttempts = 50): string {
  let code = rawCode

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try parsing the code as TSX
      parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      })
      // If it parses without error, we’re good
      return code
    } catch (err: any) {
      // Not a Babel parse error or can't fix? Rethrow
      if (err.code !== 'BABEL_PARSER_SYNTAX_ERROR' || !err.loc) {
        throw err
      }

      // Attempt to do a single brace fix near the error location
      const fixed = fixOneBraceProblemAt(code, err.loc)
      if (!fixed) {
        // If we can't fix, give up
        throw err
      }
      code = fixed
    }
  }

  throw new Error('Hit maxAttempts while trying to fix TSX code')
}

/**
 * Attempts to fix one invalid brace near the error location by replacing
 * '{' with '&#123;' or '}' with '&#125;'.
 */
function fixOneBraceProblemAt(code: string, loc: { line: number; column: number }): string | null {
  // Convert line/column to absolute index
  const lines = code.split('\n')
  if (loc.line < 1 || loc.line > lines.length) {
    return null
  }
  const lineStr = lines[loc.line - 1]
  if (loc.column < 0 || (lineStr && loc.column > lineStr.length)) {
    return null
  }

  const absIndex = lines.slice(0, loc.line - 1).reduce((sum, l) => sum + l.length + 1, 0) + loc.column

  // Find the nearest '{' or '}' scanning from absIndex
  const braceIndex = findNearestBrace(code, absIndex)
  if (braceIndex == null) {
    return null
  }

  const braceChar = code[braceIndex]
  if (braceChar !== '{' && braceChar !== '}') {
    return null
  }

  // Replace the single brace with an HTML entity
  const entity = braceChar === '{' ? '&#123;' : '&#125;'
  return code.slice(0, braceIndex) + entity + code.slice(braceIndex + 1)
}

/**
 * Finds the nearest '{' or '}' scanning left, then right from startIndex.
 */
function findNearestBrace(code: string, startIndex: number): number | null {
  // Check left side first
  for (let i = startIndex; i >= 0; i--) {
    if (code[i] === '{' || code[i] === '}') {
      return i
    }
  }
  // Check right side
  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{' || code[i] === '}') {
      return i
    }
  }
  return null
}

const HTML_ENTITIES: Record<string, string> = {
  '{': '&#123;',
  '}': '&#125;',
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
}

/**
 * For any fenced code blocks (```...```),
 * we replace { / } with &#123; / &#125; so they don’t get parsed as JSX.
 * also < / > with &lt; / &gt; so they don’t get parsed as HTML.
 */
function escapeBracesInCodeFences(tsx: string): string {
  let i = 0
  let output = ''
  let insideFencedBlock = false

  while (i < tsx.length) {
    // Check if we’re entering or leaving a fenced block
    if (tsx.startsWith('```', i)) {
      insideFencedBlock = !insideFencedBlock
      output += '```'
      i += 3
      continue
    }

    // If we’re inside a fenced code block, escape { and }
    if (insideFencedBlock && tsx[i]! in HTML_ENTITIES) {
      output += HTML_ENTITIES[tsx[i]!]
      i++
      continue
    }

    // Normal character
    output += tsx[i]
    i++
  }

  return output
}

export const JSXMarkdown = {
  preProcessing: (code: string) => {
    code = escapeBracesInCodeFences(code)
    code = fixTSXUntilNoErrors(code)
    return code
  },
}
