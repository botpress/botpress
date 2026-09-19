import { transforms } from '@bpinternal/zui'
import { parse } from 'acorn'
import MagicString from 'magic-string'
import type { Component } from '../component.js'
import type { Example, ExampleMessage } from '../example.js'
import type { Exit } from '../exit.js'
import {
  createNativeToolCatalogue,
  getComponentJSONSchema,
  getComponentPropsSchema,
  getNativeTextComponent,
  isNativeTextComponent,
  validateNativePresentationInputs,
  type NativePresentationInput,
} from '../runtime/native-tools.js'
import type { LLMzPrompts } from './prompt.js'

type NativeInitialStateProps = LLMzPrompts.InitialStateProps & { isChatEnabled?: boolean }

const runtimeRules = (chat: boolean, hasTaskExits: boolean) =>
  [
    '# Responses and execution',
    chat
      ? 'Reply to the user with normal assistant text. Text and voice replies stream normally. A completed response without tool calls finishes the turn. All assistant text is visible to the user; keep private reasoning out of it.'
      : 'Complete the assigned task with return exit(name, payload) inside JavaScript. Assistant prose alone does not complete a worker task.',
    ...(chat && hasTaskExits
      ? [
          'When a known outcome matches a registered task exit description, call that exit with its required payload, even if you also explain the outcome in assistant text. An apology or other prose does not select a typed exit. Use listen only when waiting for the user or when no task outcome matches a registered exit.',
        ]
      : []),
    'run_javascript is the only native tool and accepts { code: string }. Write JavaScript with top-level await and return. TypeScript declarations below document the API; do not write type annotations, imports, JSX, eval, or Function constructors in executable code. Dynamically generated code is not supported.',
    'Make at most one run_javascript call per response. Chain dependent operations inside JavaScript; await Promise.all for independent business operations when safe.',
    'Return inspect(value) to inspect a result in another model response. A plain JavaScript return value has the same inspection behavior, including undefined. Use return exit(name, payload) to finish with an available typed exit; JavaScript can compute that payload from actual tool results without another model response.',
    'Always prefer return exit(...). A valid exit(...) also stops JavaScript if return is omitted, including surrounding catch and finally blocks. Invalid names or payloads raise ordinary validation errors. Complete all required work before exiting.',
    'inspect(...), chat.present(...), and chat.buttons(...) construct opaque decisions that take effect only when returned as the result of the JavaScript program. Never fabricate, serialize, or store a decision as persistent memory.',
    ...(chat
      ? [
          'Use return exit() to wait silently when listen is available. Return chat.present({ messages: [...] }) to send an ordered rich-message batch and finish through listen. Return chat.buttons([...]) to send buttons and finish. These returned decisions need no separate listen call or extra model response.',
          'For a different completion after presentation, use return chat.present({ messages, exit: { name, payload } }). The exit field is plain data; calling exit(...) while constructing the input would stop before presentation.',
          'Use await chat.send(messageOrArray) for nonterminal delivery when program order requires it. For progress already known before execution, prefer normal assistant text accompanying the tool call. Never print a rich-message description instead of presenting its registered component.',
        ]
      : []),
    'Await all business operations before calling exit or returning a terminal presentation. Do not combine terminal presentation or exit with unfinished sibling operations in Promise.all. Completion validates payloads, preserves memory, and requires all necessary deliveries and the exit hook to succeed.',
    'Execution may overlap the remaining response stream, but the model has not seen its results within that response. Accompanying text can describe progress, not unseen outcomes. Return an inspection result when another model response must interpret the evidence.',
    'Keep routine calls and recovery silent unless the user or task requests progress updates. Do not announce a lookup or retry by default; answer once you have the results.',
    'Use only documented JavaScript functions, objects, and loaded memory. Runtime availability may change between responses. Do not assume browser, network, filesystem, or package APIs are available.',
    'Declare new retained variables at top level with const or let, for example const count = 0. Bare assignment such as count = 1 only updates a variable already declared in this program or listed in Memory; it never creates one. Captured named variables remain available across JavaScript calls and transcript compaction. The Memory overview identifies their values and assignment ages.',
    'Object properties are immutable snapshots. Change a writable property by assigning its complete replacement value, such as account.profile = { ...account.profile, age: 42 }; nested edits are forbidden and every replacement is schema-validated.',
    '$return contains the latest successful inspection result. $iterations is read-only, newest-first retained history: [0] is the last settled iteration, [1] the preceding one. The current execution is not in the array. Entries without results still occupy indexes; check hasResult. Compaction removes automatic results, not named variables.',
    'Return values and history are read-only snapshots. Assign useful data to a named variable to retain it independently. Assignment age describes when a variable was set, not when its underlying data was fetched.',
    'Tool results report returns, memory changes, delivery receipts, errors, and interruptions. Reuse preserved variables and acknowledged deliveries; do not repeat successful actions just to correct later errors. A failed delivery may have an uncertain external outcome.',
    'An operational error does not by itself finish the task. When recovery is safe and authorized, address the cause and retry failed work without repeating successful actions. If planning recovery needs another model response, return an inspection result with the error and partial results, or let the error reach the runtime, instead of choosing a failure exit in catch. Use failure completion when recovery is unavailable, unsafe, forbidden, or the attempt or response budget is exhausted. Honor task instructions defining terminal failure outcomes.',
    'Do not precommit an unseen tool error to terminal failure with a blanket catch or an if (failed.length) exit(...) branch. Inspect its actual cause against the available tools. Apply a specific safe, authorized repair and retry only failed work; if the program has no such recovery handler, return inspect({ errors, completed }) so the next response can diagnose it. Failure completion requires a concrete reason recovery cannot continue, or an instruction making that failure terminal.',
    'A snapshot or thinking interruption stops the current program. Statements after the interruption have not run. Resolution supplies the interrupted operation outcome; it does not replay or resume the remaining JavaScript.',
    'Respect tool-attempt limits and the separate model-response budget. An empty successful inspection result is not a failure. Recover silently by default unless the user or task requests progress updates.',
  ].join('\n\n')

function findExampleComponent(message: ExampleMessage, components: readonly Component[]): Component {
  const name = typeof message.component === 'string' ? message.component : message.component.definition.name
  const component = components.find((candidate) => {
    const names = [candidate.definition.name, ...(candidate.definition.aliases ?? [])]

    return names.some((candidateName) => candidateName.toLowerCase() === name.toLowerCase())
  })

  if (!component) {
    throw new Error(`Unknown native example component: ${name}`)
  }

  return component
}

function exampleExit(example: Example, exits: readonly Exit[]): { name: string; expression: string } | undefined {
  const requested = example.definition.exit

  if (requested === undefined) {
    return undefined
  }

  const name = typeof requested === 'string' ? requested : requested.name
  const exit = exits.find((candidate) => {
    return [candidate.name, ...candidate.aliases].some((alias) => alias.toLowerCase() === name.toLowerCase())
  })

  if (!exit) {
    throw new Error(`Unknown native example exit: ${name}`)
  }

  const value = example.definition.props

  if (exit.zSchema) {
    exit.zSchema.parse(value)
  } else if (value !== undefined && (!value || typeof value !== 'object' || Object.keys(value).length)) {
    throw new Error(`Example exit ${name} takes no payload.`)
  }

  const payload = value === undefined ? '' : `, ${JSON.stringify(value)}`

  return { name: exit.name.toLowerCase(), expression: `exit(${JSON.stringify(exit.name)}${payload})` }
}

/** Preserve top-level declarations and original return-expression effects when adding completion. */
function withExampleCompletion(code: string, completion: string): string {
  const source = new MagicString(code)
  const tree = parse(code, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') {
      return
    }

    const current = node as { type?: string; start: number; end: number; argument?: { start: number; end: number } }

    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(current.type ?? '')) {
      return
    }

    if (current.type === 'ReturnStatement') {
      const value = current.argument ? code.slice(current.argument.start, current.argument.end) : undefined
      const expression = value === undefined ? '' : `await (${value});\n`
      source.overwrite(current.start, current.end, `{\n${expression}return ${completion};\n}`)
      return
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        value.forEach(visit)
      } else {
        visit(value)
      }
    }
  }

  visit(tree)
  source.append(`\n\nreturn ${completion}`)

  return source.toString()
}

function renderExample(
  example: Example,
  index: number,
  components: readonly Component[],
  exits: readonly Exit[]
): string {
  const texts: string[] = []
  const messages: NativePresentationInput[] = []
  let exit: ReturnType<typeof exampleExit>

  try {
    exit = exampleExit(example, exits)

    for (const message of example.definition.messages ?? []) {
      const component = findExampleComponent(message, components)
      const input = {
        component: component.definition.name,
        ...(message.props === undefined ? {} : { props: message.props }),
        ...(message.body === undefined ? {} : { body: message.body }),
      }
      const [validated] = validateNativePresentationInputs([input], components)

      if (isNativeTextComponent(component) && !messages.length) {
        texts.push(message.body!)
      } else {
        messages.push(validated!)
      }
    }
  } catch (error) {
    throw new Error(`Invalid native example ${index + 1}: ${error instanceof Error ? error.message : String(error)}`)
  }

  const code = example.definition.code
  const lines: string[] = []

  if (messages.length && code === undefined && (!exit || exit.name === 'listen')) {
    if (!exits.some((candidate) => candidate.name.toLowerCase() === 'listen')) {
      throw new Error('Terminal presentation examples require the listen exit.')
    }

    lines.push(`return chat.present(${JSON.stringify({ messages })})`)
  } else {
    if (messages.length) {
      lines.push(`await chat.send(${JSON.stringify(messages)})`)
    }

    if (code !== undefined) {
      lines.push(exit ? withExampleCompletion(code, exit.expression) : code)
    } else if (exit && (exit.name !== 'listen' || !texts.length || messages.length)) {
      lines.push(`return ${exit.expression}`)
    }
  }

  const output = {
    ...(texts.length ? { text: texts.join('\n\n') } : {}),
    ...(lines.length ? { toolCalls: [{ name: 'run_javascript', arguments: { code: lines.join('\n\n') } }] } : {}),
  }

  return [
    `### Example ${index + 1}`,
    `Situation: ${JSON.stringify(example.situation)}`,
    ...(example.reason ? [`Reason: ${JSON.stringify(example.reason)}`] : []),
    'Desired assistant response:',
    JSON.stringify(output),
  ].join('\n')
}

/** Demonstrations remain hypothetical; code is parsed and rendered but never executed here. */
export function renderNativeExamples(
  examples: readonly Example[],
  components: readonly Component[],
  exits: readonly Exit[]
): string {
  if (!examples.length) {
    return ''
  }

  createNativeToolCatalogue({ components, exits })

  return [
    '# Hypothetical examples',
    'These examples explain desired behavior; they are not live conversation or completed work. The JSON illustrates assistant text and the single execution tool, not text to print. Apply an example only when its conditions match. Explicit task instructions and the current user request take precedence. Substitute actual facts for hypothetical values.',
    ...examples.map((example, index) => renderExample(example, index, components, exits)),
  ].join('\n\n')
}

function describeComponentExamples(component: Component): string | undefined {
  const definition = component.definition
  const examples = definition.generation?.examples

  if (!examples?.length) {
    return undefined
  }

  if (isNativeTextComponent(component)) {
    const responses = examples.map((example, index) => {
      const messages = Array.isArray(example) ? example : [example]
      const text = messages.map((message) => message.body).join('\n\n')

      return `Assistant text example ${index + 1}:\n${text}`
    })

    return ['Write these examples as ordinary assistant content, without a tool call:', ...responses].join('\n\n')
  }

  const presentations = examples.map((example) => {
    const messages = (Array.isArray(example) ? example : [example]).map((message) => ({
      component: definition.name,
      ...message,
    }))

    return `return chat.present(${JSON.stringify({ messages })});`
  })

  return ['Presentation examples (complete messages):', '```javascript', ...presentations, '```'].join('\n')
}

function describePresentation(component: Component): string {
  const definition = component.definition
  const hasBody = definition.type !== 'leaf' && definition.body !== false
  const bodyOptions = definition.type !== 'leaf' && definition.body ? definition.body : undefined
  let body = 'no body'

  if (hasBody) {
    body = bodyOptions?.required === false ? 'body: optional string' : 'body: required string'
  }

  return [
    `Component ${JSON.stringify(definition.name)}: ${definition.description}`,
    `Props schema: ${JSON.stringify(getComponentJSONSchema(component))}; ${body}.`,
    bodyOptions?.description,
    definition.generation?.usage,
    definition.generation?.doNotUseWhen && `Do not use when: ${definition.generation.doNotUseWhen}`,
    describeComponentExamples(component),
  ]
    .filter(Boolean)
    .join('\n')
}

function describeRuntimeAPI(props: NativeInitialStateProps, chat: boolean): string {
  const declarations = ['declare function inspect<T>(value?: T): InspectionDecision;']
  const exitTargets: string[] = []

  for (const exit of props.exits) {
    const name = JSON.stringify(exit.name)

    if (!exit.zSchema) {
      declarations.push(`declare function exit(name: ${name}): never;`)
      exitTargets.push(`{ name: ${name} }`)
      continue
    }

    const payload = transforms.toTypescriptType(exit.zSchema, { treatDefaultAsOptional: true })
    const optional = exit.zSchema.isOptional() ? '?' : ''

    declarations.push(`declare function exit(name: ${name}, payload${optional}: ${payload}): never;`)
    exitTargets.push(`{ name: ${name}; payload${optional}: ${payload} }`)
  }

  if (props.exits.some((exit) => exit.name.toLowerCase() === 'listen')) {
    declarations.push('declare function exit(): never; // Use return exit() to finish through listen.')
  }

  if (chat) {
    const button = props.components.find((component) => {
      const names = [component.definition.name, ...(component.definition.aliases ?? [])]

      return names.some((name) => name.toLowerCase() === 'button')
    })

    if (button) {
      const schema = getComponentPropsSchema(button.definition)
      const type = transforms.toTypescriptType(schema, { treatDefaultAsOptional: true })

      declarations.push(`type ButtonProps = ${type};`)
    }

    declarations.push(
      `type ExitTarget = ${exitTargets.join(' | ') || 'never'};`,
      'type Message = { component: string; props?: Record<string, unknown>; body?: string };',
      'declare const chat: {',
      '  present(input: { messages: Message[]; exit?: ExitTarget }): PresentationDecision;',
      ...(button ? ['  buttons(buttons: ButtonProps[]): PresentationDecision;'] : []),
      '  send(message: Message | Message[]): Promise<void>;',
      '};'
    )
  }

  const exits = props.exits.map((exit) => {
    const name = JSON.stringify(exit.name)

    if (!exit.schema) {
      return `exit(${name}): ${exit.description} No payload. This does not send a message.`
    }

    return `exit(${name}, payload): ${exit.description} Payload schema: ${JSON.stringify(exit.schema)}`
  })
  const components = chat ? props.components.map(describePresentation) : []

  return [
    'Use return exit(...) for completion. The function also stops execution if return is omitted. Returned presentation and inspection decisions are opaque runtime values, not objects to construct yourself.',
    '```typescript\n' + declarations.join('\n') + '\n```',
    ...exits,
    ...components,
  ].join('\n\n')
}

export async function getNativeSystemMessage(props: NativeInitialStateProps): Promise<LLMzPrompts.SystemMessage> {
  const chat = props.isChatEnabled ?? props.components.length > 0
  const declarations = await Promise.all([
    ...props.objects.filter((object) => object.tools?.length).map((object) => object.getToolTypings()),
    ...props.globalTools.map((tool) => tool.getTypings()),
  ])
  const instructions = props.instructions?.trim() || 'Carry out the assigned task.'
  const businessFunctions = declarations.join('\n\n') || '// No business functions are available.'
  const tools = [describeRuntimeAPI(props, chat), '```typescript\n' + businessFunctions + '\n```'].join('\n\n')
  const textComponent = getNativeTextComponent(props.components)
  const textDefinition = textComponent?.definition
  const bodyInstructions =
    textDefinition && textDefinition.type !== 'leaf' && textDefinition.body
      ? textDefinition.body.description
      : undefined
  const hasTaskExits = props.exits.some((exit) => exit.name.toLowerCase() !== 'listen')
  const protocol = [
    runtimeRules(chat, hasTaskExits),
    bodyInstructions && `Assistant text delivery: ${bodyInstructions}`,
  ]
    .filter(Boolean)
    .join('\n\n')
  const examples = renderNativeExamples(props.examples ?? [], props.components, props.exits)

  return {
    message: {
      role: 'system',
      content: [
        '# Task instructions',
        instructions,
        protocol,
        '# JavaScript API',
        'These declarations document callable functions inside run_javascript, including presentation, exits, business functions, and namespaced object methods. Functions may cause real effects. Object properties, their types, current values, and read/write rules are listed in Memory.',
        tools,
        examples,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
    parts: { instructions, tools, transcript: '', protocol, examples },
  }
}

/** Fresh execution state; append to the last input, never retain previous copies. */
export function getNativeExecutionState(props: NativeInitialStateProps): string {
  if (!props.iteration) {
    return ''
  }

  const { current, limit, toolAttempts, resumed } = props.iteration
  const chat = props.isChatEnabled ?? props.components.length > 0
  const completion = chat
    ? 'Finish with the available evidence or an honest incomplete outcome. JavaScript may await work and return exit(...) or chat.present(...) using the actual result.'
    : 'Complete by returning exit(name, payload) from run_javascript with a registered exit. If the task is incomplete, report it honestly with an incomplete or error payload only when the exit schema permits it. Assistant prose and inspection returns do not complete a worker.'

  return [
    '## Execution',
    `Response ${current} of ${limit}. ${Math.max(0, limit - current)} model responses remain after this one.`,
    ...(resumed ? ['Resuming an interrupted execution; use its recorded settlement and preserved memory.'] : []),
    ...(toolAttempts && Object.keys(toolAttempts).length
      ? [`Actual business calls, including failures: ${JSON.stringify(toolAttempts)}.`]
      : []),
    current >= limit
      ? `This is the last response. ${completion} Do not request JavaScript results that require another response to inspect. Never claim success for an unobserved action.`
      : 'Reserve another response when a result needs model interpretation. JavaScript may complete directly with a returned terminal decision when it already has the required data.',
    'The generation budget does not replace task-specific tool-attempt limits. Keep runtime budgets private unless requested.',
  ].join('\n')
}
