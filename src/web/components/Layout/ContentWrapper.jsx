import React from 'react'
import { connect } from 'react-redux'

import classnames from 'classnames'
import style from './ContentWrapper.scss'

class ContentWrapper extends React.Component {
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

    const hasPadding = this.props.viewMode < 2
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

const mapStateToProps = state => ({ viewMode: state.ui.viewMode })

export default connect(mapStateToProps)(ContentWrapper)
