import { z, IntegrationDefinition, interfaces, InterfacePackage } from '@botpress/sdk'
import { modelId } from 'src/schemas'

const llmPkg = {
  type: 'interface',
  definition: interfaces.llm,
} satisfies InterfacePackage

export default new IntegrationDefinition({
  name: 'anthropic',
  title: 'Anthropic',
  version: '3.2.0',
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
    ANTHROPIC_API_KEY: {
      description: 'Anthropic API key',
    },
  },
}).extend(llmPkg, ({ modelRef }) => ({
  modelRef,
}))
