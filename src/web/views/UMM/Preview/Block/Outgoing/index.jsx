import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

export default class Outgoing extends Component {
  constructor(props) {
    super(props)
  }

  renderText(text) {
    return <div className={style.text}>
        {text}
      </div>
  }

  renderOutgoing({ platform, type, text, raw }, key) {
    return <div key={key}>
        {type === 'text' ? this.renderText(text) : null}
      </div>
  }

  render() {
    const classNames = classnames({
      [style.outgoing]: true,
      'bp-umm-outgoing': true
    })

    return <div className={classNames}>
        {this.renderOutgoing(this.props.data)}
      </div>
  }
}
