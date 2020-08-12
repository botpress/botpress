import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'

import style from './style.scss'
import ConfigStatus from './ConfigStatus'
import LangSwitcher from './LangSwitcher'
import { TrainingStatusComponent } from './TrainingStatus'

interface Props {
  langSwitcherOpen: boolean
  user: any
  botInfo: any
  contentLang: string
  toggleLangSwitcher: (e: any) => void
}

const DEFAULT_STATE = {
  progress: 0,
  working: false,
  message: ''
}

const StatusBar: FC<Props> = props => {
  // const progressReducer = (state, action) => {
  //   if (action.type === 'updateData') {
  //     const { message, working, progress, status } = action.data

  //     // if (status === 'done') {
  //     //   setTimeout(() => {
  //     //     dispatch({ type: 'updateData', data: { message: '', working: false } })
  //     //   }, 2000)
  //     // }

  //     return {
  //       ...state,
  //       message: message || '',
  //       working: working || false,
  //       progress: progress ? Math.floor(progress * 100) : state.progress
  //     }
  //   } else {
  //     throw new Error(`That action type isn't supported.`)
  //   }
  // }

  return (
    <footer className={style.statusBar}>
      <div className={style.item}>
        <span>{window.APP_VERSION}</span>
        <span className={style.botName}>{window.BOT_NAME}</span>
        <LangSwitcher toggleLangSwitcher={props.toggleLangSwitcher} langSwitcherOpen={props.langSwitcherOpen} />
      </div>
      <div className={style.item}>
        {props.user && props.user.isSuperAdmin && <ConfigStatus />}
        <TrainingStatusComponent currentLanguage={props.contentLang} />
      </div>
    </footer>
  )
}

const mapStateToProps = state => ({
  user: state.user,
  botInfo: state.bot,
  contentLang: state.language.contentLang
})

export default connect(mapStateToProps)(StatusBar)
