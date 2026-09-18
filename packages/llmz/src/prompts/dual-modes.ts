import { isPlainObject } from 'lodash-es'
import { exampleBoundaryInstructions, quoteExample, quoteResponseExample } from '../example-format.js'
import { renderExamples } from '../example.js'
import { inspect } from '../inspect.js'
import { cleanStackTrace } from '../stack-traces.js'
import { wrapContent } from '../truncator.js'

import CHAT_SYSTEM_PROMPT_TEXT from './chat-mode/system.js'
import CHAT_USER_PROMPT_TEXT from './chat-mode/user.js'

import { parseAssistantResponse, replacePlaceholders } from './common.js'
import { getExecutionState } from './execution-state.js'
import { LLMzPrompts, Prompt } from './prompt.js'
import { getMessageContract, getProtocolInstructions, getTranscriptTextComponent } from './protocol.js'

import WORKER_SYSTEM_PROMPT_TEXT from './worker-mode/system.js'
import WORKER_USER_PROMPT_TEXT from './worker-mode/user.js'

const getSystemMessage: Prompt['getSystemMessage'] = async (props) => {
  let dts = ''

  const tool_names: string[] = []
  const readonly_vars: string[] = []
  const writeable_vars: string[] = []
  const canTalk = props.components.length > 0

  // Parallelize the generation of typings for each object
  const objectTypingsPromise = props.objects.map((obj) => ({
    ...obj,
    typings: obj.getTypings(),
  }))

  for (const obj of objectTypingsPromise) {
    dts += (await obj.typings) + '\n\n\n'
    for (const tool of obj.tools ?? []) {
      tool_names.push(`${obj.name}.${tool.name}`)
    }
    for (const prop of obj.properties ?? []) {
      if (prop.writable) {
        writeable_vars.push(`${obj.name}.${prop.name}`)
      } else {
        readonly_vars.push(`${obj.name}.${prop.name}`)
      }
    }
  }

  if (props.objects.length && props.globalTools.length) {
    dts += `

// ----------------------- //
//       Global Tools      //
// ----------------------- //

`
  }

  for (const tool of props.globalTools) {
    dts += (await tool.getTypings()) + '\n'
    tool_names.push(tool.name)
  }

  let variables_example = ''

  if (writeable_vars.length) {
    variables_example += `// Example of writing to a variable:
${writeable_vars[0]} = ... // assigning a value to a Writable variable is valid`
  }

  if (readonly_vars.length) {
    variables_example += `// Example of reading a variable:
const value = ${readonly_vars[0]} // reading a Readonly variable is valid
// on the other hand, writing to a Readonly variable is not allowed and will result in an error`
  }

  if (variables_example) {
    variables_example = `\n\n${quoteExample(variables_example)}`
  }

  const identity = props.instructions?.length ? props.instructions : 'No specific instructions provided'
  const transcript = props.transcript.toString({
    assistantMessageComponent: getTranscriptTextComponent(props.components),
  })
  const examples = await renderExamples(props.examples ?? [], props.components, props.exits)
  const protocol = getProtocolInstructions({ components: props.components, exits: props.exits })

  return {
    message: {
      role: 'system' as const,
      content: replacePlaceholders(canTalk ? CHAT_SYSTEM_PROMPT_TEXT : WORKER_SYSTEM_PROMPT_TEXT, {
        is_message_enabled: canTalk,
        'tools.d.ts': wrapContent(dts, {
          preserve: 'both',
          minTokens: 500,
        }),
        identity: wrapContent(identity, {
          preserve: 'both',
          minTokens: 1000,
        }),
        transcript: wrapContent(transcript, {
          preserve: 'bottom',
          minTokens: 500,
        }),
        tool_names: tool_names.join(', '),
        readonly_vars: readonly_vars.join(', '),
        writeable_vars: writeable_vars.join(', '),
        variables_example,
        few_shots: examples,
        protocol: wrapContent(protocol, {
          preserve: 'both',
          minTokens: 500,
        }),
        message_contract: getMessageContract(props.components, props.exits),
      }).trim(),
    },
    parts: {
      instructions: identity,
      tools: dts,
      transcript,
      protocol,
      examples,
    },
  }
}

const getInitialUserMessage: Prompt['getInitialUserMessage'] = async (props) => {
  const isChatMode = props.components.length > 0
  const transcript = [...props.transcript].reverse()
  let recap = isChatMode
    ? 'Nobody has spoken yet in this conversation. You can start by saying something.'
    : 'Carry out the assigned task.'

  if (transcript.length && transcript[0]?.role === 'user') {
    const lastContent = transcript[0].content.trim()
    const lastHasVoiceAudio = transcript[0].attachments?.some((attachment) => attachment.type === 'audio')
    const lastIsVoice = lastHasVoiceAudio || transcript[0].modality === 'voice'

    if (lastHasVoiceAudio && !lastContent.length) {
      recap =
        'The user spoke last. They sent a voice message: what they said is spoken out loud in the attached audio, not typed as text.'
    } else if (lastHasVoiceAudio) {
      recap = `The user spoke last. They sent a voice message (spoken audio, attached below) along with this text:
<last_message>
${lastContent}
</last_message>`.trim()
    } else if (lastIsVoice) {
      recap =
        `The user spoke last. They sent a voice message — the text below is a transcript of what they said out loud:
<last_message>
${lastContent}
</last_message>`.trim()
    } else {
      recap = `The user spoke last. Here's what they said:
<last_message>
${lastContent}
</last_message>`.trim()
    }
  } else if (transcript.length && transcript[0]?.role === 'assistant') {
    recap = `You are the one who spoke last. Here's what you said last:
<last_message>
${transcript[0]?.content.trim()}
</last_message>`.trim()
  } else if (transcript.length && transcript[0]?.role === 'event') {
    recap = `An event was triggered last. Here's what it was:
<last_message>
${inspect(transcript[0]?.payload, transcript[0]?.name, { tokens: 5000 })}
</last_message>`.trim()
  }

  const attachments = transcript
    .flatMap((x) => (x.role === 'user' || x.role === 'event' ? (x.attachments ?? []) : []))
    .slice(-10)

  if (attachments.length) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    return {
      role: 'user',
      type: 'multipart',
      content: [
        {
          type: 'text',
          text: replacePlaceholders(isChatMode ? CHAT_USER_PROMPT_TEXT : WORKER_USER_PROMPT_TEXT, {
            recap,
            ...(isChatMode ? { message_contract: getMessageContract(props.components, props.exits, false) } : {}),
          }).trim(),
        },
        ...attachments.flatMap<LLMzPrompts.MessageContent>((attachment, idx) => {
          const ref = attachment.id ?? alphabet[idx % alphabet.length]
          const alt = attachment.alt ? ` (${attachment.alt})` : ''
          if (attachment.type === 'audio') {
            return [
              {
                type: 'text',
                text: `The user spoke this message aloud. Here's the voice message [${ref}]${alt} — what is said in this audio is what the user said:`,
              },
              {
                type: 'audio',
                url: attachment.url,
              },
            ]
          }
          return [
            {
              type: 'text',
              text: `Here's the attachment [${ref}]${alt}`,
            },
            {
              type: 'image',
              url: attachment.url,
            },
          ]
        }),
      ] satisfies LLMzPrompts.MessageContent[],
    }
  }

  return {
    role: 'user',
    content: replacePlaceholders(isChatMode ? CHAT_USER_PROMPT_TEXT : WORKER_USER_PROMPT_TEXT, {
      recap,
      ...(isChatMode ? { message_contract: getMessageContract(props.components, props.exits, false) } : {}),
    }).trim(),
  }
}

const recoveryReminder =
  'Recover SILENTLY by default: do not send apologies, error reports, or retry announcements between attempts. Keep attempts bounded. Give the final answer when ready; mention a failure only if it still blocks completion or requires user input. Explicit requests or applicable examples for recovery updates override these defaults. If updates are requested after EACH failure, send one for THIS failure before retrying, even if its wording matches an earlier update.'

const getInvalidCodeMessage = async (props: LLMzPrompts.InvalidCodeProps): Promise<LLMzPrompts.Message> => {
  return {
    role: 'user',
    content: `
## Important message from the VM

The response you provided is invalid. Here's the error:

Code:

\`\`\`ts
${wrapContent(props.code)}
\`\`\`

Error:
\`\`\`
${wrapContent(props.message, { flex: 4 })}
\`\`\`

${props.variables ? `Preserved variables (reuse these):\n${wrapContent(inspect(props.variables) ?? '', { preserve: 'top' })}` : ''}
${props.toolCalls ? `Actual tool calls and outcomes (completed calls must NOT be repeated to fix formatting):\n${wrapContent(inspect(props.toolCalls) ?? '', { preserve: 'top' })}` : ''}

Fix the error within the remaining generation budget. If the task also sets a tool-attempt limit, count actual tool calls only: an invalid response that executed no tool does not consume a tool attempt.
${/\n\s*<\/run>\s*$/.test(props.code) ? 'The trailing </run> is the syntax error. DELETE that line. A ■run block is plain JavaScript, not XML: close the response with ■end after the last JavaScript line, with NO XML closing tag.' : ''}
${props.isChatEnabled === false ? '' : `${recoveryReminder}\nAny messages already sent have been delivered. Do not repeat them while correcting the code or exit.`}

Expected response format (■ blocks):
${exampleBoundaryInstructions}
${props.isChatEnabled ? 'To answer or ask a question, write ■send=<component> on its own line BEFORE the message body, then ■next=<exit>. Unmarked text is discarded. Keep private reasoning out of send blocks. An exit alone sends nothing; use it only for intentional silence or a handoff requiring no message.' : ''}
For an exit, put ALL required props in a JSON object on the SAME LINE as ■next=<exit>. An exit has NO body: putting the object on the next line leaves its props missing.

${quoteResponseExample('■run\n// code here')}

Or finish with:

${quoteResponseExample('■next=<exit> {props?}')}
`.trim(),
  }
}

const getCodeExecutionErrorMessage = async (
  props: LLMzPrompts.CodeExecutionErrorProps
): Promise<LLMzPrompts.Message> => {
  return {
    role: 'user',
    content: `
## Important message from the VM

An error occurred while executing the code.

${wrapContent(props.message, { preserve: 'top', flex: 4 })}

Stack Trace:
\`\`\`
${wrapContent(cleanStackTrace(props.stacktrace), { flex: 6, preserve: 'top' })}
\`\`\`

${props.variables ? `Variables preserved from execution:\n${wrapContent(inspect(props.variables) ?? '', { preserve: 'top' })}` : ''}
${props.toolCalls ? `Tool results from this attempt (including parallel calls):\n${wrapContent(inspect(props.toolCalls) ?? '', { preserve: 'top' })}` : ''}

If the task sets a tool-attempt limit, count actual calls across ALL previous responses, including the call that just failed. The initial call counts as one attempt; retries use the remaining attempts. Invalid code that called no tool is not a tool attempt. If the limit is reached, DO NOT call the tool again; finish with the available outcome. Do not invent a tool-attempt limit when none was assigned. Always respect the generation budget separately.
Otherwise, resume at the FAILED operation; do not restart the whole code block. Reuse preserved data instead of repeating successful reads or side effects. For a temporary failure, retry the failed operation when attempts remain; for invalid code or inputs, correct the cause first. Then continue the remaining work. ${props.isChatEnabled === false ? 'If completion is blocked, use an available exit to report the outcome according to the assigned task.' : recoveryReminder}

Continue with a new response using the available ■ blocks.
`.trim(),
  }
}

const getThinkingMessage = async (props: LLMzPrompts.ThinkingProps): Promise<LLMzPrompts.Message> => {
  let context = ''

  if (isPlainObject(props.variables)) {
    const mapped = Object.entries(props.variables ?? {}).reduce<string[]>((acc, [key, value]) => {
      const inspected = inspect(value, key)

      if (inspected) {
        acc.push(inspected)
      } else {
        acc.push(`Value of ${key} is ${wrapContent(JSON.stringify(value, null, 2))}`)
      }
      return acc
    }, [])

    context = mapped.join('\n\n')
  } else if (Array.isArray(props.variables)) {
    const mapped = props.variables.map((value, index) => {
      const inspected = inspect(value, `Index ${index}`)

      if (inspected) {
        return inspected
      } else {
        return `Value at index ${index} is ${wrapContent(JSON.stringify(value, null, 2))}`
      }
    })

    context = mapped.join('\n\n')
  } else if (typeof props.variables === 'string') {
    context = props.variables
  } else {
    context = inspect(props.variables) ?? JSON.stringify(props.variables, null, 2)
  }

  return {
    role: 'user',
    content: `
## Important message from the VM

${props.interrupted ? 'A tool paused code execution to request your attention. Its reason and context below may supply a result or request further work.' : "The code execution completed. Here's the context:"}
-------------------
Reason: ${props.reason || 'Code execution returned a value'}
Context:
${wrapContent(context, { preserve: 'top' })}
-------------------

Continue with a new response using ■ blocks. ${props.interrupted ? "Follow the tool's request. If it supplied no result and the task still needs one, call that tool again after addressing its request. Do not repeat earlier operations that already succeeded." : 'Do not re-run successful code or tools. An empty result is normal for tools that return no value; it does NOT mean execution failed. Do not repeat reads just to verify these successful operations. Use the available results; if the task is complete, finish with an available exit.'} A successful search with NO matches has not answered the question: run a refined query when it could help. A different query is new work, not a repeat of the successful call. Keep internal deliberation private.
${
  props.isChatEnabled === false
    ? ''
    : props.discardedMessages
      ? 'Messages generated after the returning code were discarded: you wrote them before seeing the result. They were NOT delivered and are NOT evidence. Answer now using the actual result above. Any messages before that code were already delivered; do not repeat those.'
      : 'Any ■send messages from your previous response have already been delivered to the user — never repeat or rephrase them; continue from where you left off.'
}
`.trim(),
  }
}

const getSnapshotResolvedMessage = (props: LLMzPrompts.SnapshotResolvedProps): LLMzPrompts.Message => {
  if (props.snapshot.status.type !== 'resolved') {
    throw new Error('Snapshot is not resolved')
  }

  let variablesMessage = ''
  const injectedVariables: Record<string, unknown> = {}

  for (const variable of props.snapshot.variables) {
    if (!variable.truncated) {
      injectedVariables[variable.name] = variable.value
      variablesMessage += `
// Variable "${variable.name}" restored with its full value:
// ${wrapContent(inspect(variable.value)?.split('\n').join('\n// ') ?? '')}
declare const ${variable.name}: ${variable.type}\n`
    } else {
      variablesMessage += `
// The variable "${variable.name}" was too large to be restored with its full value, here's a preview of its last known value:
// ${wrapContent(variable.preview.split('\n').join('\n// '))}
// Important: To restore the full value, please re-run the code that generated this variable in the first place.
let ${variable.name}: undefined | ${variable.type} = undefined;\n`
    }
  }

  const output = wrapContent(inspect(props.snapshot.status.value)?.split('\n').join('\n * ') ?? '', {
    preserve: 'top',
    flex: 4,
  })

  return {
    role: 'user',
    content: `
## Important message from the VM

The execution of an asynchronous code block has been completed. Here's the code that was executed:
${cleanStackTrace(props.snapshot.stack).split('\n').slice(0, -1).join('\n')}
// Reason: ${props.snapshot.reason}
\`\`\`tsx
/**
 * Here's the output:
 * ${output}
 * */
\`\`\`

Continue the task from here, without repeating the above code, as it has already been executed. Here's the variables you can rely on:

\`\`\`tsx
${wrapContent(variablesMessage)}
\`\`\`

You can now assume that the code you about to generate can rely on the variables "${Object.keys(injectedVariables).join('", "')}" being available.
There are NO OTHER VARIABLES than the ones listed above.

IMPORTANT: Do NOT re-run the code that was already executed. This would be a critical error. Instead, continue the task from here.

Continue with a new response using the available ■ blocks.
`.trim(),
  }
}

const getSnapshotRejectedMessage = (props: LLMzPrompts.SnapshotRejectedProps): LLMzPrompts.Message => {
  if (props.snapshot.status.type !== 'rejected') {
    throw new Error('Snapshot is not resolved')
  }

  const errorMessage = inspect(props.snapshot.status.error) ?? 'Unknown Error'

  const output = wrapContent(errorMessage.split('\n').join('\n * ') ?? 'Unknown Error', {
    preserve: 'both',
    minTokens: 100,
  })

  return {
    role: 'user',
    content: `
## Important message from the VM

An error occurred while executing the code. Here is the code that was executed so far:

${cleanStackTrace(props.snapshot.stack).split('\n').slice(0, -1).join('\n')}
// Reason: ${props.snapshot.reason}

Here's the error:
${output}

Continue the task from here, without repeating the above code, as it has already been executed.
IMPORTANT: Do NOT re-run the code that was already executed. This would be a critical error. Instead, continue the task from here.

Continue with a new response using the available ■ blocks.
`.trim(),
  }
}

const getStopTokens = () => ['\n■end']

export const DualModePrompt: Prompt = {
  getSystemMessage,
  getExecutionState,
  getInitialUserMessage,
  getThinkingMessage,
  getInvalidCodeMessage,
  getCodeExecutionErrorMessage,
  getSnapshotResolvedMessage,
  getSnapshotRejectedMessage,
  getStopTokens,
  parseAssistantResponse,
}
