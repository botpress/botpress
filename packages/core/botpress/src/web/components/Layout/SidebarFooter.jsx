import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { Link, NavLink } from 'react-router-dom'
import classnames from 'classnames'
import moment from 'moment'

import { toggleLicenseModal, toggleAboutModal, fetchAllBots } from '~/actions'
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

  componentDidMount() {
    this.props.fetchAllBots()
  }

  openLicenseComponent = () => {
    this.props.toggleLicenseModal()
  }

  openAbout = () => {
    this.props.toggleAboutModal()
  }

  renderProgressBar() {
    const limit = this.props.license.limit

    const progressClassNames = classnames(style.progressBar, 'bp-progress')

    const progress = limit && limit.get('progress')
    const usedClassNames = classnames(style.used, 'bp-used', {
      [style.warning]: progress >= 0.75,
      ['bp-warning']: progress >= 0.75,
      [style.urgent]: progress >= 0.9,
      ['bp-urgent']: progress >= 0.9,
      [style.reached]: progress >= 1,
      ['bp-reached']: progress >= 1
    })

    let width = limit && limit.get('progress') * 100 + '%'

    if (limit && limit.get('reached')) {
      width = '100%'
    }

    const usedStyle = {
      width
    }

    if (limit && limit.get('progress')) {
      return (
        <div className={progressClassNames}>
          <div style={usedStyle} className={usedClassNames} />
        </div>
      )
    }

    return null
  }

  renderStatusDiv(message) {
    const limit = this.props.license.limit

    const statusClassNames = classnames(style.status, 'bp-status')

    const dotClassNames = classnames(style.dot, 'bp-dot', {
      [style.reached]: limit && limit.get('reached'),
      ['bp-reached']: limit && limit.get('reached')
    })

    return (
      <div className={statusClassNames}>
        <div className={dotClassNames} />
        {message}
      </div>
    )
  }

  renderLicenseStatus() {
    const limit = this.props.license.limit

    if (limit && limit.get('message')) {
      return this.renderStatusDiv(limit.get('message'))
    }

    const date = this.props.license.date

    if (date) {
      const expiration = moment(date).format('MMM Do YYYY')
      const text = 'Valid until ' + expiration

      return this.renderStatusDiv(text)
    }

    return null
  }

  renderBuyLink() {
    const limit = this.props.license.limit
    const licensed = this.props.license.licensed

    if ((limit && limit.get('reached')) || !licensed) {
      const classNames = classnames(style.buy, 'bp-buy')

      return (
        <a className={classNames} href="https://botpress.io">
          Buy a license
        </a>
      )
    }

    return null
  }

  renderLicense() {
    const { licensed } = this.props.license
    const license = licensed ? this.props.license.name : 'Unlicensed'

    const classNames = classnames(style.license, 'bp-edition-license', {
      [style.unlicensed]: !licensed
    })

    return (
      <Link className={classNames} to="#" title="License" onClick={this.openLicenseComponent}>
        {license}
      </Link>
    )
  }

  renderAllLicenseElements() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    return (
      <div>
        {this.renderLicense()}
        {this.renderProgressBar()}
        {this.renderLicenseStatus()}
        {this.renderBuyLink()}
      </div>
    )
  }

  switchBot = botId => {
    this.setState({ selectedBot: botId })
    window.location = '/studio/' + botId
  }

  renderBotSelect() {
    if (!window.BOTPRESS_XX) {
      return null
    }

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
          {/*TODO link to admin*/}
          <NavLink className={adminClassNames} to="./admin" title="admin">
            <i className="icon material-icons">home</i>
            <span>Admin</span>
          </NavLink>
          {this.renderBotSelect()}
          <div className={productionClassNames}>{production}</div>
          {this.renderAllLicenseElements()}
          <Link className={aboutClassNames} to="#" title="About" onClick={this.openAbout}>
            About Botpress
          </Link>
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

const mapDispatchToProps = dispatch =>
  bindActionCreators({ toggleLicenseModal, toggleAboutModal, fetchAllBots }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(SidebarFooter)
