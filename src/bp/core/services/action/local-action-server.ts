import bodyParser from 'body-parser'
import express from 'express'
import { injectable } from 'inversify'

const port = 4000

@injectable()
export class LocalActionServer {
  private readonly app: express.Express
  constructor() {
    this.app = express()
    this.app.use(bodyParser.json())

    this.app.get('/', (req, res) => res.send('Hello World!'))
    this.app.post('/action/run', async (req, res) => {
      const { incomingEvent, actionArgs, actionName, botId } = req.body

      res.status(200).send({ result: {}, incomingEvent })
    })
  }
  async start() {
    this.app.listen(port, () => console.log(`Local Action Server listening on port ${port}!`))
  }
}
