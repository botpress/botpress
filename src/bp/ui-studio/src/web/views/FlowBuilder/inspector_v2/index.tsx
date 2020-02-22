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

import FlowInformation from '../nodeProps/FlowInformation'
import SaySomethingForm from '../nodeProps/SaySomethingForm'

import style from './style.scss'

interface Props {
  currentFlowNode: any
  closeFlowNodeProps: any
  show: any
  history: any
  readOnly: any
  updateFlowNode: any
  refreshFlowsLinks: any
  flows: any
  currentFlow: any
  requestEditSkill: any
  copyFlowNode: any
  fetchContentCategories: any
  fetchContentItem: any
  categories: any
  pasteFlowNode: any
  buffer: any
  updateFlow: any
  user: any
}

const InspectorV2: FC<Props> = props => {
  const renderNodeProperties = props => {
    const {
      readOnly,
      currentFlowNode,
      updateFlowNode,
      refreshFlowsLinks,
      user,
      currentFlow,
      updateFlow,
      requestEditSkill,
      copyFlowNode,
      fetchContentCategories,
      fetchContentItem,
      categories,
      pasteFlowNode,
      buffer
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

    console.log(props)

    if (flowType === 'say_something') {
      return (
        <SaySomethingForm
          readOnly={readOnly}
          user={user}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={updateFlow}
          requestEditSkill={requestEditSkill}
          fetchContentCategories={fetchContentCategories}
          fetchContentItem={fetchContentItem}
          categories={categories}
          copyFlowNode={copyFlowNode}
          pasteFlowNode={pasteFlowNode}
          buffer={buffer}
        />
      )
    }

    return <FlowInformation {...props} subflows={subflows} />
  }

  return <div className={style.inspector}>{renderNodeProperties(props)}</div>
}

const mapStateToProps = state => ({
  flows: _.values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  buffer: state.flows.buffer,
  user: state.user,
  categories: state.content.categories
})

const mapDispatchToProps = {
  updateFlow,
  requestEditSkill,
  fetchContentCategories,
  fetchContentItem,
  copyFlowNode,
  pasteFlowNode,
  closeFlowNodeProps,
  updateFlowNode,
  refreshFlowsLinks
}

export default connect(mapStateToProps, mapDispatchToProps)(InspectorV2)
