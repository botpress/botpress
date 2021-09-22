const axios = require('axios')
const _ = require('lodash')

const { currentFlow, currentNode } = event.state.context

const matchesQuickReply = async flow => {
  if (currentFlow.startsWith('skills/choice')) {
    const preview = event.preview.toLowerCase()
    const kw = _.chain(flow.skillData.keywords)
      .values()
      .flatten()
      .find(kw => kw.toLowerCase() === preview.toLowerCase())
      .value()

    if (kw) {
      return true
    }
  }

  return false
}

const inWaitNode = async flow => {
  const node = _.find(flow.nodes, node => node.name === currentNode)
  return node && node.onReceive != null
}

const isMisunderstood = async () => {
  if (event.type === 'text' && event.nlu.intent.name === 'none') {
    const flow = currentFlow && (await bp.ghost.forBot(event.botId).readFileAsObject('flows', currentFlow))
    if (flow && ((await matchesQuickReply(flow)) || (await inWaitNode(flow)))) {
      return false
    }

    return true
  }
}

const flag = async () => {
  if (!(await isMisunderstood())) {
    return
  }

  const language = [event.nlu.language, event.nlu.detectedLanguage, event.state.user.language].filter(
    l => l && l !== 'n/a'
  )[0]

  if (!language) {
    return
  }

  const data = {
    eventId: event.id,
    botId: event.botId,
    language,
    preview: event.preview,
    reason: 'auto_hook'
  }

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post('/mod/misunderstood/events', data, axiosConfig)
}

return flag()
