import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { customAlphabet } from 'nanoid'

import { bots as mountedBots, conditions } from '.'
import { DEFAULT_MIN_CONFIDENCE, UnderstandingEngine } from './ndu-engine'

const prettyId = (length = 10) => customAlphabet('1234567890abcdef', length)()
const debug = DEBUG('ndu').sub('migrate')

interface TemplateFile {
  fileName: string
  content: any
  buffer: string | Buffer
}

interface FlowNodeView {
  nodes: {
    id: string
    position: { x: number; y: number }
  }[]
}

const addTriggersToListenNodes = (flow: sdk.Flow, flowPath: string) => {
  for (const node of flow.nodes) {
    if (node.onReceive != null) {
      const listenNode = (node as unknown) as sdk.ListenNode
      if (!listenNode.triggers?.length) {
        debug('Add triggers property to node %o', { flow: flowPath, node: node.name })
        listenNode.triggers = [{ conditions: [{ id: 'always' }] }]
      }
    }
  }
}

const addSuccessFailureNodes = (flow: sdk.Flow, flowPath: string, flowUi: FlowNodeView) => {
  const addNode = (type: sdk.FlowNodeType) => {
    const id = prettyId()
    flow.nodes.push({
      id,
      name: type,
      onEnter: [],
      onReceive: null,
      next: [],
      type
    })

    flowUi.nodes.push({
      id,
      position: {
        x: 1000,
        y: type === 'success' ? 100 : 200
      }
    })

    debug(`Add ${type} node to flow ${flowPath}`)
  }

  const nodeTypes: sdk.FlowNodeType[] = ['success', 'failure']
  nodeTypes.forEach(type => !flow.nodes.find(x => x.type === type) && addNode(type))
}

const updateAllFlows = async (ghost: sdk.ScopedGhostService) => {
  const flowsPaths = await ghost.directoryListing('flows', '*.flow.json')

  for (const flowPath of flowsPaths) {
    const flowUiPath = flowPath.replace('.flow.json', '.ui.json')

    const flow = await ghost.readFileAsObject<sdk.Flow>('flows', flowPath)
    const flowUi = await ghost.readFileAsObject<FlowNodeView>('flows', flowUiPath)

    addTriggersToListenNodes(flow, flowPath)
    addSuccessFailureNodes(flow, flowPath, flowUi)

    await ghost.upsertFile('flows', flowPath, JSON.stringify(flow, undefined, 2))
    await ghost.upsertFile('flows', flowUiPath, JSON.stringify(flowUi, undefined, 2))
  }
}

const upsertNewFlows = async (ghost: sdk.ScopedGhostService, files: TemplateFile[]) => {
  const flows = files.filter(x => x.fileName.startsWith('flows/'))

  for (const flow of flows) {
    const [topic, flowName] = flow.fileName.replace('flows/', '').split('/')

    if (!(await ghost.fileExists(`flows/${topic}`, flowName))) {
      await ghost.upsertFile(`flows/${topic}`, flowName, flow.buffer)
      debug('Flow file missing, creating %o', { topic, flow: flowName })
    }
  }
}

const createMissingElements = async (bp: typeof sdk, botId, files: TemplateFile[]) => {
  const contentFiles = files.filter(x => x.fileName.startsWith('content-elements/'))

  for (const { fileName, content } of contentFiles) {
    const contentType = fileName.substr(fileName.lastIndexOf('/') + 1).replace('.json', '')

    for (const element of content) {
      if (!(await bp.cms.getContentElement(botId, element.id))) {
        debug('Missing content element, creating... %o', { element: element.id, type: contentType })
        await bp.cms.createOrUpdateContentElement(botId, contentType, element.formData, element.id)
      }
    }
  }
}

const getTemplateFiles = async (bp: typeof sdk): Promise<TemplateFile[]> => {
  return (await bp.bots.getBotTemplate('ndu', 'oneflow')).map(x => ({
    fileName: x.name.replace(/\\/g, '/'),
    content: JSON.parse(x.content.toString()),
    buffer: x.content
  }))
}

const getIntentContexts = async (ghost: sdk.ScopedGhostService) => {
  try {
    const intentNames = await ghost.directoryListing('intents', '*.json')
    const intents = (await Promise.mapSeries(intentNames, i => ghost.readFileAsObject('intents', i))) as any

    return _.chain(intents)
      .flatMap(i => i.contexts)
      .uniq()
      .value()
  } catch (err) {
    return []
  }
}

const createTopicsFromContexts = async (bp: typeof sdk, ghost: sdk.ScopedGhostService, botId: string) => {
  try {
    const axiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true, studioUrl: true })

    const contexts = await getIntentContexts(ghost)
    const { data: existingTopics } = await axios.get('/topics', axiosConfig)

    for (const topic of contexts) {
      if (!existingTopics?.find(x => x.name === topic)) {
        await axios.post('/topics', { name: topic, description: '' }, axiosConfig)
        debug(`Created a new topic for existing NLU context ${topic}`)
      }
    }
  } catch (err) {
    bp.logger
      .forBot(botId)
      .attachError(err)
      .warn("Couldn't create topics from context.")
  }
}

const migrateBot = async (bp: typeof sdk, botId: string) => {
  const ghost = bp.ghost.forBot(botId)
  const templateFiles = await getTemplateFiles(bp)

  await upsertNewFlows(ghost, templateFiles)
  await createMissingElements(bp, botId, templateFiles)

  await updateAllFlows(ghost)

  await createTopicsFromContexts(bp, ghost, botId)

  // Required so the studio can show the correct UI
  await bp.config.mergeBotConfig(botId, { oneflow: true })

  // Ensure the NDU will process events for that bot
  mountedBots[botId] = new UnderstandingEngine(bp, conditions, { minimumConfidence: DEFAULT_MIN_CONFIDENCE })
}

export default migrateBot
