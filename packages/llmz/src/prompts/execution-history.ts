import type { Iteration, IterationStatus } from '../context.js'
import { ThinkSignal } from '../errors.js'
import type { LLMzPrompts } from './prompt.js'

type Progress = Pick<
  NonNullable<LLMzPrompts.InitialStateProps['iteration']>,
  'history' | 'toolAttempts' | 'deliveredMessages'
>

function describeOutcome(status: IterationStatus): string {
  switch (status.type) {
    case 'thinking_requested':
      return status.thinking_requested.interrupted ? 'a tool paused execution' : 'code completed and returned control'
    case 'execution_error':
      return 'code execution failed'
    case 'invalid_code_error':
      return 'invalid code or protocol'
    case 'exit_error':
      return 'exit validation failed'
    default:
      return status.type
  }
}

/** Summarize observed effects, including failed calls and retracted deliveries. */
export function summarizeIterations(iterations: readonly Iteration[], canTalk: boolean): Progress {
  const history: string[] = []
  const attempts = new Map<string, number>()
  const deliveredMessages: NonNullable<Progress['deliveredMessages']> = []

  for (const [index, iteration] of iterations.entries()) {
    const calls: string[] = []
    const lastRestart = iteration.traces.reduce(
      (last, trace, traceIndex) => (trace.type === 'llm_call_restarted' ? traceIndex : last),
      -1
    )

    for (const [traceIndex, trace] of iteration.traces.entries()) {
      if (trace.type === 'tool_call') {
        const name = trace.object ? `${trace.object}.${trace.tool_name}` : trace.tool_name
        let outcome = 'failed or paused'

        if (trace.success) {
          outcome = trace.output instanceof ThinkSignal ? 'paused for attention' : 'succeeded'
        }

        attempts.set(name, (attempts.get(name) ?? 0) + 1)
        calls.push(`${name}: ${outcome}`)
      }

      if (canTalk && trace.type === 'yield') {
        deliveredMessages.push({
          iteration: index + 1,
          content: trace.value,
          // A stream restart retracts all earlier deliveries from that generation.
          ...(traceIndex < lastRestart ? { retracted: true } : {}),
        })
      }
    }

    const outcome = describeOutcome(iteration.status)
    const toolSummary = calls.length ? ` Tool attempts: ${calls.join('; ')}.` : ''
    history.push(`Iteration ${index + 1}: ${outcome}.${toolSummary}`)
  }

  return {
    history,
    toolAttempts: Object.fromEntries(attempts),
    deliveredMessages: canTalk ? deliveredMessages : undefined,
  }
}
