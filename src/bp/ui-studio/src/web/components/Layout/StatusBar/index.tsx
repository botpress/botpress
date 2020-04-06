import axios from 'axios'
import classNames from 'classnames'
import _ from 'lodash'
import { Line } from 'progressbar.js'
import React, { FC, useEffect } from 'react'
import { Glyphicon } from 'react-bootstrap'
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
    console.log(progress)

    return {
      ...state,
      message: message || '',
      working: working || false,
      progress: progress || 0
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
        data: { message: event.message, working: event.working, progress: event.trainSession.progress * 100 }
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
      console.log(session)
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
    return (
      <div className={classNames(style.right, style.item, { [style.worker]: state.working })}>
        <Glyphicon glyph={state.working ? 'hourglass' : 'ok-circle'} />
        &nbsp; {state.message}
      </div>
    )
  }

  console.log(state.progress)

  return (
    <footer className={style.statusBar}>
      <div className={style.list}>
        <div className={style.item}>
          <strong>{window.BOTPRESS_VERSION}</strong>
          {window.BOT_NAME}
        </div>
        {props.user && props.user.isSuperAdmin && <ConfigStatus />}
        {renderTaskMessage()}
        {state.progress}
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
