import Handlebars from 'handlebars'
import { isPlainObject } from 'lodash-es'
import { inspect } from '../inspect.js'
import { getObjectTypings } from '../objects.js'
import { OAI } from '../openai.js'
import { wrapContent } from '../truncator.js'

import SYSTEM_PROMPT_TEXT from './oct-2024-system.md.js'
import USER_PROMPT_TEXT from './oct-2024-user.md.js'
import { LLMzPrompts, PromptVersion } from './prompt.js'

const replacePlaceholders = (prompt: string, values: Record<string, unknown>) => {
  const regex = new RegExp('■■■([A-Z0-9_\\.-]+)■■■', 'gi')
  const obj = Object.assign({}, values)

  const replaced = prompt.replace(regex, (_match, name) => {
    if (name in values) {
      delete obj[name]
      return typeof values[name] === 'string' ? (values[name] as string) : JSON.stringify(values[name])
    } else {
      throw new Error(`Placeholder not found: ${name}`)
    }
  })

  const remaining = Object.keys(obj).filter((key) => key !== 'is_message_enabled')

  if (remaining.length) {
    throw new Error(`Missing placeholders: ${remaining.join(', ')}`)
  }

  const compile = Handlebars.compile(replaced)

  const compiled = compile({
    is_message_enabled: false,
    ...values,
  })

  return compiled.replace(/\n{3,}/g, '\n\n').trim()
}

export const getSystemMessage: PromptVersion['getSystemMessage'] = async (props) => {
  let dts = ''

  const tool_names: string[] = []
  const readonly_vars: string[] = []
  const writeable_vars: string[] = []
  let canTalk = false

  // Parallelize the generation of typings for each object
  const objectTypingsPromise = props.objects.map((obj) => ({
    ...obj,
    typings: getObjectTypings(obj).withTools().withProperties().build(),
  }))

  for (const obj of objectTypingsPromise) {
    dts += (await obj.typings) + '\n\n\n'
    for (const tool of obj.tools) {
      tool_names.push(`${obj.name}.${tool.name}`)
    }
    for (const prop of obj.properties) {
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
    if (tool.name === 'Message') {
      canTalk = true
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

  if (!dts) {
    throw new Error('No typings generated')
  }

  return {
    role: 'system' as const,
    content: replacePlaceholders(SYSTEM_PROMPT_TEXT, {
      is_message_enabled: canTalk,
      'tools.d.ts': dts,
      identity: props.instructions?.length ? props.instructions : 'No specific instructions provided',
      transcript: props.transcript.toString(),
      tool_names: tool_names.join(', '),
      readonly_vars: readonly_vars.join(', '),
      writeable_vars: writeable_vars.join(', '),
      variables_example,
    }).trim(),
  }
}

const getInitialUserMessage: PromptVersion['getInitialUserMessage'] = async (props) => {
  const transcript = [...props.transcript].reverse()
  let recap = 'Nobody has spoken yet in this conversation. You can start by saying something.'

  const hasUserSpokenLast = transcript.length && transcript[0]?.role === 'user'
  const hasAssistantSpokenLast = transcript.length && transcript[0]?.role === 'assistant'

  if (hasUserSpokenLast) {
    recap = `The user spoke last. Here's what they said:
■im_start
${transcript[0]?.content.trim()}
■im_end`.trim()
  } else if (hasAssistantSpokenLast) {
    recap = `You are the one who spoke last. Here's what you said last:
■im_start
${transcript[0]?.content.trim()}
■im_end`.trim()
  }

  return {
    role: 'user',
    content: replacePlaceholders(USER_PROMPT_TEXT, {
      recap,
    }).trim(),
  }
}

const getInvalidCodeMessage = async (props: LLMzPrompts.InvalidCodeProps): Promise<OAI.Message> => {
  return {
    role: 'user',
    name: 'VM',
    content: `
## Important message from the VM

The code you provided is invalid. Here's the error:

Code:

\`\`\`tsx
■fn_start
${wrapContent(props.error.code)}
■fn_end
\`\`\`

Error:
\`\`\`
${wrapContent(props.error.message, { flex: 4 })}
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

const getFeedbackMessage = async (props: LLMzPrompts.FeedbackProps) => {
  return {
    role: 'user',
    name: 'VM',
    content: `
## Important message from the VM

The code you provided has been deemed incorrect by a group of expert reviewers. Here's their feedback:
\`\`\`
${wrapContent(props.feedback)}
\`\`\`

Please fix the code according to the feedback and try again.

Expected output:

\`\`\`tsx
■fn_start
// code here
■fn_end
\`\`\`
`.trim(),
  } as const
}

const getCodeExecutionErrorMessage = async (props: LLMzPrompts.CodeExecutionErrorProps): Promise<OAI.Message> => {
  return {
    role: 'user',
    name: 'VM',
    content: `
## Important message from the VM

An error occurred while executing the code.

${wrapContent(props.error.message, { preserve: 'top', flex: 4 })}

Stack Trace:
\`\`\`
${wrapContent(props.error.stacktrace, { flex: 6, preserve: 'top' })}
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

const getThinkingMessage = async (props: LLMzPrompts.ThinkingProps): Promise<OAI.Message> => {
  let context = ''

  if (isPlainObject(props.signal.context)) {
    const mapped = Object.entries(props.signal.context ?? {}).reduce<string[]>((acc, [key, value]) => {
      const inspected = inspect(value, key)

      if (inspected) {
        acc.push(inspected)
      } else {
        acc.push(`Value of ${key} is ${wrapContent(JSON.stringify(value, null, 2))}`)
      }
      return acc
    }, [])

    context = mapped.join('\n\n')
  } else if (Array.isArray(props.signal.context)) {
    const mapped = props.signal.context.map((value, index) => {
      const inspected = inspect(value, `Index ${index}`)

      if (inspected) {
        return inspected
      } else {
        return `Value at index ${index} is ${wrapContent(JSON.stringify(value, null, 2))}`
      }
    })

    context = mapped.join('\n\n')
  } else if (typeof props.signal.context === 'string') {
    context = props.signal.context
  } else {
    context = inspect(props.signal.context) ?? JSON.stringify(props.signal.context, null, 2)
  }

  return {
    role: 'user',
    name: 'VM',
    content: `
## Important message from the VM

The assistant requested to think. Here's the context:
-------------------
Reason: ${props.signal.reason}
Context:
${wrapContent(context, { preserve: 'top' })}
-------------------

Please continue with the conversation (■fn_start).
`.trim(),
  }
}

const getSnapshotResolvedMessage = (props: LLMzPrompts.SnapshotResolvedProps): OAI.Message => {
  let variablesMessage = ''

  const resolve = props.result.callback
  const value = props.result.result
  const injectedVariables = props.injectedVariables
  const snapshot = props.result.snapshot

  for (const variable of snapshot.variables) {
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

  const output = wrapContent(inspect(value)?.split('\n').join('\n * ') ?? '', { preserve: 'top', flex: 4 })

  return {
    role: 'user',
    name: 'VM',
    content: `
## Important message from the VM

The execution of an asynchronous code block has been completed. Here's the code that was executed:
${snapshot.stack.split('\n').slice(0, -1).join('\n')}
// ${resolve.description}
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

const getSnapshotRejectedMessage = (props: LLMzPrompts.SnapshotRejectedProps): OAI.Message => {
  const reject = props.result.callback
  const error = props.result.result
  const snapshot = props.result.snapshot

  const errorMessage = inspect(error) ?? 'Unknown Error'

  const output = wrapContent(errorMessage.split('\n').join('\n * ') ?? 'Unknown Error', {
    preserve: 'both',
    minTokens: 100,
  })

  return {
    role: 'user',
    name: 'VM',
    content: `
## Important message from the VM

An error occurred while executing the code. Here is the code that was executed so far:

${snapshot.stack.split('\n').slice(0, -1).join('\n')}

${reject.description}
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

const parseAssistantResponse = (response: string) => {
  const raw = response
  let code = response

  const START_TOKEN = '■fn_start'
  const END_TOKEN = '■fn_end'

  if (!code.includes(START_TOKEN)) {
    code = `${START_TOKEN}\n${code.trim()}`
  }

  if (!code.includes(END_TOKEN)) {
    code = `${code.trim()}\n${END_TOKEN}`
  }

  const start = Math.max(code.indexOf(START_TOKEN) + START_TOKEN.length, 0)
  const end = Math.min(code.indexOf(END_TOKEN), code.length)

  code = code
    .slice(start, end)
    .trim()
    .split('\n')
    .filter((line, index, arr) => {
      const isFirstOrLastLine = index === 0 || index === arr.length - 1
      if (isFirstOrLastLine && line.trim().startsWith('```')) {
        return false
      }
      return true
    })
    .join('\n')

  return {
    type: 'code',
    raw,
    code,
  } as const
}

export const Oct2024Prompt: PromptVersion<'01-Oct-2024'> = {
  version: '01-Oct-2024',
  status: 'stable',
  description: 'This version improves the generation of messages.',
  displayName: 'October 2024',
  getSystemMessage,
  getInitialUserMessage,
  getThinkingMessage,
  getInvalidCodeMessage,
  getFeedbackMessage,
  getCodeExecutionErrorMessage,
  getSnapshotResolvedMessage,
  getSnapshotRejectedMessage,
  getStopTokens,
  parseAssistantResponse,
}
