import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { OverlayTrigger, Tooltip, Panel } from 'react-bootstrap'

import _ from 'lodash'
import classnames from 'classnames'
import axios from 'axios'

import style from './style.scss'

export default class HeroComponent extends React.Component {
  state = {
    loading: true
  }

  componentDidMount() {
    this.queryHero().then(() => {
      this.setState({ loading: false })
    })
  }

  queryHero() {
    return axios.get('/api/module/hero').then(result => {
      this.setState({
        ...result.data
      })
    })
  }

  renderUsername() {
    return (
      <a className={(style.username, 'bp-username')} href={this.state.github} target="_blank">
        {this.state.username}
      </a>
    )
  }

  renderPhrase() {
    const { module: m, contributions: c } = this.state

    const utterances = [
      <h4>
        Shout out to {this.renderUsername()} for being awesome and contributing {c} commits to <b>{m}</b>
      </h4>,
      <h4>
        Did you know that without {this.renderUsername()}, <b>{m}</b> wouldn't be the same ?
      </h4>,
      <h4>
        {this.renderUsername()} is one of the heroes behind <b>{m}</b>.
      </h4>,
      <h4>The world needs more people like {this.renderUsername()}. You're awesome for contributing to botpress!</h4>
    ]

    return _.sample(utterances)
  }

  render() {
    if (this.state.loading) {
      return null
    }

    const heroTooltip = (
      <Tooltip id="heroTooltip">
        These are people randomly selected from the list of contributors&nbsp; to various open-source components of the
        botpress ecosystem.&nbsp; We feel they deserve to be publicly recognized for their contributions.
      </Tooltip>
    )

    return (
      <div className={classnames(style.heroContainer, 'bp-hero')}>
        <div className={classnames(style.heroInfo, 'bp-info')}>
          <OverlayTrigger placement="left" overlay={heroTooltip}>
            <i className="material-icons">info</i>
          </OverlayTrigger>
        </div>
        <Panel className={classnames(style.contribution, 'bp-contribution')}>
          <div className={classnames(style.raysAnim, 'bp-rays-anim')}>
            <div className={classnames(style.rays, 'bp-rays')} />
          </div>
          <div className={classnames(style.root, 'bp-root')}>
            <div className={classnames(style.contributionContent, 'bp-content')}>
              <img src={this.state.avatar} />
              {this.renderPhrase()}
            </div>
          </div>
        </Panel>
      </div>
    )
  }
}
