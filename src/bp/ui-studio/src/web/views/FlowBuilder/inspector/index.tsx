import { Button, H4 } from '@blueprintjs/core'
import cx from 'classnames'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import {
  closeFlowNodeProps,
  copyFlowNode,
  copyFlowNodeElement,
  fetchContentCategories,
  pasteFlowNode,
  pasteFlowNodeElement,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow,
  updateFlowNode
} from '~/actions'
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'

import { nodeTypes } from '../diagram/manager'
import FlowInformation from '../nodeProps/FlowInformation'
import SaySomethingForm from '../nodeProps/SaySomethingForm'
import SkillCallNode from '../nodeProps/SkillCallNode'
import StandardNode from '../nodeProps/StandardNode'

import style from './style.scss'

interface Props {
  buffer: any
  categories: any
  closeFlowNodeProps: any
  copyFlowNode: any
  copyFlowNodeElement: any
  currentFlow: any
  currentFlowNode: any
  fetchContentCategories: any
  flows: any
  history: any
  onDeleteSelectedElements: () => void
  pasteFlowNode: any
  pasteFlowNodeElement: any
  readOnly: any
  refreshFlowsLinks: any
  requestEditSkill: any
  show: any
  updateFlow: any
  updateFlowNode: any
  user: any
}

class Inspector extends Component<Props> {
  render() {
    const { currentFlowNode } = this.props

    const goBackToMain = () => {
      this.props.closeFlowNodeProps()
      this.props.refreshFlowsLinks()
    }

    const node = currentFlowNode
    const flowType = currentFlowNode?.type || (currentFlowNode ? 'standard' : null)
    return (
      <div className={cx(style.inspector, { [style.sideForm]: flowType === 'say_something' })}>
        {flowType !== 'say_something' && (
          <Fragment>
            {node && (
              <Button id="btn-back-element" className={style.noLineHeight} onClick={goBackToMain} small={true}>
                <i className="material-icons">keyboard_backspace</i>
              </Button>
            )}
            <H4>{node ? 'Node Properties' : 'Flow Properties'}</H4>
          </Fragment>
        )}
        {this.renderNodeProperties(flowType)}
      </div>
    )
  }

  renderNodeProperties(flowType: string) {
    const {
      buffer,
      categories,
      copyFlowNode,
      currentFlow,
      currentFlowNode,
      onDeleteSelectedElements,
      fetchContentCategories,
      pasteFlowNode,
      readOnly,
      refreshFlowsLinks,
      requestEditSkill,
      updateFlow,
      updateFlowNode,
      flows,
      user
    } = this.props

    const subflows = _.filter(
      _.map(flows, f => f.name),
      f => f !== currentFlow?.name
    )

    const updateNodeAndRefresh = (...args) => {
      updateFlowNode(...args)
      refreshFlowsLinks()
    }

    if (flowType === 'skill-call') {
      return (
        <SkillCallNode
          readOnly={readOnly}
          user={user}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={updateFlow}
          requestEditSkill={requestEditSkill}
          copyFlowNodeElement={copyFlowNodeElement}
          pasteFlowNodeElement={pasteFlowNodeElement}
          buffer={buffer}
        />
      )
    }

    if (flowType === 'say_something') {
      return (
        <SaySomethingForm
          buffer={buffer}
          categories={categories}
          copyFlowNode={copyFlowNode}
          onDeleteSelectedElements={onDeleteSelectedElements}
          fetchContentCategories={fetchContentCategories}
          flow={currentFlow}
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

    if (nodeTypes.includes(flowType)) {
      return (
        <StandardNode
          readOnly={readOnly}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={updateFlow}
          copyFlowNodeElement={copyFlowNodeElement}
          pasteFlowNodeElement={pasteFlowNodeElement}
          transitionOnly={flowType === 'router'}
          buffer={buffer}
        />
      )
    }

    return <FlowInformation {...this.props} subflows={subflows} />
  }
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
  copyFlowNodeElement,
  pasteFlowNodeElement,
  fetchContentCategories,
  closeFlowNodeProps,
  updateFlowNode,
  refreshFlowsLinks,
  copyFlowNode,
  pasteFlowNode
}

export default connect(mapStateToProps, mapDispatchToProps)(Inspector)
