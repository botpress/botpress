import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { loadInEditor, setActiveFormItem, setActiveView, switchFlowNode, updateFlow, updateFlowNode } from '~/actions'
import { getAllFlows, getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'
import { ViewType } from '~/reducers/ui'

import ContentForm from './ContentForm'
import ExecuteForm from './ExecuteForm'

interface OwnProps {
  currentLang: string
  defaultLang: string
  deleteSelectedElements: () => void
  updateEditingNodeItem: (editingNodeItem: any) => void
  diagramEngine: any

  updateTimeout: (timeout) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps

const Forms: FC<Props> = ({
  contentTypes,
  currentLang,
  defaultLang,
  currentFlowNode,
  updateEditingNodeItem,
  deleteSelectedElements,
  diagramEngine,
  activeFormItem,
  updateFlowNode,
  switchFlowNode,
  setActiveFormItem,
  updateTimeout,
  actions,
  loadInEditor,
  hints,
  setActiveView,
  activeView
}) => {
  const { node, index, data } = activeFormItem || {}
  const formType: string = node?.nodeType || node?.type || activeFormItem?.type

  let currentItem
  if (formType === 'say_something') {
    currentItem = node?.content
  } else if (formType === 'execute') {
    currentItem = node?.execute
  }

  const getEmptyContent = content => {
    if (!content) {
      return { contentType: 'builtin_text' }
    }
    return {
      contentType: content[Object.keys(content)[0]]?.contentType
    }
  }

  const updateNodeContent = data => {
    switchFlowNode(node.id)
    updateEditingNodeItem({ node: { ...node, content: data.content }, index })
    updateFlowNode({ content: data.content })
  }

  const deleteNodeContent = () => {
    deleteSelectedElements()
    setActiveFormItem(null)
  }

  const updateExecute = data => {
    switchFlowNode(node.id)
    updateEditingNodeItem({ node: { ...node, execute: { ...node.execute, ...data } }, index })
    updateFlowNode({ execute: { ...node.execute, ...data } })
  }

  const close = () => {
    updateTimeout(
      setTimeout(() => {
        setActiveFormItem(null)
      }, 200)
    )
  }

  return (
    <Fragment>
      {/* {formType === 'say_something' && (
        <ContentForm
          customKey={`${node.id}${index}`}
          contentTypes={contentTypes}
          deleteContent={() => deleteNodeContent()}
          contentLang={currentLang}
          node={currentFlowNode}
          defaultLang={defaultLang}
          editingContent={index}
          formData={currentItem || getEmptyContent(currentItem)}
          onUpdate={updateNodeContent}
          close={close}
        />
      )} */}
      {formType === 'execute' && (
        <ExecuteForm
          node={currentFlowNode}
          customKey={`${node?.id}`}
          deleteNode={deleteSelectedElements}
          contentLang={currentLang}
          actions={actions}
          events={hints}
          formData={currentItem}
          onUpdate={updateExecute}
          onCodeEdit={(code, editorCallback, template) => {
            loadInEditor({ code, editorCallback, template })
            setActiveView(ViewType.CodeEditor)
          }}
          keepOpen={activeView === ViewType.CodeEditor}
          close={close}
        />
      )}
    </Fragment>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  flows: getAllFlows(state),
  currentFlowNode: getCurrentFlowNode(state),
  activeFormItem: state.flows.activeFormItem,
  contentTypes: state.content.categories,
  actions: state.skills.actions,
  hints: state.hints.inputs,
  activeView: state.ui.activeView
})

const mapDispatchToProps = {
  switchFlowNode,
  updateFlowNode,
  updateFlow,
  loadInEditor,
  setActiveFormItem,
  setActiveView
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Forms)
