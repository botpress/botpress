import 'reflect-metadata'

import { Botpress } from './botpress'
import { TYPES } from './misc/types'
import { container } from './inversify.config'

import dotenv from 'dotenv'
dotenv.config()

const botpress = container.get<Botpress>(TYPES.Botpress)
botpress.start()
