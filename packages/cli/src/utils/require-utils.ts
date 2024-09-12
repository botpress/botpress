import Module from 'module'
import pathlib from 'path'

export const requireJsFile = <T>(path: string): T => {
  return require(path)
}

export const requireJsCode = <T>(code: string): T => {
  const filedir = 'tmp'
  const filename = `${Date.now()}.js`

  const fileid = pathlib.join(filedir, filename)

  const m = new Module(fileid)
  m.filename = filename

  try {
    // @ts-ignore
    m._compile(code, filename)
    return m.exports
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(`${thrown}`)
    throw _injectStackTrace(error, code, filename)
  }
}

const STACK_TRACE_SURROUNDING_LINES = 3

const _injectStackTrace = (compileError: Error, code: string, filename: string): Error => {
  if (!compileError.stack || !compileError.stack.includes(`${filename}:`)) {
    return compileError
  }

  // Extract line and column from the stack trace:
  const [, locationInfo] = compileError.stack.split(`${filename}:`, 2)
  if (!locationInfo) {
    return compileError
  }

  const [lineNoStr, _rest] = locationInfo.split(':', 2)
  if (!lineNoStr || !_rest) {
    return compileError
  }

  const [columnStr] = _rest.split(')', 1)
  if (!columnStr) {
    return compileError
  }

  const lineNo = parseInt(lineNoStr)
  const column = parseInt(columnStr)

  // Build the stack trace:
  const allLines = code.split('\n')
  const linesBefore = allLines.slice(Math.max(0, lineNo - 1 - STACK_TRACE_SURROUNDING_LINES), lineNo - 1)
  const offendingLine = allLines[lineNo - 1]
  const caretLine = ' '.repeat(column - 1) + '^'
  const linesAfter = allLines.slice(lineNo, Math.min(allLines.length, lineNo + STACK_TRACE_SURROUNDING_LINES))
  const stackTrace = [...linesBefore, offendingLine, caretLine, ...linesAfter].join('\n')

  return new Error(`${compileError.message}\n\nOffending code:\n\n${stackTrace}`, { cause: compileError })
}
