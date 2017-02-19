import React from 'react'

import Header from './Header'
import Sidebar from './Sidebar'
import LicenseComponent from '~/components/License'
import AboutComponent from '~/components/About'
import GuidedTour from '~/components/Tour'

import actions from '~/actions'
import getters from '~/stores/getters'
import {connect} from 'nuclear-js-react-addons'

import style from './style.scss'

@connect(props => ({ UI: getters.UI }))
class Layout extends React.Component {

  static contextTypes = {
    reactor: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
  }

  render() {
    return (
      <div className="wrapper">
        <Sidebar>
          <Header />
          <section className={style.container}>{this.props.children}</section>
        </Sidebar>
        <GuidedTour opened={window.SHOW_GUIDED_TOUR}/>
        <LicenseComponent opened={this.props.UI.get('licenseModalOpened')} />
        <AboutComponent opened={this.props.UI.get('aboutModalOpened')} />
      </div>
    )
  }
}

export default Layout
