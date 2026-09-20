import type { CognitiveToolCall } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'

import { DefaultComponents, Exit, ListenExit, Tool, execute } from '../../src/index.js'
import type { LLMzPrompts } from '../../src/prompts/prompt.js'
import { NativeClient, response } from '../../src/runtime/fixtures/native-client.js'
import { protocolLanguages } from '../../src/runtime/fixtures/protocol-languages.js'
import { validateNativeToolCalls } from '../../src/runtime/native-tools.js'
import type { Transcript } from '../../src/session/transcript.js'
import { createComponentRegistry } from '../../src/chat/component.js'

import { createTestChat } from './chat.js'
import { protocolScenario } from './protocol-scenarios.js'

const read = new Tool({
  name: 'readAccount',
  description: 'Read the account plan and project count.',
  output: z.object({ plan: z.string(), projects: z.number() }),
  handler: async () => ({ plan: 'Orchid', projects: 17 }),
})

const save = new Tool({
  name: 'savePreference',
  description: 'Save the enabled preference.',
  input: z.object({ enabled: z.boolean() }),
  handler: async () => undefined,
})

const kinds = [
  'greeting',
  'intake',
  'long-context',
  'read',
  'progress',
  'tool-result',
  'save',
  'worker',
  'buttons',
  'json',
  'markdown',
  'recovery',
] as const

export type ProtocolCase = {
  id: string
  language: string
  kind: (typeof kinds)[number]
  props: LLMzPrompts.InitialStateProps
  messages: Transcript.Message[]
  history?: 'result' | 'error'
  expected?: string
}

export const protocolMatrix: ProtocolCase[] = protocolLanguages.flatMap((lang) =>
  kinds.map((kind): ProtocolCase => {
    const { messages: _, ...baseProps } = protocolScenario(lang.question)
    const props: LLMzPrompts.InitialStateProps = {
      ...baseProps,
      components: createComponentRegistry([]),
      globalTools: [],
    }
    const scenario: ProtocolCase = {
      id: `${lang.language}/${kind}`,
      language: lang.language,
      kind,
      props,
      messages: [{ role: 'user', content: lang.question }],
    }
    const set = (question: string, instructions: string, tools: Tool[] = []) => {
      scenario.messages = [{ role: 'user', content: question }]
      props.instructions = `Respond in ${lang.language}. ${instructions}`
      props.globalTools = tools
    }

    switch (kind) {
      case 'greeting':
        set(lang.hello, `Greet the user with exactly this text: ${lang.hello}`)
        scenario.expected = lang.hello
        break
      case 'intake':
        set(lang.question, `Ask exactly this question, then wait: ${lang.reply}`)
        scenario.expected = lang.reply
        break
      case 'long-context':
        props.instructions += `\nRespond in ${lang.language}. The first question must be exactly: ${lang.reply}`
        scenario.expected = lang.reply
        break
      case 'read':
        set(
          `${lang.question} What is my account plan and project count?`,
          'Use readAccount to obtain the facts. Return its result before answering. Do not send a progress message.',
          [read]
        )
        break
      case 'progress':
        set(
          `First say exactly "${lang.checking}", then look up my account.`,
          'Follow the requested progress update, then use readAccount and return its result.',
          [read]
        )
        scenario.expected = lang.checking
        break
      case 'tool-result':
        set(
          'What is my account plan and project count?',
          'Answer from the latest tool result without calling again. Include the plan name and project count.',
          [read]
        )
        scenario.history = 'result'
        break
      case 'save':
        set(
          'Enable the preference silently.',
          'Call run_javascript to await savePreference({enabled:true}) silently, then return exit("listen") in that same program. Do not send a message.',
          [save]
        )
        break
      case 'worker':
        set(
          'Finish.',
          'The verified total is 42. Call run_javascript and return exit("done", { total: 42 }). No calculation is needed.'
        )
        props.components = createComponentRegistry([])
        props.isChatEnabled = false
        props.exits = [
          new Exit({
            name: 'done',
            description: 'Report the verified total.',
            schema: z.object({ total: z.number() }),
          }),
        ]
        break
      case 'buttons':
        set(
          'Ask me to pick Standard or Premium, with a button for each.',
          `Say exactly "${lang.reply}" and call chat.buttons with exactly two say buttons labelled Standard and Premium, then return exit("listen") to finish the turn.`
        )
        props.components = createComponentRegistry([DefaultComponents.Buttons])
        scenario.expected = lang.reply
        break
      case 'json':
        set(
          'Send {"status":"ok"} as a text reply.',
          'Reply with the exact requested JSON string as normal assistant text.'
        )
        scenario.expected = '{"status":"ok"}'
        break
      case 'markdown':
        set(
          'Show a fenced Python example with a triple-quoted docstring.',
          'Answer directly in Markdown, then listen. Include a complete fenced Python example.'
        )
        break
      case 'recovery':
        set(
          'What is my account plan and project count?',
          'Use readAccount. On a temporary failure, retry once silently. There has only been one failed call so far. Return the result before answering.',
          [read]
        )
        scenario.history = 'error'
        break
    }

    return scenario
  })
)

type EvaluatedResponse = {
  sends: Array<{ name: string; props: unknown; body?: string }>
  businessCalls: Array<{ name: string; input: unknown; success: boolean }>
  code?: string
  next?: { name: string; props: unknown }
  errors: string[]
  executionErrors: string[]
  inspectedResult?: unknown
}

/** Replay one completed response with local fixtures; no provider request or repair is allowed. */
export async function evaluateNativeResponse(
  output: string,
  calls: CognitiveToolCall[],
  props: ProtocolCase['props']
): Promise<EvaluatedResponse> {
  const validated = validateNativeToolCalls(calls)
  const sends: EvaluatedResponse['sends'] = []
  const code = calls.find((call) => call.name === 'run_javascript')?.input.code
  const parsed: EvaluatedResponse = {
    sends,
    businessCalls: [],
    code: typeof code === 'string' ? code : undefined,
    errors: validated.valid ? [] : validated.errors,
    executionErrors: [],
  }

  if (!validated.valid) {
    return parsed
  }

  const chatEnabled = props.isChatEnabled
  const client = new NativeClient([response(output, calls)])
  const result = await execute({
    client,
    model: 'fake:fake',
    tools: props.globalTools,
    objects: props.objects,
    // Prompt fixtures include the built-in listen exit; execution adds it for chats.
    exits: props.exits.filter((exit) => !chatEnabled || exit !== ListenExit),
    chat: chatEnabled
      ? createTestChat({
          components: [...props.components.values()],
          onMessage: async (message) => {
            if (message.type === 'text') {
              sends.push({ name: 'message', props: {}, body: message.text })
            } else {
              sends.push({ name: message.name.toLowerCase(), props: message.props })
            }
          },
        })
      : undefined,
    options: { loop: 1, timeout: 5000, maxTokens: 12_000 },
  })

  // A nonterminal inspection exhausts this deliberate one-response replay.
  // The iteration status, rather than that outer budget error, describes execution.
  for (const iteration of result.iterations) {
    if (
      ['execution_error', 'generation_error', 'invalid_code_error', 'aborted', 'exit_error'].includes(
        iteration.status.type
      )
    ) {
      parsed.executionErrors.push(iteration.error ?? iteration.status.type)
    }

    if (iteration.status.type === 'exit_success') {
      parsed.next = {
        name: iteration.status.exit_success.exit_name.toLowerCase(),
        props: iteration.status.exit_success.return_value,
      }
    }

    for (const trace of iteration.traces) {
      if (trace.type === 'tool_call') {
        parsed.businessCalls.push({ name: trace.tool_name, input: trace.input, success: trace.success })
      }
    }
  }

  if (client.requests.length !== 1 || result.iterations.length !== 1) {
    const reason = result.isError() ? String(result.error) : result.status

    parsed.executionErrors.push(`The semantic replay did not execute exactly one response: ${reason}`)
  }

  parsed.inspectedResult = result.session.getBindings().$return

  return parsed
}

/** Independent task checks: valid syntax alone must not turn a silent exit into a passing answer. */
export function checkProtocolTask(scenario: ProtocolCase, parsed: EvaluatedResponse): boolean {
  if (parsed.errors.length || parsed.executionErrors.length) {
    return false
  }

  const text = parsed.sends
    .filter((s) => s.name === 'message')
    .map((s) => s.body ?? '')
    .join('')
  const listen = parsed.next?.name === 'listen'
  const reads = parsed.businessCalls.filter((call) => call.name === 'readAccount' && call.success)
  const account = parsed.inspectedResult
  const inspectedAccount =
    !!account &&
    typeof account === 'object' &&
    'plan' in account &&
    account.plan === 'Orchid' &&
    'projects' in account &&
    account.projects === 17

  switch (scenario.kind) {
    case 'greeting':
    case 'intake':
    case 'long-context':
    case 'json':
      return text === scenario.expected && !parsed.code && listen
    case 'read':
    case 'recovery':
      return (
        reads.length === 1 &&
        parsed.businessCalls.length === 1 &&
        inspectedAccount &&
        parsed.sends.length === 0 &&
        !parsed.next
      )
    case 'progress':
      return (
        text === scenario.expected &&
        reads.length === 1 &&
        parsed.businessCalls.length === 1 &&
        inspectedAccount &&
        !parsed.next
      )
    case 'tool-result':
      return text.includes('Orchid') && text.includes('17') && !parsed.code && listen
    case 'save':
      return (
        parsed.businessCalls.length === 1 &&
        parsed.businessCalls[0]?.name === 'savePreference' &&
        parsed.businessCalls[0]?.success === true &&
        JSON.stringify(parsed.businessCalls[0]?.input) === JSON.stringify({ enabled: true }) &&
        !parsed.sends.length &&
        listen
      )
    case 'worker': {
      const payload = parsed.next?.props

      return (
        parsed.next?.name === 'done' &&
        !!payload &&
        typeof payload === 'object' &&
        'total' in payload &&
        payload.total === 42 &&
        !parsed.businessCalls.length &&
        !parsed.sends.length
      )
    }
    case 'buttons':
      return (
        text === scenario.expected &&
        parsed.sends.length === 2 &&
        !parsed.businessCalls.length &&
        getButtonLabels(parsed).sort().join(',') === 'Premium,Standard' &&
        listen
      )
    case 'markdown':
      return text.includes('```python') && text.includes('"""') && !parsed.code && listen
  }
}

/** Protocol/control-flow checks are separate from exact wording and translation quality. */
export function checkResponseShape(scenario: ProtocolCase, parsed: EvaluatedResponse): boolean {
  if (parsed.errors.length || parsed.executionErrors.length) {
    return false
  }

  switch (scenario.kind) {
    case 'greeting':
    case 'intake':
    case 'long-context':
    case 'tool-result':
      return (
        !parsed.code &&
        parsed.next?.name === 'listen' &&
        parsed.sends.length > 0 &&
        parsed.sends.every((send) => send.name === 'message' && !!send.body?.trim())
      )
    case 'buttons':
      return (
        !!parsed.code &&
        parsed.next?.name === 'listen' &&
        parsed.sends.map((send) => send.name).join(',') === 'message,buttons' &&
        !!parsed.sends[0]?.body?.trim() &&
        getButtonLabels(parsed).sort().join(',') === 'Premium,Standard'
      )
    case 'progress':
      return (
        parsed.businessCalls.length === 1 &&
        parsed.businessCalls[0]?.name === 'readAccount' &&
        parsed.businessCalls[0]?.success === true &&
        !parsed.next &&
        parsed.sends.length === 1 &&
        parsed.sends[0]?.name === 'message' &&
        !!parsed.sends[0]?.body?.trim()
      )
    default:
      return checkProtocolTask(scenario, parsed)
  }
}

function getButtonLabels(response: EvaluatedResponse): string[] {
  const buttons = response.sends.find((message) => message.name === 'buttons')?.props

  if (
    !Array.isArray(buttons) ||
    !buttons.every((button) => button?.action === 'say' && typeof button.label === 'string')
  ) {
    return []
  }

  return buttons.map((button) => button.label)
}
