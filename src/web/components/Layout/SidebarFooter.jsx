import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Link } from 'react-router'
import classnames from 'classnames'
import moment from 'moment'

import { connect } from 'nuclear-js-react-addons'

import getters from '~/stores/getters'
import actions from '~/actions'

const style = require('./SidebarFooter.scss')

@connect(props => ({
  botInformation: getters.botInformation,
  license : getters.license
}))

class SidebarFooter extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
  }

  openLicenseComponent() {
    actions.toggleLicenseModal()
  }

  openAbout() {
    actions.toggleAboutModal()
  }

  renderProgressBar() {
    const limit = this.props.license.get('limit')

    const progressClassNames = classnames(style.progressBar, 'bp-progress')

    const progress = limit && limit.get('progress')
    const usedClassNames = classnames({
      [style.used]: true,
      ['bp-used']: true,
      [style.warning]: progress >= 0.75,
      ['bp-warning']: progress >= 0.75,
      [style.urgent]: progress >= 0.90,
      ['bp-urgent']: progress >= 0.90,
      [style.reached]: progress >= 1,
      ['bp-reached']: progress >= 1
    })

    let width = limit && limit.get('progress') * 100 + '%'
    
    if (limit && limit.get('reached')) {
      width = '100%'
    }

    const usedStyle = {
      width: width
    }

    if (limit && limit.get('progress')) {
      return <div className={progressClassNames}>
          <div style={usedStyle} className={usedClassNames}></div>
        </div>
    }

    return null
  }

  renderStatusDiv(message) {
    const limit = this.props.license.get('limit')

    const statusClassNames = classnames(style.status, 'bp-status')

    const dotClassNames = classnames({
      [style.dot]: true,
      ['bp-dot']: true,
      [style.reached]: limit && limit.get('reached'),
      ['bp-reached']: limit && limit.get('reached')
    })

    return <div className={statusClassNames}>
        <div className={dotClassNames}></div>
        {message}
      </div>
  }

  renderLicenseStatus() {
    const limit = this.props.license.get('limit')

    if (limit && limit.get('message')) {
      return this.renderStatusDiv(limit.get('message'))
    }

    const date = this.props.license.get('date')

    if (date) {
      const expiration = moment(date).format("MMM Do YYYY")
      const text = 'Valid until ' + expiration

      return this.renderStatusDiv(text)
    }

    return null
  }

  renderBuyLink() {
    const limit = this.props.license.get('limit')
    const licensed = this.props.license.get('licensed')

    if ((limit && limit.get('reached')) || !licensed) {
      const classNames = classnames(style.buy, 'bp-buy')

      return <a className={classNames} href='https://botpress.io'>
        Buy a license
      </a>
    }

    return null
  }

  renderLicense() {
    let license = 'Unlicensed'
    
    if (this.props.license.get('licensed')) {
      license = this.props.license.get('name')
    }

    const classNames = classnames(style.license, 'bp-edition-license', {
      [style.unlicensed]: !this.props.license.get('licensed')
    })

    return <Link className={classNames} to='#' title='License' onClick={::this.openLicenseComponent}>
        {license}
      </Link>
  }

  renderAllLicenseElements() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    return <div>
        {this.renderLicense()}
        {this.renderProgressBar()}
        {this.renderLicenseStatus()}
        {this.renderBuyLink()}
      </div>
  }

  render() {
    const isProduction = this.props.botInformation && this.props.botInformation.get('production') 

    const production = isProduction ? "in production" : "in development"

    const name = this.props.botInformation && this.props.botInformation.get('name')
    
    const sidebarFooterClassNames = classnames(style.bottomInformation, 'bp-sidebar-footer')
    const sidebarInnerClassNames = classnames(style.innerFooter, 'bp-inner-footer')
    const nameClassNames = classnames(style.name, 'bp-name')
    const productionClassNames = classnames(style.production, 'bp-production')
    const aboutClassNames = classnames(style.about, 'bp-about')

    return <div className={sidebarFooterClassNames}>
      <div className={sidebarInnerClassNames}>
        <div className={nameClassNames}>{name}</div>
        <div className={productionClassNames}>{production}</div>
        {this.renderAllLicenseElements()}
        <Link className={aboutClassNames} to="#" title="About" onClick={::this.openAbout}>
          About Botpress
        </Link>
      </div>
    </div>
  }
}

SidebarFooter.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default SidebarFooter
