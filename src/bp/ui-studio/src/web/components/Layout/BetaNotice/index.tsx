import { Button } from '@blueprintjs/core'
import { confirmDialog, lang } from 'botpress/shared'
import React, { useEffect, useState } from 'react'

import storage from '../../../util/storage'
import InfoMessage from '../InfoMessage'

import style from './style.scss'

const WELCOME_KEY = `bp::beta::${window.APP_VERSION}`

export default () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.USE_ONEFLOW && !storage.get(WELCOME_KEY)) {
      setVisible(true)
    }
  }, [])

  const onAccept = () => {
    storage.set(WELCOME_KEY, '1')
    setVisible(false)
  }

  const showMoreClicked = async e => {
    const confirmContent = (
      <div>
        <h4>Botpress Albert - Beta</h4>
        <p>{window.APP_VERSION}</p>
        <p>{lang.tr('studio.betaNotice.contribution')}</p>
        <p>{lang.tr('studio.betaNotice.limitations')}</p>
        <p>{lang.tr('studio.betaNotice.thanks')}</p>
      </div>
    )
    await confirmDialog(confirmContent, {
      accept: onAccept,
      acceptLabel: lang.tr('studio.betaNotice.accept'),
      declineLabel: lang.tr('studio.betaNotice.dismiss')
    })
  }

  if (!visible) {
    return null
  }

  return (
    <InfoMessage
      message={
        <span className={style.infoContent}>
          {lang.tr('studio.betaNotice.usingBeta')}
          <Button
            small
            className={style.showMoreBtn}
            minimal
            onClick={showMoreClicked}
            text={lang.tr('studio.betaNotice.seeNotice')}
          />
        </span>
      }
    />
  )
}
