import React, { Fragment } from 'react'

import style from './BotInfo.scss'
import PhoneIcon from '../../icons/Phone'
import WebsiteIcon from '../../icons/Website'
import EmailIcon from '../../icons/Email'
import Avatar from './Avatar'

const CoverPicture = ({ botInfo }) => (
  <img
    src={
      (botInfo.details && botInfo.details.coverPictureUrl) || `https://via.placeholder.com/400x175?text=${botInfo.name}`
    }
  />
)

const BotAvatar = ({ botInfo, config }) => {
  const name = botInfo.name || config.botName
  const avatarUrl = (botInfo.details && botInfo.details.avatarUrl) || config.avatarUrl
  return <Avatar name={name} avatarUrl={avatarUrl} height={64} width={64} />
}

class BotInfo extends React.Component {
  componentDidMount() {
    this.btnEl && this.btnEl.focus()
  }

  startConversation = () => {
    this.props.onSendData &&
      this.props.onSendData({ type: 'request_start_conversation' }).then(this.props.toggleBotInfo)
  }

  render() {
    const { botInfo, config, currentConversation } = this.props

    const isConvoStarted = currentConversation && !!currentConversation.messages.length
    const onDismiss = isConvoStarted ? this.props.toggleBotInfo : this.startConversation

    return (
      <div className={'bp-bot-info-container ' + style['bot-info-container']}>
        <CoverPicture botInfo={botInfo} />
        <div className={'bp-bot-info-summmary ' + style.summary}>
          <BotAvatar botInfo={botInfo} config={config} />
          <h3>{botInfo.name || config.botName}</h3>
          <p>{botInfo.description}</p>
        </div>
        {botInfo.details && (
          <Fragment>
            <div className={'bp-bot-info-links ' + style.links}>
              {botInfo.details.phoneNumber && (
                <div className={'bp-bot-info-icon-link ' + style['icon-link']}>
                  <i>
                    <PhoneIcon />
                  </i>
                  <a target="_blank" href={`tel:${botInfo.details.phoneNumber}`}>
                    {botInfo.details.phoneNumber}
                  </a>
                </div>
              )}
              {botInfo.details.website && (
                <div className={'bp-bot-info-icon-link ' + style['icon-link']}>
                  <i>
                    <WebsiteIcon />
                  </i>
                  <a target="_blank" href={botInfo.details.website}>
                    {botInfo.details.website}
                  </a>
                </div>
              )}
              {botInfo.details.emailAddress && (
                <div className={'bp-bot-info-icon-link ' + style['icon-link']}>
                  <i>
                    <EmailIcon />
                  </i>
                  <a target="_blank" href={`mailto:${botInfo.details.emailAddress}`}>
                    {botInfo.details.emailAddress}
                  </a>
                </div>
              )}
            </div>
            {botInfo.details.termsConditions && (
              <div className={'bp-bot-info-terms ' + style.terms}>
                <a target="_blank" href={botInfo.details.termsConditions}>
                  View Terms of Service
                </a>
              </div>
            )}
            {botInfo.details.privacyPolicy && (
              <div className={'bp-bot-info-terms ' + style.terms}>
                <a target="_blank" href={botInfo.details.privacyPolicy}>
                  View Privacy Policy
                </a>
              </div>
            )}
          </Fragment>
        )}
        <button
          tabIndex="1"
          ref={el => (this.btnEl = el)}
          className={'bp-bot-info-start-convo-button ' + style.startBtn}
          onClick={onDismiss}
        >
          {isConvoStarted ? 'Back to Conversation' : 'Start Conversation'}
        </button>
      </div>
    )
  }
}

export default BotInfo
