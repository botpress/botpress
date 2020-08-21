import { FlowNode, FlowVariable, SubWorkflowNode } from 'botpress/sdk'
import { FlowView, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC } from 'react'

import InputForm from './InputForm'
import OutputForm from './OutputForm'

interface Props {
  close: () => void
  node: FlowNode
  customKey: string
  flows: FlowView[]
  formData: SubWorkflowNode
  variables: Variables
  type: 'in' | 'out'
  updateSubWorkflow: (formData: SubWorkflowNode) => void
  onUpdateVariables: (variable: FlowVariable) => void
}

const SubWorkflowForm: FC<Props> = ({
  type,
  node,
  customKey,
  formData,
  variables,
  flows,
  close,
  updateSubWorkflow,
  onUpdateVariables
}) => {
  const updateEntry = data => {
    updateSubWorkflow({
      ...(formData || ({} as SubWorkflowNode)),
      [type]: {
        ...data
      }
    })
  }

  const subflow = flows.find(x => x.name === node?.flow)
  const subFlowVars = (subflow?.variables || []).filter(v => (type === 'in' ? v.params.isInput : v.params.isOutput))

  const commonProps = { close, customKey, subFlowVars, variables, updateEntry, onUpdateVariables }

  if (type === 'in') {
    return <InputForm {...commonProps} formData={formData?.in ?? {}}></InputForm>
  } else {
    return <OutputForm {...commonProps} formData={formData?.out ?? {}}></OutputForm>
  }
}

export default SubWorkflowForm
