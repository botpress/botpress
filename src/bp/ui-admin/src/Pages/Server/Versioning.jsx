import React, { Component } from 'react'
import { connect } from 'react-redux'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Button, Jumbotron, Row, Col } from 'reactstrap'
import { FaRegSmile } from 'react-icons/fa'
import _ from 'lodash'

import { fetchPendingChanges } from '../../reducers/versioning'
import { pullToken } from '../../Auth'

class Versioning extends Component {
  state = {
    pullCommand: '',
    pushCommand: '',
    copied: false
  }

  componentDidMount() {
    this.props.fetchPendingChanges()
    this.setPullCommand()
  }

  setPullCommand = () => {
    let bpcli = navigator.appVersion.indexOf('Win') !== -1 ? 'bp.exe' : './bp'

    const { token } = pullToken()
    const host = window.location.origin

    this.setState({
      pullCommand: `${bpcli} pull --url ${host}${window.ROOT_PATH} --authToken ${token} --targetDir data`,
      pushCommand: `${bpcli} push --url ${host}${window.ROOT_PATH} --authToken ${token} --targetDir data`
    })
  }

  setCopied = () => {
    this.setState({ copied: true })
  }

  renderNoPendingChanges = () => {
    return (
      <Jumbotron>
        <Row>
          <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
            <h1>
              <FaRegSmile />
              &nbsp;You're all set
            </h1>
            <p>No changes have been made on this server yet.</p>
          </Col>
        </Row>
      </Jumbotron>
    )
  }

  renderMainContent = () => (
    <div>
      {this.props.loading && <div>loading</div>}

      {!this.props.loading && (
        <div>
          <h4>Pull remote to file system</h4>
          <p>Use this command to copy the remote data on your local file system.</p>
          <code>{this.state.pullCommand}</code>
          <CopyToClipboard text={this.state.command} onCopy={this.setCopied}>
            <Button color="link" size="sm" className="license-infos__icon">
              <svg href="#" id="TooltipCopy" height="15" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.996 0H16v16h-4.004v4H0V4h3.996V0zM6 2v12h8V2H6zM2 6v12h8v-1.997H3.998V6H2z"
                  fill="#4A4A4A"
                  fillRule="evenodd"
                />
              </svg>
            </Button>
          </CopyToClipboard>
          {this.state.copied && <span>&nbsp;copied</span>}
          <hr />
          <h4>Push local to this server</h4>
          <p>
            If you are using the database storage for BPFS, you can also push your local changes to the database using
            this command:
          </p>
          <code>{this.state.pushCommand}</code>
        </div>
      )}
    </div>
  )

  render() {
    return this.renderMainContent()
  }
}

const mapStateToProps = state => ({
  ...state.versioning
})

export default connect(
  mapStateToProps,
  { fetchPendingChanges }
)(Versioning)
