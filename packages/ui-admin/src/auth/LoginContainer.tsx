import { Callout, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import { ChatBubbleBackground } from './ChatBubbleBackground'
import logo from './media/bg-logo-black.svg'

import style from './style.scss'

interface Props {
  title?: string
  subtitle?: React.ReactNode
  error?: string | null
  poweredBy?: boolean
  children: React.ReactNode
}

const LoginContainer: FC<Props> = props => {
  return (
    <div className={cx('centered-container', style.centered_container)}>
      <ChatBubbleBackground />
      <div className={cx('middle', style.middle)}>
        <div className={cx('inner', style.inner)}>
          <img className={cx('logo', style.logo)} src={logo} alt="loading" />
          <div className={cx('card', style.card)}>
            <div className={cx('card_body', 'login_box', style.card_body, style.login_box)}>
              <div>
                <div className={cx('card_title', style.card_title)}>
                  <strong>{props.title || 'Botpress'}</strong>
                </div>

                <div className={cx('card_text', style.card_text)}>{props.subtitle || ''}</div>

                {props.error && (
                  <Callout intent={Intent.DANGER} className={style.error}>
                    {props.error}
                  </Callout>
                )}
                {props.children}
              </div>
            </div>
          </div>
          {props.poweredBy && (
            <div className={cx('homepage', style.homepage)}>
              <p>
                {lang.tr('admin.poweredBy')} <a href="https://botpress.com">Botpress</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginContainer
