import * as fslib from 'fs'
import * as pathlib from 'path'
import * as uuid from 'uuid'
import impl from '../../src'
import defaults from '../defaults'
import { Test, TestProps } from '../typings'
import * as utils from '../utils'

const getHomeDir = (props: { tmpDir: string }) => pathlib.join(props.tmpDir, '.botpresshome')
const initBot = async (props: TestProps, definitionFile: string) => {
  const { tmpDir, dependencies, ...creds } = props
  const argv = {
    ...defaults,
    botpressHome: getHomeDir(props),
    confirm: true,
    ...creds,
  }
  const botName = uuid.v4().replace(/-/g, '')
  const botDir = pathlib.join(tmpDir, botName)
  await impl
    .init({ ...argv, workDir: tmpDir, name: botName, type: 'bot', template: 'empty' })
    .then(utils.handleExitCode)
  await utils.fixBotpressDependencies({ workDir: botDir, target: dependencies })
  await utils.npmInstall({ workDir: botDir }).then(utils.handleExitCode)
  fslib.writeFileSync(pathlib.join(botDir, 'bot.definition.ts'), definitionFile)
  return { botDir }
}
let botDir: string | undefined = undefined
const ALIAS = 'alias'
export const removePackage: Test = {
  name: 'cli should allow removing a plugin',
  handler: async (props) => {
    try {
      const botpressHomeDir = pathlib.join(props.tmpDir, '.botpresshome')

      const initializedBot = await initBot(
        props,
        ['import * as sdk from "@botpress/sdk"', 'export default new sdk.BotDefinition({})'].join('\n')
      )
      botDir = initializedBot.botDir

      const argv = {
        ...defaults,
        botpressHome: botpressHomeDir,
        confirm: true,
        ...props,
      }

      await impl
        .login({
          ...argv,
        })
        .then(utils.handleExitCode)

      const plugin: string = 'hitl'

      props.logger.info(`Installing plugin: ${plugin}`)
      await impl
        .add({
          ...argv,
          packageRef: plugin,
          installPath: botDir,
          useDev: false,
          alias: ALIAS,
        })
        .then(utils.handleExitCode)

      await impl.remove({
        ...argv,
        alias: ALIAS,
        workDir: botDir,
      })

      const aliasPath = pathlib.join(botDir, 'bp_modules', ALIAS)
      const exists = await fslib.promises
        .access(aliasPath)
        .then(() => true)
        .catch(() => false)
      if (exists) {
        throw new Error(`Expected ${aliasPath} to not exist`)
      }

      const pkgJsonPath = pathlib.join(botDir, 'package.json')
      const pkgJson = JSON.parse(fslib.readFileSync(pkgJsonPath, 'utf-8'))
      if (pkgJson.bpDependencies && Object.keys(pkgJson.bpDependencies).length !== 0) {
        throw new Error('Expected bpDependencies to be empty')
      }
    } finally {
      if (botDir) fslib.rmSync(botDir, { force: true, recursive: true })
    }
  },
}
