import { inspect } from 'node:util'
import type { ReviewScenario } from './capture.js'

type ExecutionStep = Extract<ReviewScenario['steps'][number], { type: 'execution' }>
type CapturedRequest = ExecutionStep['requests'][number]
type ScriptedResponse = ExecutionStep['responses'][number]

const divider = '='.repeat(88)
const separator = '-'.repeat(88)

export function formatScenario(scenario: ReviewScenario): string {
  const sections = [
    divider,
    scenario.title,
    `Scenario: ${scenario.name}`,
    divider,
    scenario.description,
    'Captured requests are actual LLMz inputs to the Cognitive client boundary.',
    'Responses are scripted local fixtures, not provider observations.',
  ]

  for (const [index, step] of scenario.steps.entries()) {
    sections.push('', divider, `STEP ${index + 1}`, divider)

    if (step.type === 'note') {
      sections.push(step.text)

      if (Object.hasOwn(step, 'details')) {
        sections.push('', 'DETAILS', formatValue(step.details))
      }

      continue
    }

    sections.push(formatExecution(step))
  }

  return sections.join('\n') + '\n'
}

export function formatIndex(scenarios: ReviewScenario[]): string {
  const requestCount = scenarios.reduce((total, scenario) => {
    return (
      total +
      scenario.steps.reduce((count, step) => {
        return count + (step.type === 'execution' ? step.requests.length : 0)
      }, 0)
    )
  }, 0)
  const sections = [
    divider,
    'LLMz native protocol: prompt review',
    divider,
    `${scenarios.length} scenarios; ${requestCount} captured model requests.`,
    '',
    'WHAT THESE FILES CONTAIN',
    'Actual requests produced by the LLMz runtime at its Cognitive client boundary.',
    'Local scripted responses drive subsequent iterations so the reports include',
    'tool results, memory updates, recovery, and other runtime-generated context.',
    'Host outcomes and delivered UI components are recorded separately from prompts.',
    '',
    'WHAT THESE FILES DO NOT ESTABLISH',
    'No provider is called. No network request or media fetch is performed.',
    'Scripted assistant responses are fixtures, not evidence of model behavior.',
    'These are LLMz-to-Cognitive requests, before provider-specific adaptation.',
    'Streaming scenarios capture the same request boundary; they do not represent',
    'provider wire events or timing measurements.',
    '',
    'HOW TO READ A SCENARIO',
    'The request envelope contains every field outside messages[]. Each message',
    'then appears in order with its role, content, and every remaining field.',
    'String content is printed verbatim between labeled boundaries. Empty strings,',
    'null, undefined, omitted content, and multipart arrays remain distinguishable.',
    'Structured values use untruncated JavaScript inspection, preserving undefined.',
    'Native tool calls remain structured; JavaScript code also has a readable view.',
    'No prompt text is normalized, shortened, or rewritten for presentation.',
    '',
    'SCENARIO SETUP',
    'Chat fixtures expose all default components unless a scenario says otherwise.',
    'Voice is exercised explicitly in its own scenario. Media URLs are local-test',
    'fixture values and are never fetched. Business tools use local fixture data.',
    '',
    'SCENARIOS',
  ]

  for (const scenario of scenarios) {
    sections.push('', `${scenario.name}.txt`, scenario.title, scenario.description)
  }

  return sections.join('\n') + '\n'
}

function formatExecution(step: ExecutionStep): string {
  const sections = [
    step.label,
    `Client method: ${step.streaming ? 'generateTextStream' : 'generateText'}`,
    `Captured requests: ${step.requests.length}`,
    '',
    'ACTUAL REQUESTS SENT BY LLMz',
  ]

  for (const [index, request] of step.requests.entries()) {
    sections.push('', separator, `REQUEST ${index + 1}`, separator, formatRequest(request))

    const response = step.responses[index]

    if (response) {
      sections.push(
        '',
        separator,
        `SCRIPTED RESPONSE ${index + 1} — LOCAL FIXTURE`,
        separator,
        formatResponse(response)
      )
    }
  }

  sections.push(
    '',
    divider,
    'OBSERVED HOST OUTCOME — NOT MODEL INPUT',
    divider,
    formatValue(step.outcome),
    '',
    'DELIVERED UI COMPONENTS — NOT MODEL INPUT',
    formatValue(step.delivered),
    '',
    'OBSERVED STREAM PREVIEWS — NOT MODEL INPUT',
    formatValue(step.deltas)
  )

  return sections.join('\n')
}

function formatRequest(request: CapturedRequest): string {
  const { messages, ...envelope } = request
  const sections = ['REQUEST ENVELOPE (messages[] below)', formatValue(envelope)]

  for (const [index, message] of messages.entries()) {
    const { content, ...fields } = message

    sections.push(
      '',
      `messages[${index}]`,
      'MESSAGE FIELDS (all fields except content)',
      formatValue(fields),
      '',
      formatContent('content', content, Object.hasOwn(message, 'content'))
    )

    appendJavaScript(sections, message.toolCalls)
  }

  return sections.join('\n')
}

function formatResponse(response: ScriptedResponse): string {
  const { output, ...fields } = response
  const sections = [
    'SCRIPTED RESPONSE FIELDS (all fields except output)',
    formatValue(fields),
    '',
    formatContent('output', output, Object.hasOwn(response, 'output')),
  ]

  appendJavaScript(sections, response.toolCalls)

  if (!response.toolCalls?.length) {
    appendJavaScript(sections, response.assistantMessage?.toolCalls)
  }

  return sections.join('\n')
}

function formatContent(label: string, content: unknown, present: boolean): string {
  if (!present) {
    return `${label}: <omitted>`
  }

  if (typeof content !== 'string') {
    const sections = [`${label}:\n${formatValue(content)}`]

    if (Array.isArray(content)) {
      for (const [index, part] of content.entries()) {
        if (isRecord(part) && part.type === 'text' && typeof part.text === 'string') {
          sections.push('', `READABLE MULTIPART TEXT — ${label}[${index}]`, formatContent('text', part.text, true))
        }
      }
    }

    return sections.join('\n')
  }

  return [
    `${label}: string (${content.length} UTF-16 code units)`,
    `--- BEGIN ${label} ---`,
    content,
    `--- END ${label} ---`,
  ].join('\n')
}

function appendJavaScript(sections: string[], calls: unknown): void {
  if (!Array.isArray(calls)) {
    return
  }

  for (const [index, call] of calls.entries()) {
    if (!isRecord(call)) {
      continue
    }

    const nativeFunction = isRecord(call.function) ? call.function : undefined
    const name = nativeFunction?.name ?? call.name
    const input = nativeFunction ? nativeFunction.arguments : call.input

    if (name !== 'run_javascript' || !isRecord(input) || typeof input.code !== 'string') {
      continue
    }

    sections.push('', `READABLE JAVASCRIPT — toolCalls[${index}]`, formatContent('code', input.code, true))
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function formatValue(value: unknown): string {
  return inspect(value, {
    depth: null,
    maxArrayLength: null,
    maxStringLength: null,
    breakLength: 100,
    compact: false,
    colors: false,
    customInspect: false,
    getters: false,
    sorted: false,
  })
}
