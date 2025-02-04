import { z } from '@bpinternal/zui'
import JSON5 from 'json5'
import { Context } from '../context'
import * as llm from '../llm'

type GenerateContentInput = llm.GenerateContentInput
type GenerateContentOutput = llm.GenerateContentOutput

const nonEmptyString = z.string().trim().min(1)
const nonEmptyObject = z
  .object({})
  .passthrough()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Expected a non-empty object',
  })

export type Input = z.infer<typeof Input>
const Input = nonEmptyString.or(nonEmptyObject).or(z.array(z.any()))

export type Output<T = any> = z.infer<typeof Output> & { result: T }
const Output = z.object({
  reason: nonEmptyString.describe('A human-readable explanation of the result'),
  result: z
    .any()
    .describe(
      'Your best guess at the output according to the instructions provided, rooted in the context of the input and the reason above'
    ),
})

type Example = z.infer<typeof Example>
const Example = z.object({
  input: Input,
  output: Output,
})

type InputOptions<T extends z.ZodSchema = z.ZodSchema> = z.input<typeof Options> & { outputSchema: T }
type Options = z.infer<typeof Options>
const Options = z.object({
  systemMessage: z.string(),
  examples: z.array(Example).default([]),
  input: Input,

  outputSchema: z.custom<z.ZodSchema<any>>((value) => typeof value === 'object' && value !== null && '_def' in value),
  model: z.string(),
})

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const isValidExample =
  (outputSchema: z.ZodSchema) =>
  (example: Example): example is Example =>
    Input.safeParse(example.input).success &&
    Output.safeParse(example.output).success &&
    outputSchema.safeParse(example.output.result).success

export async function predictJson<T extends z.ZodSchema>(_options: InputOptions<T>): Promise<Output<z.infer<T>>> {
  const options = Options.parse(_options)
  const [integration, model] = options.model.split('__')

  if (!model?.length) {
    throw new Error('Invalid model')
  }

  const exampleMessages = options.examples
    .filter(isValidExample(options.outputSchema))
    .flatMap(({ input, output }) => [
      { role: 'user', content: JSON.stringify(input, null, 2) } satisfies Message,
      { role: 'assistant', content: JSON.stringify(output, null, 2) } satisfies Message,
    ])

  const outputSchema = Output.extend({
    result: options.outputSchema.describe(Output.shape.result.description!),
  })

  const result = await Context.client.callAction({
    type: `${integration}:generateContent`,
    input: {
      systemPrompt: `
${options.systemMessage}

---
Please generate a JSON response with the following format:
\`\`\`typescript
${await outputSchema.toTypescriptAsync()}
\`\`\`
`.trim(),
      messages: [
        ...exampleMessages,
        {
          role: 'user',
          content: JSON.stringify(options.input, null, 2),
        },
      ],
      temperature: 0,
      responseFormat: 'json_object',
      model: { id: model! },
    } as GenerateContentInput,
  })

  const output = result.output as GenerateContentOutput

  if (!output.choices.length || typeof output.choices?.[0]?.content !== 'string') {
    throw new Error('Invalid response from the model')
  }

  const json = output.choices[0].content.trim()

  if (!json.length) {
    throw new Error('No response from the model')
  }

  return outputSchema.parse(JSON5.parse(json)) as Output<z.infer<T>>
}
