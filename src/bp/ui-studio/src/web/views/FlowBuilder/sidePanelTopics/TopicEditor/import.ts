import axios from 'axios'
import 'bluebird-global'
import { Topic } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'

import { ElementType } from '..'
import { ExportedTopic, ImportAction } from '../typings'
import { analyzeWorkflowFile, executeWorkflowActions, getWorkflowAction } from '../WorkflowEditor/import'

export const analyzeTopicFile = async (file: ExportedTopic, flows: FlowView[]) => {
  const importActions: ImportAction[] = []

  try {
    const { data: questions } = await axios.get(`${window.BOT_API_PATH}/mod/qna/questions`)

    for (const question of file.knowledge) {
      const existing = questions.items.find(x => x.id === question.id)
      importActions.push({
        type: ElementType.Knowledge,
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
    for (const workflow of file.workflows) {
      const actions = await analyzeWorkflowFile(workflow, flows)
      const existing: any = flows.find(x => x.name === workflow.name)

      importActions.push(...actions)
      importActions.push(getWorkflowAction(workflow, existing))
    }
  } catch (err) {
    console.error(`Can't check knowledge: ${err}`)
  }

  return importActions
}

export const executeTopicActions = async (actions: ImportAction[]) => {
  const getActionType = type => actions.filter(x => x.type === type && !x.identical)
  try {
    await Promise.each(getActionType('knowledge'), ({ data: { id, data } }) =>
      axios.post(`${window.BOT_API_PATH}/mod/qna/questions/${id}`, data)
    )
  } catch (err) {
    console.error(`Can't import knowledge: ${err}`)
  }

  try {
    await Promise.each(getActionType('topic'), ({ data, name, existing }) => {
      const topicPath = (existing && `/${name}`) || ''
      return axios.post(`${window.BOT_API_PATH}/topic${topicPath}`, data)
    })
  } catch (err) {
    console.error(`Can't import topic: ${err}`)
  }

  await executeWorkflowActions(actions)
}

export const renameTopic = (newName: string, exportedTopic: ExportedTopic) => {
  exportedTopic.workflows.forEach(el => {
    const name = `${newName}${el.name.substr(el.name.indexOf('/'))}`
    el.name = name
    el.location = name
  })
}

export const detectFileType = content => {
  if (content.name && content.knowledge && content.workflows) {
    return ElementType.Topic
  }

  if (content.name && content.nodes && content.content) {
    return ElementType.Workflow
  }
  return ElementType.Unknown
}

export const getTopicAction = (newTopic: Topic, existingTopic: Topic): ImportAction => {
  return {
    type: ElementType.Topic,
    name: newTopic.name,
    existing: !!existingTopic,
    identical: existingTopic !== undefined && _.isEqual(newTopic, existingTopic),
    data: newTopic
  }
}

export const fields = {
  topic: { knowledge: 'Knowledge element', workflows: 'Workflows' },
  workflow: { actions: 'Action', content: 'Content Element', intents: 'Intent', skills: 'Skill' }
}
