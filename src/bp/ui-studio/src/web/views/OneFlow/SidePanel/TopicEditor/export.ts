import axios from 'axios'
import 'bluebird-global'
import _ from 'lodash'

import { exportCompleteGoal } from '../GoalEditor/export'

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

const getGoals = async (goals: string[]) => {
  try {
    return Promise.mapSeries(goals, async goal => exportCompleteGoal(goal))
  } catch (err) {
    console.error(`Can't export intents: ${err}`)
    return []
  }
}

export const exportCompleteTopic = async (topicName: string, flows: any[]) => {
  const { data: topics } = await axios.get(`${window.BOT_API_PATH}/mod/ndu/topics`)

  return {
    name: topicName,
    description: topics.find(x => x.name === topicName)?.description,
    knowledge: await getKnowledge(topicName),
    goals: await getGoals(flows.filter(x => x.name.startsWith(topicName)).map(x => x.name))
  }
}
