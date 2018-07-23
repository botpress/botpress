import express from 'express'
import { Botpress } from './botpress'
import * as indexRouter from './router/index'

const BASE_API_PATH = '/api/v1'

const app = express()

app.use(BASE_API_PATH, indexRouter.router)

const botpress = new Botpress()
botpress.start()

export default app
