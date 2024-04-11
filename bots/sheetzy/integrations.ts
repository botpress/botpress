import { $ } from 'execa'
import * as pathlib from 'path'

const rootDir = pathlib.resolve(__dirname, '..', '..')
const integrationsDir = pathlib.join(rootDir, 'integrations')
const integrations = ['telegram', 'gsheets']

const main = async () => {
  for (const integration of integrations) {
    console.info(`Installing integration "${integration}"`)
    const integrationPath = pathlib.join(integrationsDir, integration)
    const { exitCode } = await $`pnpm bp add ${integrationPath} -y`
    if (exitCode !== 0) {
      throw new Error(`Failed to install integration "${integration}"`)
    }
  }
}

void main()
  .then(() => {
    console.info('Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
