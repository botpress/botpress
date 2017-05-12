import React, { Component } from 'react'
import classnames from 'classnames'

import style from './ContentWrapper.scss'

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

    const classNames = classnames({
      [style.contentWrapper]: true,
      'bp-content-wrapper': true,
      [style.show]: this.state.show,
      'bp-content-wrapper-show': this.state.show
    })

    return (
      <div className={classNames}>
        {childElement}
      </div>
    )
  }
}

export default ContentWrapper
