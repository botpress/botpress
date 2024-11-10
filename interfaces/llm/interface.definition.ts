/* bplint-disable */
import * as common from '@botpress/common'
import { z, InterfaceDeclaration } from '@botpress/sdk'

export default new InterfaceDeclaration({
  name: 'llm',
  version: '5.1.0',
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
