import React from 'react'
import { connect } from 'react-redux'

import classnames from 'classnames'
import style from './ContentWrapper.scss'

class ContentWrapper extends React.Component {
  state = {
    show: false
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        show: true
      })
    }, 50)
  }

  render() {
    const { unwrap, viewMode, stretch: _stretch, children } = this.props

    const childElement = unwrap ? <div className="unwrap">{children}</div> : children

    const hasPadding = viewMode < 2
    const stretch = _stretch === true

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

const mapStateToProps = state => ({ viewMode: state.ui.viewMode })

export default connect(mapStateToProps)(ContentWrapper)
