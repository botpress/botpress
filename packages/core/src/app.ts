if (process.env.NODE_ENV === 'production') {
  require('dotenv').config()
} else {
  require('dotenv').config({ path: './.env.local' })
}

import 'bluebird-global'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress as Core } from './botpress'
import { TYPES } from './misc/types'

const botpress = container.get<Core>(TYPES.Botpress)

export const Botpress = botpress
