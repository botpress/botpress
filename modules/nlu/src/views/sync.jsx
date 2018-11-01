import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import _ from 'lodash'

import style from './style.scss'

export default class SyncConfirmModal extends React.Component {
  state = {
    isSyncing: false,
    syncFailedError: null
  }

  componentDidMount() {
    this.initializeFromProps()
  }

  componentWillReceiveProps(nextProps) {
    this.initializeFromProps(nextProps)
  }

  initializeFromProps(props) {
    props = props || this.props
  }

  sync = () => {
    this.setState({ isSyncing: true, syncFailedError: null })

    return this.props.axios
      .get('/api/ext/nlu/sync')
      .then(res => {
        this.setState({ isSyncing: false })
        this.props.onSync(false)
      })
      .catch(err => {
        this.setState({ isSyncing: false, syncFailedError: err.response.data })
      })
  }

  render() {
    const showInfo = !this.state.isSyncing && !this.state.syncFailedError

    return (
      <Modal show={this.props.show} bsSize="small" animation={false}>
        <Modal.Header>
          <Modal.Title>Synchronization</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {showInfo && (
            <p>Be careful as single state of truth, everything on your provider will be either deleted or updated</p>
          )}
          {this.state.isSyncing && <p className={style.loading}>Syncing</p>}
          {this.state.syncFailedError && <p>Syncing failed, reason : {this.state.syncFailedError}</p>}
        </Modal.Body>

        <Modal.Footer>
          <Button disabled={this.state.isSyncing} onClick={this.props.onHide}>
            Cancel
          </Button>
          <Button bsStyle="primary" disabled={this.state.isSyncing} onClick={this.sync}>
            Sync
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
