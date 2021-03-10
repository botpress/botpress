import axios from 'axios'
import 'bluebird-global'
import { FlowView } from 'common/typings'
import _ from 'lodash'

import { ElementType } from '..'
import { ExportedFlow, ImportAction } from '../typings'

export const analyzeWorkflowFile = async (file: ExportedFlow, flows: FlowView[]) => {
  const ids = file.content.map(x => x.id)
  const { data: elements } = await axios.post(`${window.BOT_API_PATH}/content/elements`, { ids })

  const importActions: ImportAction[] = []

  try {
    const { data: actions } = await axios.get(`${window.BOT_API_PATH}/mod/code-editor/files?includeBuiltin=true`)

    for (const action of file.actions) {
      const existing = [...actions['bot.actions'], ...actions['global.actions']].find(
        x => x.location === `${action.actionName}.js`
      )
      if (existing) {
        const { data } = await axios.post(`${window.BOT_API_PATH}/mod/code-editor/readFile`, existing)

        importActions.push({
          type: ElementType.Action,
          name: action.actionName,
          existing: true,
          identical: data.fileContent === action.fileContent,
          data: action
        })
      } else {
        importActions.push({ type: ElementType.Action, name: action.actionName, data: action })
      }
    }
  } catch (err) {
    console.error(`Can't check actions: ${err}`)
  }

  try {
    const { data: intents } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/intents`)

    for (const intent of file.intents) {
      const existing = intents.find(x => x.name === intent.name)

      importActions.push({
        type: ElementType.Intent,
        name: intent.name,
        existing: !!existing,
        identical: existing !== undefined && _.isEqual(existing, intent),
        data: intent
      })
    }
  } catch (err) {
    console.error(`Can't check intents: ${err}`)
  }

  for (const content of file.content) {
    const existing = elements.find(x => x.id === content.id)

    importActions.push({
      type: ElementType.Content,
      name: content.id,
      existing: !!existing,
      identical: existing !== undefined && _.isEqual(existing.formData, content.formData),
      data: content
    })
  }

  for (const flow of file.skills) {
    const existing = flows.find(x => x.name === flow.name)

    importActions.push({
      type: ElementType.Flow,
      name: flow.name,
      existing: !!existing,
      identical: existing !== undefined && _.isEqual(existing, flow),
      data: flow
    })

    const flowContent = await analyzeWorkflowFile(flow, flows)
    importActions.push(...flowContent)
  }

  return importActions
}

export const executeWorkflowActions = async (actions: ImportAction[]) => {
  const botId = window.BOT_ID

  const getActionsForType = type => actions.filter(x => x.type === type && !x.identical)

  try {
    await Promise.each(getActionsForType('content'), ({ data: { contentType, formData, id } }) =>
      axios.post(`${window.BOT_API_PATH}/content/${contentType}/element/${id}`, { formData })
    )
  } catch (err) {
    console.error(`Can't import content elements: ${err}`)
  }

  try {
    await Promise.each(getActionsForType('intent'), ({ data }) =>
      axios.post(`${window.BOT_API_PATH}/mod/nlu/intents`, data)
    )
  } catch (err) {
    console.error(`Can't import intents: ${err}`)
  }

  try {
    await Promise.each(getActionsForType('action'), async ({ data: { actionName, fileContent } }) => {
      const isGlobal = actionName.indexOf('/') > 0
      const name = `${actionName}.js`

      await axios.post(`${window.BOT_API_PATH}/mod/code-editor/save`, {
        botId: !isGlobal && botId,
        location: name,
        name,
        type: 'action',
        content: fileContent
      })
    })
  } catch (err) {
    console.error(`Can't import actions: ${err}`)
  }

  try {
    await Promise.each([...getActionsForType('flow'), ...getActionsForType('workflow')], ({ data, existing }) => {
      const flowPath = (existing && `/${data.location.replace(/\//g, '%2F')}`) || ''
      return axios.post(`${window.BOT_API_PATH}/flow${flowPath}`, {
        flow: cleanFlowProperties(data)
      })
    })
  } catch (err) {
    console.error(`Can't import flows: ${err}`)
  }
}

export const cleanFlowProperties = flow => _.omit(flow, ['content', 'actions', 'intents', 'skills', 'currentMutex'])

export const getWorkflowAction = (newWorkflow: ExportedFlow, existingWorkflow: FlowView): ImportAction => {
  return {
    type: ElementType.Workflow,
    name: newWorkflow.name,
    existing: !!existingWorkflow,
    identical:
      existingWorkflow !== undefined &&
      _.isEqual(cleanFlowProperties(newWorkflow), cleanFlowProperties(existingWorkflow)),
    data: newWorkflow
  }
}
