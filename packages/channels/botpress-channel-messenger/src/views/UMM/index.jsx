import { Component } from 'react'
import { Button, Tooltip, OverlayTrigger, Glyphicon } from 'react-bootstrap'

import _ from 'lodash'
import ReactPlayer from 'react-player'
import ReactAudioPlayer from 'react-audio-player'

import classnames from 'classnames'

import style from './style.scss'

export default class UMMComponent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }

    this.handleSliderChanged = this.handleSliderChanged.bind(this)
  }

  componentDidMount() {
    this.setState({
      loading: false
    })

    if (this.props.raw && this.props.raw.payload && this.props.raw.payload.elements) {
      this.setState({
        selected: 0,
        size: _.size(this.props.raw.payload.elements)
      })
    }
  }

  componentWillUnmount() {
    this.setState({
      loading: true
    })
  }

  handleSliderChanged(value) {
    this.setState({
      selected: this.state.selected + value
    })
  }

  renderTyping() {
    if (!this.props.raw.typing) {
      return null
    }

    const classNames = classnames({
      [style.typing]: true,
      'bp-messenger-typing': true
    })

    const tooltip = (
      <Tooltip id="tooltip">
        Typing for <strong>{this.props.raw.typing}</strong> seconds...
      </Tooltip>
    )

    return (
      <div className={classNames}>
        <OverlayTrigger placement="top" overlay={tooltip}>
          <Glyphicon glyph="pencil" />
        </OverlayTrigger>
      </div>
    )
  }

  renderText() {
    const classNames = classnames({
      [style.text]: true,
      'bp-messenger-text': true
    })

    if (this.state.typing) {
      return this.renderTyping()
    }

    return (
      <div>
        <div className={classNames}>{this.props.text}</div>
        {this.renderQuickReplies()}
      </div>
    )
  }

  renderQuickRepliesButton({ title, payload }, key) {
    const tooltip = (
      <Tooltip id="tooltip">
        On click, payload event <strong>{payload}</strong> is emitted.
      </Tooltip>
    )

    return (
      <OverlayTrigger key={key} placement="top" overlay={tooltip}>
        <Button>{title}</Button>
      </OverlayTrigger>
    )
  }

  renderQuickReplies() {
    if (!this.props.raw.quick_replies) {
      return null
    }

    const classNames = classnames(style.quickReplies, 'bp-messenger-quick-replies')

    return <div className={classNames}>{this.props.raw.quick_replies.map(this.renderQuickRepliesButton)}</div>
  }

  renderGenericButton({ title, payload, url, type }, key) {
    const tooltip = (
      <Tooltip id="tooltip">
        On click, payload <strong>{type}</strong> event <strong>{payload || url}</strong> is emitted.
      </Tooltip>
    )

    return (
      <OverlayTrigger key={key} placement="top" overlay={tooltip}>
        <Button>{title}</Button>
      </OverlayTrigger>
    )
  }

  renderTemplateButton() {
    if (!this.props.raw.payload.buttons) {
      return null
    }

    const classNames = classnames({
      [style.button]: true,
      'bp-messenger-template-button': true
    })

    const headerClassNames = classnames({
      [style.header]: true,
      'bp-messenger-template-button-header': true
    })

    return (
      <div className={classNames}>
        <div className={headerClassNames}>{this.props.raw.payload.text || ''}</div>
        {this.props.raw.payload.buttons.map(::this.renderGenericButton)}
      </div>
    )
  }

  renderElement({ title, subtitle, image_url, buttons, default_action }) {
    const classNames = classnames({
      [style.element]: true,
      'bp-messenger-template-element': true
    })

    const imageClassNames = classnames({
      [style.image]: true,
      'bp-messenger-template-image': true
    })

    const action = (default_action && default_action[0]) || { type: 'undefined', payload: 'undefined' }

    const tooltip = (
      <Tooltip id="tooltip">
        On click, payload <strong>{action.type}</strong> event
        <strong> {action.payload || action.url}</strong> is emitted.
      </Tooltip>
    )

    return (
      <div className={classNames}>
        <OverlayTrigger placement="top" overlay={tooltip}>
          <div className={imageClassNames}>
            <img src={image_url} alt="image of an element" />
          </div>
        </OverlayTrigger>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {buttons && buttons.map(::this.renderGenericButton)}
      </div>
    )
  }

  renderLeftSliderButton() {
    const classNames = classnames({
      [style.leftSlider]: true,
      'bp-messenger-left-slider': true,
      [style.visible]: this.state.selected !== 0
    })

    return (
      <div
        onClick={() => {
          this.handleSliderChanged(-1)
        }}
        className={classNames}
      >
        <Glyphicon glyph="chevron-left" />
      </div>
    )
  }

  renderRightSliderButton() {
    const classNames = classnames({
      [style.rightSlider]: true,
      'bp-messenger-right-slider': true,
      [style.visible]: this.state.selected < this.state.size - 1
    })

    return (
      <div
        onClick={() => {
          this.handleSliderChanged(1)
        }}
        className={classNames}
      >
        <Glyphicon glyph="chevron-right" />
      </div>
    )
  }

  renderTemplateGeneric() {
    if (_.isUndefined(this.state.selected) || !this.props.raw.payload.elements[this.state.selected]) {
      return null
    }

    const classNames = classnames({
      [style.generic]: true,
      'bp-messenger-template-generic': true
    })

    return (
      <div className={classNames}>
        {this.renderElement(this.props.raw.payload.elements[this.state.selected])}
        {this.renderLeftSliderButton()}
        {this.renderRightSliderButton()}
      </div>
    )
  }

  renderTemplate() {
    const classNames = classnames({
      [style.template]: true,
      'bp-messenger-template': true
    })

    let template = null

    switch (this.props.raw.payload.template_type) {
      case 'button':
        template = this.renderTemplateButton()
        break
      case 'generic':
        template = this.renderTemplateGeneric()
        break
      default:
        return this.renderNotSupported(this.props.raw.payload.template_type)
    }

    return (
      <div>
        <div className={classNames}>{template}</div>
        {this.renderQuickReplies()}
      </div>
    )
  }

  renderAttachementImage() {
    return <img src={this.props.raw.url} alt="url messenger image" />
  }

  renderAttachmentVideo() {
    return <ReactPlayer width="400px" height="225px" url={this.props.raw.url} controls />
  }

  renderAttachmentAudio() {
    return <ReactAudioPlayer className={style.audio} src={this.props.raw.url} />
  }

  renderAttachment() {
    const classNames = classnames({
      [style.attachment]: true,
      'bp-messenger-attachment': true
    })

    let attachment = null

    switch (this.props.raw.type) {
      case 'image':
        attachment = this.renderAttachementImage()
        break
      case 'audio':
        attachment = this.renderAttachmentAudio()
        break
      case 'video':
        attachment = this.renderAttachmentVideo()
        break
      default:
        return this.renderNotSupported(this.props.raw.type)
    }

    return (
      <div>
        <div className={classNames}>{attachment}</div>
        {this.renderQuickReplies()}
      </div>
    )
  }

  renderNotSupported(type) {
    return (
      <div>
        Visual preview for <strong>{type}</strong> is not supported yet..
      </div>
    )
  }

  renderComponent() {
    switch (this.props.type) {
      case 'text':
        return this.renderText()
      case 'template':
        return this.renderTemplate()
      case 'attachment':
        return this.renderAttachment()
      default:
        return this.renderNotSupported(this.props.type)
    }
  }

  render() {
    if (this.state.loading) {
      return null
    }

    const classNames = classnames(style.component, 'bp-messenger-component')
    return (
      <div className={classNames}>
        {this.renderComponent()}
        {this.renderTyping()}
      </div>
    )
  }
}
