export const noPlaceholders =
  'Placeholders are an error. Write real JavaScript and actual values. Never output template labels, unfinished code, or made-up tool names. Example values only explain the format; use the facts and tools for your task.'

export const readResultExample = '■run\nconst total = 2 + 3\nreturn total'
export const finalActionExample = '■run\nawait exampleSaveTotal({ total: 5 })'

export const responseBoundaries = `## Response Boundaries

Every response MUST follow these rules:
- The first line must be exactly ■start. Write nothing before it.
- After ■start, use ONE of the command patterns below.
- The last line must be exactly ■end. Write nothing after it.
- Put each command on its own line. Copy the command names exactly.
- Do not put your response inside Markdown code fences.
- The quotes (""") only mark examples in this document. They are NOT part of the protocol. Do NOT start or end your response with """.

${noPlaceholders}`

export const codeChoices = `There are two ways to run code. Choose the one you need:
- Need to read the result before deciding what to do? Return the actual value, then write ■end. You will get another turn with that result. Do not add ■next after return.
- Ready to finish without reading another result? Run the final action with await, then write ■next= followed by an available exit name and its JSON fields, then ■end. Do not add a return statement for this pattern.
- If the runtime says this is the last turn, there is no next turn. Use a pattern that ends with ■next. Do not request another result.

Put required fields in one JSON object on the same line as the command. Use double quotes for keys and strings. If no fields are needed, omit the object. Do not put the fields inside another object named "props" or "value".
The examples below use concrete values to show the format. Do not copy their task or values. exampleSaveTotal is a fictional tool, NOT available. Do not call it; use only tools listed in the code section.`
