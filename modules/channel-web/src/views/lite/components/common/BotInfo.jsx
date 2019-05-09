import React, { Fragment } from 'react'
import snarkdown from 'snarkdown'

import PhoneIcon from '../../icons/Phone'
import WebsiteIcon from '../../icons/Website'
import EmailIcon from '../../icons/Email'
import Avatar from './Avatar'
import { injectIntl, FormattedMessage } from 'react-intl'

const CoverPicture = ({ botInfo }) => (
  <img
    className={'bpw-botinfo-cover-picture'}
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

  renderDescription(text) {
    let html = snarkdown(text || '')
    html = html.replace(/<a href/gi, `<a target="_blank" href`)

    return <div className={'bpw-botinfo-description'} dangerouslySetInnerHTML={{ __html: html }} />
  }

  render() {
    const { botInfo, config, currentConversation } = this.props

    const isConvoStarted = currentConversation && !!currentConversation.messages.length
    const onDismiss = isConvoStarted ? this.props.toggleBotInfo : this.startConversation

    return (
      <div className={'bpw-botinfo-container'}>
        <CoverPicture botInfo={botInfo} />
        <div className={'bpw-botinfo-summary'}>
          <BotAvatar botInfo={botInfo} config={config} />
          <h3>{botInfo.name || config.botName}</h3>
          {this.renderDescription(botInfo.description)}
        </div>
        {botInfo.details && (
          <Fragment>
            <div className={'bpw-botinfo-links'}>
              {botInfo.details.phoneNumber && (
                <div className={'bpw-botinfo-link'}>
                  <i>
                    <PhoneIcon />
                  </i>
                  <a target="_blank" href={`tel:${botInfo.details.phoneNumber}`}>
                    {botInfo.details.phoneNumber}
                  </a>
                </div>
              )}
              {botInfo.details.website && (
                <div className={'bpw-botinfo-link'}>
                  <i>
                    <WebsiteIcon />
                  </i>
                  <a target="_blank" href={botInfo.details.website}>
                    {botInfo.details.website}
                  </a>
                </div>
              )}
              {botInfo.details.emailAddress && (
                <div className={'bpw-botinfo-link'}>
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
              <div className={'bpw-botinfo-terms'}>
                <a target="_blank" href={botInfo.details.termsConditions}>
                  <FormattedMessage id="botInfo.termsAndConditions" />
                </a>
              </div>
            )}
            {botInfo.details.privacyPolicy && (
              <div className={'bpw-botinfo-terms'}>
                <a target="_blank" href={botInfo.details.privacyPolicy}>
                  <FormattedMessage id="botInfo.privacyPolicy" />
                </a>
              </div>
            )}
          </Fragment>
        )}
        <button tabIndex="1" ref={el => (this.btnEl = el)} className={'bpw-botinfo-start-button'} onClick={onDismiss}>
          {isConvoStarted ? (
            <FormattedMessage id="botInfo.backToConversation" />
          ) : (
            <FormattedMessage id="botInfo.startConversation" />
          )}
        </button>
      </div>
    )
  }
}

export default injectIntl(BotInfo)
