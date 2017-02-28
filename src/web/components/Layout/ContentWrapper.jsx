import React, {Component} from 'react'
import classnames from 'classnames'

import style from './ContentWrapper.scss'

class ContentWrapper extends Component {
  render() {
    var childElement = this.props.children

    if (this.props.unwrap) {
      childElement = <div className="unwrap">{this.props.children}</div>
    }

    return (
      <div className={classnames(style['content-wrapper'], 'bp-content-wrapper')}>
        {childElement}
      </div>
    )
  }
}

export default ContentWrapper
