import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import {
  closeFlowNodeProps,
  copyFlowNode,
  fetchContentCategories,
  fetchContentItem,
  pasteFlowNode,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow,
  updateFlowNode
} from '~/actions'
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'

import { textToItemId } from '../diagram/nodes_v2/utils'
import FlowInformation from '../nodeProps/FlowInformation'
import SaySomethingForm from '../nodeProps/SaySomethingForm'

import style from './style.scss'

interface Props {
  buffer: any
  categories: any
  closeFlowNodeProps: any
  copyFlowNode: any
  currentFlow: any
  currentFlowNode: any
  fetchContentCategories: any
  fetchContentItem: any
  flows: any
  history: any
  pasteFlowNode: any
  readOnly: any
  refreshFlowsLinks: any
  requestEditSkill: any
  show: any
  updateFlow: any
  updateFlowNode: any
  user: any
}

const InspectorV2: FC<Props> = props => {
  const renderNodeProperties = props => {
    const {
      buffer,
      categories,
      contentItem,
      copyFlowNode,
      currentFlow,
      currentFlowNode,
      fetchContentCategories,
      fetchContentItem,
      itemId,
      pasteFlowNode,
      readOnly,
      refreshFlowsLinks,
      requestEditSkill,
      updateFlow,
      updateFlowNode,
      user
    } = props
    const subflows = _.filter(
      _.map(props.flows, f => f.name),
      f => f !== _.get(props, 'currentFlow.name')
    )
    const flowType = _.get(props, 'currentFlowNode.type') || (currentFlowNode ? 'standard' : null)

    const updateNodeAndRefresh = (...args) => {
      updateFlowNode(...args)
      refreshFlowsLinks()
    }

    if (flowType === 'say_something') {
      return (
        <SaySomethingForm
          buffer={buffer}
          categories={categories}
          contentItem={contentItem}
          copyFlowNode={copyFlowNode}
          fetchContentCategories={fetchContentCategories}
          fetchContentItem={fetchContentItem}
          flow={currentFlow}
          itemId={itemId}
          node={currentFlowNode}
          pasteFlowNode={pasteFlowNode}
          readOnly={readOnly}
          requestEditSkill={requestEditSkill}
          subflows={subflows}
          updateFlow={updateFlow}
          updateNode={updateNodeAndRefresh}
          user={user}
        />
      )
    }

    return <FlowInformation {...props} subflows={subflows} />
  }

  return <div className={style.inspector}>{renderNodeProperties(props)}</div>
}

const mapStateToProps = state => {
  const node = getCurrentFlowNode(state)
  let itemId

  if (node) {
    const { onEnter } = node

    itemId = textToItemId((onEnter && onEnter.length && onEnter[0]) || '')
  }

  return {
    buffer: state.flows.buffer,
    categories: state.content.categories,
    contentItem: itemId && { ...state.content.itemsById[itemId] },
    currentFlow: getCurrentFlow(state),
    currentFlowNode: getCurrentFlowNode(state),
    flows: _.values(state.flows.flowsByName),
    itemId,
    user: state.user
  }
}

const mapDispatchToProps = {
  closeFlowNodeProps,
  copyFlowNode,
  fetchContentCategories,
  fetchContentItem,
  pasteFlowNode,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow,
  updateFlowNode
}

export default connect(mapStateToProps, mapDispatchToProps)(InspectorV2)
