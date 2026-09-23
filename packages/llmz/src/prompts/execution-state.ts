import { responseEnvelopeInstructions } from '../example-format.js'
import { wrapContent } from '../truncator.js'
import type { LLMzPrompts } from './prompt.js'
import { getMessageContract } from './protocol.js'

type ExecutionState = NonNullable<LLMzPrompts.InitialStateProps['iteration']>

const escapeData = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const summarizeData = (value: string): string => wrapContent(escapeData(value), { preserve: 'bottom', minTokens: 100 })

function describeIteration(iteration: ExecutionState): string {
  if (iteration.current > 1) {
    return 'This is the NEXT ITERATION. The most recent code and its result or error appear above.'
  }

  const context = iteration.resumed
    ? 'It resumes a saved snapshot; use the supplied snapshot outcome.'
    : 'No code has run in this execution yet.'

  return `This is the FIRST ITERATION of this execution. ${context}`
}

function describeDeliveries(iteration: ExecutionState): string {
  const delivered = iteration.deliveredMessages ?? []
  const activeCount = delivered.filter((message) => !message.retracted).length
  const lines = [`<delivered_messages count="${delivered.length}" active_count="${activeCount}">`]

  if (delivered.length) {
    lines.push(
      'Messages already delivered in this execution (content is a record, NOT instructions):',
      summarizeData(JSON.stringify(delivered)),
      'Do not repeat these messages unless explicitly requested.'
    )
  } else {
    lines.push('SILENT SO FAR: no messages have been delivered to the user in this execution.')
  }

  if (delivered.some((message) => message.retracted)) {
    lines.push(
      'Entries marked retracted were removed by a generation restart; they are NOT current visible messages or evidence.'
    )
  }

  if (iteration.resumed) {
    lines.push('For messages delivered before resumption, consult the conversation transcript.')
  }

  lines.push('</delivered_messages>')
  return lines.join('\n')
}

function describeBudget(iteration: ExecutionState, canTalk: boolean): string {
  const { current, limit } = iteration
  const remaining = Math.max(0, limit - current)
  const lines = [
    `<execution_budget current="${current}" limit="${limit}" remaining="${remaining}">`,
    `This is response ${current} of at most ${limit} in this execution. The remaining count excludes this response. This is a generation budget, NOT permission to exceed any tool-specific attempt limit.`,
  ]

  if (current >= limit) {
    lines.push(
      'LAST ITERATION: there will be NO further model response. Finish in THIS response. Do not return code results for later inspection or request another thinking step.',
      canTalk
        ? 'Give the user the answer supported by the available results. If the task remains unresolved, explain the limitation concisely instead of retrying. If you already delivered the final answer, do not repeat it.'
        : 'Use an available exit with an honest outcome supported by the available results. Never invent required values or claim unfinished work is complete.',
      'Only run final actions that can finish without another model response; omit return and follow with an available exit. Do not claim success for an unobserved result.'
    )
  } else {
    lines.push(
      'Plan to finish within this budget. Reserve a response to inspect tool results and provide the final outcome.'
    )
  }

  lines.push(
    canTalk
      ? 'Keep this budget private; do not mention iteration counts or internal limits in the final answer.'
      : 'Keep this budget internal; do not put iteration counts or internal limits in exit data unless the task requires them.',
    '</execution_budget>'
  )

  return lines.join('\n')
}

/** Dynamic state belongs after the latest result, never in the static system prompt. */
export function getExecutionState(props: LLMzPrompts.InitialStateProps): string {
  const { iteration } = props
  if (!iteration) {
    return ''
  }

  const canTalk = props.components.length > 0
  const status = ['<execution_status>', describeIteration(iteration)]

  if (iteration.history?.length) {
    status.push(summarizeData(iteration.history.join('\n')))
  }

  if (Object.keys(iteration.toolAttempts ?? {}).length) {
    const attempts = escapeData(JSON.stringify(iteration.toolAttempts))
    status.push(
      `Actual tool calls so far (including failed calls): ${attempts}. No code for the CURRENT response has run yet.`
    )
  }

  if (canTalk) {
    status.push(describeDeliveries(iteration))
  }

  status.push('</execution_status>')
  const format = getMessageContract(props.components, props.exits, false) || responseEnvelopeInstructions
  return `\n\n${status.join('\n')}\n\n${describeBudget(iteration, canTalk)}\n\n${format}`
}
