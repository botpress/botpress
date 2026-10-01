/** Documentation boundaries only; never part of the response protocol. */
export const quoteExample = (output: string): string => `"""\n${output}\n"""`

/** A single block excerpt; the omitted response is not part of this example. */
export const quotePartialExample = (output: string): string => quoteExample(`(...)\n${output}\n(...)`)

export const exampleBoundaryInstructions =
  'Triple quotes (""") mark the beginning and end of examples only. Do NOT emit these delimiters in your response.'

/** A complete response example, unlike individual block/syntax examples. */
export const quoteResponseExample = (output: string): string => quoteExample(`■start\n${output}\n■end`)

export const responseEnvelopeInstructions =
  'Every response starts with ■start on its own line and ends with ■end on its own line. Between them write only the documented protocol blocks. Nothing goes before ■start or after ■end. The envelope is protocol, not a code fence.'
