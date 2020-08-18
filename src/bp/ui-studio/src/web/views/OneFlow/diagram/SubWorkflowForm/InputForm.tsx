import { Tab, Tabs } from '@blueprintjs/core'
import { FlowVariable, FormField, SubWorkflowInput } from 'botpress/sdk'
import { Contents, lang, RightSidebar } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import style from '../PromptForm/style.scss'

interface Props {
  customKey: string
  subFlowVars: FlowVariable[]
  formData: { [variable: string]: SubWorkflowInput }
  variables: Variables
  close: () => void
  updateEntry: (formData: any) => void
  onUpdateVariables: (variable: FlowVariable) => void
}

const InputForm: FC<Props> = ({
  close,
  customKey,
  formData,
  subFlowVars,
  variables,
  updateEntry,
  onUpdateVariables
}) => {
  const [fieldTypes, setFieldTypes] = useState({})

  useEffect(() => {
    setFieldTypes(_.mapValues(formData, item => (item?.source === 'variable' ? 'variable' : 'text')))
  }, [customKey])

  const fields = subFlowVars.map<FormField>(({ params, type }) => ({
    type: fieldTypes[params.name] ?? 'variable',
    key: params.name,
    label: params.name,
    variableTypes: [type],
    placeholder: 'module.builtin.setValueToPlaceholder',
    defaultVariableType: type,
    // TODO: Use the variable default type instead of text (ex: number, date)
    onClick: field => setFieldTypes({ ...fieldTypes, [field.key]: field.type === 'variable' ? 'text' : 'variable' })
  }))

  const convertBack = data => {
    const items = _.mapValues(data, (value, key) => ({
      source: fieldTypes[key] === 'variable' ? 'variable' : 'hardcoded',
      value
    }))

    updateEntry(items)
  }

  const convertFormData = data => {
    return _.mapValues(data, item => item?.value)
  }

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={customKey}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('input')} />
          </Tabs>
        </div>

        <Contents.Form
          fields={fields}
          variables={variables}
          formData={convertFormData(formData)}
          onUpdate={convertBack}
          onUpdateVariables={onUpdateVariables}
        />
      </Fragment>
    </RightSidebar>
  )
}

export default InputForm
