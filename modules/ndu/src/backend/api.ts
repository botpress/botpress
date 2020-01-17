import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { conditionsDefinitions } from './conditions'
import { BotStorage } from './typings'

export default async (bp: typeof sdk, bots: BotStorage) => {
  const router = bp.http.createRouterForBot('ndu')

  router.get('/conditions', async (req, res) => {
    res.send(conditionsDefinitions)
  })

  router.get('/topics', async (req, res) => {
    const storage = bots[req.params.botId]
    res.send(await storage.getTopics())
  })

  router.get('/exportGoal', async (req, res) => {
    const botId = req.params.botId
    const axiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })

    const { data } = await axios.get('flows', axiosConfig)

    const getAction = async actionName => {
      const isGlobal = actionName.indexOf('/') > 0
      const { data } = await axios.post(
        'mod/code-editor/readFile',
        { botId: !isGlobal && botId, location: `${actionName}.js`, type: 'action' },
        axiosConfig
      )

      return data && data.fileContent
    }

    const getIntent = async intentName => {
      const { data } = await axios.get(`mod/nlu/intents/${intentName}`, axiosConfig)

      return data
    }

    const exportFlowData = async (flows, flowName) => {
      const flow = data.find(x => x.name === flowName)
      if (!flow) {
        return res.sendStatus(404)
      }

      const elements: string[] = _.compact(_.flatMapDeep(flow.nodes, n => [n.onEnter, n.onReceive]))

      const cmsIds = elements.filter(x => x.startsWith('say')).map(x => x.replace('say #!', ''))
      const content = (await bp.cms.getContentElements(botId, cmsIds)).map(x =>
        _.pick(x, ['id', 'contentType', 'formData', 'previews'])
      )

      const actionNames = elements.filter(x => !x.startsWith('say')).map(x => x.substr(0, x.indexOf(' ')))
      const actions = await Promise.mapSeries(actionNames, async actionName => ({
        actionName,
        fileContent: await getAction(actionName)
      }))

      const skills = flow.nodes.filter(x => x.type === 'skill-call').map(x => x.flow)
      const linkedFlows = await Promise.mapSeries(skills, async flowN2 => await exportFlowData(flows, flowN2))

      const intentNames = _.compact(_.flatMapDeep(flow.triggers, n => n.conditions))
        .filter(x => x.id === 'user_intent_is')
        .map(x => x.params.intentName)
      const intents = await Promise.mapSeries(intentNames, async intent => ({
        intent,
        fileContent: await getIntent(intent)
      }))

      return { ...flow, content, actions, intents, linkedFlows }
    }

    res.send(await exportFlowData(data, req.query.goalName))
  })

  router.get('/events', async (req, res) => {
    res.send(
      await bp
        .database('events')
        .select('*')
        .where({ botId: req.params.botId, direction: 'incoming' })
        .orderBy('createdOn', 'desc')
        .limit(100)
    )
  })

  router.post('/topics', async (req, res) => {
    const storage = bots[req.params.botId]
    await storage.saveTopics(req.body)
    res.send(true)
  })

  router.get('/library', async (req, res) => {
    const library = [
      {
        elementPath: 'Content/Text/Hello, welcome to the bot',
        goalName: 'hire_new_employee',
        elementId: '#!builtin_text-F7FM5E'
      },
      {
        elementPath: 'Content/Text/Please choose a choice',
        goalName: 'hire_new_employee',
        elementId: '#!builtin_text-Xqk8ha'
      },
      {
        elementPath: 'Content/Image/Nice background',
        goalName: 'hire_new_employee',
        elementId: '#!builtin_image-YSseJL'
      },
      {
        elementPath: 'Actions/Switch language',
        goalName: 'hire_new_employee',
        elementId: 'builtin/switchLanguage {"lang":"fr"}'
      }
    ]
    res.send(library)
  })
}
