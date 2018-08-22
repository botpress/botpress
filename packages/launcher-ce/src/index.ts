import { Botpress } from 'botpress-xx'
import { ModuleDefinition } from 'botpress-xx/node_modules/botpress-module-sdk'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

console.log(chalk`===========================`)
console.log(chalk`=     {bold Botpress Server}     =`)
console.log(chalk`=       Version 0.1       =`)
console.log(chalk`=       {yellow Pre-release}       =`)
console.log(chalk`===========================`)

try {
  const modules = new Map<string, ModuleDefinition>()

  modules.set('webchat', require('@botpress/channel-web') as ModuleDefinition)

  Botpress.start({
    modules
  })
} catch (e) {
  console.log(chalk.red('Error starting botpress'))
  console.log(e)
}
