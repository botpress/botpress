import { resolveResponse } from '../chat/response.js'
import { formatTypings } from '../formatting.js'
import { getTypings } from '../typings.js'
import { getMultilineComment } from '../utils.js'
import type { LLMzPrompts } from './prompt.js'

const runJavaScriptSyntax = [
  '# run_javascript syntax',
  'run_javascript is the only native tool. Call it with a JSON object containing exactly one property: "code", a non-empty string of JavaScript source.',
  'The code string is the body of an async JavaScript program. Top-level await and return are supported. Send plain JavaScript without Markdown fences, an enclosing function, type annotations, imports, or JSX. eval, Function constructors, and dynamically generated code are not supported.',
  'Make at most one run_javascript call per response. Put multiple operations in that program: await dependent business calls in order, or await Promise.all for independent operations when safe. Await all business operations before the final return, including unfinished siblings after a Promise.all failure.',
  'Use only the functions documented in the JavaScript API and variables listed in Memory. Do not assume browser, network, filesystem, or package APIs are available.',
  'Match each function signature exactly. A string parameter takes a string, not an object containing that string.',
].join('\n\n')

function runtimeRules(props: LLMzPrompts.InitialStateProps, chat: boolean): string {
  const hasExits = props.exits.length > 0
  const listen = props.exits.find((exit) => exit.name.toLowerCase() === 'listen')
  const rules = [
    '# Responses and execution',
    hasExits
      ? 'Every run_javascript program must explicitly return inspect(value) for inspection or return exit("NAME", payload) with a registered name and its required payload for completion.'
      : 'Every run_javascript program must explicitly return inspect(value).',
    'The only way for the model to see a business tool return value is return inspect(value). JavaScript can use tool results immediately to compute, branch, or call other functions. Inspection exposes the result in the next response.',
    'If completing the task requires interpreting natural-language tool output, inspect it before constructing the completion payload. Do not substitute the whole returned text for an extracted field, guess facts, or fill required fields with placeholders. Structured results may be used directly when the program can compute the complete payload from them.',
    'inspect(...) constructs an opaque decision that takes effect only when returned as the result of the JavaScript program. Never fabricate, serialize, or store a decision as persistent memory.',
  ]

  if (chat) {
    rules.push(
      'Reply to the user with normal assistant text. Assistant text streams normally and is visible to the user. A completed response without tool calls finishes the turn. Choose text-only only when no requested action remains; a requested component or business operation requires a tool call in this response, even when you already wrote the requested text. Keep private reasoning out of assistant text.',
      "Follow the task's response constraints exactly. When exact text is requested, reproduce it byte-for-byte, without a greeting, explanation, translation, or extra whitespace. Do not add a leading or trailing space or newline, including before a tool call. This constrains assistant text, not the tool calls needed to carry out the task. Response style applies to free-form prose; it must not rewrite supplied text or code that the task asks you to preserve, including whitespace, quotes, and escapes. When transcribing source, check each line against the supplied source rather than completing familiar patterns from memory.",
      'Keep routine business lookups and recovery silent unless progress updates are requested; answer from inspected results. This does not suppress text explicitly requested alongside components. When more work remains, send a requested progress update alongside the run_javascript call that continues that work; a text-only update ends the turn.'
    )
  } else if (hasExits) {
    rules.push(
      'Complete the assigned task with return exit("NAME", payload) inside JavaScript. Assistant prose alone does not complete a worker task. Every worker response, including completion after an inspection, must call run_javascript. Return the completion payload through exit, never as assistant text or a Markdown/JSON response.'
    )
  }

  if (hasExits) {
    rules.push(
      'Complete all required work before returning the registered exit. JavaScript can compute its payload from tool results without another model response. Completion validates the payload and requires its hook to succeed. Omit the payload when an exit signature has no payload parameter.'
    )
  }

  if (chat && props.exits.some((exit) => exit !== listen)) {
    rules.push(
      'When a known outcome matches a registered task exit description, return exit("NAME", payload) for that outcome, even if you also explain it in assistant text. Prose does not select a typed exit.'
    )
  }

  if (chat && listen) {
    rules.push(
      `Use return exit(${JSON.stringify(listen.name)}) only when waiting for the user or when no task outcome matches another registered exit, within a program that already needs to run. A plain assistant reply automatically waits for the user when its text ends. Do not call run_javascript solely to listen after a text-only reply, even if the task says "then listen".`
    )
  }

  if (chat && props.components.size) {
    rules.push(
      'Send rich messages with the registered chat methods. Each method accepts its documented props, sends synchronously, and returns void; do not await it. Messages are delivered in invocation order. A component call does not finish the program; follow it with the required return.',
      `When the task requests text AND components, put the requested text in the assistant preamble to a native tool call, then call run_javascript to send the components. Use a tool-call response with a text preamble, not a final text-only answer. Both belong in this response.${hasExits ? ' exit ends the turn and cannot send the missing text afterward.' : ''} Text alone omits the components; components alone omit the text. When only components are requested, keep assistant output empty and do not add an acknowledgement afterward.`,
      'Never print a rich-message description instead of sending its component. Reuse acknowledged deliveries; a failed delivery may have an uncertain external outcome.'
    )

    if (listen) {
      rules.push(
        `After sending all requested components, finish in the same program with return exit(${JSON.stringify(listen.name)}) when waiting for the user. Returning inspect(undefined) requests another response and does not finish the turn.`
      )
    }
  }

  rules.push(
    'Execution may overlap the remaining response stream. The runtime waits for the stream, code, and queued message deliveries before the next response.',
    '# Memory',
    'Declare retained variables at top level with const or let. Bare assignment only updates a variable already declared in this program or listed in Memory. Named variables survive transcript compaction; assignment age records when they were set, not when the underlying data was fetched.',
    'Object properties are immutable snapshots. Replace a writable property completely, such as account.profile = { ...account.profile, age: 42 }; nested edits are forbidden and replacements are schema-validated.',
    '$return is the latest successful inspection result. $iterations is read-only retained history, newest first: [0] is the last settled iteration and [1] the preceding one. The current execution is not included. Entries without results still occupy indexes; check hasResult. Compaction prunes automatic results. Assign useful data to named variables to retain it independently.',
    '# Recovery',
    'Execution reports identify completed actions, inspected values, memory changes, and errors. Reuse preserved variables and completed actions; retry only failed work. Build completion payloads from those values, not by calling successful tools again. An inspection has already run the recorded calls; it is not a dry run.',
    'An operational error does not by itself finish the task. Inspect the actual error, repair its cause when safe and authorized, then retry. Unchanged retries do not establish that recovery is exhausted. If another response must diagnose the error, return inspect({ errors, completed }) or let the error reach the runtime. Honor task instructions defining terminal failure outcomes.'
  )

  if (hasExits) {
    rules.push(
      'Use a failure exit only when recovery is unavailable, unsafe, forbidden, its budget is exhausted, or task instructions make the failure terminal. Do not select failure in advance for an unseen error. Do not turn an unexpected exception or rejected Promise.allSettled entry directly into failure completion: first expose it with inspect or let it reach the runtime, then diagnose the actual cause and available recovery tools. Explicit task instructions may define an error as terminal.'
    )
  }

  rules.push(
    'A thinking interruption stops the current program and requests another model response. Statements after the interruption have not run; continue with a new program without repeating completed actions.',
    'Respect tool-attempt limits separately from the model-response budget. An empty successful inspection result is not a failure.'
  )

  return rules.join('\n\n')
}

async function describeRuntimeAPI(props: LLMzPrompts.InitialStateProps, chat: boolean): Promise<string> {
  const declarations = ['declare function inspect<T>(value: T): InspectionDecision;']

  for (const exit of props.exits) {
    const name = JSON.stringify(exit.name)
    const description = `${exit.description}${!exit.zSchema && chat ? ' This does not send a message.' : ''}`
    const parameters = exit.zSchema
      ? `name: ${name}, payload${exit.zSchema.isOptional() ? '?' : ''}: ${await getTypings(exit.zSchema)}`
      : `name: ${name}`

    declarations.push(getMultilineComment(description), `declare function exit(${parameters}): never;`)
  }

  if (chat && props.components.size) {
    declarations.push('declare const chat: {')

    for (const [name, component] of props.components) {
      declarations.push(
        getMultilineComment(component.definition.description),
        `${name}(props: ${await getTypings(component.definition.props)}): void;`
      )
    }

    declarations.push('};')
  }

  return '```typescript\n' + (await formatTypings(declarations.join('\n'))) + '\n```'
}

export async function getNativeSystemMessage(props: LLMzPrompts.InitialStateProps): Promise<LLMzPrompts.SystemMessage> {
  const chat = props.isChatEnabled
  const declarations = await Promise.all([
    ...props.objects.filter((object) => object.tools?.length).map((object) => object.getToolTypings()),
    ...props.globalTools.map((tool) => tool.getTypings()),
  ])
  const instructions = props.instructions?.trim() || 'Carry out the assigned task.'
  const tools = [
    await describeRuntimeAPI(props, chat),
    ...(declarations.length ? ['```typescript\n' + declarations.join('\n\n') + '\n```'] : []),
  ].join('\n\n')
  const protocol = [
    runJavaScriptSyntax,
    runtimeRules(props, chat),
    ...(chat ? ['# Assistant response', (props.response ?? resolveResponse()).instructions] : []),
  ].join('\n\n')

  return {
    message: {
      role: 'system',
      content: [
        protocol,
        '# JavaScript API',
        'These TypeScript declarations describe functions inside run_javascript. Object properties, their types, values, and read/write rules are listed in Memory.',
        tools,
        '# Task instructions',
        instructions,
      ].join('\n\n'),
    },
    parts: { instructions, tools, protocol },
  }
}
