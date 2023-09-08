import * as pathlib from 'path'
import { $ } from 'shellby'

const integrations = ['zendesk', 'telegram']

const rootDir = pathlib.resolve(__dirname, '..', '..')
const integrationsDir = pathlib.join(rootDir, 'integrations')

for (const integration of integrations) {
  console.info(`Installing integration "${integration}"`)
  const integrationPath = pathlib.join(integrationsDir, integration)
  $(`pnpm bp add ${integrationPath} -y`)
}
