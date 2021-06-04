import { Condition } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'

import { IntentParams, LiteEditor } from '~/views/Nlu/intents/LiteEditor'

import InputParams from './InputParams'

interface Props {
  topicName: string
  contentLang: string
  condition: Condition
  params?: any
  updateParams?: (params: any) => void
  forceSave?: boolean
}

const ConditionEditor: FC<Props> = props => {
  const { topicName, params, updateParams, contentLang, forceSave } = props
  const useLiteEditor = props.condition.useLiteEditor

  return (
    <div style={{ maxHeight: 500 }}>
      {useLiteEditor ? (
        <LiteEditor
          topicName={topicName}
          params={params}
          updateParams={updateParams}
          contentLang={contentLang}
          forceSave={forceSave}
        ></LiteEditor>
      ) : (
        <InputParams {...props} updateParams={props.updateParams} />
      )}
    </div>
  )
}

export default ConditionEditor
