import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames'

import Header from './Header'
import Sidebar from './Sidebar'
import SidebarFooter from './SidebarFooter'

import LicenseComponent from '~/components/License'
import AboutComponent from '~/components/About'
import GuidedTour from '~/components/Tour'

import PluginInjectionSite from '~/components/PluginInjectionSite'

import actions from '~/actions'
import getters from '~/stores/getters'
import { connect } from 'nuclear-js-react-addons'

import style from './style.scss'

@connect(props => ({ UI: getters.UI }))
class Layout extends React.Component {

  static contextTypes = {
    reactor: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
  }

  componentDidMount() {
    const viewMode = this.props.location.query && this.props.location.query.viewMode
    
    setImmediate(() => {
      actions.viewModeChanged(viewMode ? viewMode : 0)
    })
  }

  render() {
    if (this.props.UI.get('viewMode') < 0) {
      return null
    }

    const hasHeader = this.props.UI.get('viewMode') <= 2
    const classNames = classnames({
      [style.container]: hasHeader, 
      'bp-container': hasHeader
    })

    return (
      <div className={classnames('wrapper', 'bp-wrapper')}>
        <Sidebar>
          <Header />
          <section className={classNames}>{this.props.children}</section>
        </Sidebar>
        <SidebarFooter />
        <GuidedTour opened={window.SHOW_GUIDED_TOUR}/>
        <LicenseComponent opened={this.props.UI.get('licenseModalOpened')} />
        <AboutComponent opened={this.props.UI.get('aboutModalOpened')} />
        <PluginInjectionSite site={'overlay'}/>
      </div>
    )
  }
}

Layout.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default Layout
