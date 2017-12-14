import React, { Component } from 'react'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { Popover, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'
import Mustache from 'mustache'

import { fetchContentItem } from '~/actions'

const style = require('./style.scss')

class ActionItem extends Component {
  constructor(props) {
    super(props)

    this.state = { itemId: this.textToItemId(this.props.text) }
    this.fetchItem(this.props.text)
  }

  textToItemId = text => _.get(text.match(/^say #!(.*)$/), '[1]')

  fetchItem = text => {
    const itemId = this.textToItemId(text)
    this.setState({ itemId })
    if (itemId) {
      this.props.fetchContentItem(itemId)
    }
  }

  componentWillReceiveProps({ text }) {
    if (text !== this.props.text) {
      this.fetchItem(text)
    }
  }

  renderAction() {
    const action = this.props.text.trim()

    let actionName = action
    let parameters = {}

    if (action.indexOf(' ') >= 0) {
      const tokens = action.split(' ')
      actionName = _.head(tokens) + ' (args)'
      parameters = JSON.parse(_.tail(tokens).join(' '))
    }

    const callPreview = JSON.stringify(parameters, null, 2)

    const popoverHoverFocus = (
      <Popover id="popover-action" title={`⚡ ${actionName}`}>
        Called with these arguments:
        <pre>{callPreview}</pre>
      </Popover>
    )

    return (
      <OverlayTrigger trigger="hover" placement="top" delayShow={500} overlay={popoverHoverFocus}>
        <div className={classnames(this.props.className, style['fn'], style['action-item'])}>
          <span className={style.icon}>⚡</span>
          <span className={style.name}>{actionName}</span>
          {this.props.children}
        </div>
      </OverlayTrigger>
    )
  }

  render() {
    const action = this.props.text
    const isAction = typeof action !== 'string' || !action.startsWith('say ')

    if (isAction) {
      return this.renderAction()
    }

    const item = this.props.items[this.state.itemId]
    const textContent = (item && `${item.categoryTitle} | ${item.previewText}`) || ''
    const vars = {}

    const htmlTpl = textContent.replace(/{{([a-z0-9. _-]*?)}}/gi, x => {
      const name = x.replace(/{|}/g, '')
      vars[name] = '<span class="var">' + x + '</span>'
      return '{' + x + '}'
    })

    const mustached = Mustache.render(htmlTpl, vars)
    const html = { __html: mustached }

    return (
      <div className={classnames(this.props.className, style['action-item'], style['msg'])}>
        <span className={style.icon}>💬</span>
        <span className={style.name} dangerouslySetInnerHTML={html} />
        {this.props.children}
      </div>
    )
  }
}

const mapStateToProps = state => ({ items: state.content.itemsById })
const mapDispatchToProps = { fetchContentItem }

export default connect(mapStateToProps, mapDispatchToProps)(ActionItem)
