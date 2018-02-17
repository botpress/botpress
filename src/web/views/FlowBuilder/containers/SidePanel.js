import { connect } from 'react-redux'
import values from 'lodash/values'
import { withRouter } from 'react-router'

import { getCurrentFlow, getCurrentFlowNode, getDirtyFlows } from '~/reducers'
import {
  updateFlowNode,
  refreshFlowsLinks,
  updateFlow,
  removeFlowNode,
  deleteFlow,
  duplicateFlow,
  requestEditSkill,
  copyFlowNodeElement,
  pasteFlowNodeElement
} from '~/actions'

import SidePanel from '../sidePanel'

const mapStateToProps = (state, ownProps) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  flows: values(state.flows.flowsByName),
  buffer: state.flows.buffer,
  dirtyFlows: getDirtyFlows(state)
})

const mapDispatchToProps = {
  updateFlowNode,
  refreshFlowsLinks,
  updateFlow,
  deleteFlow,
  duplicateFlow,
  requestEditSkill,
  copyFlowNodeElement,
  pasteFlowNodeElement
}

const ConnectedSidePanel = connect(mapStateToProps, mapDispatchToProps)(withRouter(SidePanel))
export default ConnectedSidePanel
