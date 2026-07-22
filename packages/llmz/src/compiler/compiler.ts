import type * as BabelCore from '@babel/core'
import { type TransformOptions } from '@babel/core'

import * as Babel from '@babel/standalone'

import { AsyncWrapper } from './plugins/async-wrapper.js'
import { LineTrackingFnIdentifier, lineTrackingBabelPlugin } from './plugins/line-tracking.js'
import { CommentFnIdentifier, replaceCommentBabelPlugin } from './plugins/replace-comment.js'
import { instrumentLastLinePlugin } from './plugins/return-async.js'
import {
  ToolCallEntry,
  ToolCallTrackerFnIdentifier,
  ToolTrackerRetIdentifier,
  toolCallTrackingPlugin,
} from './plugins/track-tool-calls.js'
import { VariableTrackingFnIdentifier, variableTrackingPlugin } from './plugins/variable-extraction.js'

export const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  parserOpts: {
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    strictMode: true,
    startLine: 1,
  },
  sourceFileName: '<anonymous>',
  sourceMaps: true,
  minified: false,
  retainLines: true,
}

export const Identifiers = {
  ConsoleObjIdentifier: 'console',
  LineTrackingFnIdentifier,
  VariableTrackingFnIdentifier,
  ToolCallTrackerFnIdentifier,
  ToolTrackerRetIdentifier,
  CommentFnIdentifier,
}

export type CompiledCode = ReturnType<typeof compile>

/**
 * Whether the code contains a top-level `return` statement (one that would
 * return from the generated code itself, not from a nested function). Unlike a
 * regex, this ignores `return` inside comments, strings and nested functions.
 * Falls back to a word-boundary match if the code cannot be parsed.
 */
export function hasTopLevelReturn(code: string): boolean {
  let found = false

  const detectTopLevelReturnPlugin = (): BabelCore.PluginObj => ({
    visitor: {
      ReturnStatement(path) {
        if (!path.getFunctionParent()) {
          found = true
        }
      },
    },
  })

  try {
    Babel.transform(code, {
      parserOpts: {
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
      },
      presets: ['typescript'],
      plugins: [detectTopLevelReturnPlugin],
      filename: '<anonymous>.ts',
      code: false,
    })
  } catch {
    return /\breturn\b/.test(code)
  }

  return found
}

export function compile(code: string) {
  code = AsyncWrapper.preProcessing(code)
  let output = Babel.transform(code, {
    parserOpts: {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
    },
    presets: ['typescript'],
    plugins: [instrumentLastLinePlugin],
    filename: '<anonymous>.ts',
    sourceFileName: '<anonymous>',
    sourceMaps: true,
    minified: false,
    retainLines: true,
  })

  const variables = new Set<string>()
  const toolCalls = new Map<number, ToolCallEntry>()

  // Keep this version with markers intact (before plugins transform them)
  const codeWithMarkers = output.code!

  output = Babel.transform(output.code!, {
    ...DEFAULT_TRANSFORM_OPTIONS,
    parserOpts: {
      ...DEFAULT_TRANSFORM_OPTIONS.parserOpts,
    },
    plugins: [
      lineTrackingBabelPlugin,
      replaceCommentBabelPlugin,
      variableTrackingPlugin(variables),
      toolCallTrackingPlugin(toolCalls),
    ],
    retainLines: true,
  })

  let outputCode = output.code!
  outputCode = AsyncWrapper.postProcessing(outputCode)

  return {
    code: outputCode,
    codeWithMarkers, // Code from before second transform, still has literal markers
    map: output.map,
    variables,
    toolCalls,
  }
}
