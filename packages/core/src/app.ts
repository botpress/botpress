import chalk from 'chalk'
import dotenv from 'dotenv'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress } from './botpress'
import { TYPES } from './misc/types'

dotenv.config()

console.log(chalk`===========================`)
console.log(chalk`=     {bold Botpress Server}     =`)
console.log(chalk`=       Version 0.1       =`)
console.log(chalk`=       {yellow Pre-release}       =`)
console.log(chalk`===========================`)

const botpress = container.get<Botpress>(TYPES.Botpress)
botpress.start()
