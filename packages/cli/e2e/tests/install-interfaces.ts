import pathlib from 'path'
import impl from '../../src/command-implementations'
import defaults from '../defaults'
import { Test } from '../typings'
import * as utils from '../utils'

export const installAllInterfaces: Test = {
  name: 'cli should allow installing public interfaces',
  handler: async ({ tmpDir, logger, ...creds }) => {
    const botpressHomeDir = pathlib.join(tmpDir, '.botpresshome')
    const baseDir = pathlib.join(tmpDir, 'interfaces')

    const argv = {
      ...defaults,
      botpressHome: botpressHomeDir,
      confirm: true,
      ...creds,
    }

    await impl.login({ ...argv }).then(utils.handleExitCode)

    const interfaces: string[] = [
      'creatable',
      'deletable',
      'hitl',
      'listable',
      'llm',
      'readable',
      'speechToText',
      'textToImage',
      'typingIndicator',
      'updatable',
    ]

    for (const iface of interfaces) {
      logger.info(`Installing interface: ${iface}`)
      await impl
        .add({
          ...argv,
          packageRef: iface,
          packageType: 'interface',
          installPath: baseDir,
          useDev: false,
        })
        .then(utils.handleExitCode)
      // TODO: also run a type check on the installed interface
    }
  },
}
