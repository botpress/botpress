import axios from 'axios'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'
import { connect } from 'react-redux'
import { updateDocumentationModal } from '~/actions'
import EventBus from '~/util/EventBus'

import style from './style.scss'
import ConfigStatus from './ConfigStatus'

interface Props {
  user: any
  botInfo: any
  contentLang: string
}

const progressReducer = (state, action) => {
  if (action.type === 'updateData') {
    const { message, working, progress } = action.data

    return {
      ...state,
      message: message || '',
      working: working || false,
      progress: progress ? progress * 100 : state.progress
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const DEFAULT_STATE = {
  progress: 0,
  working: false,
  message: ''
}

const StatusBar: FC<Props> = props => {
  const [state, dispatch] = React.useReducer(progressReducer, {
    ...DEFAULT_STATE
  })

  useEffect(() => {
    EventBus.default.on('statusbar.event', handleModuleEvent)
    fetchTrainingSession()
  }, [])

  const shouldUpdateNLUEvent = (event): boolean => {
    return (
      event.type === 'nlu' &&
      event.botId === window.BOT_ID &&
      _.get(event, 'trainSession.language') === props.contentLang
    )
  }

  const handleModuleEvent = async event => {
    if (shouldUpdateNLUEvent(event)) {
      dispatch({
        type: 'updateData',
        data: { message: event.message, working: event.working, progress: event.trainSession.progress }
      })
    } else if (event.working && event.value && state.progress !== event.value) {
      dispatch({ type: 'updateData', data: { progress: event.value } }) // @deprecated remove when engine 1 is totally gone
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

export default connect(mapStateToProps, { updateDocumentationModal })(StatusBar)
