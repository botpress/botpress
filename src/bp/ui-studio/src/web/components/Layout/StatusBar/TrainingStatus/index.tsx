import { NLU } from 'botpress/sdk'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import MultiLang from './MultiLang'
import SingleLang from './SingleLang'

interface Props {
  languages: string[]
  trainSessions: { [lang: string]: NLU.TrainingSession }
}

const TrainingStatusComponent: FC<Props> = (props: Props) => {
  const { languages, trainSessions } = props

  if (!languages || languages.length < 1) {
    return null
  }

  if (languages.length === 1) {
    return <SingleLang trainSession={trainSessions[languages[0]]} />
  }

  return <MultiLang />
}

const mapStateToProps = (state: RootReducer) => ({
  languages: state.bot.languages,
  trainSessions: state.nlu.trainSessions
})
export default connect(mapStateToProps)(TrainingStatusComponent)
