import { z } from '@bpinternal/zui'
import { expect, test, vi } from 'vitest'
import { Chat, Component, Exit, ObjectInstance, Tool, isCriticalError, isLLMzError, type ErrorCode } from '../index.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript, nativeCall, response } from './fixtures/native-client.js'

const done = new Exit({ name: 'done', description: 'Finish the task.', schema: z.object({ ok: z.boolean() }) })
const completed = () => javascript('return exit("done", { ok: true });')

test('async effects on synchronous APIs stop execution even when generated code catches them', async () => {
  try {
    for (const quickjs of ['false', 'true']) {
      vi.stubEnv('USE_QUICKJS', quickjs)
      for (const source of ['exit("asyncExit", "value")', 'chat.card({ value: "value" })', 'account.value = "value"']) {
        const schema = z.string().transform(async (value) => value)
        const danger = vi.fn(async () => 'must not run')
        const send = vi.fn()
        const client = new NativeClient([
          javascript(`try { ${source}; } catch {} await danger(); exit("done", { ok: true });`),
        ])
        const result = await executeContext({
          client,
          exits: [done, new Exit({ name: 'asyncExit', description: 'Invalid async schema.', schema })],
          tools: [new Tool({ name: 'danger', handler: danger })],
          chat: new Chat({
            components: [
              new Component({ name: 'card', description: 'Card.', props: z.object({ value: schema }), handler: send }),
            ],
          }),
          objects: [
            new ObjectInstance({
              name: 'account',
              properties: [{ name: 'value', type: schema, value: 'initial', writable: true }],
            }),
          ],
        })

        expect(result.isError()).toBe(true)
        expect(client.requests).toHaveLength(1)
        expect(danger).not.toHaveBeenCalled()
        expect(send).not.toHaveBeenCalled()
        expect(result.iterations[0]?.errors.some((error) => error.code === 'INVALID_CONFIG')).toBe(true)
      }
    }
  } finally {
    vi.unstubAllEnvs()
  }
})

test('schema effects produce recoverable feedback and run once on corrected input', async () => {
  const prompts: Record<string, string> = {}
  try {
    for (const quickjs of ['false', 'true']) {
      vi.stubEnv('USE_QUICKJS', quickjs)
      for (const surface of ['tool', 'exit', 'component', 'property']) {
        const transform = vi.fn((value: string) => value.toUpperCase())
        const schema = z
          .string()
          .trim()
          .refine((value) => value === 'valid', 'Use valid runtime references')
          .transform(transform)
        const payload = z.object({ value: schema })
        const finish = new Exit({
          name: 'finish',
          description: 'Finish.',
          schema: surface === 'exit' ? payload : undefined,
        })
        const action = (value: string) => {
          const literal = JSON.stringify(value)
          switch (surface) {
            case 'tool':
              return `await save({ value: ${literal} });`
            case 'exit':
              return `exit("finish", { value: ${literal} });`
            case 'component':
              return `chat.card({ value: ${literal} });`
            default:
              return `account.value = ${literal};`
          }
        }
        const client = new NativeClient([
          javascript(action('invalid')),
          javascript(action(' valid ') + (surface === 'exit' ? '' : 'exit("finish");')),
        ])
        const handler = vi.fn(async () => 'saved')
        const deliver = vi.fn()
        const exitHook = vi.fn()
        const result = await executeContext({
          client,
          exits: [finish],
          tools: [new Tool({ name: 'save', input: payload, handler })],
          chat: new Chat({
            components: [
              new Component({ name: 'card', description: 'Show a card.', props: payload, handler: deliver }),
            ],
          }),
          objects: [
            new ObjectInstance({
              name: 'account',
              properties: [{ name: 'value', value: 'initial', type: schema, writable: true }],
            }),
          ],
          onExit: exitHook,
          options: { loop: 2 },
        })

        expect(result.is(finish)).toBe(true)
        expect(client.requests).toHaveLength(2)
        expect(transform).toHaveBeenCalledOnce()
        expect(handler).toHaveBeenCalledTimes(surface === 'tool' ? 1 : 0)
        expect(deliver).toHaveBeenCalledTimes(surface === 'component' ? 1 : 0)
        expect(exitHook).toHaveBeenCalledOnce()
        expect(recoveryFeedback(client)).toContain('Use valid runtime references')
        if (surface === 'exit') {
          expect(result.output).toEqual({ value: 'VALID' })
          expect(exitHook.mock.calls[0]?.[0].result).toEqual({ value: 'VALID' })
        }

        // Stack mapping is covered above; snapshot the schema diagnostic itself.
        const diagnostic = recoveryFeedback(client).match(/<error>[\s\S]*?<\/error>/)?.[0]
        expect(diagnostic).toBeDefined()
        if (quickjs === 'false') {
          prompts[surface] = diagnostic!
        } else {
          expect(diagnostic).toBe(prompts[surface])
        }
      }
    }
  } finally {
    vi.unstubAllEnvs()
  }

  expect(prompts).toMatchInlineSnapshot(`
    {
      "component": "<error>
    Code: INVALID_COMPONENT_INPUT
    Component "card" received invalid input:
    - value: Use valid runtime references

    Expected input (TypeScript):
    { value: string }
    </error>",
      "exit": "<error>
    Code: INVALID_EXIT_INPUT
    Exit "finish" received invalid input:
    - value: Use valid runtime references

    Expected input (TypeScript):
    { value: string }
    </error>",
      "property": "<error>
    Code: INVALID_OBJECT_PROPERTY
    Object property account.value received invalid input:
    - input: Use valid runtime references

    Expected input (TypeScript):
    string
    </error>",
      "tool": "<error>
    Code: INVALID_TOOL_INPUT
    Tool "save" received invalid input:
    - value: Use valid runtime references

    Expected input (TypeScript):
    { value: string }
    </error>",
    }
  `)
})

/** Read what the next model actually received, excluding unrelated memory/budget footers. */
function recoveryFeedback(client: NativeClient): string {
  const message = client.requests[1]!.messages.slice()
    .reverse()
    .find((message) => message.type === 'tool_result')
  return String(message?.content).split('\n\n<runtime-memory>')[0]!
}

const failures: { label: string; source: string; code: ErrorCode }[] = [
  {
    label: 'explicit JavaScript throw',
    source: 'throw new Error("Cannot proceed without a confirmed order.");',
    code: 'EXECUTION_FAILED',
  },
  { label: 'unawaited tool', source: 'slow(); return 1;', code: 'HOST_OPERATION_FAILED' },
  { label: 'invalid inspection value', source: 'return inspect(1n);', code: 'INVALID_MEMORY_VALUE' },
  { label: 'hook rejection', source: 'return inspect(1);', code: 'HOOK_FAILED' },
  { label: 'exit hook rejection', source: 'return exit("done", {ok:true});', code: 'HOOK_FAILED' },
  {
    label: 'component delivery failure',
    source: 'chat.card({title:"Hello"}); return inspect(1);',
    code: 'DELIVERY_FAILED',
  },
  { label: 'invalid JavaScript', source: 'const value: number = 1;', code: 'INVALID_CODE' },
  { label: 'unknown tool', source: 'await missingTool();', code: 'UNKNOWN_TOOL' },
  { label: 'unknown object tool', source: 'await account.missingTool();', code: 'UNKNOWN_TOOL' },
  { label: 'invalid tool input', source: 'await lookup({ id: 42 });', code: 'INVALID_TOOL_INPUT' },
  { label: 'tool handler failure', source: 'await fail();', code: 'TOOL_EXECUTION_FAILED' },
  { label: 'reserved declaration', source: 'const $return = 1;', code: 'RESERVED_IDENTIFIER' },
  { label: 'read-only assignment', source: 'account.id = "other";', code: 'INVALID_ASSIGNMENT' },
  { label: 'invalid object property', source: 'account.age = "old";', code: 'INVALID_OBJECT_PROPERTY' },
  { label: 'unknown exit', source: 'exit("missing");', code: 'UNKNOWN_EXIT' },
  { label: 'invalid exit input', source: 'exit("done", { ok: 42 });', code: 'INVALID_EXIT_INPUT' },
  { label: 'unknown component', source: 'chat.doesNotExist({});', code: 'UNKNOWN_COMPONENT' },
  { label: 'invalid component input', source: 'chat.card({ title: 42 });', code: 'INVALID_COMPONENT_INPUT' },
]

// Both sandboxes send the same correction, with their own source-map column precision.
// Only provider calls are mocked; QuickJS source traces are snapshotted separately.
// Snapshots contain the actual next-request tool result; memory/budget footers are unrelated.
test('non-critical error recovery prompts sent to the next LLM iteration', async () => {
  const prompts: Record<string, string> = {}
  const quickjsTraces: Record<string, string> = {}
  try {
    for (const quickjs of ['false', 'true']) {
      vi.stubEnv('USE_QUICKJS', quickjs)
      for (const { label, source, code } of failures) {
        const handler = vi.fn(async () => 'found')
        const send = vi.fn(() => {
          if (label === 'component delivery failure') {
            throw new Error('Delivery channel unavailable')
          }
        })
        let hookCalls = 0
        const invalid = javascript(source)
        invalid.toolCalls![0]!.id = 'failed-call'
        const client = new NativeClient([invalid, completed()])
        const seen: ErrorCode[] = []
        const result = await executeContext({
          client,
          exits: [done],
          chat: new Chat({
            components: [
              new Component({
                name: 'card',
                description: 'Show a card.',
                props: z.object({ title: z.string() }),
                handler: send,
              }),
            ],
          }),
          tools: [
            new Tool({
              name: 'slow',
              handler: async () => {
                await new Promise((resolve) => setTimeout(resolve, 20))
                return 'confirmed'
              },
            }),
            new Tool({ name: 'lookup', input: z.object({ id: z.string() }), handler }),
            new Tool({
              name: 'fail',
              handler: async () => {
                throw new Error('Service unavailable; try another source.')
              },
            }),
          ],
          objects: [
            new ObjectInstance({
              name: 'account',
              properties: [
                { name: 'age', type: z.number(), value: 30, writable: true },
                { name: 'id', type: z.string(), value: 'account-1', writable: false },
              ],
            }),
          ],
          options: { loop: 2 },
          onBeforeExecution: async () => {
            if (label === 'hook rejection' && hookCalls++ === 0) {
              throw new Error('Use a confirmed order before continuing.')
            }
          },
          onExit: () => {
            if (label === 'exit hook rejection' && hookCalls++ === 0) {
              throw new Error('Approval is required before completing.')
            }
          },
          onIterationEnd: (iteration) => {
            const error = iteration.exception
            if (error) {
              seen.push(isLLMzError(error.cause) ? error.cause.code : error.code)
            }
          },
        })
        expect(result.is(done)).toBe(true)
        expect(client.requests).toHaveLength(2)
        expect(seen).toEqual([code])
        const first = result.iterations[0]!
        const error = first.exception!
        const specific = isLLMzError(error.cause) ? error.cause : error
        expect(specific.code).toBe(code)
        expect(isCriticalError(error)).toBe(false)
        if (code !== 'HOST_OPERATION_FAILED') {
          expect(handler).not.toHaveBeenCalled()
        }

        expect(send).toHaveBeenCalledTimes(label === 'component delivery failure' ? 1 : 0)
        expect(first.errors).toContain(error)
        expect(JSON.parse(JSON.stringify(first)).exception).toMatchObject({ code: error.code, critical: false })

        const prompt = recoveryFeedback(client)
        if (quickjs === 'true') {
          const withoutTrace = (text: string) => text.replace(/<stack_trace>[\s\S]*?<\/stack_trace>\n\n/, '')
          expect(withoutTrace(prompt)).toBe(withoutTrace(prompts[label]!))
          quickjsTraces[label] =
            prompt.match(/<stack_trace>[\s\S]*?<\/stack_trace>/)?.[0] ??
            'No guest stack: failure outside guest execution.'
        } else {
          prompts[label] = prompt
        }
      }
    }

    for (const invalid of [
      response('', [nativeCall('missing', {}, 'invalid-native')]),
      response('', [nativeCall('run_javascript', { invalid: true }, 'invalid-native')]),
    ]) {
      const client = new NativeClient([invalid, completed()])
      const result = await executeContext({ client, exits: [done], options: { loop: 2 } })
      expect(result.is(done)).toBe(true)
      prompts[`native ${invalid.toolCalls![0]!.name}`] = recoveryFeedback(client)
    }

    expect(quickjsTraces).toMatchInlineSnapshot(`
      {
        "component delivery failure": "No guest stack: failure outside guest execution.",
        "exit hook rejection": "No guest stack: failure outside guest execution.",
        "explicit JavaScript throw": "<stack_trace>
      > 001 | throw new Error("Cannot proceed without a confirmed order.");
             ^^^^^^^^^^
      </stack_trace>",
        "hook rejection": "No guest stack: failure outside guest execution.",
        "invalid JavaScript": "No guest stack: failure outside guest execution.",
        "invalid component input": "<stack_trace>
      > 001 | chat.card({ title: 42 });
             ^^^^^^^^^^
      </stack_trace>",
        "invalid exit input": "<stack_trace>
      > 001 | exit("done", { ok: 42 });
             ^^^^^^^^^^
      </stack_trace>",
        "invalid inspection value": "<stack_trace>
      > 001 | return inspect(1n);
             ^^^^^^^^^^
      </stack_trace>",
        "invalid object property": "<stack_trace>
      > 001 | account.age = "old";
             ^^^^^^^^^^
      </stack_trace>",
        "invalid tool input": "<stack_trace>
      > 001 | await lookup({ id: 42 });
             ^^^^^^^^^^
      </stack_trace>",
        "read-only assignment": "<stack_trace>
      > 001 | account.id = "other";
             ^^^^^^^^^^
      </stack_trace>",
        "reserved declaration": "No guest stack: failure outside guest execution.",
        "tool handler failure": "<stack_trace>
      > 001 | await fail();
             ^^^^^^^^^^
      </stack_trace>",
        "unawaited tool": "No guest stack: failure outside guest execution.",
        "unknown component": "<stack_trace>
      > 001 | chat.doesNotExist({});
             ^^^^^^^^^^
      </stack_trace>",
        "unknown exit": "<stack_trace>
      > 001 | exit("missing");
             ^^^^^^^^^^
      </stack_trace>",
        "unknown object tool": "<stack_trace>
      > 001 | await account.missingTool();
             ^^^^^^^^^^
      </stack_trace>",
        "unknown tool": "<stack_trace>
      > 001 | await missingTool();
             ^^^^^^^^^^
      </stack_trace>",
      }
    `)
    expect(prompts).toMatchInlineSnapshot(`
      {
        "component delivery failure": "run_javascript: failed

      <error>
      Code: DELIVERY_FAILED
      Delivery failed-call:message:1 failed: Delivery channel unavailable. Its external outcome is uncertain. Later messages were skipped; earlier acknowledged messages remain delivered.
      </error>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <messages>
      Messages sent
      - card { title: "Hello" }: uncertain; error: "Delivery channel unavailable"
      Messages queued after the failed delivery were skipped.
      </messages>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "exit hook rejection": "run_javascript: failed

      <error>
      Code: HOOK_FAILED
      Approval is required before completing.
      </error>

      <recovery>
      Completion through done failed; no exit was applied.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "explicit JavaScript throw": "run_javascript: failed

      <error>
      Code: EXECUTION_FAILED
      Cannot proceed without a confirmed order.
      </error>

      <stack_trace>
      > 001 | throw new Error("Cannot proceed without a confirmed order.");
                    ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "hook rejection": "run_javascript: failed

      <error>
      Code: HOOK_FAILED
      Use a confirmed order before continuing.
      </error>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "invalid JavaScript": "run_javascript: failed

      <error>
      Code: INVALID_CODE
      Unexpected token (4:11). The code must be plain JavaScript: do not use TypeScript syntax (type annotations, "as" casts, generics, interfaces or type aliases).
      </error>

      <invalid_code>
      const value: number = 1;
      </invalid_code>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "invalid component input": "run_javascript: failed

      <error>
      Code: INVALID_COMPONENT_INPUT
      Component "card" received invalid input:
      - title: Expected string, received number

      Expected input (TypeScript):
      { title: string }
      </error>

      <stack_trace>
      > 001 | chat.card({ title: 42 });
                   ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "invalid exit input": "run_javascript: failed

      <error>
      Code: INVALID_EXIT_INPUT
      Exit "done" received invalid input:
      - ok: Expected boolean, received number

      Expected input (TypeScript):
      { ok: boolean }
      </error>

      <stack_trace>
      > 001 | exit("done", { ok: 42 });
                  ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "invalid inspection value": "run_javascript: failed

      <error>
      Code: INVALID_MEMORY_VALUE
      Unsupported memory value: bigint
      </error>

      <stack_trace>
      > 001 | return inspect(1n);
                            ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "invalid object property": "run_javascript: failed

      <error>
      Code: INVALID_OBJECT_PROPERTY
      Object property account.age received invalid input:
      - input: Expected number, received string

      Expected input (TypeScript):
      number
      </error>

      <stack_trace>
      > 001 | account.age = "old";
                          ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "invalid tool input": "run_javascript: failed

      <error>
      Code: INVALID_TOOL_INPUT
      Tool "lookup" received invalid input:
      - id: Expected string, received number

      Expected input (TypeScript):
      { id: string }
      </error>

      <stack_trace>
      > 001 | await lookup({ id: 42 });
             ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <tool_calls>
      Tools called
      - lookup({ id: 42 }): failed; error: "Tool \\"lookup\\" received invalid input: - id: Expected string, received number Expected input (TypeScript): { id: string }"
      </tool_calls>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "native missing": "<error>
      Native tool batch rejected before execution:
      Unknown native tool "missing". Use run_javascript.
      </error>

      <recovery>
      No code ran and no actions were performed. Call run_javascript with exactly one non-empty code string.
      </recovery>",
        "native run_javascript": "<error>
      Native tool batch rejected before execution:
      run_javascript requires exactly one non-empty code string.
      </error>

      <recovery>
      No code ran and no actions were performed. Call run_javascript with exactly one non-empty code string.
      </recovery>",
        "read-only assignment": "run_javascript: failed

      <error>
      Code: INVALID_ASSIGNMENT
      Property account.id is read-only and cannot be modified
      </error>

      <stack_trace>
      > 001 | account.id = "other";
                         ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "reserved declaration": "run_javascript: failed

      <error>
      Code: RESERVED_IDENTIFIER
      $return is reserved for runtime memory
      </error>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "tool handler failure": "run_javascript: failed

      <error>
      Code: TOOL_EXECUTION_FAILED
      Service unavailable; try another source.
      </error>

      <stack_trace>
      > 001 | await fail();
             ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <tool_calls>
      Tools called
      - fail(): failed; error: "Service unavailable; try another source."
      </tool_calls>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "unawaited tool": "run_javascript: failed

      <error>
      Code: HOST_OPERATION_FAILED
      JavaScript completed with 1 unawaited host operation(s). Await all business tools before returning. Started operations have settled and may have completed effects; do not replay them.
      </error>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <tool_calls>
      Tools called
      - slow(): succeeded; returned "confirmed"
      </tool_calls>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "unknown component": "run_javascript: failed

      <error>
      Code: UNKNOWN_COMPONENT
      Component "chat.doesNotExist" is not available. Available components: chat.card. Use native assistant text for ordinary replies.
      </error>

      <stack_trace>
      > 001 | chat.doesNotExist({});
                   ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "unknown exit": "run_javascript: failed

      <error>
      Code: UNKNOWN_EXIT
      Exit "missing" is not available. Use a registered exit name. Available exits: done, listen.
      </error>

      <stack_trace>
      > 001 | exit("missing");
                  ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "unknown object tool": "run_javascript: failed

      <error>
      Code: UNKNOWN_TOOL
      Tool "account.missingTool" is not available. Use a documented tool from the JavaScript API.
      </error>

      <stack_trace>
      > 001 | await account.missingTool();
                            ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <reference_recovery>
      REFERENCE RECOVERY
      Check the Memory overview and JavaScript API for the missing name. Declare new variables with const or let; assignment alone never creates a variable. If a preceding business call already returned, reuse its acknowledged result rather than repeating the call. Do not invent values or functions for unknown names.
      </reference_recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
        "unknown tool": "run_javascript: failed

      <error>
      Code: UNKNOWN_TOOL
      Tool "missingTool" is not available. Use a documented tool from the JavaScript API.
      </error>

      <stack_trace>
      > 001 | await missingTool();
                   ^^^^^^^^^^
      </stack_trace>

      <recovery>
      Fix the error before continuing.
      The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
      Use retained variables and acknowledged results. Do not repeat completed actions or messages.
      Check uncertain external outcomes before retrying an operation.
      </recovery>

      <reference_recovery>
      REFERENCE RECOVERY
      Check the Memory overview and JavaScript API for the missing name. Declare new variables with const or let; assignment alone never creates a variable. If a preceding business call already returned, reuse its acknowledged result rather than repeating the call. Do not invent values or functions for unknown names.
      </reference_recovery>

      <result>
      inspect() result
      Not produced; execution did not complete an inspection.
      </result>",
      }
    `)
  } finally {
    vi.unstubAllEnvs()
  }
})

test('the next request retains a larger expected input shape instead of clipping it to the short error preview', async () => {
  const optional = Object.fromEntries(
    Array.from({ length: 25 }, (_, index) => [`preference${index}`, z.boolean().optional()])
  )
  const tool = new Tool({
    name: 'lookup',
    input: z.object({ id: z.string(), ...optional }),
    handler: vi.fn(async () => 'found'),
  })
  const client = new NativeClient([javascript('await lookup({ id: 42 });'), completed()])
  const result = await executeContext({ client, exits: [done], tools: [tool] })
  expect(result.is(done)).toBe(true)
  expect(recoveryFeedback(client)).toContain('Expected input (TypeScript):')
  expect(recoveryFeedback(client)).toContain('preference24?: boolean')
})

test('ThinkSignal exposes successful tool results together in the next LLM prompt', async () => {
  let prompt: string | undefined
  const { ThinkSignal } = await import('../errors.js')
  try {
    for (const quickjs of ['false', 'true']) {
      vi.stubEnv('USE_QUICKJS', quickjs)
      const stock = vi.fn(async () => {
        throw new ThinkSignal('Review the available stock.', { stock: 4 })
      })
      const pickup = vi.fn(async () => {
        return new ThinkSignal('Review the pickup location before answering.', { collection: 'Dock 7' })
      })
      const onExit = vi.fn()
      const client = new NativeClient([
        javascript(
          [
            'const stock = await searchStock();',
            'const pickup = await searchPickup();',
            'return exit("done", { ok: true });',
          ].join('\n')
        ),
        completed(),
      ])
      const result = await executeContext({
        client,
        tools: [new Tool({ name: 'searchStock', handler: stock }), new Tool({ name: 'searchPickup', handler: pickup })],
        exits: [done],
        options: { loop: 2 },
        onExit,
      })

      expect.soft(result.is(done)).toBe(true)
      expect.soft(client.requests).toHaveLength(2)
      expect.soft(stock).toHaveBeenCalledOnce()
      expect.soft(pickup).toHaveBeenCalledOnce()
      expect.soft(onExit).toHaveBeenCalledOnce()
      expect.soft(result.iterations[0]?.status.type).toBe('thinking_requested')
      expect.soft(result.iterations[0]?.errors).toEqual([])
      expect.soft(result.session.memory.variables).toMatchObject({
        stock: { stock: 4 },
        pickup: { collection: 'Dock 7' },
      })

      // Snapshot the actual tool-result message sent to the second model call,
      // not a separately constructed report. Only memory/budget footers are omitted.
      const current = recoveryFeedback(client)
      if (prompt !== undefined) {
        expect(current).toBe(prompt)
      }

      prompt = current
    }
  } finally {
    vi.unstubAllEnvs()
  }

  expect(prompt).toMatchInlineSnapshot(`
        "run_javascript: succeeded

        <forced_inspection>
        Forced inspection: the tools listed below completed successfully and requested review of their results.
        This is the equivalent of an inspect() call. Do not repeat these tool calls; use the results below and retained variables.
        No exit was applied. Review the evidence before continuing or completing the task.

        Tools requesting inspection (lines refer to the executed JavaScript):
        <tool name="searchStock" line="1">
        <reason>Review the available stock.</reason>
        <result>
        // Object Preview
        --------------
        {
          "stock": 4
        }
        </result>
        </tool>
        <tool name="searchPickup" line="2">
        <reason>Review the pickup location before answering.</reason>
        <result>
        // Object Preview
        --------------
        {
          "collection": "Dock 7"
        }
        </result>
        </tool>
        </forced_inspection>

        <tool_calls>
        Tools called
        - searchStock(): succeeded
        - searchPickup(): succeeded
        </tool_calls>

        <memory_changes>
        Memory changes
        Created: stock, pickup
        </memory_changes>"
      `)
})

test.each(['false', 'true'])(
  'nested VM errors retain their source trace in the next request (QuickJS=%s)',
  async (quickjs) => {
    vi.stubEnv('USE_QUICKJS', quickjs)
    try {
      const code =
        'const path = "/llmz/node_modules/example";\nfunction fail() {\n  throw new Error("Bad state");\n}\nfail();'
      const client = new NativeClient([javascript(code), completed()])
      const result = await executeContext({ client, exits: [done] })
      expect(result.is(done)).toBe(true)
      const prompt = recoveryFeedback(client)
      expect(prompt).toContain('<stack_trace>')
      expect(prompt).toContain('> 003 |   throw new Error("Bad state");')
      expect(prompt).toContain('> 005 | fail();')
      expect(prompt).toContain('^^^^')
    } finally {
      vi.unstubAllEnvs()
    }
  }
)

test('silent listen explains the missing message in the next LLM request', async () => {
  const client = new NativeClient([javascript('return exit("listen");'), response('Here is your answer.')])
  const handler = vi.fn()
  const onExit = vi.fn()
  const result = await executeContext({ client, chat: new Chat({ response: { handler } }), onExit })
  expect(result.isSuccess()).toBe(true)
  expect(result.iterations[0]?.exception?.code).toBe('MISSING_CHAT_RESPONSE')
  expect(handler).toHaveBeenCalledOnce()
  expect(onExit).toHaveBeenCalledOnce()
  expect(recoveryFeedback(client)).toMatchInlineSnapshot(`
    "run_javascript: failed

    <error>
    Code: MISSING_CHAT_RESPONSE
    The assistant has not delivered a message since the last user message. Send a response using the inspected results before waiting for the user. Do not repeat completed tool calls.
    </error>

    <recovery>
    Completion through listen failed; no exit was applied.
    The iteration did not complete successfully. Review the error and recorded outcomes before continuing.
    Use retained variables and acknowledged results. Do not repeat completed actions or messages.
    Check uncertain external outcomes before retrying an operation.
    </recovery>

    <result>
    inspect() result
    Not produced; execution did not complete an inspection.
    </result>"
  `)
})
