import classnames from 'classnames'
import { inject, observer } from 'mobx-react'
import * as React from 'react'
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl'

import EmailIcon from '../../icons/Email'
import PhoneIcon from '../../icons/Phone'
import WebsiteIcon from '../../icons/Website'
import { RootStore, StoreDef } from '../../store'
import { renderUnsafeHTML } from '../../utils'

import Avatar from './Avatar'

const CoverPicture = ({ botInfo }) => (
  <div className={'bpw-botinfo-cover-picture-wrapper'}>
    <img
      className={'bpw-botinfo-cover-picture'}
      src={
        (botInfo.details && botInfo.details.coverPictureUrl) ||
        `https://via.placeholder.com/400x175?text=${botInfo.name}`
      }
    />
  </div>
)

class BotInfoPage extends React.Component<BotInfoProps> {
  private btnEl: HTMLElement

  componentDidMount() {
    this.btnEl?.focus()
  }

  renderDescription(text) {
    const html = renderUnsafeHTML(text, this.props.escapeHTML)

    return <div className={'bpw-botinfo-description'} dangerouslySetInnerHTML={{ __html: html }} />
  }

  changeLanguage = async (e: any) => {
    const lang = e.target.value
    await this.props.updatePreferredLanguage(lang)
  }

  render() {
    const { botInfo, botName, avatarUrl } = this.props
    const onDismiss = this.props.isConversationStarted ? this.props.toggleBotInfo : this.props.startConversation
    return (
      <div
        className={classnames('bpw-botinfo-container', {
          'bpw-rtl': this.props.rtl
        })}
      >
        <CoverPicture botInfo={botInfo} />
        <div className={'bpw-botinfo-summary'}>
          <Avatar name={botName} avatarUrl={avatarUrl} height={64} width={64} />
          <h3>{botName}</h3>
          {this.renderDescription(botInfo.description)}
        </div>
        {botInfo.details && (
          <React.Fragment>
            <div className={'bpw-botinfo-links'}>
              {botInfo.details.phoneNumber && (
                <div className={'bpw-botinfo-link'}>
                  <i>
                    <PhoneIcon />
                  </i>
                  <a target={'_blank'} href={`tel:${botInfo.details.phoneNumber}`}>
                    {botInfo.details.phoneNumber}
                  </a>
                </div>
              )}
              {botInfo.details.website && (
                <div className={'bpw-botinfo-link'}>
                  <i>
                    <WebsiteIcon />
                  </i>
                  <a target={'_blank'} href={botInfo.details.website}>
                    {botInfo.details.website}
                  </a>
                </div>
              )}
              {botInfo.details.emailAddress && (
                <div className={'bpw-botinfo-link'}>
                  <i>
                    <EmailIcon />
                  </i>
                  <a target={'_blank'} href={`mailto:${botInfo.details.emailAddress}`}>
                    {botInfo.details.emailAddress}
                  </a>
                </div>
              )}
            </div>
            {botInfo.details.termsConditions && (
              <div className={'bpw-botinfo-terms'}>
                <a target={'_blank'} href={botInfo.details.termsConditions}>
                  <FormattedMessage id={'botInfo.termsAndConditions'} />
                </a>
              </div>
            )}
            {botInfo.details.privacyPolicy && (
              <div className={'bpw-botinfo-terms'}>
                <a target={'_blank'} href={botInfo.details.privacyPolicy}>
                  <FormattedMessage id={'botInfo.privacyPolicy'} />
                </a>
              </div>
            )}
          </React.Fragment>
        )}
        {botInfo.languages.length > 1 && (
          <div className={'bpw-botinfo-preferred-language'}>
            <FormattedMessage id={'botInfo.preferredLanguage'} />
            <select value={this.props.preferredLanguage} onChange={this.changeLanguage}>
              {botInfo.languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          tabIndex={1}
          ref={el => (this.btnEl = el)}
          className={'bpw-botinfo-start-button'}
          onClick={onDismiss.bind(this, undefined)}
        >
          {this.props.isConversationStarted ? (
            <FormattedMessage id={'botInfo.backToConversation'} />
          ) : (
            <FormattedMessage id={'botInfo.startConversation'} />
          )}
        </button>
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  botName: store.botName,
  botInfo: store.botInfo,
  avatarUrl: store.botAvatarUrl,
  startConversation: store.startConversation,
  toggleBotInfo: store.view.toggleBotInfo,
  isConversationStarted: store.isConversationStarted,
  updatePreferredLanguage: store.updatePreferredLanguage,
  preferredLanguage: store.preferredLanguage,
  escapeHTML: store.escapeHTML,
  rtl: store.rtl
}))(injectIntl(observer(BotInfoPage)))

type BotInfoProps = InjectedIntlProps &
  Pick<
    StoreDef,
    | 'botInfo'
    | 'botName'
    | 'avatarUrl'
    | 'toggleBotInfo'
    | 'startConversation'
    | 'isConversationStarted'
    | 'enableArrowNavigation'
    | 'updatePreferredLanguage'
    | 'preferredLanguage'
    | 'escapeHTML'
    | 'rtl'
  >
