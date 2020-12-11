import { Icon, Popover, Position } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'
import SingleLang from './SingleLang'
import classNames from 'classnames'

interface Props {
  languages: string[]
  trainSessions: { [lang: string]: NLU.TrainingSession }
}

const TrainingStatusCenter: FC<Props> = (props: Props) => {
  const { languages, trainSessions } = props
  return (
    <div className={style.trainCenter}>
      {languages.map(l => (
        <div className={classNames(style.trainCenter_lang, style.trainStatus_message_dark)}>
          <div className={style.trainCenter_lang_code}>{l}:</div>
          <SingleLang dark={true} trainSession={trainSessions[l]} />
        </div>
      ))}
    </div>
  )
}

const MultiLangTrainingStatusComponent: FC<Props> = (props: Props) => {
  return (
    <Popover
      content={<TrainingStatusCenter {...props} />}
      minimal={false}
      position={Position.TOP_RIGHT}
      modifiers={{
        arrow: { enabled: true },
        preventOverflow: { enabled: true, boundariesElement: 'window' }
      }}
    >
      <span className={style.trainCenter_openButton}>
        <div> {lang.tr('statusBar.training')}</div>
        <Icon icon="predictive-analysis" />
      </span>
    </Popover>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  languages: state.bot.languages,
  trainSessions: state.nlu.trainSessions
})
export default connect(mapStateToProps)(MultiLangTrainingStatusComponent)
