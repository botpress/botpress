import 'bluebird-global'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress } from './botpress'
import { TYPES } from './misc/types'

module.exports = { Botpress: botpress }
