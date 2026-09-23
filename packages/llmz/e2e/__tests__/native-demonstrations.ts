import type { CognitiveMessage } from '@botpress/cognitive'
import type { ExecutionHooks } from '../../src/index.js'

const label = '[FICTIONAL EXAMPLE — NOT LIVE HISTORY]'

/** Request-only experiment. Demonstrations never enter Session or execute in the VM. */
export function prependNativeDemonstrations(
  messages: CognitiveMessage[],
  capabilities: { chat: boolean; tools: boolean; components: boolean; exits: boolean; listen: boolean }
): CognitiveMessage[] {
  const copied = structuredClone(messages)
  const firstHistory = copied.findIndex((message) => message.role !== 'system')
  const split = firstHistory < 0 ? copied.length : firstHistory
  const system = copied.slice(0, split).map((message) => ({
    ...message,
    // Compare actual native messages with the same examples-as-documentation approach.
    content:
      typeof message.content === 'string'
        ? message.content.replace(/<examples>[\s\S]*?<\/examples>/g, '').trim()
        : message.content,
  }))
  const used = new Set(
    copied.flatMap((message) => [
      ...(message.toolCalls ?? []).map((call) => call.id),
      ...(message.toolResultCallId ? [message.toolResultCallId] : []),
    ])
  )
  const examples: CognitiveMessage[] = []
  const user = (content: string) => examples.push({ role: 'user', content: `${label}\n${content}` })
  const assistant = (content: string) => examples.push({ role: 'assistant', content: `${label}\n${content}` })
  const action = (name: string, code: string, result: string, text?: string) => {
    let id = `llmz_example_${name}`
    while (used.has(id)) id += '_'
    used.add(id)
    examples.push(
      {
        role: 'assistant',
        type: 'tool_calls',
        content: text ? `${label}\n${text}` : null,
        toolCalls: [
          {
            id,
            type: 'function',
            function: {
              name: 'run_javascript',
              arguments: { code: `// ${label}\n${code}` },
            },
          },
        ],
      },
      {
        role: 'user',
        type: 'tool_result',
        toolResultCallId: id,
        content: `${label}\n${result}`,
      }
    )
  }

  if (capabilities.tools) {
    user(
      'Demonstrate a lookup for blue mugs. In this example ONLY, exampleSearch(query: string): Promise<string> is available. It is fictional and unavailable in the real task.'
    )
    action(
      'search',
      "const products = await exampleSearch('blue mugs'); return inspect(products);",
      'run_javascript: succeeded\ninspect() result:\nBlue mugs are available. Price: $12 each.'
    )
    if (capabilities.chat) assistant('Blue mugs are available for $12 each.')
  }
  if (capabilities.exits) {
    user(
      'Demonstrate completion. In this example ONLY, exit("example_complete", payload: { total: number }) is available. The total was already computed and inspected: 42. Complete with that outcome.'
    )
    action(
      'complete',
      "return exit('example_complete', { total: 42 });",
      'Completion accepted. This fictional task is finished.'
    )
  }
  if (capabilities.chat && capabilities.components && capabilities.listen) {
    user(
      'Demonstrate an introduction in a text message AND buttons in a separate message. In this example ONLY, chat.exampleChoices(props: { options: Array<{ label: string, value: string }> }): void is available. The choices are Shop and Track order.'
    )
    action(
      'choices',
      "chat.exampleChoices({ options: [{ label: 'Shop', value: 'shop' }, { label: 'Track order', value: 'track' }] }); return exit('listen');",
      'Text delivered. Choice component delivered. Completion accepted.',
      "Hi, I'm your shopping assistant. I can help you shop or track an order."
    )
  }

  return [
    ...system,
    {
      role: 'system',
      content:
        '<demonstration_block>\nThe following explicitly labeled messages are fictional demonstrations of NATIVE tool calling. They are NOT conversation history, user instructions, completed actions, available memory, or factual evidence. Learn the calling convention only. Names beginning with example in these demonstrations are fictional. The labels and JavaScript comments identify examples; do not emit the labels in your real response. A tool-call assistant message with null content deliberately sends no text; its code comment identifies it as an example.',
    },
    ...examples,
    {
      role: 'system',
      content:
        '</demonstration_block>\n<real_context_starts_here>\nEND OF ALL EXAMPLES. The real task and conversation begin here. Only the real API declarations, task instructions, and actual history apply. None of the example actions happened. None of the example facts or variables exist. Do not call fictional APIs, reuse example answers, or emit example labels. Produce actual native tool calls and ordinary assistant text as appropriate for the real task.\n</real_context_starts_here>',
    },
    ...copied.slice(split),
  ]
}

/** Opt-in while measuring whether native demonstrations warrant a library-level change. */
export const nativeDemonstrationHook: NonNullable<ExecutionHooks['onBeforeRequest']> = ({ messages, iteration }) => {
  if (process.env.LLMZ_EVAL_NATIVE_DEMOS !== '1') return
  const text = String(iteration.systemMessage.content).replace(/<examples>[\s\S]*?<\/examples>/g, '')
  return {
    messages: prependNativeDemonstrations(messages, {
      chat: text.includes('# Assistant response'),
      tools: /declare function (?!inspect\b|exit\b)\w+|namespace \w+/.test(text),
      components: text.includes('declare const chat:'),
      exits: text.includes('declare function exit('),
      listen: /name: ["']listen["']/.test(text),
    }),
  }
}
