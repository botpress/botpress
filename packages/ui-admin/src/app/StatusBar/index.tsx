import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { AppState } from '../rootReducer'
import ConfigStatus from './ConfigStatus'
import LangSwitcher from './LangSwitcher'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const StatusBar: FC<Props> = props => {
  const [botName, setBotName] = useState<string>('')
  const [languages, setLanguages] = useState<string[]>([])

  useEffect(() => {
    const botId = props.workspaceAppBotId
    const bot = props.bots.find(x => x.id === botId)

    setBotName(bot?.name || '')
    setLanguages(bot?.languages || [])

    window.BOT_ID = botId || ''
  }, [props.workspaceAppBotId, props.bots])

  return (
    <footer className={style.statusBar}>
      <div className={style.item}>
        <span>{window.APP_VERSION}</span>
        <span className={style.botName}>{botName}</span>
        <LangSwitcher languages={languages}></LangSwitcher>
      </div>
      <div className={style.item}>{props.profile?.isSuperAdmin && <ConfigStatus />}</div>
    </footer>
  )
}

const mapStateToProps = (state: AppState) => ({
  profile: state.user.profile,
  bots: state.bots.bots,
  workspaceAppBotId: state.bots.workspaceAppsBotId
})

const connector = connect(mapStateToProps)
export default connector(StatusBar)
