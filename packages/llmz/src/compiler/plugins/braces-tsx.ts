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
 * For any fenced code blocks (```...```) and inline code within JSX text (`...`),
 * we replace { / } with &#123; / &#125; so they don't get parsed as JSX.
 * also < / > with &lt; / &gt; so they don't get parsed as HTML.
 *
 * Important: We only escape inline code backticks that appear inside JSX text content,
 * not those inside JSX expressions (between {}).
 *
 * This scanner can't tell JSX from TypeScript on its own (a `<` comparison or a generic looks
 * like a tag opening and corrupts template literals that follow), so it must only run on known
 * JSX ranges — see escapeCodeFencesInJsxChildren.
 */
function escapeBracesInCodeFences(tsx: string): string {
  let i = 0
  let output = ''
  let insideFencedBlock = false
  let jsxDepth = 0 // Track JSX element depth
  let braceDepth = 0 // Track {} expression depth inside JSX

  while (i < tsx.length) {
    const char = tsx[i]!

    // Track JSX element depth with <tag> and </tag>
    if (char === '<' && !insideFencedBlock) {
      // Check if it's an opening tag (not closing tag)
      if (tsx[i + 1] !== '/') {
        jsxDepth++
      } else {
        jsxDepth--
      }
      output += char
      i++
      continue
    }

    // Track brace depth inside JSX (for expressions like {foo})
    if (jsxDepth > 0 && !insideFencedBlock) {
      if (char === '{') {
        braceDepth++
        output += char
        i++
        continue
      } else if (char === '}') {
        braceDepth--
        output += char
        i++
        continue
      }
    }

    // Check if we're entering or leaving a fenced block
    if (tsx.startsWith('```', i)) {
      insideFencedBlock = !insideFencedBlock
      output += '```'
      i += 3
      continue
    }

    // Only handle inline code if:
    // 1. We're inside JSX text content (jsxDepth > 0)
    // 2. We're NOT inside a JSX expression (braceDepth === 0)
    // 3. We're not inside a fenced block
    if (jsxDepth > 0 && braceDepth === 0 && !insideFencedBlock && char === '`') {
      // Find the matching closing backtick
      const closingIndex = tsx.indexOf('`', i + 1)
      if (closingIndex !== -1) {
        // Extract the inline code content
        const inlineCode = tsx.slice(i + 1, closingIndex)
        // Escape special chars in the inline code
        let escaped = '`'
        for (const c of inlineCode) {
          escaped += HTML_ENTITIES[c] || c
        }
        escaped += '`'
        output += escaped
        i = closingIndex + 1
        continue
      }
    }

    // If we're inside a fenced code block, escape special chars
    if (insideFencedBlock && char in HTML_ENTITIES) {
      output += HTML_ENTITIES[char]
      i++
      continue
    }

    // Normal character
    output += char
    i++
  }

  return output
}

/**
 * Collects the source ranges of the outermost JSX elements/fragments in an AST.
 * Nested JSX is skipped (covered by its ancestor's range), so no range overlaps another.
 */
function collectOutermostJsxRanges(node: unknown, insideJsx: boolean, out: Array<[number, number]>): void {
  if (!node || typeof node !== 'object') {
    return
  }
  const n = node as { type?: unknown; start?: unknown; end?: unknown; [key: string]: unknown }
  if (typeof n.type !== 'string') {
    return
  }

  const isJsx = n.type === 'JSXElement' || n.type === 'JSXFragment'
  if (isJsx && !insideJsx && typeof n.start === 'number' && typeof n.end === 'number') {
    out.push([n.start, n.end])
  }

  const childrenAreInsideJsx = insideJsx || isJsx
  for (const key of Object.keys(n)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'type') {
      continue
    }
    const value = n[key]
    if (Array.isArray(value)) {
      for (const child of value) {
        collectOutermostJsxRanges(child, childrenAreInsideJsx, out)
      }
    } else if (value && typeof value === 'object') {
      collectOutermostJsxRanges(value, childrenAreInsideJsx, out)
    }
  }
}

/**
 * Escapes markdown code fences / inline code in JSX children without touching the surrounding
 * TypeScript: parse the code, then run escapeBracesInCodeFences only over the source ranges of
 * the outermost JSX elements — template literals and comparisons in plain TS are never scanned.
 * If the code doesn't parse (e.g. raw braces in JSX text), fall back to the whole-file scan;
 * fixTSXUntilNoErrors (run afterwards) makes such input parseable.
 */
function escapeCodeFencesInJsxChildren(code: string): string {
  let ast: { program?: unknown }
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    })
  } catch {
    // Unparseable as-is: preserve historical behaviour (whole-file scan + later brace fixing).
    return escapeBracesInCodeFences(code)
  }

  const ranges: Array<[number, number]> = []
  collectOutermostJsxRanges(ast.program, false, ranges)
  if (ranges.length === 0) {
    return code
  }

  // Splice right-to-left so earlier offsets stay valid.
  ranges.sort((a, b) => a[0] - b[0])
  let output = code
  for (let idx = ranges.length - 1; idx >= 0; idx--) {
    const [start, end] = ranges[idx]!
    const escaped = escapeBracesInCodeFences(code.slice(start, end))
    output = output.slice(0, start) + escaped + output.slice(end)
  }
  return output
}

export const JSXMarkdown = {
  preProcessing: (code: string) => {
    code = escapeCodeFencesInJsxChildren(code)
    code = fixTSXUntilNoErrors(code)
    return code
  },
}
