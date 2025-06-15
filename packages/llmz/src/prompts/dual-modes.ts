import { isPlainObject } from 'lodash-es'
import { getComponentReference } from '../component.js'
import { inspect } from '../inspect.js'
import { cleanStackTrace } from '../stack-traces.js'
import { wrapContent } from '../truncator.js'

import CHAT_SYSTEM_PROMPT_TEXT from './chat-mode/system.md.js'
import CHAT_USER_PROMPT_TEXT from './chat-mode/user.md.js'

import { parseAssistantResponse, replacePlaceholders } from './common.js'
import { LLMzPrompts, Prompt } from './prompt.js'

import WORKER_SYSTEM_PROMPT_TEXT from './worker-mode/system.md.js'
import WORKER_USER_PROMPT_TEXT from './worker-mode/user.md.js'

type ExitType = {
  name: string
  description: string
  has_typings: boolean
  typings?: string
}

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

  const exits: ExitType[] = []

  for (const exit of props.exits) {
    if (exit.zSchema) {
      exits.push({
        name: exit.name,
        description: exit.description,
        has_typings: true,
        typings: exit.zSchema.toTypescript(),
      })
    } else {
      exits.push({
        name: exit.name,
        description: exit.description,
        has_typings: false,
      })
    }
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
    variables_example = `

\`\`\`tsx
${variables_example}
\`\`\``
  }

  return {
    role: 'system' as const,
    content: replacePlaceholders(canTalk ? CHAT_SYSTEM_PROMPT_TEXT : WORKER_SYSTEM_PROMPT_TEXT, {
      is_message_enabled: canTalk,
      'tools.d.ts': wrapContent(dts, {
        preserve: 'both',
        minTokens: 500,
      }),
      identity: wrapContent(props.instructions?.length ? props.instructions : 'No specific instructions provided', {
        preserve: 'both',
        minTokens: 1000,
      }),
      transcript: wrapContent(props.transcript.toString(), {
        preserve: 'bottom',
        minTokens: 500,
      }),
      tool_names: tool_names.join(', '),
      readonly_vars: readonly_vars.join(', '),
      writeable_vars: writeable_vars.join(', '),
      variables_example,
      exits,
      components: wrapContent(
        props.components.map((component) => getComponentReference(component.definition)).join('\n\n'),
        {
          preserve: 'top',
          minTokens: 500,
        }
      ),
    }).trim(),
  }
}

const getInitialUserMessage: Prompt['getInitialUserMessage'] = async (props) => {
  // TODO: iteration.mode -> chat vs worker based on tools
  const isChatMode = props.globalTools.find((tool) => tool.name.toLowerCase() === 'message')
  const transcript = [...props.transcript].reverse()
  let recap = isChatMode
    ? 'Nobody has spoken yet in this conversation. You can start by saying something.'
    : 'Nobody has spoken yet in this conversation.'

  if (transcript.length && transcript[0]?.role === 'user') {
    recap = `The user spoke last. Here's what they said:
■im_start
${transcript[0]?.content.trim()}
■im_end`.trim()
  } else if (transcript.length && transcript[0]?.role === 'assistant') {
    recap = `You are the one who spoke last. Here's what you said last:
■im_start
${transcript[0]?.content.trim()}
■im_end`.trim()
  } else if (transcript.length && transcript[0]?.role === 'event') {
    recap = `An event was triggered last. Here's what it was:
■im_start
${inspect(transcript[0]?.payload, transcript[0]?.name, { tokens: 5000 })}
■im_end`.trim()
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
          }).trim(),
        },
        ...attachments.flatMap<LLMzPrompts.MessageContent>((attachment, idx) => {
          return [
            {
              type: 'text',
              text: `Here's the attachment [${alphabet[idx % alphabet.length]}]`,
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
    }).trim(),
  }
}

const getInvalidCodeMessage = async (props: LLMzPrompts.InvalidCodeProps): Promise<LLMzPrompts.Message> => {
  return {
    role: 'user',
    content: `
## Important message from the VM

The code you provided is invalid. Here's the error:

Code:

\`\`\`tsx
■fn_start
${wrapContent(props.code)}
■fn_end
\`\`\`

Error:
\`\`\`
${wrapContent(props.message, { flex: 4 })}
\`\`\`

Please fix the error and try again.

Expected output:

\`\`\`tsx
■fn_start
// code here
■fn_end
\`\`\`
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

Let the user know that an error occurred, and if possible, try something else. Do not repeat yourself in the message.

Expected output:

\`\`\`tsx
■fn_start
// code here
■fn_end
\`\`\`
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

The assistant requested to think. Here's the context:
-------------------
Reason: ${props.reason || 'Thinking requested'}
Context:
${wrapContent(context, { preserve: 'top' })}
-------------------

Please continue with the conversation (■fn_start).
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

Continue the conversation from here, without repeating the above code, as it has already been executed. Here's the variables you can rely on:

\`\`\`tsx
${wrapContent(variablesMessage)}
\`\`\`

You can now assume that the code you about to generate can rely on the variables "${Object.keys(injectedVariables).join('", "')}" being available.
There are NO OTHER VARIABLES than the ones listed above.

IMPORTANT: Do NOT re-run the code that was already executed. This would be a critical error. Instead, continue the conversation from here.

Expected output:

\`\`\`tsx
■fn_start
// code here
■fn_end
\`\`\`
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

Continue the conversation from here, without repeating the above code, as it has already been executed.
IMPORTANT: Do NOT re-run the code that was already executed. This would be a critical error. Instead, continue the conversation from here.

Expected output:
\`\`\`tsx
■fn_start
// code here
■fn_end
\`\`\`
`.trim(),
  }
}

const getStopTokens = () => ['■fn_end']

export const DualModePrompt: Prompt = {
  getSystemMessage,
  getInitialUserMessage,
  getThinkingMessage,
  getInvalidCodeMessage,
  getCodeExecutionErrorMessage,
  getSnapshotResolvedMessage,
  getSnapshotRejectedMessage,
  getStopTokens,
  parseAssistantResponse,
}
