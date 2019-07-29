import React from 'react'
import { Row, Col } from 'react-bootstrap'
import SVGIcon from './SVGIcon'
import style from './style.scss'
import moment from 'moment'
import _ from 'lodash'
import ReactAudioPlayer from 'react-audio-player'

export default class Message extends React.Component {
  constructor() {
    super()
  }

  renderText() {
    return <p>{this.props.content.text}</p>
  }

  renderImage() {
    return <img src={this.props.content.text} />
  }

  renderVideo() {
    return (
      <video controls>
        <source src={this.props.content.text} type="video/mp4" />
      </video>
    )
  }

  renderAudio() {
    return <ReactAudioPlayer className={style.audio} src={this.props.content.text} />
  }

  renderEvent() {
    const date = moment(this.props.content.ts).format('DD MMM YYYY [at] LT')
    return <p>User visit : {date}</p>
  }

  renderContent() {
    const type = this.props.content.type

    if (type === 'message' || type === 'text' || type === 'quick_reply' || type === 'custom') {
      return this.renderText()
    } else if (type === 'image') {
      return this.renderImage()
    } else if (type === 'video') {
      return this.renderVideo()
    } else if (type === 'audio') {
      return this.renderAudio()
    } else if (type === 'visit') {
      return this.renderEvent()
    }
    return null
  }

  displayIcon(icon) {
    if (icon == 'bot') {
      return <SVGIcon name="bot" width="50" fill="#36bc98" />
    } else if (icon == 'agent') {
      return <SVGIcon name="agent" width="50" fill="#2E046A" />
    } else if (icon == 'user') {
      return <SVGIcon name="user" width="50" fill="#FFF" />
    }
  }
  renderMessageFromUser() {
    return (
      <div className={style.message + ' ' + style.fromUser}>
        <div className={style.icon}>
          {this.displayIcon(this.props.content.source)}
          <time>{moment(this.props.content.ts).format('LT')}</time>
        </div>
        {this.renderContent()}
      </div>
    )
  }

  renderMessageFromBot() {
    return (
      <div className={style.message + ' ' + style.fromBot}>
        <div className={style.icon}>
          {this.displayIcon(this.props.content.source)}
          <time>{moment(this.props.content.ts).format('LT')}</time>
        </div>
        {this.renderContent()}
      </div>
    )
  }

  renderMessageFromAgent() {
    return (
      <div className={style.message + ' ' + style.fromAgent}>
        <div className={style.icon}>
          {this.displayIcon(this.props.content.source)}
          <time>{moment(this.props.content.ts).format('LT')}</time>
        </div>
        {this.renderContent()}
      </div>
    )
  }

  renderMessageFromSystem() {
    return <div className={style.message + ' ' + style.fromSystem}>{this.renderContent()}</div>
  }

  renderMessage() {
    const date = moment(this.props.content.ts).format('DD MMM YYYY [at] LT')

    if (this.props.content.direction === 'in') {
      if (this.props.content.type === 'visit') {
        return this.renderMessageFromSystem()
      }
      return this.renderMessageFromUser()
    } else if (this.props.content.source === 'agent') {
      return this.renderMessageFromAgent()
    }
    return this.renderMessageFromBot()
  }

  render() {
    const renderedTypes = ['text', 'message', 'image', 'video', 'audio', 'quick_reply', 'custom', 'visit']
    if (!_.includes(renderedTypes, this.props.content.type)) {
      return null
    }

    return (
      <Row>
        <Col md={12}>{this.renderMessage()}</Col>
      </Row>
    )
  }
}
