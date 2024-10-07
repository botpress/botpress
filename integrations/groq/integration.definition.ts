import { IntegrationDefinition, InterfacePackage, interfaces, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'

const llmPkg = {
  type: 'interface',
  definition: interfaces.llm,
} satisfies InterfacePackage

const sttPkg = {
  type: 'interface',
  definition: interfaces.speechToText,
} satisfies InterfacePackage

export default new IntegrationDefinition({
  name: 'groq',
  title: 'Groq',
  version: '6.3.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: modelId,
      }),
    },
    speechToTextModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
  },
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
})
  .extend(llmPkg, ({ modelRef }) => ({
    modelRef,
  }))
  .extend(sttPkg, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
