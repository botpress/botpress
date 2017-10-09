import React, { Component } from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames'
import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'

import style from './ContentWrapper.scss'

@connect(props => ({
  UI: getters.UI
}))
class ContentWrapper extends Component {
  constructor(props) {
    super(props)

    this.state = {
      show: false
    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        show: true
      })
    }, 50)
  }

  render() {
    var childElement = this.props.children

    if (this.props.unwrap) {
      childElement = <div className="unwrap">{this.props.children}</div>
    }

    const hasPadding = this.props.UI.get('viewMode') < 2
    const stretch = this.props.stretch === true

    const classNames = classnames({
      [style.contentWrapper]: true,
      'bp-content-wrapper': true,
      [style.contentWrapperPadding]: !stretch && hasPadding,
      'bp-content-wrapper-padding': !stretch && hasPadding,
      [style.show]: this.state.show,
      'bp-content-wrapper-show': this.state.show,
      [this.props.className]: true
    })

    return <div className={classNames}>{childElement}</div>
  }
}

ContentWrapper.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default ContentWrapper
