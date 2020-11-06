import { ExecuteNode } from 'botpress/sdk'
import { Form } from 'botpress/shared'
import { ControlType } from 'common/controls'
import { LocalActionDefinition } from 'common/typings'
import React, { FC } from 'react'

interface Props {
  customKey: string
  actionName: string
  contentLang: string
  actions: LocalActionDefinition[]
  formData: ExecuteNode
  onUpdate: (data: Partial<ExecuteNode>) => void
}

const ConfigAction: FC<Props> = ({ actions, actionName, formData, contentLang, onUpdate }) => {
  const actionParams = actions.find(x => x.name === actionName)?.params

  const fields = actionParams?.reduce((acc, { name, required, description, default: defaultValue }) => {
    return {
      ...acc,
      [name]: {
        type: ControlType.String,
        title: name,
        required,
        placeholder: description,
        defaultValue
      }
    }
  }, {})

  return (
    <Form.Form
      currentLang={contentLang}
      fields={fields}
      formData={formData?.params}
      onUpdate={data => onUpdate({ params: data })}
    />
  )
}

export default ConfigAction
