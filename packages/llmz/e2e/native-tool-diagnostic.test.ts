import type { CognitiveRequest } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { parse } from 'acorn'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CachedCognitive } from './__tests__/cached-cognitive.js'
import { ListenExit, Tool } from '../src/index.js'
import { getNativeSystemMessage } from '../src/prompts/native.js'
import { RUN_JAVASCRIPT_TOOL } from '../src/runtime/native-tools.js'
import { prependNativeDemonstrations } from './__tests__/native-demonstrations.js'

const minimalTool = {
  name: 'run_javascript',
  description: 'Execute JavaScript code.',
  parameters: {
    type: 'object',
    properties: { code: { type: 'string', description: 'JavaScript source code.' } },
    required: ['code'],
    additionalProperties: false,
  },
}

// Keep the problematic schema in this opt-in reproducer after fixing the runtime.
const constrainedTool = structuredClone(RUN_JAVASCRIPT_TOOL)
const constrainedParameters = constrainedTool.parameters as { properties: { code: { minLength?: number } } }
constrainedParameters.properties.code.minLength = 1

async function probe(name: string, request: CognitiveRequest, stream = true) {
  const client = new CachedCognitive({
    apiUrl: process.env.CLOUD_API_ENDPOINT,
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
    timeout: 45_000,
  })
  const responses = []
  if (stream) {
    for await (const chunk of client.generateTextStream(request)) responses.push(chunk)
  } else {
    responses.push(await client.generateText(request))
  }
  const directory = process.env.LLMZ_DIAGNOSTIC_OUTPUT
  if (directory) {
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify({ request, responses }, null, 2))
  }
  const calls = responses.flatMap((response) => response.toolCalls ?? [])
  const metadata = responses.at(-1)?.metadata
  console.info(
    JSON.stringify({
      name,
      calls,
      output: responses.map((r) => r.output ?? '').join(''),
      model: metadata?.model,
      debugTypes: metadata?.debug?.map((entry) => entry.type),
    })
  )
  expect(metadata?.model).toBe(request.model?.[0])
  const providerRequest = metadata?.debug?.find((entry) => entry.type === 'provider_request')?.data as
    | { tools?: unknown[] }
    | undefined
  expect(providerRequest?.tools).toEqual(request.tools?.map((tool) => ({ type: 'function', function: tool })))
  // Cognitive currently omits provider_response on its streaming path, including generateText.
  // Record that limitation rather than misclassifying a correct tool call as a model failure.
  return calls
}

const base = {
  model: ['groq:qwen3.8-27b'],
  toolControl: { mode: 'auto', parallel: false },
  reasoningEffort: 'none',
  temperature: 0,
  maxTokens: 1024,
  options: { debug: true, skipCache: true },
} satisfies Partial<CognitiveRequest>

// Explicitly opt in: this isolates the provider exchange without executing LLMz.
describe.skipIf(process.env.LLMZ_NATIVE_DIAGNOSTIC !== '1')('native tool transport diagnostic', () => {
  const cases = [
    { name: 'qwen-stream-none', model: 'groq:qwen3.8-27b', stream: true, reasoning: 'none' },
    { name: 'qwen-complete-none', model: 'groq:qwen3.8-27b', stream: false, reasoning: 'none' },
    { name: 'qwen-stream-low', model: 'groq:qwen3.8-27b', stream: true, reasoning: 'low' },
    { name: 'oss-stream-none', model: 'groq:gpt-oss-120b', stream: true, reasoning: 'none' },
  ] as const

  it.each(cases)('$name', { retry: 0, timeout: 60_000 }, async ({ name, model, stream, reasoning }) => {
    const request: CognitiveRequest = {
      ...base,
      model: [model],
      messages: [{ role: 'user', content: 'Call run_javascript with code exactly: return inspect(42);' }],
      tools: [minimalTool],
      reasoningEffort: reasoning,
    }
    const calls = await probe(name, request, stream)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ name: 'run_javascript', input: { code: 'return inspect(42);' } })
  })

  it.each([
    'arithmetic',
    'business-inline',
    'business-system',
    'full-prompt',
    'full-schema',
    'full-history',
    'full-native-examples',
    'schema-only-minLength',
    'schema-only-tool-description',
    'schema-only-code-description',
    'schema-without-minLength',
    'schema-without-descriptions',
  ])('layer %s', { retry: 0, timeout: 60_000 }, async (stage) => {
    const request: CognitiveRequest = { ...base, tools: [minimalTool], messages: [] }
    const business =
      'Use run_javascript to look up products. Inside JavaScript, search_knowledge(query: string): Promise<string> searches the catalog. Await it and return inspect(result) so you can read the result before replying. Do not answer without searching.'
    if (stage === 'arithmetic') {
      request.messages = [
        { role: 'user', content: 'Use run_javascript to compute 17 + 25 and return inspect of the result.' },
      ]
    } else if (stage === 'business-inline') {
      request.messages = [{ role: 'user', content: `${business}\nFind Tomatoes.` }]
    } else if (stage === 'business-system') {
      request.messages = [
        { role: 'system', content: business },
        { role: 'user', content: 'Tomatoes' },
      ]
    } else {
      const system = await getNativeSystemMessage({
        isChatEnabled: true,
        instructions: business,
        objects: [],
        components: new Map(),
        exits: [ListenExit],
        globalTools: [
          new Tool({
            name: 'search_knowledge',
            description: 'Search the product catalog.',
            input: z.string(),
            output: z.string(),
            handler: async () => '',
          }),
        ],
      })
      request.messages = [system.message, { role: 'user', content: 'Tomatoes' }]
      if (stage !== 'full-prompt') request.tools = [constrainedTool]
      if (stage.startsWith('schema-')) {
        const tool = structuredClone(stage.startsWith('schema-only-') ? minimalTool : constrainedTool)
        const parameters = tool.parameters as { properties: { code: { description?: string; minLength?: number } } }
        if (stage === 'schema-only-minLength') parameters.properties.code.minLength = 1
        if (stage === 'schema-only-tool-description') tool.description = RUN_JAVASCRIPT_TOOL.description
        if (stage === 'schema-only-code-description')
          parameters.properties.code.description = (
            RUN_JAVASCRIPT_TOOL.parameters as typeof parameters
          ).properties.code.description
        if (stage === 'schema-without-minLength') delete parameters.properties.code.minLength
        if (stage === 'schema-without-descriptions') {
          delete parameters.properties.code.description
          tool.description = ''
        }
        request.tools = [tool]
      }
      if (stage === 'full-history' || stage === 'full-native-examples') {
        request.messages[1]!.content +=
          '\n\n<runtime-memory>\n## Memory\nNo stored variables or results yet.\n</runtime-memory>\n\nExecution budget: response 1 of 4. Inspect business results that need interpretation before completing; never guess missing completion fields.'
      }
      if (stage === 'full-native-examples')
        request.messages = prependNativeDemonstrations(request.messages, {
          chat: true,
          tools: true,
          exits: true,
          components: false,
          listen: true,
        })
    }
    const calls = await probe(stage, request)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.name).toBe('run_javascript')
    const code = calls[0]?.input?.code
    expect(typeof code).toBe('string')
    expect(() => parse(`async function program() {\n${code}\n}`, { ecmaVersion: 'latest' })).not.toThrow()
    expect(code).toMatch(/return\s+inspect\s*\(/)
    if (stage !== 'arithmetic') expect(code).toMatch(/search_knowledge\s*\(/)
  })
})
