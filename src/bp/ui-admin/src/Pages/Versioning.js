import React, { Component } from 'react'
import SectionLayout from './Layouts/Section'
import { connect } from 'react-redux'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Button } from 'reactstrap'
import _ from 'lodash'

import { fetchPendingChanges } from '../modules/versioning'
import { pullToken } from '../Auth'

class Versioning extends Component {
  state = {
    command: ''
  }

  componentDidMount() {
    this.props.fetchPendingChanges()
    this.setPullCommand()
  }

  setPullCommand = () => {
    let bpcli = navigator.appVersion.indexOf("Win") !== -1 ? "bp.exe" : "bp"

    const { token } = pullToken()
    const host = window.location.origin
    const command = `${bpcli} pull --host ${host} --target { YOUR_DATA_TARGET_DIR } --auth ${token}`
    this.setState({ command })
  }

  renderMainContent = () => (
    <div>
      {
        this.props.loading && <div>loading</div>
      }
      {
        !this.props.loading && _.isEmpty(this.props.pendingChanges) && <div>you're all set</div>
      }
      {
        !this.props.loading && !_.isEmpty(this.props.pendingChanges) &&
        <div>
          <p>Some changes has been made since this server was deployed. Run the botpress pull command to sync server data locally</p>
          <code>
            {this.state.command}
          </code>
          <CopyToClipboard text={this.state.command}>
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
        </div>
      }
    </div>
  )

  render() {
    return (
      <SectionLayout
        title="Versioning"
        helpText="Changes on your server"
        activePage="versioning"
        mainContent={this.renderMainContent()}
      />
    )
  }
}

const mapStateToProps = (state) => ({
  ...state.versioning
})

export default connect(mapStateToProps, { fetchPendingChanges })(Versioning)