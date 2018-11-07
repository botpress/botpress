import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import values from 'lodash/values'

import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'
import {
  updateFlow,
  requestEditSkill,
  copyFlowNodeElement,
  pasteFlowNodeElement,
  closeFlowNodeProps,
  updateFlowNode,
  refreshFlowsLinks
} from '~/actions'

import NodeProps from '../nodeProps'

const mapStateToProps = state => ({
  flows: values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  buffer: state.flows.buffer,
  user: state.user
})

const mapDispatchToProps = {
  updateFlow,
  requestEditSkill,
  copyFlowNodeElement,
  pasteFlowNodeElement,
  closeFlowNodeProps,
  updateFlowNode,
  refreshFlowsLinks
}

const ConnectedNodeProps = connect(mapStateToProps, mapDispatchToProps)(withRouter(NodeProps))
export default ConnectedNodeProps
