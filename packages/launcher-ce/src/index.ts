import { Botpress } from 'botpress-xx'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

console.log(chalk`===========================`)
console.log(chalk`=     {bold Botpress Server}     =`)
console.log(chalk`=       Version 0.1       =`)
console.log(chalk`=       {yellow Pre-release}       =`)
console.log(chalk`===========================`)

try {
  Botpress.start({
    modules: [require('@botpress/channel-web')]
  })
} catch (e) {
  console.log(chalk.red('Error starting botpress'))
  console.log(e)
}
