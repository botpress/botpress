import React, { Fragment } from 'react'
// import classnames from 'classnames'

import style from './style.scss'
import PhoneIcon from './PhoneIcon'
import WebsiteIcon from './WebsiteIcon'
import EmailIcon from './EmailIcon'

const CoverPicture = ({ botInfo }) => (
  <img
    src={
      (botInfo.details && botInfo.details.coverPictureUrl) || `https://via.placeholder.com/400x175?text=${botInfo.name}`
    }
  />
)

const Avatar = ({ botInfo, webchatConfig }) => {
  const botName = botInfo.name || webchatConfig.botName
  return (
    <img
      src={
        (botInfo.details && botInfo.details.avatarUrl) ||
        (webchatConfig && webchatConfig.botAvatarUrl) ||
        `https://via.placeholder.com/64x64?text=${botName[0]}`
      }
    />
  )
}

export default ({ botInfo, onDismiss, dismissLabel, webchatConfig }) => (
  <div className={'bp-bot-info-container ' + style['bot-info-container']}>
    <CoverPicture botInfo={botInfo} />
    <div className={'bp-bot-info-summmary ' + style.summary}>
      <Avatar botInfo={botInfo} webchatConfig={webchatConfig} />
      <h3>{botInfo.name || webchatConfig.botName}</h3>

      {/* truncate after x number of lines ? */}
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
