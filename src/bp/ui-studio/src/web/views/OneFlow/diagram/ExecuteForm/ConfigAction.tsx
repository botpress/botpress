import { ActionParameter, BotEvent, ExecuteNode, FlowVariable, FormField } from 'botpress/sdk'
import { Contents } from 'botpress/shared'
import { LocalActionDefinition, Variables } from 'common/typings'
import mapValues from 'lodash/mapValues'
import React, { FC } from 'react'

interface Props {
  customKey: string
  actionName: string
  contentLang: string
  variables: Variables
  actions: LocalActionDefinition[]
  events: BotEvent[]
  formData: ExecuteNode
  onUpdate: (data: Partial<ExecuteNode>) => void
  onUpdateVariables: (variable: FlowVariable) => void
}

const ConfigAction: FC<Props> = ({
  customKey,
  variables,
  actions,
  actionName,
  formData,
  events,
  contentLang,
  onUpdate,
  onUpdateVariables
}) => {
  const actionParams = actions.find(x => x.name === actionName)?.params

  const fields: FormField[] = actionParams?.map(x => ({
    type: 'text',
    key: x.name,
    label: x.name,
    required: x.required,
    placeholder: x.description,
    superInput: true,
    defaultValue: x.default
  }))

  const onUpdateContent = data => {
    onUpdate({ params: mapValues(data, val => ({ source: 'hardcoded', value: val } as ActionParameter)) })
  }

  return (
    <Contents.Form
      currentLang={contentLang}
      variables={variables}
      events={events}
      fields={fields}
      advancedSettings={[]}
      formData={mapValues(formData?.params, ({ value }) => value)}
      onUpdate={onUpdateContent}
      onUpdateVariables={onUpdateVariables}
    />
  )
}

export default ConfigAction
