import { FlowVariable, NodeTransition } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment, useRef } from 'react'
import { connect } from 'react-redux'
import * as portals from 'react-reverse-portal'
import { setActiveFormItem, switchFlowNode, updateFlow, updateFlowNode } from '~/actions'
import { getAllFlows, getCurrentFlow, getCurrentFlowNode, getPrompts, getVariables, RootReducer } from '~/reducers'

import ActionForm from './ActionForm'
import ConditionForm from './ConditionForm'
import ContentForm from './ContentForm'
import ExecuteForm from './ExecuteForm'
import PromptForm from './PromptForm'
import RouterForm from './RouterForm'
import SubWorkflowForm from './SubWorkflowForm'
import VariableForm from './VariableForm'
import VariableTypesForm from './VariableTypesForm'

interface OwnProps {
  selectedTopic: string
  editorPortal: portals.HtmlPortalNode
  currentLang: string
  defaultLang: string
  deleteSelectedElements: () => void
  updateEditingNodeItem: (editingNodeItem: any) => void
  diagramEngine: any
  addVariable: (variable?: FlowVariable & { isNew?: boolean }) => void
  updateTimeout: (timeout) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps

const Forms: FC<Props> = ({
  contentTypes,
  actions,
  conditions,
  currentFlow,
  currentFlowNode,
  currentLang,
  defaultLang,
  editorPortal,
  flows,
  hints,
  prompts,
  selectedTopic,
  variables,
  updateEditingNodeItem,
  deleteSelectedElements,
  diagramEngine,
  addVariable,
  activeFormItem,
  setActiveFormItem,
  updateTimeout,
  switchFlowNode,
  updateFlowNode,
  updateFlow
}) => {
  const { node, index, data } = activeFormItem || {}
  const vars = variables.currentFlow ?? []
  const formType: string = node?.nodeType || node?.type || activeFormItem?.type

  let currentItem
  if (formType === 'say_something') {
    currentItem = node?.contents?.[index]
  } else if (formType === 'trigger') {
    currentItem = node?.conditions?.[index]
  } else if (formType === 'sub-workflow') {
    currentItem = node.subflow
  } else if (formType === 'variableType') {
    currentItem = data
  } else if (formType === 'variable') {
    currentItem = node?.variable
  } else if (formType === 'router') {
    currentItem = node?.next
  } else if (formType === 'execute') {
    currentItem = node?.execute
  }

  const getEmptyContent = content => {
    return {
      contentType: content[Object.keys(content)[0]]?.contentType
    }
  }

  const updateNodeContent = data => {
    const newContents = [...node.contents]

    newContents[index] = data.content

    switchFlowNode(node.id)
    updateEditingNodeItem({ node: { ...node, contents: newContents }, index })

    if (data.transitions && data.triggers) {
      updateFlowNode({
        contents: newContents,
        next: [...node.next.filter(x => x.condition === 'true'), ...data.transitions],
        triggers: data.triggers
      })
    } else {
      updateFlowNode({ contents: newContents })
    }
  }

  const updateNodeCondition = data => {
    const newConditions = [...node.conditions]

    newConditions[index] = data

    switchFlowNode(node.id)
    updateEditingNodeItem({ node: { ...node, conditions: newConditions }, index })
    updateFlowNode({
      conditions: newConditions,
      activeWorkflow: !!newConditions.find(x => x.id === 'on_active_workflow'),
      activeTopic: !!newConditions.find(x => x.id === 'on_active_topic')
    })
  }

  const updatePromptNode = args => {
    switchFlowNode(node.id)
    updateFlowNode({ prompt: { ...args } })
  }

  const deleteNodeContent = () => {
    const { contents } = node
    const newContents = [...contents.filter((_, i) => index !== i)]

    if (!newContents.length) {
      deleteSelectedElements()
    } else {
      updateFlowNode({ contents: newContents })
    }

    setActiveFormItem(null)
  }

  const deleteNodeCondition = () => {
    const { conditions } = node
    const newConditions = conditions.filter((cond, i) => index !== i)

    if (!newConditions.length) {
      deleteSelectedElements()
    } else {
      updateFlowNode({ conditions: newConditions })
    }

    setActiveFormItem(null)
  }

  const updateRouter = (data: NodeTransition) => {
    switchFlowNode(node.id)

    const newTransitions = [...node.next.slice(0, index), data, ...node.next.slice(index + 1)]

    updateEditingNodeItem({ node: { ...node, next: newTransitions }, index })
    updateFlowNode({ next: newTransitions })
  }

  const updateExecute = data => {
    switchFlowNode(node.id)
    updateEditingNodeItem({ node: { ...node, execute: { ...node.execute, ...data } }, index })
    updateFlowNode({ execute: { ...node.execute, ...data } })
  }

  const updateFlowVariable = data => {
    updateEditingNodeItem({ node: { ...node, variable: data }, index })
    updateFlow({
      ...currentFlow,
      variables: [...vars.slice(0, index), data, ...vars.slice(index + 1)]
    })
  }

  const deleteVariable = () => {
    updateFlow({
      ...currentFlow,
      variables: [...vars.slice(0, index), ...vars.slice(index + 1)]
    })
    setActiveFormItem(null)
  }

  const updateSubWorkflow = data => {
    switchFlowNode(node.id)
    updateEditingNodeItem({ node: { ...node, subflow: { ...node.subflow, ...data } }, index })
    updateFlowNode({ subflow: data })
  }

  const deleteTransition = () => {
    const next = currentFlowNode.next

    switchFlowNode(node.id)
    updateFlowNode({ next: [...next.slice(0, index), ...next.slice(index + 1)] })
  }

  return (
    <Fragment>
      {formType === 'say_something' && (
        <ContentForm
          customKey={`${node.id}${index}`}
          contentTypes={contentTypes.filter(type => type.schema.newJson?.displayedIn.includes('sayNode'))}
          deleteContent={() => deleteNodeContent()}
          variables={variables}
          events={hints || []}
          contentLang={currentLang}
          node={currentFlowNode}
          defaultLang={defaultLang}
          editingContent={index}
          formData={currentItem || getEmptyContent(currentItem)}
          onUpdate={updateNodeContent}
          onUpdateVariables={addVariable}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}
      {formType === 'trigger' && (
        <ConditionForm
          customKey={`${node.id}${index}`}
          conditions={conditions}
          deleteCondition={() => deleteNodeCondition()}
          editingCondition={index}
          topicName={selectedTopic}
          variables={variables}
          events={hints}
          formData={currentItem}
          contentLang={currentLang}
          defaultLang={defaultLang}
          onUpdate={updateNodeCondition}
          onUpdateVariables={addVariable}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}
      {formType === 'prompt' && (
        <PromptForm
          prompts={prompts}
          customKey={`${node?.id}${node?.prompt?.type}`}
          formData={node?.prompt}
          onUpdate={updatePromptNode}
          deletePrompt={deleteSelectedElements}
          variables={variables}
          onUpdateVariables={addVariable}
          contentLang={currentLang}
          defaultLang={defaultLang}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}
      {formType === 'execute' && (
        <ExecuteForm
          node={currentFlowNode}
          customKey={`${node?.id}`}
          deleteNode={deleteSelectedElements}
          contentLang={currentLang}
          editorPortal={editorPortal}
          formData={currentItem}
          events={hints}
          actions={actions}
          variables={variables}
          onUpdate={updateExecute}
          onUpdateVariables={addVariable}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}
      {formType === 'action' && (
        <ActionForm
          node={currentFlowNode}
          deleteNode={deleteSelectedElements}
          diagramEngine={diagramEngine}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}
      {formType === 'sub-workflow' && (
        <SubWorkflowForm
          variables={variables}
          node={currentFlowNode}
          customKey={`${node?.id}${node?.type}`}
          updateSubWorkflow={updateSubWorkflow}
          onUpdateVariables={addVariable}
          formData={currentItem}
          flows={flows}
          type={index === 0 ? 'in' : 'out'}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}

      {formType === 'router' && (
        <RouterForm
          transition={currentItem?.[index]}
          deleteTransition={deleteTransition}
          variables={variables}
          onUpdateVariables={addVariable}
          customKey={`${node?.type}${node?.id}${index}`}
          updateRouter={updateRouter}
          contentLang={currentLang}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}

      {formType === 'variable' && (
        <VariableForm
          variables={variables}
          contentLang={currentLang}
          customKey={index}
          defaultLang={defaultLang}
          deleteVariable={deleteVariable}
          formData={currentItem}
          currentFlow={currentFlow}
          onUpdate={updateFlowVariable}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}

      {formType === 'variableType' && (
        <VariableTypesForm
          contentLang={currentLang}
          customKey={data.id}
          formData={currentItem}
          variables={variables}
          close={() => {
            updateTimeout(
              setTimeout(() => {
                setActiveFormItem(null)
              }, 200)
            )
          }}
        />
      )}
    </Fragment>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  flows: getAllFlows(state),
  currentFlowNode: getCurrentFlowNode(state),
  actions: state.skills.actions,
  prompts: getPrompts(state),
  variables: getVariables(state),
  contentTypes: state.content.categories,
  conditions: state.ndu.conditions,
  hints: state.hints.inputs,
  activeFormItem: state.flows.activeFormItem
})

const mapDispatchToProps = {
  switchFlowNode,
  updateFlowNode,
  updateFlow,
  setActiveFormItem
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Forms)
