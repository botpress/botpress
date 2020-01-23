import axios from 'axios'
import 'bluebird-global'
import _ from 'lodash'

import { ExportedTopic, ImportActions } from '../typings'
import { analyzeFile as analyzeFileGoal, executeActions as executeGoalActions } from '../GoalEditor/import'

export const analyzeFile = async (file: ExportedTopic, flows) => {
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
      const actions = await analyzeFileGoal(goal, flows)

      importActions.push(...actions)
      importActions.push({
        type: 'flow',
        name: goal.name,
        data: goal
      })
    }
  } catch (err) {
    console.error(`Can't check knowledge: ${err}`)
  }

  return importActions
}

export const executeActions = async (actions: ImportActions[]) => {
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

export const renameTopic = (newName: string, actions: ImportActions[]) => {
  for (const action of actions) {
    const { type, data } = action

    if (type === 'flow') {
      action.name = `${newName}${action.name.substr(action.name.indexOf('/'))}`
      data.name = action.name
      data.location = action.name
    }

    if (type === 'topic') {
      data.name = newName
    }
  }
}
