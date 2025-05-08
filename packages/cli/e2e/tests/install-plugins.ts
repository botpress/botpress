import pathlib from 'path'
import impl from '../../src/command-implementations'
import defaults from '../defaults'
import { Test } from '../typings'
import * as utils from '../utils'

export const installAllPlugins: Test = {
  name: 'cli should allow installing public plugins',
  handler: async ({ tmpDir, logger, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'plugins')

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    await impl.login({ ...argv }).then(utils.handleExitCode)

    const plugins: string[] = ['hitl', 'file-synchronizer']

    for (const iface of plugins) {
      logger.info(`Installing plugin: ${iface}`)
      await impl
        .add({
          ...argv,
          packageRef: iface,
          packageType: 'plugin',
          installPath: baseDir,
          useDev: false,
        })
        .then(utils.handleExitCode)
    }
  },
}
