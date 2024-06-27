import { IntegrationDefinition, interfaces } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'openai',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
}).extend(interfaces.llm, () => ({}))
