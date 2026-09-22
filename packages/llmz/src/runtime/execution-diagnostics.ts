import { CodeExecutionError, InvalidCodeError, isLLMzError } from '../errors.js'
import { limitInspectionOutput } from '../inspect.js'
import type { InspectionIdentity, Inspector } from '../inspection.js'
import type { TruncatePreserve } from '../truncate.js'

/** XML-style boundaries keep diagnostic text separate from recovery instructions. */
export function reportSection(
  name: string,
  content: string,
  maxTokens = 2000,
  options: { heading?: string; preserve?: TruncatePreserve } = {}
): string {
  const heading = options.heading ? `${options.heading}\n` : ''
  const body = limitInspectionOutput(content, maxTokens, false, options.preserve ?? 'top')
  return `<${name}>\n${heading}${body}\n</${name}>`
}

/** Show the specific failure and guest source, never the host's implementation stack. */
export function renderExecutionDiagnostics(
  error: unknown,
  message: string,
  inspector: Inspector,
  identity: InspectionIdentity
): string[] {
  const cause = CodeExecutionError.is(error) ? error.cause : error
  const candidate = isLLMzError(cause) ? cause : error
  const failure = isLLMzError(candidate) ? candidate : undefined
  const details = [failure ? `Code: ${failure.code}` : undefined, failure?.message ?? message].filter(Boolean)
  const sections = [
    reportSection('error', inspector(details.join('\n'), { purpose: 'error', maxTokens: 1000, identity }), 1000),
  ]

  if (CodeExecutionError.is(error) && error.stacktrace) {
    sections.push(renderSourceTrace(error.stacktrace, inspector, identity))
  } else if (InvalidCodeError.is(error) && error.source) {
    sections.push(
      reportSection('invalid_code', inspector(error.source, { purpose: 'code', maxTokens: 800, identity }), 800)
    )
  }

  return sections
}

/** Keep failure sites visible even when they are near the end of a long program. */
export function renderSourceTrace(stack: string, inspector: Inspector, identity: InspectionIdentity): string {
  const lines = stack.split('\n')
  const marked = lines.flatMap((line, index) => (/^> \d+ \|/.test(line) ? [index] : []))
  const selected = new Set<number>()

  for (const index of marked.slice(0, 8)) {
    for (let nearby = Math.max(0, index - 2); nearby <= Math.min(lines.length - 1, index + 3); nearby++) {
      selected.add(nearby)
    }
  }

  const excerpt: string[] = []
  let previous = -1
  for (const index of [...selected].sort((a, b) => a - b)) {
    if (index > previous + 1) {
      excerpt.push('... omitted source ...')
    }

    excerpt.push(lines[index]!)
    previous = index
  }

  if (selected.size && previous < lines.length - 1) {
    excerpt.push('... omitted source ...')
  }

  const source = selected.size ? excerpt.join('\n') : stack
  return reportSection('stack_trace', inspector(source, { purpose: 'code', maxTokens: 1000, identity }), 1000)
}
