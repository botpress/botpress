import { type Comment } from 'acorn'
import MagicString from 'magic-string'
import { SourceMapConsumer, SourceMapGenerator } from 'source-map-js'

import { parseScript, walk, type Ctx } from './ast.js'
import { AsyncWrapper } from './plugins/async-wrapper.js'
import { rejectDynamicCode } from './plugins/dynamic-code.js'
import { LineTrackingFnIdentifier, applyLineTracking } from './plugins/line-tracking.js'
import { CommentFnIdentifier, applyCommentReplacement } from './plugins/replace-comment.js'
import { planLastLineInstrumentation } from './plugins/return-async.js'
import { applyTerminationGuards } from './plugins/termination.js'
import {
  ToolCallEntry,
  ToolCallTrackerFnIdentifier,
  ToolTrackerRetIdentifier,
  applyToolCallTracking,
} from './plugins/track-tool-calls.js'
import { VariableTrackingFnIdentifier, applyVariableTracking } from './plugins/variable-extraction.js'

export const Identifiers = {
  ConsoleObjIdentifier: 'console',
  LineTrackingFnIdentifier,
  VariableTrackingFnIdentifier,
  ToolCallTrackerFnIdentifier,
  ToolTrackerRetIdentifier,
  CommentFnIdentifier,
}

export type CompiledCode = ReturnType<typeof compile>

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])

/**
 * Whether the code contains a top-level `return` statement (one that would
 * return from the generated code itself, not from a nested function). Unlike a
 * regex, this ignores `return` inside comments, strings and nested functions.
 * Falls back to a word-boundary match if the code cannot be parsed.
 */
export function hasTopLevelReturn(code: string): boolean {
  try {
    const ast = parseScript(code)
    let found = false
    walk(ast, (node, _parent, ancestors) => {
      if (node.type === 'ReturnStatement' && !ancestors.some((a) => FUNCTION_TYPES.has(a.type))) {
        found = true
      }
    })
    return found
  } catch {
    return /\breturn\b/.test(code)
  }
}

/**
 * Compiles the agent's generated JavaScript for VM execution:
 *
 * 1. wraps it in an async `__fn__` so top-level `await`/`return` parse
 * 2. instruments it in a single parse + text-edit pass:
 *    line tracking, last-line awaiting, tool-call tracking, comment tracing
 *    and variable tracking
 * 3. unwraps it — the VM drivers re-wrap the bare statements themselves
 *
 * All edits preserve line numbers 1:1 with the wrapped source, so positions
 * reported at runtime map straight back to the user code.
 */
export function compile(code: string) {
  const wrapped = AsyncWrapper.preProcessing(code)
  const comments: Comment[] = []
  const ast = parseScript(wrapped, { comments })
  rejectDynamicCode(ast)

  const variables = new Set<string>()
  const toolCalls = new Map<number, ToolCallEntry>()

  const lastLine = planLastLineInstrumentation(ast)

  // user code with only the last-line instrumentation — used for line offsets
  // and user-facing display
  const msMarkers = new MagicString(wrapped)
  if (lastLine) {
    msMarkers.appendLeft(lastLine.prefixPos, lastLine.prefix)
    msMarkers.appendRight(lastLine.suffixPos, lastLine.suffix)
  }

  const codeWithMarkers = msMarkers.toString()

  const ms = new MagicString(wrapped)
  const ctx: Ctx = { code: wrapped, ms, ast, comments }

  // order matters: at identical positions MagicString emits appendLeft content
  // in call order and appendRight content in call order, so the line tracker
  // lands before `return await (`, which lands before the tool-call IIFE — and
  // the closing edits nest in reverse
  applyLineTracking(ctx)
  if (lastLine) {
    ms.appendLeft(lastLine.prefixPos, lastLine.prefix)
  }

  const finishVariableTracking = applyVariableTracking(ctx, variables, true)
  const wrappedRanges = applyToolCallTracking(ctx, toolCalls)
  applyCommentReplacement(ctx, wrappedRanges)
  finishVariableTracking()
  if (lastLine) {
    ms.appendRight(lastLine.suffixPos, lastLine.suffix)
  }

  // Guard the instrumented program in a separate pass. Nested call and variable
  // wrappers share source boundaries; mixing their edits can change expression values.
  const instrumented = ms.toString()
  const terminationSource = new MagicString(instrumented)
  const finishTerminationGuards = applyTerminationGuards({
    code: instrumented,
    ms: terminationSource,
    ast: parseScript(instrumented),
    comments: [],
  })
  finishTerminationGuards()

  const firstMap = ms.generateMap({ hires: true, source: '<anonymous>' })
  const secondMap = terminationSource.generateMap({ hires: true, source: '<instrumented>' })
  const map = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(JSON.parse(secondMap.toString())))
  map.applySourceMap(new SourceMapConsumer(JSON.parse(firstMap.toString())), '<instrumented>')
  const outputCode = AsyncWrapper.postProcessing(terminationSource.toString())

  return {
    code: outputCode,
    codeWithMarkers,
    map: map.toJSON(),
    variables,
    toolCalls,
  }
}
