import dotenv from 'dotenv'
import 'reflect-metadata'

import { Botpress } from './botpress'
import { container } from './inversify.config'
import { TYPES } from './misc/types'

dotenv.config()

const botpress = container.get<Botpress>(TYPES.Botpress)
botpress.start()
