import React, { Component } from 'react'
import { Link } from 'react-router'
import classnames from 'classnames'
import moment from 'moment'

import { connect } from 'nuclear-js-react-addons'

import getters from '~/stores/getters'
import actions from '~/actions'

const style = require('./SidebarFooter.scss')

@connect(props => ({
  license : getters.license
}))

class SidebarFooter extends Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
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
    
    let color = '#58d1b0'
    let width = limit && limit.get('progress') * 100 + '%'

    if (limit && limit.get('progress') >= 0.70) {
      color = '#FFFD77'
    }

    if (limit && limit.get('progress') >= 0.90) {
      color = '#FEA464'
    }

    if (limit && limit.get('reached')) {
      color = '#F86768'
    }

    const usedStyle = {
      backgroundColor: color,
      width: width
    }

    if (limit && limit.get('progress')) {
      return <div className={style.progressBar}>
          <div style={usedStyle} className={style.used}></div>
        </div>
    }

    return null
  }

  renderStatusDiv(message, color) {
    const dotStyle = {
      backgroundColor: color
    }

    return <div>
        <div style={dotStyle} className={style.dot}></div>
        {message}
      </div>
  }

  renderLicenseStatus() {
    
    const limit = this.props.license.get('limit')
    let color = '#58d1b0'

    if (limit && limit.get('reached')) {
      color = '#F86768'
    }


    if (limit && limit.get('message')) {
      return <div>{this.renderStatusDiv(limit.get('message'), color)}</div>
    }

    const date = this.props.license.get('date')

    if (date) {
      const expiration = moment(date).format("MMM Do YYYY")
      const text = 'Valid until ' + expiration
      return <div>{this.renderStatusDiv(text, color)}</div>
    }

    return null
  }

  renderBuyLink() {
    const limit = this.props.license.get('limit')
    const licensed = this.props.license.get('licensed')

    if ((limit && limit.get('reached')) || !licensed) {
      return <a className={style.buy} href='https://botpress.io'>
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

    return <Link className={style.license} to='#' title='License' onClick={::this.openLicenseComponent}>
        {license}
      </Link>
  }

  render() {
    const isProduction = this.props.botInformation && this.props.botInformation.get('production') 

    const production = isProduction ? "in production" : "in development"

    const name = this.props.botInformation && this.props.botInformation.get('name')
    
    return <div className={classnames(style.bottomInformation, 'bp-sidebar-footer')}>
      <div className={classnames(style.name, 'bp-name')}>{name}</div>
      <div className={classnames(style.production, 'bp-production')}>{production}</div>
      {this.renderLicense()}
      {this.renderProgressBar()}
      {this.renderLicenseStatus()}
      {this.renderBuyLink()}
      <br />
      <Link to="#" title="About" onClick={::this.openAbout}>
        About Botpress
      </Link>
    </div>
  }
}

SidebarFooter.contextTypes = {
  reactor: React.PropTypes.object.isRequired
}

export default SidebarFooter
