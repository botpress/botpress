import { transforms } from '@bpinternal/zui'
import { parse } from 'acorn'
import MagicString from 'magic-string'
import type { Component } from '../component.js'
import type { Example, ExampleMessage } from '../example.js'
import type { Exit } from '../exit.js'
import { formatTypings } from '../formatting.js'
import { resolveResponse, type ResolvedResponse } from '../response.js'
import {
  createNativeToolCatalogue,
  getNativeChatMethods,
  validateNativePresentationInputs,
  type NativeChatMethod,
  type NativePresentationInput,
} from '../runtime/native-tools.js'
import { fromJSONSchemaCompat } from '../utils.js'
import type { LLMzPrompts } from './prompt.js'

type NativeInitialStateProps = LLMzPrompts.InitialStateProps & { isChatEnabled?: boolean }

const runJavaScriptSyntax = [
  '# run_javascript syntax',
  'run_javascript is the only native tool. Call it with a JSON object containing exactly one property: "code", a non-empty string of JavaScript source.',
  'Example tool arguments:',
  '```json\n' + JSON.stringify({ code: 'const total = 2 + 3;\nreturn inspect({ total });' }, null, 2) + '\n```',
  'The code string is the body of an async JavaScript program. Top-level await and return are supported. Send the source directly in code, without Markdown fences or an enclosing function.',
  'The JavaScript API section uses TypeScript to describe the available functions. In code, use plain JavaScript without type annotations, imports, or JSX. eval, Function constructors, and dynamically generated code are not supported.',
  'Make at most one run_javascript call per response. Put multiple operations in that program: await dependent calls in order, or await Promise.all for independent business operations when safe.',
  'Use the JavaScript API section below for available functions, and the latest Memory overview for loaded variables and object properties. The Responses and execution section explains inspection and recovery.',
].join('\n\n')

function runtimeRules(props: NativeInitialStateProps, chat: boolean): string {
  const hasExits = props.exits.length > 0
  const hasComponents = chat && props.components.length > 0
  const hasTaskExits = props.exits.some((exit) => exit.name.toLowerCase() !== 'listen')
  const listen = props.exits.find((exit) => exit.name.toLowerCase() === 'listen')

  return [
    '# Responses and execution',
    ...(chat
      ? [
          'Reply to the user with normal assistant text. Assistant text streams normally. A completed response without tool calls finishes the turn. All assistant text is visible to the user; keep private reasoning out of it.',
        ]
      : [
          'Use JavaScript to carry out the assigned work and return inspect(value) when another response needs its results.',
        ]),
    hasExits
      ? 'Every run_javascript program must explicitly return inspect(value) for inspection or return exit("NAME", payload) with a registered name and its required payload for completion.'
      : 'Every run_javascript program must explicitly return inspect(value).',
    ...(!chat && hasExits
      ? [
          'Complete the assigned task with return exit("NAME", payload) inside JavaScript. Assistant prose alone does not complete a worker task.',
        ]
      : []),
    ...(chat && hasTaskExits
      ? [
          'When a known outcome matches a registered task exit description, return exit("NAME", payload) for that outcome, even if you also explain the outcome in assistant text. An apology or other prose does not select a typed exit.',
        ]
      : []),
    ...(chat && listen
      ? [
          `Use return exit(${JSON.stringify(listen.name)}) only when waiting for the user or when no task outcome matches another registered exit.`,
        ]
      : []),
    'The only way for the model to see a business tool return value is return inspect(value). JavaScript can use tool return values immediately to compute, branch, or call other functions, but the model has not seen those values until they are returned through inspect.',
    ...(hasExits
      ? [
          'Use the exact registered name and required payload in return exit("NAME", payload). JavaScript can compute that payload from tool results without another model response. Complete all required work before returning the named exit.',
        ]
      : []),
    'inspect(...) constructs an opaque decision that takes effect only when returned as the result of the JavaScript program. Never fabricate, serialize, or store a decision as persistent memory.',
    ...(hasComponents
      ? [
          'Send rich messages with the registered chat component methods in the JavaScript API. Each method accepts its documented props, sends synchronously, and returns void; do not await it. Calls send messages in invocation order, and the runtime waits for their delivery before settling the program.',
          hasExits
            ? 'Sending a message does not finish the turn. After sending, return exit("NAME", payload) for the appropriate registered outcome, or return inspect(value) if another response is needed.'
            : 'Sending a message does not finish the turn. After sending, return inspect(value) for the next response.',
          'For progress already known before execution, prefer normal assistant text accompanying the tool call. Never print a rich-message description instead of sending its registered component.',
        ]
      : []),
    'Await all business operations before the final return. Do not return with unfinished sibling operations in Promise.all.',
    ...(hasComponents ? ['The runtime joins queued message deliveries before settling the program.'] : []),
    ...(hasExits ? ['Completion validates the named exit payload and requires its hook to succeed.'] : []),
    'Execution may overlap the remaining response stream. Use return inspect(value) when another model response must interpret its results.',
    ...(chat
      ? [
          'Accompanying text can describe progress, not unseen outcomes. Keep routine calls and recovery silent unless the user or task requests progress updates. Do not announce a lookup or retry by default; answer once you have inspected the results.',
        ]
      : []),
    'Use only documented JavaScript functions, objects, and loaded memory. Runtime availability may change between responses. Do not assume browser, network, filesystem, or package APIs are available.',
    'Declare new retained variables at top level with const or let, for example const count = 0. Bare assignment such as count = 1 only updates a variable already declared in this program or listed in Memory; it never creates one. Captured named variables remain available across JavaScript calls and transcript compaction. The Memory overview identifies their values and assignment ages.',
    'Object properties are immutable snapshots. Change a writable property by assigning its complete replacement value, such as account.profile = { ...account.profile, age: 42 }; nested edits are forbidden and every replacement is schema-validated.',
    '$return contains the latest successful inspection result. $iterations is read-only, newest-first retained history: [0] is the last settled iteration, [1] the preceding one. The current execution is not in the array. Entries without results still occupy indexes; check hasResult. Compaction removes automatic results, not named variables.',
    'Return values and history are read-only snapshots. Assign useful data to a named variable to retain it independently. Assignment age describes when a variable was set, not when its underlying data was fetched.',
    'Execution reports contain inspected values, memory changes, errors, and interruptions. Reuse preserved variables and completed actions; do not repeat successful work just to correct later errors.',
    ...(hasComponents
      ? ['Reuse acknowledged deliveries. A failed delivery may have an uncertain external outcome.']
      : []),
    'An operational error does not by itself finish the task. When recovery is safe and authorized, address the cause and retry failed work without repeating successful actions. If planning recovery needs another model response, return inspect({ errors, completed }) with the error and partial results, or let the error reach the runtime. Honor task instructions defining terminal failure outcomes.',
    ...(hasExits
      ? [
          'A failure exit requires a concrete reason recovery is unavailable, unsafe, forbidden, or the attempt or response budget is exhausted, or a task instruction making that failure terminal. Do not select a failure exit in advance for an unseen tool error.',
        ]
      : []),
    'Inspect the actual error against the available tools, repair its cause when safe and authorized, then retry only failed work. Do not add a generic catch block that retries unchanged and reports failure: unchanged retries do not establish that recovery is exhausted. Without an implemented recovery handler, return inspect({ errors, completed }) or let the error reach the runtime so the next response can diagnose it.',
    'A thinking interruption stops the current program and requests another model response. Statements after the interruption have not run. Continue with a new JavaScript program; do not repeat completed actions.',
    'Respect tool-attempt limits and the separate model-response budget. An empty successful inspection result is not a failure. Recover silently by default unless the user or task requests progress updates.',
  ].join('\n\n')
}

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

function normalizeExampleCapabilities(code: string, exits: readonly Exit[], chat: boolean): string {
  const source = new MagicString(code)
  const tree = parse(code, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') {
      return
    }

    const current = node as {
      type?: string
      start: number
      end: number
      callee?: { type?: string; name?: string; object?: { type?: string; name?: string } }
      arguments?: unknown[]
    }

    if (current.type === 'CallExpression') {
      if (!chat && current.callee?.object?.type === 'Identifier' && current.callee.object.name === 'chat') {
        throw new Error('Worker examples cannot call component methods.')
      }

      if (current.callee?.type === 'Identifier' && current.callee.name === 'exit') {
        if (!exits.length) {
          throw new Error('An example cannot call an exit when none is registered.')
        }

        if (!current.arguments?.length) {
          const listen = exits.find((exit) => exit.name.toLowerCase() === 'listen')

          if (!listen) {
            throw new Error('An unnamed example exit requires the registered listen exit.')
          }

          source.overwrite(current.start, current.end, `exit(${JSON.stringify(listen.name)})`)
        }
      }
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

  return source.toString()
}

/** Retain declarations and expression effects while making every program return explicit. */
function withExampleCompletion(code: string, completion?: string): string {
  const source = new MagicString(code)
  const tree = parse(code, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true })
  const lastStatement = tree.body.at(-1)
  let needsFallback = true
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') {
      return
    }

    type Expression = {
      type?: string
      start: number
      end: number
      callee?: { type?: string; name?: string }
      argument?: Expression
    }

    const current = node as {
      type?: string
      start: number
      end: number
      argument?: Expression
      expression?: Expression
    }

    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(current.type ?? '')) {
      return
    }

    if (current.type === 'ReturnStatement') {
      const value = current.argument ? code.slice(current.argument.start, current.argument.end) : undefined
      const returned = current.argument?.type === 'AwaitExpression' ? current.argument.argument : current.argument
      const callee = returned?.callee
      const isDecision = callee?.type === 'Identifier' && ['inspect', 'exit'].includes(callee.name ?? '')

      if (completion && callee?.name !== 'exit') {
        const expression = value === undefined ? '' : `await (${value});\n`
        source.overwrite(current.start, current.end, `{\n${expression}return ${completion};\n}`)
      } else if (isDecision && returned) {
        source.overwrite(current.start, current.end, `return ${code.slice(returned.start, returned.end)};`)
      } else {
        const expression = value === undefined ? 'undefined' : `await (${value})`
        source.overwrite(current.start, current.end, `return inspect(${expression});`)
      }

      if (node === lastStatement) {
        needsFallback = false
      }

      return
    }

    if (
      current.type === 'ExpressionStatement' &&
      current.expression?.callee?.type === 'Identifier' &&
      current.expression.callee.name === 'exit'
    ) {
      source.prependLeft(current.start, 'return ')

      if (node === lastStatement) {
        needsFallback = false
      }

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

  if (needsFallback) {
    source.append(`\n\nreturn ${completion ?? 'inspect(undefined)'}`)
  }

  return source.toString()
}

function renderExample(
  example: Example,
  index: number,
  components: readonly Component[],
  exits: readonly Exit[],
  chat: boolean
): string {
  const text = example.definition.text
  const messages: NativePresentationInput[] = []
  const methods = getNativeChatMethods(components)
  let exit: ReturnType<typeof exampleExit>

  try {
    if (!chat && (text !== undefined || example.definition.messages?.length)) {
      throw new Error('Worker examples cannot contain user-facing messages.')
    }

    exit = exampleExit(example, exits)

    for (const message of example.definition.messages ?? []) {
      const component = findExampleComponent(message, components)
      const input = {
        component: component.definition.name,
        props: message.props ?? {},
      }
      const [validated] = validateNativePresentationInputs([input], components)

      messages.push(validated!)
    }
  } catch (error) {
    throw new Error(`Invalid native example ${index + 1}: ${error instanceof Error ? error.message : String(error)}`)
  }

  const code = example.definition.code
  const lines = messages.map((message) => {
    const method = methods.find((candidate) => candidate.component.definition.name === message.component)

    if (!method) {
      throw new Error(`No chat method is available for example component ${message.component}.`)
    }

    return renderComponentCall(method, [message])
  })

  if (code !== undefined) {
    const normalized = normalizeExampleCapabilities(code, exits, chat)

    lines.push(withExampleCompletion(normalized, exit?.expression))
  } else if (exit && (exit.name !== 'listen' || !text || messages.length)) {
    lines.push(`return ${exit.expression}`)
  } else if (messages.length) {
    lines.push(exampleMessageCompletion(exits))
  }

  const output = {
    ...(text === undefined ? {} : { text }),
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
  exits: readonly Exit[],
  chat = components.length > 0
): string {
  if (!examples.length) {
    return ''
  }

  createNativeToolCatalogue({ components, exits })

  return [
    '# Hypothetical examples',
    'These examples explain desired behavior; they are not live conversation or completed work. The JSON illustrates native responses, not text to print. Apply an example only when its conditions match. Explicit task instructions and the current user request take precedence. Substitute actual facts for hypothetical values.',
    ...examples.map((example, index) => renderExample(example, index, components, exits, chat)),
  ].join('\n\n')
}

function renderComponentCall(
  method: NativeChatMethod,
  messages: ReadonlyArray<{ props?: Record<string, unknown> }>
): string {
  const inputs = messages.map((message) => message.props ?? {})

  if (method.multiple) {
    return `chat.${method.name}(${JSON.stringify(inputs)});`
  }

  return inputs.map((input) => `chat.${method.name}(${JSON.stringify(input)});`).join('\n')
}

function exampleMessageCompletion(exits: readonly Exit[]): string {
  const listen = exits.find((exit) => exit.name.toLowerCase() === 'listen')

  return listen ? `return exit(${JSON.stringify(listen.name)});` : 'return inspect(undefined);'
}

function describeComponentExamples(method: NativeChatMethod, exits: readonly Exit[]): string | undefined {
  const definition = method.component.definition
  const examples = definition.generation?.examples

  if (!examples?.length) {
    return undefined
  }

  const programs = examples.map((example, index) => {
    const call = renderComponentCall(method, Array.isArray(example) ? example : [example])

    return [
      `Component method example ${index + 1}:`,
      '```javascript',
      call,
      exampleMessageCompletion(exits),
      '```',
    ].join('\n')
  })

  return programs.join('\n\n')
}

function getChatMethodInputType(method: NativeChatMethod): string {
  const options = { treatDefaultAsOptional: true }

  try {
    return transforms.toTypescriptType(method.schema, options)
  } catch {
    // Normalize variants such as native enums that the TypeScript converter cannot read directly.
    const schema = fromJSONSchemaCompat(transforms.toJSONSchemaLegacy(method.schema))

    return transforms.toTypescriptType(schema, options)
  }
}

function describePresentation(method: NativeChatMethod, exits: readonly Exit[]): string {
  const definition = method.component.definition

  return [
    `Component ${JSON.stringify(definition.name)}: ${definition.description}`,
    `Send with chat.${method.name}(input).`,
    definition.generation?.usage,
    definition.generation?.doNotUseWhen && `Do not use when: ${definition.generation.doNotUseWhen}`,
    describeComponentExamples(method, exits),
  ]
    .filter(Boolean)
    .join('\n')
}

async function describeRuntimeAPI(props: NativeInitialStateProps, chat: boolean): Promise<string> {
  const declarations = ['declare function inspect<T>(value: T): InspectionDecision;']
  const methods = chat ? getNativeChatMethods(props.components) : []

  for (const exit of props.exits) {
    const name = JSON.stringify(exit.name)

    if (!exit.zSchema) {
      declarations.push(`declare function exit(name: ${name}): never;`)
      continue
    }

    const payload = transforms.toTypescriptType(exit.zSchema, { treatDefaultAsOptional: true })
    const optional = exit.zSchema.isOptional() ? '?' : ''

    declarations.push(`declare function exit(name: ${name}, payload${optional}: ${payload}): never;`)
  }

  if (methods.length) {
    declarations.push(
      'declare const chat: {',
      ...methods.map((method) => `  ${method.name}(input: ${getChatMethodInputType(method)}): void;`),
      '};'
    )
  }

  const exits = props.exits.map((exit) => {
    const name = JSON.stringify(exit.name)

    if (!exit.zSchema) {
      return `return exit(${name}): ${exit.description} No payload.${chat ? ' This does not send a message.' : ''}`
    }

    return `return exit(${name}, payload): ${exit.description}`
  })
  const components = methods.map((method) => describePresentation(method, props.exits))
  const runtimeDeclarations = await formatTypings(declarations.join('\n'))

  return [
    'Inspection decisions are opaque runtime values. Use return inspect(value) to expose values to the model.',
    ...(props.exits.length ? ['Use return exit("NAME", payload) with a registered name for completion.'] : []),
    ...(methods.length ? ['Chat methods send immediately when called and return void.'] : []),
    '```typescript\n' + runtimeDeclarations + '\n```',
    ...exits,
    ...components,
  ].join('\n\n')
}

function describeResponse(response: ResolvedResponse): string {
  return [
    '# Assistant response',
    'Write ordinary assistant content using this style. The same style applies to all streamed text, including any progress updates.',
    response.instructions,
    ...(response.examples.length
      ? [
          'These examples illustrate the response style. Adapt their facts to the current conversation.',
          ...response.examples.map((example, index) => `### Response example ${index + 1}\n${example}`),
        ]
      : []),
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
  const tools = [await describeRuntimeAPI(props, chat), '```typescript\n' + businessFunctions + '\n```'].join('\n\n')
  const protocol = [
    runJavaScriptSyntax,
    runtimeRules(props, chat),
    chat && describeResponse(props.response ?? resolveResponse()),
  ]
    .filter(Boolean)
    .join('\n\n')
  const examples = renderNativeExamples(props.examples ?? [], props.components, props.exits, chat)

  return {
    message: {
      role: 'system',
      content: [
        '# Task instructions',
        instructions,
        protocol,
        '# JavaScript API',
        'These declarations document callable functions inside run_javascript. Functions may cause real effects. Object properties, their types, current values, and read/write rules are listed in Memory.',
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

  const { current, limit, toolAttempts } = props.iteration
  const chat = props.isChatEnabled ?? props.components.length > 0
  const hasExits = props.exits.length > 0
  const guidance: string[] = []

  if (hasExits) {
    guidance.push(
      'Complete with return exit("NAME", payload) using a registered name. If the task is incomplete, report it honestly with an incomplete or error payload only when the exit schema permits it.'
    )

    if (!chat) {
      guidance.push('Assistant prose and inspection returns do not complete a worker.')
    }

    guidance.push('Do not request JavaScript results that require another response to inspect.')
  } else {
    guidance.push('Every JavaScript program must return inspect(value) with the available evidence.')
  }

  if (chat) {
    guidance.push('Use normal assistant text for an answer supported by evidence you have already inspected.')
  }

  return [
    '## Execution',
    `Response ${current} of ${limit}. ${Math.max(0, limit - current)} model responses remain after this one.`,
    ...(toolAttempts && Object.keys(toolAttempts).length
      ? [`Actual business calls, including failures: ${JSON.stringify(toolAttempts)}.`]
      : []),
    current >= limit
      ? `This is the last response. ${guidance.join(' ')} Never claim success for an unobserved action.`
      : 'Use return inspect(value) when another response must interpret a business tool result. Reserve a response for that inspection.',
    'The generation budget does not replace task-specific tool-attempt limits. Keep runtime budgets private unless requested.',
  ].join('\n')
}
