import axios from 'axios'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'
import { connect } from 'react-redux'
import EventBus from '~/util/EventBus'

import style from './style.scss'
import ConfigStatus from './ConfigStatus'
import LangSwitcher from './LangSwitcher'

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
  const progressReducer = (state, action) => {
    if (action.type === 'updateData') {
      const { message, working, progress, status } = action.data

      if (status === 'done') {
        setTimeout(() => {
          dispatch({ type: 'updateData', data: { message: '', working: false } })
        }, 2000)
      }

      return {
        ...state,
        message: message || '',
        working: working || false,
        progress: progress ? Math.floor(progress * 100) : state.progress
      }
    } else {
      throw new Error(`That action type isn't supported.`)
    }
  }

  const [state, dispatch] = React.useReducer(progressReducer, {
    ...DEFAULT_STATE
  })

  useEffect(() => {
    if (EventBus.default.eventNames().includes('statusbar.event')) {
      EventBus.default.off('statusbar.event', handleModuleEvent)
    }

    EventBus.default.on('statusbar.event', handleModuleEvent)
    fetchTrainingSession()
  }, [])

  const shouldUpdateProgressEvent = (event): boolean => {
    return event.botId === window.BOT_ID && _.get(event, 'trainSession.language') === props.contentLang
  }

  const handleModuleEvent = async event => {
    if (shouldUpdateProgressEvent(event)) {
      dispatch({
        type: 'updateData',
        data: {
          message: event.message,
          working: event.working,
          progress: event.trainSession.progress,
          status: event.trainSession.status
        }
      })
    }
    if (event.message && state.message !== event.message) {
      dispatch({ type: 'updateData', data: { message: event.message, working: event.working } })
    }
  }

  const fetchTrainingSession = () => {
    // tslint:disable-next-line: no-floating-promises
    axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${props.contentLang}`).then(({ data: session }) => {
      if (session && session.status === 'training') {
        dispatch({
          type: 'updateData',
          data: {
            working: true,
            progress: session.progress,
            message: 'Training'
          }
        })
      }
    })
  }

  const renderTaskMessage = () => {
    const { working, message, progress } = state
    let progressLabel = ''

    if (!working && !message) {
      return null
    }

    if (working) {
      progressLabel = `${progress}%`
    }

    return <div className={style.item}>{`${message} ${progressLabel}`}</div>
  }

  return (
    <footer className={style.statusBar}>
      <div className={style.item}>
        <span>{window.BOTPRESS_VERSION}</span>
        <span className={style.botName}>{window.BOT_NAME}</span>
        <LangSwitcher toggleLangSwitcher={props.toggleLangSwitcher} langSwitcherOpen={props.langSwitcherOpen} />
      </div>
      <div className={style.item}>
        {props.user && props.user.isSuperAdmin && <ConfigStatus />}
        {renderTaskMessage()}
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
