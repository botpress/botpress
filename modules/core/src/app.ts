import dotenv from 'dotenv'

import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress } from './botpress'
import { TYPES } from './misc/types'

dotenv.config()

const botpress = container.get<Botpress>(TYPES.Botpress)
botpress.start()
