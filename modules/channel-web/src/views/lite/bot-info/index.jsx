import React, { Fragment } from 'react'

import style from './style.scss'
import PhoneIcon from './PhoneIcon'
import WebsiteIcon from './WebsiteIcon'
import EmailIcon from './EmailIcon'
import Avatar from '../avatar'

const CoverPicture = ({ botInfo }) => (
  <img
    src={
      (botInfo.details && botInfo.details.coverPictureUrl) || `https://via.placeholder.com/400x175?text=${botInfo.name}`
    }
  />
)

const BotAvatar = ({ botInfo, webchatConfig }) => {
  const name = botInfo.name || webchatConfig.botName
  const avatarUrl = (botInfo.details && botInfo.details.avatarUrl) || webchatConfig.avatarUrl
  return <Avatar name={name} avatarUrl={avatarUrl} height={64} width={64} />
}

export default ({ botInfo, onDismiss, dismissLabel, webchatConfig }) => (
  <div className={'bp-bot-info-container ' + style['bot-info-container']}>
    <CoverPicture botInfo={botInfo} />
    <div className={'bp-bot-info-summmary ' + style.summary}>
      <BotAvatar botInfo={botInfo} webchatConfig={webchatConfig} />
      <h3>{botInfo.name || webchatConfig.botName}</h3>
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
    <button className={'bp-bot-info-start-convo-button ' + style.startBtn} onClick={onDismiss}>
      {dismissLabel || 'Start Conversation'}
    </button>
  </div>
)
