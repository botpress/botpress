import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { fetchFlows, setDiagramAction } from '~/actions'
import { getCurrentFlow } from '~/reducers'

import Toolbar from '../toolbar.jsx'

const mapStateToProps = (state, ownProps) => ({
  flows: state.flows,
  currentFlow: getCurrentFlow(state),
  currentDiagramAction: state.flows.currentDiagramAction
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      fetchFlows: fetchFlows,
      setDiagramAction: setDiagramAction
    },
    dispatch
  )

const ConnectedToolbar = connect(mapStateToProps, mapDispatchToProps)(Toolbar)

export default ConnectedToolbar
