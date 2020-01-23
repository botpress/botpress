import axios from 'axios'
import 'bluebird-global'
import { FlowView } from 'common/typings'
import _ from 'lodash'

import { ExportedTopic, ImportActions } from '../typings'
import { analyzeGoalFile, executeGoalActions, getGoalAction } from '../GoalEditor/import'

export const analyzeTopicFile = async (file: ExportedTopic, flows: FlowView[]) => {
  const importActions: ImportActions[] = []

  try {
    const { data: questions } = await axios.get(`${window.BOT_API_PATH}/mod/qna/questions`)

    for (const question of file.knowledge) {
      const existing = questions.items.find(x => x.id === question.id)
      importActions.push({
        type: 'knowledge',
        name: question.id,
        existing: !!existing,
        identical: existing !== undefined && _.isEqual(existing, question),
        data: question
      })
    }
  } catch (err) {
    console.error(`Can't check knowledge: ${err}`)
  }

  try {
    for (const goal of file.goals) {
      const actions = await analyzeGoalFile(goal, flows)
      const existing: any = flows.find(x => x.name === goal.name)

      importActions.push(...actions)
      importActions.push(getGoalAction(goal, existing))
    }
  } catch (err) {
    console.error(`Can't check knowledge: ${err}`)
  }

  return importActions
}

export const executeTopicActions = async (actions: ImportActions[]) => {
  const getType = type => actions.filter(x => x.type === type && !x.identical)
  try {
    await Promise.each(getType('knowledge'), ({ data: { id, data } }) =>
      axios.post(`${window.BOT_API_PATH}/mod/qna/questions/${id}`, data)
    )
  } catch (err) {
    console.error(`Can't import knoweldge: ${err}`)
  }

  await executeGoalActions(actions)
}

export const renameTopic = (newName: string, exportedTopic: ExportedTopic) => {
  exportedTopic.goals.forEach(goal => {
    const name = `${newName}${goal.name.substr(goal.name.indexOf('/'))}`
    goal.name = name
    goal.location = name
  })
}

export const detectFileType = content => {
  if (content.name && content.knowledge && content.goals) {
    return 'topic'
  }

  if (content.name && content.nodes && content.content) {
    return 'goal'
  }
  return 'unknown'
}

export const fields = {
  topic: { knowledge: 'Knowledge element', goals: 'Goal' },
  goal: { actions: 'Action', content: 'Content Element', intents: 'Intent', skills: 'Skill' }
}
