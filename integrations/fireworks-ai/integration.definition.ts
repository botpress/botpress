import { IntegrationDefinition, InterfacePackage, interfaces, z } from '@botpress/sdk'
import { languageModelId } from 'src/schemas'

const llmPkg = {
  type: 'interface',
  definition: interfaces.llm,
} satisfies InterfacePackage

const sttPkg = {
  type: 'interface',
  definition: interfaces.speechToText,
} satisfies InterfacePackage

export default new IntegrationDefinition({
  name: 'fireworks-ai',
  title: 'Fireworks AI',
  version: '0.4.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: languageModelId,
      }),
    },
    speechToTextModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
  },
  secrets: {
    FIREWORKS_AI_API_KEY: {
      description: 'Fireworks AI API key',
    },
  },
})
  .extend(llmPkg, ({ modelRef }) => ({ modelRef }))
  .extend(sttPkg, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
