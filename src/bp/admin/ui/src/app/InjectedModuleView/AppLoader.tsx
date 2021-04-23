import { lang } from 'botpress/shared'
import React, { useEffect } from 'react'

import InjectedModuleView from '.'
import style from './style.scss'

export const AppLoader = props => {
  const { botId, appName } = props.match.params

  useEffect(() => {
    window.BOT_ID = botId
  }, [botId])

  return (
    <div title={lang.tr('admin.workspace.bots.bots')} className={style.container}>
      <div className={style.title}>
        <span>{botId}</span>
      </div>

      <div className={style.componentWrapper}>
        <InjectedModuleView moduleName={appName} extraProps={{ botId, contentLang: 'en' }} />
      </div>
    </div>
  )
}
