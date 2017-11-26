import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import classnames from 'classnames'

import Header from './Header'
import Sidebar from './Sidebar'
import SidebarFooter from './SidebarFooter'
import HelpButton from './HelpButton'

import LicenseComponent from '~/components/License'
import AboutComponent from '~/components/About'
import GuidedTour from '~/components/Tour'

import PluginInjectionSite from '~/components/PluginInjectionSite'

import { toggleLicenseModal, viewModeChanged } from '~/actions'

import style from './style.scss'

class Layout extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  componentDidMount() {
    const viewMode = this.props.location.query && this.props.location.query.viewMode

    setImmediate(() => {
      this.props.viewModeChanged(viewMode ? viewMode : 0)
    })
  }

  render() {
    if (this.props.viewMode < 0) {
      return null
    }

    const hasHeader = this.props.viewMode <= 2
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
        <GuidedTour opened={window.SHOW_GUIDED_TOUR} />
        <LicenseComponent
          opened={this.props.licenseModalOpened}
          license={{ text: this.props.license.text, name: this.props.license.name }}
          toggleLicenseModal={this.props.toggleLicenseModal}
        />
        <AboutComponent opened={this.props.aboutModalOpened} />
        <PluginInjectionSite site={'overlay'} />
        <HelpButton />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  license: state.license,
  licenseModalOpened: state.ui.licenseModalOpened,
  aboutModalOpened: state.ui.aboutModalOpened,
  viewMode: state.ui.viewMode
})

const mapDispatchToProps = dispatch => bindActionCreators({ toggleLicenseModal, viewModeChanged }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
