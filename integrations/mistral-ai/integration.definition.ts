import { IntegrationDefinition } from '@botpress/sdk'
import { name } from './package.json'

export default new IntegrationDefinition({
	name,
	version: '0.1.0',
	readme: 'hub.md',
	icon: 'icon.svg',
})
