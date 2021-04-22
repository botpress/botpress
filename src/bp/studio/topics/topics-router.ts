import { TopicSchema } from 'core/dialog'
import { validate } from 'joi'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class TopicsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Topics', services)
  }

  setupRoutes() {
    const router = this.router

    router.get('/', this.checkTokenHeader, async (req, res) => {
      res.send(await this.flowService.forBot(req.params.botId).getTopics())
    })

    router.post(
      '/:topicName?',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const { topicName, botId } = req.params

        const topic = await validate(req.body, TopicSchema)

        if (!topicName) {
          await this.flowService.forBot(botId).createTopic(topic)
        } else {
          await this.flowService.forBot(botId).updateTopic(topic, topicName)
        }

        res.sendStatus(200)
      })
    )

    router.post(
      '/deleteTopic/:topicName',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const { topicName, botId } = req.params
        await this.flowService.forBot(botId).deleteTopic(topicName)

        res.sendStatus(200)
      })
    )
  }
}
