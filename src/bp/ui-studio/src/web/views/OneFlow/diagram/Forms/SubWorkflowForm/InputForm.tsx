import { FlowVariable, FormField, SubWorkflowInput } from 'botpress/sdk'
import { Contents, lang, MainContent, sharedStyle, Tabs } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

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
    placeholder: 'module.builtin.enterValue',
    onClick: field => setFieldTypes({ ...fieldTypes, [field.key]: field.type === 'variable' ? 'text' : 'variable' }),
    defaultVariableType: type
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
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose={true} close={() => close()}>
      <Fragment key={customKey}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('input') }]} />
        </div>

        <Contents.Form
          fields={fields}
          variables={variables}
          formData={convertFormData(formData)}
          onUpdate={convertBack}
          onUpdateVariables={onUpdateVariables}
        />
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default InputForm
