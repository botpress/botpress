import { IntegrationDefinition, InterfacePackage, interfaces, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'

const llmPkg = {
  type: 'interface',
  definition: interfaces.llm,
} satisfies InterfacePackage

export default new IntegrationDefinition({
  name: 'cerebras',
  title: 'Cerebras',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: modelId,
      }),
    },
  },
  secrets: {
    CEREBRAS_API_KEY: {
      description: 'Cerebras API key',
    },
  },
}).extend(llmPkg, ({ modelRef }) => ({
  modelRef,
}))
