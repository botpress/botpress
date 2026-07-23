import { upperFirst } from 'lodash-es'

import { CodeFormattingError } from './errors.js'
import { CodeFormatOptions, formatTypings } from './formatting.js'
import { isGroup, isPunct, parse, tokenize, type Group, type Node } from './typings-formatter.js'

/**
 * Hoists object types (`{ ... }`) that appear more than once in a block of
 * typings into named `type` aliases, replacing every occurrence with a
 * reference. Runs repeatedly until a fixpoint so nested duplicates converge.
 */

// ------------------------------------------------------------------ printing

/** Prints a node tree back to text, preserving line structure (formatTypings normalizes later) */
function printNodes(nodes: Node[]): string {
  let out = ''
  let afterLineComment = false

  const emit = (n: Node) => {
    const newlines = Math.min(n.nl ?? 0, 2)
    if (newlines > 0) {
      out += '\n'.repeat(newlines)
    } else if (afterLineComment) {
      out += '\n'
    } else if (out.length && !out.endsWith('\n')) {
      out += ' '
    }
    afterLineComment = false

    if (isGroup(n)) {
      out += n.open
      for (const child of n.children) {
        emit(child)
      }
      if (afterLineComment) {
        out += '\n'
        afterLineComment = false
      }
      out += n.close
    } else {
      out += n.text
      afterLineComment = n.kind === 'line-comment'
    }
  }

  for (const n of nodes) {
    emit(n)
  }
  return out
}

/** Canonical structural key of a type literal: comments and separators ignored */
function keyOf(group: Group): string {
  const parts: string[] = []
  const visit = (n: Node) => {
    if (isGroup(n)) {
      parts.push(n.open)
      n.children.forEach(visit)
      parts.push(n.close)
    } else if (n.kind === 'word' || n.kind === 'string' || (n.kind === 'punct' && n.text !== ';' && n.text !== ',')) {
      parts.push(n.text)
    }
  }
  visit(group)
  return parts.join(' ')
}

// ------------------------------------------------------------------- walking

type LiteralVisit = (args: {
  siblings: Node[]
  index: number
  group: Group
  path: string[]
  aliasName?: string
}) => void

const prevMeaningful = (siblings: Node[], index: number): Node | undefined => {
  for (let i = index - 1; i >= 0; i--) {
    const n = siblings[i]!
    if (isGroup(n) || (n.kind !== 'block-comment' && n.kind !== 'line-comment')) {
      return n
    }
  }
  return undefined
}

const asName = (text: string): string => upperFirst(text.replace(/['"]/g, '').replace(/[^A-Za-z0-9_$]/g, ''))

/** The naming segment for a `{`/`<` group from its surrounding tokens (`key:`, `fn(...)`, `): `, `=>`) */
function segmentsAt(siblings: Node[], index: number): string[] {
  const prev = prevMeaningful(siblings, index)
  if (!prev || isGroup(prev)) {
    return []
  }
  if (isPunct(prev, '=>')) {
    return ['Output']
  }
  if (isPunct(prev, ':') || isPunct(prev, '<')) {
    let i = siblings.indexOf(prev) - 1
    while (i >= 0 && !isGroup(siblings[i]!) && (siblings[i] as any).kind?.includes('comment')) {
      i--
    }
    let q = siblings[i]
    if (q && !isGroup(q) && q.kind === 'punct' && q.text === '?') {
      q = siblings[--i]
    }
    if (q && isGroup(q) && q.open === '(') {
      // `fn(...): {` — a return type
      const fnWord = prevMeaningful(siblings, i)
      return fnWord && !isGroup(fnWord) && fnWord.kind === 'word' ? [asName(fnWord.text), 'Output'] : ['Output']
    }
    if (q && !isGroup(q) && (q.kind === 'word' || q.kind === 'string')) {
      return [asName(q.text)]
    }
  }
  return []
}

/**
 * Visits every hoistable `{ ... }` type literal with its naming path. Value
 * objects (after `=`) are skipped — except `type X = { ... }` alias bodies,
 * which are visited with their alias name so they can act as the canonical
 * definition.
 */
function walkLiterals(siblings: Node[], path: string[], visit: LiteralVisit): void {
  for (let i = 0; i < siblings.length; i++) {
    const node = siblings[i]!
    if (!isGroup(node)) {
      continue
    }

    if (node.open === '(') {
      const fnWord = prevMeaningful(siblings, i)
      const fnName = fnWord && !isGroup(fnWord) && fnWord.kind === 'word' ? [asName(fnWord.text)] : []
      walkLiterals(node.children, [...path, ...fnName], visit)
      continue
    }

    if (node.open === '<' || node.open === '[') {
      walkLiterals(node.children, [...path, ...segmentsAt(siblings, i)], visit)
      continue
    }

    // '{'
    const prev = prevMeaningful(siblings, i)
    if (prev && isPunct(prev, '=')) {
      // `type NAME = { ... }` is a canonical alias body; any other `=` is a value
      const eqIdx = siblings.indexOf(prev)
      const nameTok = siblings[eqIdx - 1]
      const typeTok = siblings[eqIdx - 2]
      const isAlias =
        nameTok &&
        typeTok &&
        !isGroup(nameTok) &&
        !isGroup(typeTok) &&
        nameTok.kind === 'word' &&
        typeTok.kind === 'word' &&
        typeTok.text === 'type'
      if (!isAlias) {
        continue
      }
      const aliasName = (nameTok as { text: string }).text
      visit({ siblings, index: i, group: node, path: [aliasName], aliasName })
      if (siblings[i] === node) {
        walkLiterals(node.children, [aliasName], visit)
      }
      continue
    }

    const prevIsNamespace =
      prev &&
      !isGroup(prev) &&
      prev.kind === 'word' &&
      prevMeaningful(siblings, siblings.indexOf(prev))?.kind === 'word'
    const namespaceLike =
      prevIsNamespace &&
      ['namespace', 'module'].includes((prevMeaningful(siblings, siblings.indexOf(prev!)) as { text: string }).text)

    const segments = segmentsAt(siblings, i)
    const newPath = [...path, ...segments]

    if (!namespaceLike) {
      visit({ siblings, index: i, group: node, path: newPath })
    }
    if (siblings[i] === node) {
      walkLiterals(node.children, namespaceLike ? [...path, asName((prev as { text: string }).text)] : newPath, visit)
    }
  }
}

// ------------------------------------------------------------------ hoisting

function extractAndHoistTypes(code: string): string {
  const top = parse(tokenize(code))

  const counts = new Map<string, number>()
  const aliasByKey = new Map<string, string>()
  const usedNames = new Set<string>()

  walkLiterals(top, [], ({ group, path, aliasName }) => {
    const key = keyOf(group)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (aliasName && !aliasByKey.has(key)) {
      aliasByKey.set(key, aliasName)
    }
    for (const segment of path) {
      usedNames.add(segment)
    }
    if (aliasName) {
      usedNames.add(aliasName)
    }
  })

  const uniqueName = (base: string): string => {
    let name = base
    let counter = 1
    while (usedNames.has(name)) {
      name = `${base}${counter++}`
    }
    usedNames.add(name)
    return name
  }

  const newAliases: string[] = []

  walkLiterals(top, [], ({ siblings, index, group, aliasName, path }) => {
    const key = keyOf(group)
    if ((counts.get(key) ?? 0) < 2 || aliasName) {
      return // unique literal, or the canonical alias definition itself
    }

    let name = aliasByKey.get(key)
    if (!name) {
      const deduped = [...new Set(path)]
      name = uniqueName(deduped.length ? deduped.join('') : 'UnnamedType')
      aliasByKey.set(key, name)
      newAliases.push(`type ${name} = ${printNodes([{ ...group, nl: 0 }])}`)
    }

    siblings[index] = { kind: 'word', text: name, nl: group.nl }
  })

  const body = printNodes(top)
  return newAliases.length ? `${newAliases.join('\n')}\n${body}` : body
}

export async function hoistTypings(code: string, formatOptions?: CodeFormatOptions) {
  formatOptions ??= {}
  formatOptions.throwOnError ??= true

  for (let i = 1; i <= 5; i++) {
    try {
      const initialCode = code
      code = extractAndHoistTypes(code)
      if (initialCode === code) {
        break
      }
    } catch (err) {
      console.error(err)
      if (formatOptions.throwOnError) {
        throw new CodeFormattingError(err instanceof Error ? err.message : String(err ?? 'Unknown Error'), code)
      }
      break
    }
  }

  return formatTypings(code, formatOptions)
}
