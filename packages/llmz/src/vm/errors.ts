import { isFunction, mapValues, maxBy } from 'lodash-es'
import type { SourceMapConsumer } from 'source-map-js'

import { CodeExecutionError, Signals, SnapshotSignal, VMSignal } from '../errors.js'
import { cleanStackTrace } from '../stack-traces.js'
import type { Traces, VMExecutionResult } from '../types.js'

// Parse QuickJS stack traces ("<quickjs>:16") and map line numbers back through
// the wrapper offset and user code start line to produce annotated source output.
export const handleErrorQuickJS = (
  err: Error,
  code: string,
  _consumer: SourceMapConsumer,
  traces: Traces.Trace[],
  variables: { [k: string]: any },
  lines_executed: Map<number, number>,
  userCodeStartLine: number,
  currentToolCall?: SnapshotSignal['toolCall'] | undefined
): VMExecutionResult => {
  err = Signals.maybeDeserializeError(err)
  const lines = code.split('\n')
  const stackTrace = err.stack || ''
  const LINE_OFFSET = 1

  const regex = /<quickjs>:(\d+)/g
  const QUICKJS_WRAPPER_OFFSET = 10

  const matches = Array.from(stackTrace.matchAll(regex)).map((x) => {
    const quickjsLine = Number(x[1])
    const transformedCodeLine = quickjsLine - QUICKJS_WRAPPER_OFFSET
    const line = Math.max(1, transformedCodeLine - userCodeStartLine + 1)
    const actualLine = lines[line - LINE_OFFSET] ?? ''
    const whiteSpacesCount = actualLine.length - actualLine.trimStart().length
    return { line, column: whiteSpacesCount }
  })

  if (matches.length === 0 && lines_executed.size > 0) {
    const lastLine = Math.max(...Array.from(lines_executed.keys()))
    const actualLine = lines[lastLine - LINE_OFFSET] ?? ''
    const whiteSpacesCount = actualLine.length - actualLine.trimStart().length
    matches.push({ line: lastLine, column: whiteSpacesCount })
  }

  return formatError(err, lines, matches, traces, variables, lines_executed, currentToolCall, code)
}

// Parse Node VM stack traces ("<anonymous>:13:269") and use source maps to map
// back to original line/column positions in the LLM-generated code.
export const handleErrorNode = (
  err: Error,
  code: string,
  consumer: SourceMapConsumer,
  traces: Traces.Trace[],
  variables: { [k: string]: () => any },
  _lines_executed: Map<number, number>,
  currentToolCall?: SnapshotSignal['toolCall'] | undefined
) => {
  err = Signals.maybeDeserializeError(err)
  const lines = code.split('\n')
  const stackTrace = err.stack || ''
  const LINE_OFFSET = 1

  const regex = /<anonymous>:(\d+):(\d+)/g

  const matches = [...stackTrace.matchAll(regex)].map((x) => {
    const originalLine = consumer.originalPositionFor({
      line: Number(x[1]),
      column: Number(x[2]),
    })
    const line = originalLine.line ?? Number(x[1])
    const actualLine = lines[line - LINE_OFFSET] ?? ''
    const whiteSpacesCount = actualLine.length - actualLine.trimStart().length
    const minColumn = Math.max(whiteSpacesCount, originalLine.column)
    return { line, column: Math.min(minColumn, Number(x[2])) }
  })

  const { debugUserCode, truncatedCode } = buildDebugCode(lines, matches)

  if (err instanceof VMSignal) {
    err.stack = debugUserCode
    err.truncatedCode = truncatedCode
    err.variables = mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter))
    err.toolCall = currentToolCall
    throw err
  } else {
    traces.push({
      type: 'code_execution_exception',
      position: [matches[0]?.line ?? 0, matches[0]?.column ?? 0],
      message: err.message,
      stackTrace: debugUserCode,
      started_at: Date.now(),
    })
    throw new CodeExecutionError(err.message, code, debugUserCode)
  }
}

// Last-resort catch: wraps any error (including VMSignals) into a VMExecutionResult
export const handleCatch = (
  err: Error,
  traces: Traces.Trace[],
  variables: { [k: string]: () => any },
  lines_executed: Map<number, number>
) => {
  err = Signals.maybeDeserializeError(err)
  return {
    success: err instanceof VMSignal ? true : false,
    variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
    error: err,
    signal: err instanceof VMSignal ? err : undefined,
    traces,
    lines_executed: Array.from(lines_executed),
  } satisfies VMExecutionResult
}

// Build annotated source listing with "> 003 | code" markers and "^^^^^^^^^^" carets
// at error positions. truncatedCode stops after the deepest error line.
function buildDebugCode(lines: string[], matches: Array<{ line: number; column: number }>) {
  const LINE_OFFSET = 1
  const lastLine = maxBy(matches, (x) => x.line ?? 0)?.line ?? 0

  let debugUserCode = ''
  let truncatedCode = ''
  let truncated = false
  const appendCode = (line: string) => {
    debugUserCode += line
    if (!truncated) {
      truncatedCode += line
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const VM_OFFSET = 2
    const DISPLAY_OFFSET = 0
    const line = lines[i]
    const correctedStackLineIndex = i + LINE_OFFSET + VM_OFFSET
    const match = matches.find((x) => x.line + VM_OFFSET === correctedStackLineIndex)
    const paddedLineNumber = String(correctedStackLineIndex - VM_OFFSET - DISPLAY_OFFSET).padStart(3, '0')

    if (match) {
      appendCode(`> ${paddedLineNumber} | ${line}\n`)
      appendCode(`    ${' '.repeat(paddedLineNumber.length + match.column)}^^^^^^^^^^\n`)
      if (match.line >= lastLine) {
        truncated = true
      }
    } else {
      appendCode(`  ${paddedLineNumber} | ${line}\n`)
    }
  }

  return {
    debugUserCode: cleanStackTrace(debugUserCode).trim(),
    truncatedCode: cleanStackTrace(truncatedCode).trim(),
  }
}

// Shared formatter: annotates the error with debug code, then returns a VMExecutionResult.
// VMSignals are treated as successful (agent control flow), other errors as failures.
function formatError(
  err: Error,
  lines: string[],
  matches: Array<{ line: number; column: number }>,
  traces: Traces.Trace[],
  variables: { [k: string]: any },
  lines_executed: Map<number, number>,
  currentToolCall: SnapshotSignal['toolCall'] | undefined,
  code: string
): VMExecutionResult {
  const { debugUserCode, truncatedCode } = buildDebugCode(lines, matches)

  if (err instanceof VMSignal) {
    const signalError = err as VMSignal & {
      stack: string
      truncatedCode: string
      variables: any
      toolCall?: SnapshotSignal['toolCall']
    }
    signalError.stack = debugUserCode
    signalError.truncatedCode = truncatedCode
    signalError.variables = mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter))
    signalError.toolCall = currentToolCall

    return {
      success: true,
      variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
      signal: err,
      lines_executed: Array.from(lines_executed),
    }
  } else {
    traces.push({
      type: 'code_execution_exception',
      position: [matches[0]?.line ?? 0, matches[0]?.column ?? 0],
      message: err.message,
      stackTrace: debugUserCode,
      started_at: Date.now(),
    })

    const codeError = new CodeExecutionError(err.message, code, debugUserCode)
    const deserializedError = Signals.maybeDeserializeError(codeError)

    return {
      success: false,
      variables: mapValues(variables, (getter) => (isFunction(getter) ? getter() : getter)),
      error: deserializedError,
      traces,
      lines_executed: Array.from(lines_executed),
    }
  }
}
