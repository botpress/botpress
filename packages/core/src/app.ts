import 'bluebird-global'
import 'reflect-metadata'

import { container } from './app.inversify'
import { Botpress as Core } from './botpress'
import { TYPES } from './misc/types'

let botpress
try {
  botpress = container.get<Core>(TYPES.Botpress)
} catch (e) {
  console.log(e)
}

export const Botpress = botpress
