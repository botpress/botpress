import axios from 'axios'
import 'bluebird-global'
import _ from 'lodash'

import { ExportedTopic } from '../typings'
import { exportCompleteWorkflow } from '../WorkflowEditor/export'

const getKnowledge = async (topicName: string) => {
  try {
    const { data } = await axios.get(
      `${window.BOT_API_PATH}/mod/qna/questions?question=&categories[]=${topicName}&limit=5&offset=0`
    )

    return data?.items
  } catch (err) {
    console.error(`Can't export intents: ${err}`)
    return []
  }
}

const getWorkflows = async (wfs: string[]) => {
  try {
    return Promise.mapSeries(wfs, async name => exportCompleteWorkflow(name))
  } catch (err) {
    console.error(`Can't export intents: ${err}`)
    return []
  }
}

export const exportCompleteTopic = async (topicName: string, flows: any[]): Promise<ExportedTopic> => {
  const { data: topics } = await axios.get(`${window.STUDIO_API_PATH}/topics`)

  return {
    name: topicName,
    description: topics.find(x => x.name === topicName)?.description,
    knowledge: await getKnowledge(topicName),
    workflows: await getWorkflows(flows.filter(x => x.name.startsWith(topicName)).map(x => x.name))
  }
}
