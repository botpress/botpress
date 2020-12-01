import axios from 'axios'
import 'bluebird-global'
import sdk from 'botpress/sdk'
import _ from 'lodash'

const getActions = async (actionNames: string[]) => {
  try {
    const getAction = async (actionName: string) => {
      const isGlobal = actionName.indexOf('/') > 0

      const { data } = await axios.post(`${window.BOT_API_PATH}/mod/code-editor/readFile`, {
        botId: !isGlobal && window.BOT_ID,
        location: `${actionName}.js`,
        type: 'action_legacy'
      })

      return data?.fileContent
    }

    return Promise.mapSeries(actionNames, async actionName => ({
      actionName,
      fileContent: await getAction(actionName)
    }))
  } catch (err) {
    console.error(`Can't export actions: ${err}`)
    return []
  }
}

const getIntents = async (intentNames: string[]) => {
  try {
    const getIntent = async (intentName: string) => {
      const { data } = await axios.get(`${window.BOT_API_PATH}/nlu/intents/${intentName}`)
      return data
    }

    return Promise.mapSeries(intentNames, async intent => getIntent(intent))
  } catch (err) {
    console.error(`Can't export intents: ${err}`)
    return []
  }
}

const getContentElements = async (
  ids: string[]
): Promise<Pick<sdk.ContentElement, 'id' | 'contentType' | 'formData' | 'previews'>[]> => {
  try {
    const { data } = await axios.post(`${window.BOT_API_PATH}/content/elements`, { ids })
    return data.map(x => _.pick(x, ['id', 'contentType', 'formData', 'previews']))
  } catch (err) {
    console.error(`Can't export content elements: ${err}`)
    return []
  }
}

export const exportCompleteWorkflow = async (workflowName: string) => {
  const { data } = await axios.get(`${window.BOT_API_PATH}/flows`)

  const exportFlowData = async (flows, flowName) => {
    const flow = data.find(x => x.name === flowName)
    if (!flow) {
      return
    }

    const elements: string[] = _.compact(_.flatMapDeep(flow.nodes, n => [n.onEnter, n.onReceive]))
    const cmsIds = elements.filter(x => x.startsWith('say')).map(x => x.split(' ')[1].replace('#!', ''))
    const actionNames = elements.filter(x => !x.startsWith('say')).map(x => x.split(' ')[0])
    const skills = flow.nodes.filter(x => x.type === 'skill-call').map(x => x.flow)

    const triggerNodes = flow.nodes.filter(x => x.type === 'trigger')
    const intentNames = _.compact(_.flatMapDeep(triggerNodes, n => n.conditions))
      .filter(x => x.id === 'user_intent_is')
      .map(x => x.params.intentName)

    return {
      ...flow,
      content: await getContentElements(cmsIds),
      actions: await getActions(actionNames),
      intents: await getIntents(intentNames),
      skills: await Promise.mapSeries(skills, async flowN2 => exportFlowData(flows, flowN2))
    }
  }

  return exportFlowData(data, workflowName)
}
