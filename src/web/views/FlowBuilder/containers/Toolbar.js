import { connect } from 'react-redux'
import { fetchFlows } from '~/reducers/actions'

import Toolbar from '../toolbar.jsx'

const mapStateToProps = (state, ownProps) => {
  return {
    flows: state.flows
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    fetchFlows: () => {
      dispatch(fetchFlows())
    }
  }
}

const ConnectedToolbar = connect(mapStateToProps, mapDispatchToProps)(Toolbar)

export default ConnectedToolbar
