/* bplint-disable */
import * as common from '@botpress/common'
import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'textToImage',
  version: '2.1.0',
  entities: {
    imageModelRef: {
      schema: common.textToImage.schemas.ImageModelRefSchema,
    },
    imageGenerationParams: {
      schema: common.textToImage.schemas.ImageGenerationParamsSchema,
    },
  },
  actions: {
    generateImage: {
      billable: true,
      cacheable: true,
      input: {
        schema: ({ imageModelRef, imageGenerationParams }) =>
          common.textToImage.schemas.GenerateImageInputSchema(imageModelRef, imageGenerationParams),
      },
      output: {
        schema: () => common.textToImage.schemas.GenerateImageOutputSchema,
      },
    },
    listImageModels: {
      input: {
        schema: () => z.object({}),
      },
      output: {
        schema: ({ imageModelRef }) =>
          z.object({
            models: z.array(z.intersection(common.textToImage.schemas.ImageModelSchema, imageModelRef)),
          }),
      },
    },
  },
})
