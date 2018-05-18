import Confirm from 'prompt-confirm'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

import { print } from '../util'
import createModules from '../modules'

module.exports = async version => {
  version = version || 'latest'

  const modulesManager = createModules(null, './', null)
  const packages = ['botpress', ...modulesManager.listInstalled()]

  let cmdRest = ''

  for (const pkg of packages) {
    const confirm = await new Confirm(chalk`
Do you want to update {yellow "${pkg}"} to version {underline ${version}}?`).run()
    if (confirm) {
      cmdRest += `${pkg}@${version} `
    }
  }

  if (cmdRest.length) {
    console.log(chalk`===> {underline Installing dependencies, please wait...}`)

    if (fs.existsSync(path.resolve('./yarn.lock'))) {
      execSync(`yarn add ${cmdRest}`)
    } else {
      execSync(`npm install --save ${cmdRest}`)
    }

    console.log(chalk`{green.bold Done!}`)
  }
}
