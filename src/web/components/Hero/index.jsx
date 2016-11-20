import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import classnames from 'classnames'

import style from './style.scss'

export default class HeroComponent extends Component {

  renderUsername() {
    return <a className={style.username} href={this.props.github} target="_blank">
      {this.props.username}
    </a>
  }

  renderPhrase() {
    const { module: m, contributions: c } = this.props

    const utterances = [
      <h4>Shout out to {this.renderUsername()} for being awesome and contributing {c} commits to <b>{m}</b></h4>,
      <h4>Did you know that without {this.renderUsername()}, <b>{m}</b> wouldn't be the same ?</h4>,
      <h4>{this.renderUsername()} is one of the heroes behind <b>{m}</b>.</h4>,
      <h4>The world needs more people like {this.renderUsername()}. You're awesome for contributing to botpress!</h4>
    ]

    return _.sample(utterances)
  }

  render() {
    const className = classnames(this.props.className, style.root)

    return <div className={className}>
      <img src={this.props.avatar}/>
      {this.renderPhrase()}
    </div>
  }
}
