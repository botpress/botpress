import React, { Component } from 'react'
import PropTypes from 'prop-types'

import style from './PageHeader.scss'
import classnames from 'classnames'

import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'

@connect(props => ({ 
  UI: getters.UI
}))

class PageHeader extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
  }

  render() {
    const hasHeader = this.props.UI.get('viewMode') <= 2
    const hasSidebar = this.props.UI.get('viewMode') < 1

    if (!hasHeader) {
      return null
    }

    const classNames = classnames({
      [style.header]: true,
      'bp-page-header': true,
      [style.noSidebar]: !hasSidebar,
      'bp-page-header-no-sidebar': !hasSidebar
    })

    return <div className={classNames}>
      {this.props.children}
    </div>
  }
}

PageHeader.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default PageHeader
