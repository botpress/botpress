import { Tab, Tabs } from '@blueprintjs/core'
import { FlowVariable, FormField } from 'botpress/sdk'
import { Contents, lang, RightSidebar } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

import style from '../PromptForm/style.scss'

interface Props {
  customKey: string
  subFlowVars: FlowVariable[]
  formData: { [variable: string]: string }
  variables: Variables
  close: () => void
  onUpdateVariables: (variable: FlowVariable) => void
  updateEntry: (formData: any) => void
}

const OutputForm: FC<Props> = ({
  customKey,
  formData,
  subFlowVars,
  variables,
  updateEntry,
  onUpdateVariables,
  close
}) => {
  const fields = subFlowVars.map<FormField>(({ params, type }) => ({
    type: 'variable',
    key: params.name,
    label: params.name,
    variableTypes: [type],
    placeholder: 'module.builtin.setValueToPlaceholder',
    defaultVariableType: type
  }))

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={customKey}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('output')} />
          </Tabs>
        </div>

        <Contents.Form
          fields={fields}
          variables={variables}
          formData={formData}
          onUpdateVariables={onUpdateVariables}
          onUpdate={updateEntry}
        />
      </Fragment>
    </RightSidebar>
  )
}

export default OutputForm
