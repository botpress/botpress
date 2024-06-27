import { IntegrationDefinition, interfaces } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'groq',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
}).extend(interfaces.llm, () => ({}))
