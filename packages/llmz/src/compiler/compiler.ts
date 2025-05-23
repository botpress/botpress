import { type TransformOptions } from '@babel/core'

// @ts-ignore
import jsxPlugin from '@babel/plugin-transform-react-jsx'
import * as Babel from '@babel/standalone'

import { AsyncIterator } from './plugins/async-iterator.js'
import { JSXMarkdown } from './plugins/braces-tsx.js'
import { JSXNewLines } from './plugins/jsx-preserve-newlines.js'

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
  JSXFnIdentifier: '__jsx__',
  AsyncIterYieldFnIdentifier: '__async_iter_yield__',
  ConsoleObjIdentifier: 'console',
  LineTrackingFnIdentifier,
  VariableTrackingFnIdentifier,
  ToolCallTrackerFnIdentifier,
  ToolTrackerRetIdentifier,
  CommentFnIdentifier,
}

export type CompiledCode = ReturnType<typeof compile>

export function compile(code: string) {
  code = AsyncIterator.preProcessing(code)
  code = JSXMarkdown.preProcessing(code)

  let output = Babel.transform(code, {
    parserOpts: {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      startLine: -1,
    },
    presets: ['typescript'],
    plugins: [
      JSXNewLines.babelPlugin,
      [
        jsxPlugin,
        {
          throwIfNamespace: false,
          runtime: 'classic',
          pragma: Identifiers.JSXFnIdentifier,
        },
      ],
      instrumentLastLinePlugin,
    ],
    filename: '<anonymous>.tsx',
    sourceFileName: '<anonymous>',
    sourceMaps: true,
    minified: false,
    retainLines: true,
  })

  const variables = new Set<string>()
  const toolCalls = new Map<number, ToolCallEntry>()

  output = Babel.transform(output.code!, {
    ...DEFAULT_TRANSFORM_OPTIONS,
    parserOpts: {
      ...DEFAULT_TRANSFORM_OPTIONS.parserOpts,
      startLine: -1,
    },
    plugins: [
      lineTrackingBabelPlugin,
      replaceCommentBabelPlugin,
      variableTrackingPlugin(variables),
      toolCallTrackingPlugin(toolCalls),
    ],
  })

  let outputCode = output.code!
  outputCode = AsyncIterator.postProcessing(outputCode)
  outputCode = JSXNewLines.postProcessing(outputCode)

  return {
    code: outputCode,
    map: output.map,
    variables,
    toolCalls,
  }
}
