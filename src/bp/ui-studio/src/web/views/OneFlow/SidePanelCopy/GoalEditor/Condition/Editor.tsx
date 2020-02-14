import { Condition } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'

import InputParams from './InputParams'

interface Props {
  topicName: string
  condition: Condition
  params?: any
  updateParams: (params: any) => void
}

const ConditionEditor: FC<Props> = props => {
  const editor = props.condition && props.condition.editor

  return (
    <div style={{ maxHeight: 500 }}>
      {editor ? (
        <InjectedModuleView
          moduleName={editor.module}
          componentName={editor.component}
          extraProps={{
            ..._.pick(props, ['topicName', 'params', 'updateParams']),
            contentLang: 'en'
          }}
        />
      ) : (
        <InputParams {...props} updateParams={props.updateParams} />
      )}
    </div>
  )
}

export default ConditionEditor
