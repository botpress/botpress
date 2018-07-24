import express from 'express'

import { Botpress } from './botpress'
import * as indexRouter from './router/index'

import { TYPES } from './misc/types'
import { container } from './inversify.config'

const BASE_API_PATH = '/api/v1'

const app = express()

app.use(BASE_API_PATH, indexRouter.default)

const botpress = container.get<Botpress>(TYPES.Botpress)
botpress.start()

export default app
