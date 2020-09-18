import { Tab, Tabs } from '@blueprintjs/core'
import { FlowVariable, FormField, SubWorkflowInput } from 'botpress/sdk'
import { Contents, lang, RightSidebar, sharedStyle } from 'botpress/shared'
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
  const fields = subFlowVars.map<FormField>(({ params, type }) => ({
    type: 'text',
    superInput: true,
    superInputOptions: {
      canPickEvents: false,
      simple: true,
      toggleable: true
    },
    key: params.name,
    label: params.name,
    variableTypes: [type],
    placeholder: 'module.builtin.enterValue',
    defaultVariableType: type
  }))

  return (
    <RightSidebar className={sharedStyle.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={customKey}>
        <div className={sharedStyle.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('input')} />
          </Tabs>
        </div>

        <Contents.Form
          fields={fields}
          variables={variables}
          formData={formData}
          onUpdate={updateEntry}
          onUpdateVariables={onUpdateVariables}
        />
      </Fragment>
    </RightSidebar>
  )
}

export default InputForm
