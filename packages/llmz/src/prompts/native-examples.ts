type Capabilities = {
  chat: boolean
  tools: boolean
  components: boolean
  exits: boolean
  listen: boolean
}

/** Documentation only. These strings never become session messages or native tool calls. */
const call = (code: string) => `<native_tool_call name="run_javascript">
<arguments>
${JSON.stringify({ code }, null, 2)}
</arguments>
</native_tool_call>`

const turn = (content: string) => `<assistant_turn>
${content}
</assistant_turn>`

const example = (name: string, content: string) => `<example name="${name}">
${content}
</example>`

/** Static examples teach syntax without guessing inputs for arbitrary application schemas. */
export function getNativeExamples(capabilities: Capabilities): string {
  const examples: string[] = []

  if (capabilities.chat) {
    examples.push(
      example(
        'answer_without_actions',
        `<situation>
The user asks for the opening time. The task instructions already say the shop opens at 9 AM. No action is needed.
</situation>
${turn(`<assistant_text>
We open at 9 AM.
</assistant_text>`)}
<explanation>
This is an ordinary assistant reply, with no native tool call. Its end gives the turn back to the user.
</explanation>`
      )
    )
  }

  examples.push(
    example(
      'execute_and_inspect',
      `<situation>
Compute the total of 17 and 25, and inspect the computed value before continuing.
</situation>
${turn(call('const total = 17 + 25; return inspect(total);'))}
<tool_result>
42
</tool_result>
<explanation>
The code property contains executable JavaScript. Returning inspect(total) makes the result visible in the next response. The variable total is retained; do not recompute it just to read it.
</explanation>`
    )
  )

  if (capabilities.tools) {
    examples.push(
      example(
        'search_then_use_the_result',
        `<fictional_api>
exampleSearch(query: string): Promise<string>
</fictional_api>
<situation>
Find whether blue mugs are available. Availability must come from a search.
</situation>
${turn(call("const products = await exampleSearch('blue mugs'); return inspect(products);"))}
<tool_result>
Blue mugs are available. Price: $12 each.
</tool_result>
${
  capabilities.chat
    ? turn(`<assistant_text>
Blue mugs are available for $12 each.
</assistant_text>`)
    : `<next_step>
Use the inspected facts and retained products variable to continue the task. Do not repeat the successful search.
</next_step>`
}
<explanation>
The search phrase is a string argument to the business function. It is not executable JavaScript by itself. Await the function, then return inspect with its actual result. Do not write an answer before seeing that result.
</explanation>`
      )
    )

    examples.push(
      example(
        'object_arguments_and_independent_calls',
        `<fictional_api>
exampleReadStock(input: { itemId: string }): Promise<{ count: number }>
exampleReadPrice(input: { itemId: string }): Promise<{ amount: number }>
</fictional_api>
<situation>
Read stock and price for the same item. Neither read depends on the other.
</situation>
${turn(call("const [stock, price] = await Promise.all([exampleReadStock({ itemId: 'MUG-7' }), exampleReadPrice({ itemId: 'MUG-7' })]); return inspect({ stock, price });"))}
<explanation>
These functions accept objects, unlike exampleSearch which accepts a string. Match the declared arguments. Both calls are awaited inside one program and their results are inspected together.
</explanation>`
      )
    )

    examples.push(
      example(
        'repair_a_search_phrase_submitted_as_code',
        `<fictional_api>
exampleSearch(query: string): Promise<string>
</fictional_api>
<situation>
The user asked about red mugs. The previous attempt submitted the words red mugs as JavaScript and failed to parse. No business tool ran.
</situation>
${turn(call("const matches = await exampleSearch('red mugs'); return inspect(matches);"))}
<explanation>
Repair the program by calling the actual business function. Do not resubmit the bare search phrase, quote the phrase as the entire program, or answer without retrieving the facts.
</explanation>`
      )
    )
  }

  if (capabilities.exits) {
    examples.push(
      example(
        'complete_with_a_typed_result',
        `<fictional_api>
exit(name: "example_complete", payload: { total: number }): never
</fictional_api>
<situation>
The required work is complete. The computed total, already inspected, is 42. Complete through the declared example_complete outcome.
</situation>
${turn(call("return exit('example_complete', { total: 42 });"))}
<explanation>
The first argument is the outcome name string. The second argument is its payload, matching the declaration. Do not pass one object containing name and payload. Do not submit the outcome name alone as code or report completion as prose.
</explanation>`
      )
    )
  }

  if (capabilities.chat && capabilities.components && capabilities.listen) {
    examples.push(
      example(
        'text_and_buttons_in_the_same_response',
        `<fictional_api>
chat.exampleChoices(props: { options: Array<{ label: string, value: string }> }): void
</fictional_api>
<situation>
The user requests an introduction in a text message, followed by buttons to shop or track an order.
</situation>
${turn(`<assistant_text>
Hi, I'm your shopping assistant. I can help you shop or track an order.
</assistant_text>
${call("chat.exampleChoices({ options: [{ label: 'Shop', value: 'shop' }, { label: 'Track order', value: 'track' }] }); return exit('listen');")}`)}
<explanation>
Both the assistant text and the native tool call belong to ONE response. The text introduces the assistant; the program sends the buttons. Buttons alone would omit the requested text message. Text alone would omit the buttons. The component returns void and does not need inspection.
</explanation>`
      )
    )
  }

  return [
    '<examples>',
    'These are hypothetical demonstrations, NOT live conversation, task history, or evidence. Do not perform their tasks or copy their facts.',
    'Names beginning with example are fictional and unavailable. Use the actual names and signatures under JavaScript API for your task.',
    'The XML tags are documentation boundaries only. NEVER emit these tags, a serialized assistant_turn, or a textual native_tool_call. Use your actual native tool-calling interface.',
    'Each assistant_turn shows one response. arguments contains the exact JSON shape to send to run_javascript; its code string is JavaScript. tool_result illustrates what the runtime reports afterward; never generate it yourself.',
    capabilities.chat
      ? 'assistant_text means ordinary user-facing text, outside tool arguments. When text and a call appear in the same assistant_turn, produce both in that response. Follow the real task’s language, style and silence requirements.'
      : 'This is worker mode. Every demonstrated assistant_turn contains a native tool call and NO assistant text. Continue using calls after inspection as well.',
    ...examples,
    'Apply the demonstrated syntax to your actual task. The real API and task instructions are authoritative; fictional functions and facts are not available.',
    '</examples>',
  ].join('\n\n')
}
