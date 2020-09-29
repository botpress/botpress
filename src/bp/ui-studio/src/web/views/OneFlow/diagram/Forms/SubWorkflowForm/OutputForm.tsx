import { FlowVariable, FormField } from 'botpress/sdk'
import { Contents, lang, MainContent, sharedStyle, Tabs } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

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
    placeholder: 'module.builtin.enterValue',
    defaultVariableType: type
  }))

  return (
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose={true} close={() => close()}>
      <Fragment key={customKey}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('output') }]} />
        </div>

        <Contents.Form
          fields={fields}
          variables={variables}
          formData={formData}
          onUpdateVariables={onUpdateVariables}
          onUpdate={updateEntry}
        />
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default OutputForm
