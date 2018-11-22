import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import classnames from 'classnames'

import Select from 'react-select'
import _ from 'lodash'

const style = require('./SidebarFooter.scss')

class SidebarFooter extends React.Component {
  constructor(props) {
    super(props)

    this.state = { selectedBot: null }
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  renderLicenseStatus() {
    if (!window.EDITION !== 'ce' && !window.IS_LICENSED) {
      const licenseClassNames = classnames(style.unlicensed, 'bp-unlicensed')

      return <div className={licenseClassNames}>Unlicensed</div>
    }
  }

  switchBot = botId => {
    this.setState({ selectedBot: botId })
    window.location = '/studio/' + botId
  }

  renderBotSelect() {
    const options = (this.props.bots || []).map(bot => ({ value: bot.id, label: `${bot.team}/${bot.name}` }))
    const currentBot = _.get(this.props.bot, 'id') || _.get(options, '0.value')
    const selectClassNames = classnames(style.select, 'bp-select')

    return (
      <div className={selectClassNames}>
        <Select
          options={options}
          value={this.state.selectedBot || currentBot}
          onChange={option => this.switchBot(option.value)}
        />
      </div>
    )
  }

  render() {
    if (this.props.viewMode >= 1) {
      return null
    }

    const production = window.DEV_MODE ? 'in development' : 'in production'

    const sidebarFooterClassNames = classnames(style.bottomInformation, 'bp-sidebar-footer')
    const sidebarInnerClassNames = classnames(style.innerFooter, 'bp-inner-footer')
    const productionClassNames = classnames(style.production, 'bp-production')
    const aboutClassNames = classnames(style.about, 'bp-about')
    const adminClassNames = classnames(style.admin, 'bp-admin')

    return (
      <div className={sidebarFooterClassNames}>
        <div className={sidebarInnerClassNames}>
          <a className={adminClassNames} href="/admin" title="admin">
            <i className="icon material-icons">home</i>
            <span>Admin</span>
          </a>
          {this.renderLicenseStatus()}
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  botInformation: state.bot,
  license: state.license,
  viewMode: state.ui.viewMode,
  bots: state.bots
})

export default connect(
  mapStateToProps,
  null
)(SidebarFooter)
