import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { setActiveFormItem, switchFlowNode, updateFlow, updateFlowNode } from '~/actions'
import { getAllFlows, getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'

import ContentForm from './ContentForm'

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
  switchFlowNode,
  updateFlowNode,
  updateEditingNodeItem,
  deleteSelectedElements,
  diagramEngine,
  activeFormItem,
  setActiveFormItem,
  updateTimeout
}) => {
  const { node, index, data } = activeFormItem || {}
  const formType: string = node?.nodeType || node?.type || activeFormItem?.type

  let currentItem
  if (formType === 'say_something') {
    currentItem = node?.content
  }

  const getEmptyContent = (content?: { contentType: string; [prop: string]: any }) => {
    if (!content) {
      return { contentType: 'builtin_text' }
    }
    return {
      contentType: Object.values(content)[0]?.contentType
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
          contentTypes={contentTypes.filter(type => type.schema.newJson?.displayedIn.includes('sayNode'))}
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
    </Fragment>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  flows: getAllFlows(state),
  currentFlowNode: getCurrentFlowNode(state),
  activeFormItem: state.flows.activeFormItem,
  contentTypes: state.content.categories
})

const mapDispatchToProps = {
  switchFlowNode,
  updateFlowNode,
  updateFlow,
  setActiveFormItem
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Forms)
