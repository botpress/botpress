import * as sdk from '@botpress/sdk'
import llm from './bp_modules/llm'

export default new sdk.PluginDefinition({
  name: 'personality',
  version: '0.0.1',
  configuration: {
    schema: sdk.z.object({
      model: sdk.z.string().describe('Model to use to handle bot personality'),
      personality: sdk.z
        .string()
        .max(1000)
        .describe(
          'Describe what your chatbot is meant to do and how it should behave. You can include some personality traits here as well to influence how the chatbot will respond. Expressions are supported.'
        ),
    }),
  },
  interfaces: {
    llm,
  },
})
