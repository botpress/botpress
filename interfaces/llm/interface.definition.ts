/* bplint-disable */
import * as common from '@botpress/common'
import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'llm',
  version: '7.2.0',
  entities: {
    modelRef: {
      schema: common.llm.schemas.ModelRefSchema,
    },
  },
  events: {},
  actions: {
    generateContent: {
      billable: true,
      cacheable: true,
      input: {
        schema: ({ modelRef }) => common.llm.schemas.GenerateContentInputSchema(modelRef),
      },
      output: {
        schema: () => common.llm.schemas.GenerateContentOutputSchema,
      },
    },
    listLanguageModels: {
      input: {
        schema: () => z.object({}),
      },
      output: {
        schema: ({ modelRef }) =>
          z.object({
            models: z.array(z.intersection(common.llm.schemas.ModelSchema, modelRef)),
          }),
      },
    },
  },
})
